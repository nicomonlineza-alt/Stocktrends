// Transparent technical-indicator engine for Stocktrends paper research.
// It only analyses timestamped candles returned by the server-side Twelve Data endpoint.
const BASE_WEIGHTS = { trend: 0.30, momentum: 0.22, macd: 0.20, rsi: 0.16, volume: 0.12 };

const average = values => values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
const emaSeries = (values, period) => {
  if (!values.length) return [];
  const k = 2 / (period + 1);
  const result = [values[0]];
  for (let i = 1; i < values.length; i++) result.push(values[i] * k + result[i - 1] * (1 - k));
  return result;
};
const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

export function learnIndicatorWeights(trades = []) {
  const closed = trades.filter(t => t.side === 'SELL' && Number.isFinite(Number(t.realizedPnl)) && t.entryFeatures);
  if (closed.length < 5) return { ...BASE_WEIGHTS, sampleSize: closed.length, learned: false };
  const keys = Object.keys(BASE_WEIGHTS);
  const rates = Object.fromEntries(keys.map(key => {
    const samples = closed.filter(t => Number.isFinite(t.entryFeatures[key]));
    const wins = samples.filter(t => (t.realizedPnl > 0) === (t.entryFeatures[key] >= 50)).length;
    return [key, samples.length ? (wins + 2) / (samples.length + 4) : 0.5];
  }));
  const raw = Object.fromEntries(keys.map(key => [key, BASE_WEIGHTS[key] * (0.65 + rates[key])]));
  const total = Object.values(raw).reduce((a, b) => a + b, 0) || 1;
  return { ...Object.fromEntries(keys.map(key => [key, raw[key] / total])), sampleSize: closed.length, learned: true };
}

export function analyzeCandles(inputCandles, weights = BASE_WEIGHTS) {
  const candles = [...(inputCandles || [])]
    .filter(c => Number.isFinite(Number(c.close)) && Number(c.close) > 0)
    .sort((a, b) => String(a.datetime).localeCompare(String(b.datetime)));
  if (candles.length < 35) throw new Error('At least 35 valid candles are needed for EMA, RSI and MACD analysis.');
  const close = candles.map(c => Number(c.close));
  const high = candles.map(c => Number(c.high));
  const low = candles.map(c => Number(c.low));
  const volume = candles.map(c => Number(c.volume) || 0);
  const ema9 = emaSeries(close, 9);
  const ema12 = emaSeries(close, 12);
  const ema21 = emaSeries(close, 21);
  const ema26 = emaSeries(close, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const signalLine = emaSeries(macdLine, 9);
  const macdHist = macdLine.map((v, i) => v - signalLine[i]);
  const gains = [], losses = [];
  for (let i = Math.max(1, close.length - 14); i < close.length; i++) {
    const delta = close[i] - close[i - 1];
    gains.push(Math.max(0, delta)); losses.push(Math.max(0, -delta));
  }
  const avgGain = average(gains), avgLoss = average(losses);
  const rsi = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));
  const trueRanges = [];
  for (let i = Math.max(1, candles.length - 14); i < candles.length; i++) {
    trueRanges.push(Math.max(high[i] - low[i], Math.abs(high[i] - close[i - 1]), Math.abs(low[i] - close[i - 1])));
  }
  const atr = average(trueRanges);
  const last = close.length - 1;
  const previousClose = close[last - 1];
  const change = previousClose ? ((close[last] - previousClose) / previousClose) * 100 : 0;
  const lookback = close[Math.max(0, last - 20)];
  const momentumPct = lookback ? ((close[last] - lookback) / lookback) * 100 : 0;
  const recentVolumes = volume.slice(Math.max(0, volume.length - 21), -1).filter(v => v > 0);
  const avgVolume = average(recentVolumes);
  const volumeRatio = avgVolume > 0 && volume[last] > 0 ? volume[last] / avgVolume : null;
  const trend = ema9[last] > ema21[last] && close[last] > ema21[last] ? 85
    : close[last] > ema21[last] ? 65
      : ema9[last] < ema21[last] && close[last] < ema21[last] ? 15 : 40;
  const momentum = clamp(50 + momentumPct * 7);
  const macd = macdHist[last] > 0 && macdHist[last] >= macdHist[last - 1] ? 85
    : macdHist[last] > 0 ? 65
      : macdHist[last] < 0 && macdHist[last] <= macdHist[last - 1] ? 15 : 40;
  const rsiScore = rsi >= 50 && rsi <= 68 ? 85 : rsi >= 42 && rsi < 50 ? 60 : rsi > 68 && rsi <= 75 ? 55 : rsi < 35 ? 25 : 40;
  const volumeScore = volumeRatio == null ? 50 : clamp(50 + (volumeRatio - 1) * 35);
  const score = Math.round(
    trend * (weights.trend ?? BASE_WEIGHTS.trend) +
    momentum * (weights.momentum ?? BASE_WEIGHTS.momentum) +
    macd * (weights.macd ?? BASE_WEIGHTS.macd) +
    rsiScore * (weights.rsi ?? BASE_WEIGHTS.rsi) +
    volumeScore * (weights.volume ?? BASE_WEIGHTS.volume)
  );
  const bullish = close[last] > ema21[last] && ema9[last] > ema21[last] && rsi >= 45 && rsi <= 68 && macdHist[last] > 0;
  const bearish = close[last] < ema21[last] || (rsi < 38 && macdHist[last] < 0);
  const stopLoss = Math.max(0, close[last] - atr * 1.5);
  const takeProfit = close[last] + atr * 2;
  const reasons = [];
  reasons.push(close[last] > ema21[last] ? 'price above EMA21' : 'price below EMA21');
  reasons.push(ema9[last] > ema21[last] ? 'EMA9 bullish crossover' : 'EMA9 below EMA21');
  reasons.push(`RSI ${rsi.toFixed(1)}`);
  reasons.push(`MACD ${macdHist[last] >= 0 ? 'positive' : 'negative'}`);
  if (volumeRatio != null) reasons.push(`volume ${volumeRatio.toFixed(2)}× average`);
  return {
    price: close[last], change, score, momentum: momentum, relativeStrength: trend,
    volume: volumeScore, volatility: clamp((atr / close[last]) * 100 * 180),
    direction: bullish ? 'BUY SETUP' : bearish ? 'SELL / EXIT' : 'WAIT',
    action: bullish ? 'BUY' : bearish ? 'SELL' : 'HOLD',
    reason: reasons.join(' · '), stopLoss, takeProfit,
    indicators: { ema9: ema9[last], ema21: ema21[last], rsi, macd: macdLine[last], macdSignal: signalLine[last], macdHistogram: macdHist[last], atr, volumeRatio, momentumPct },
    signalFeatures: { trend, momentum, macd, rsi: rsiScore, volume: volumeScore },
    candleTime: candles[last].datetime,
    candleCount: candles.length,
  };
}

export function exitReason(stock, position) {
  if (!stock?.indicators || !position) return null;
  if (stock.price <= (position.stopLoss || 0)) return 'ATR stop-loss reached';
  if (stock.price >= (position.takeProfit || Infinity)) return 'ATR profit target reached';
  if (stock.indicators.ema9 < stock.indicators.ema21 && stock.indicators.macdHistogram < 0) return 'trend and MACD turned bearish';
  return null;
}
