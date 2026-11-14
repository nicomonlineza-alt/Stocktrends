import { useEffect, useMemo, useState } from 'react';

const WATCHLIST = ['NVDA','MSFT','AAPL','AMZN','GOOGL','META','TSLA','AVGO','AMD','NFLX'];
const money = (v) => Number.isFinite(v) ? v.toFixed(2) : '—';
const pct = (v) => Number.isFinite(v) ? (v >= 0 ? '+' : '') + v.toFixed(2) + '%' : '—';
const ema = (values, period) => {
  if (values.length < period) return null;
  const alpha = 2 / (period + 1);
  let value = values.slice(0, period).reduce((a,b) => a+b, 0) / period;
  for (let i=period; i<values.length; i++) value = values[i]*alpha + value*(1-alpha);
  return value;
};
function analyse(candles) {
  const rows = [...candles].sort((a,b) => String(a.datetime).localeCompare(String(b.datetime)));
  if (rows.length < 26) throw new Error('At least 26 one-minute candles are required.');
  const close = rows.map(r => Number(r.close));
  const high = rows.map(r => Number(r.high));
  const low = rows.map(r => Number(r.low));
  const volume = rows.map(r => Number(r.volume) || 0);
  const last = rows.at(-1), price = close.at(-1);
  const e9 = ema(close,9), e21 = ema(close,21);
  const volSum = volume.reduce((a,b)=>a+b,0);
  const vwap = volSum > 0 ? rows.reduce((s,r)=>s+((Number(r.high)+Number(r.low)+Number(r.close))/3)*(Number(r.volume)||0),0)/volSum : null;
  const avgVol = volume.slice(-21,-1).reduce((a,b)=>a+b,0)/Math.max(1,volume.slice(-21,-1).length);
  const volRatio = avgVol > 0 ? volume.at(-1)/avgVol : null;
  const recentHigh = Math.max(...high.slice(-7,-1));
  const recentLow = Math.min(...low.slice(-7,-1));
  const range = Math.max(...high.slice(-8)) - Math.min(...low.slice(-8));
  const avgRange = rows.slice(-15,-1).reduce((s,r)=>s+(Number(r.high)-Number(r.low)),0)/14;
  const upSweep = Number(last.high) > recentHigh && price < recentHigh;
  const downSweep = Number(last.low) < recentLow && price > recentLow;
  const body = Math.abs(Number(last.close)-Number(last.open));
  const candleRange = Math.max(0.000001,Number(last.high)-Number(last.low));
  const bullReject = (Math.min(Number(last.open),price)-Number(last.low))/candleRange > .55 && price > Number(last.open);
  const bearReject = (Number(last.high)-Math.max(Number(last.open),price))/candleRange > .55 && price < Number(last.open);
  const bias = vwap == null ? 'Chop' : price > vwap && e9 > e21 ? 'Bullish' : price < vwap && e9 < e21 ? 'Bearish' : 'Chop';
  const overlapping = range < avgRange*3.2;
  const quiet = volRatio != null && volRatio < .75;
  const choppy = bias === 'Chop' && (overlapping || quiet);
  const longFlag = bias === 'Bullish' && close.at(-1) > close.at(-4) && Math.max(...high.slice(-3)) < Math.max(...high.slice(-6,-3))*1.003;
  const shortFlag = bias === 'Bearish' && close.at(-1) < close.at(-4) && Math.min(...low.slice(-3)) > Math.min(...low.slice(-6,-3))*.997;
  const pattern = choppy ? 'NO TRADE — CHOPPY / LOW MOMENTUM'
    : downSweep && bias !== 'Bearish' ? 'Downside liquidity sweep / reclaim'
    : upSweep && bias !== 'Bullish' ? 'Upside liquidity sweep / rejection'
    : longFlag ? 'Bull micro-flag (forming)'
    : shortFlag ? 'Bear micro-flag (forming)'
    : bias === 'Bullish' && bullReject ? 'VWAP-side bullish rejection'
    : bias === 'Bearish' && bearReject ? 'VWAP-side bearish rejection'
    : 'NO TRADE — NO CLEAR MICRO-PATTERN';
  const direction = /bull|downside/i.test(pattern) && !choppy ? 'Long' : /bear|upside/i.test(pattern) && !choppy ? 'Short' : null;
  const entry = price;
  const structuralStop = direction === 'Long' ? Math.min(Number(last.low),recentLow) : direction === 'Short' ? Math.max(Number(last.high),recentHigh) : null;
  const risk = direction ? Math.abs(entry-structuralStop) : 0;
  const target1 = direction ? entry + (direction==='Long'?1:-1)*risk*1.5 : null;
  const target2 = direction ? entry + (direction==='Long'?1:-1)*risk*2.5 : null;
  const valid = !!direction && risk > 0 && volRatio != null && volRatio >= .8 && e9 != null && e21 != null;
  return {
    bias, vwap, e9, e21, volRatio, pattern: valid ? pattern : (choppy ? pattern : 'NO TRADE — CONFIRMATION INCOMPLETE'),
    direction: valid ? direction : null, entry: valid ? entry : null, stop: valid ? structuralStop : null,
    target1: valid ? target1 : null, target2: valid ? target2 : null,
    lastCandle: last.datetime, price, recentHigh, recentLow,
    riskNote: volRatio == null ? 'Volume unavailable; confirmation cannot be checked.' : volRatio < .8 ? 'Volume is below the required confirmation threshold.' : 'Check spread, delayed candles and nearby session levels.',
    candleTrigger: valid ? 'Only after this 1-minute candle closes and the next quote holds the trigger zone.' : 'Wait for a confirmed candle close; do not force a setup.',
    volumeText: volRatio == null ? 'Volume unavailable' : volRatio.toFixed(2)+'× the prior 20-candle average',
    setupReady: valid
  };
}
export default function TwoMinuteScalp() {
  const [session,setSession] = useState(null);
  const [busy,setBusy] = useState(false);
  const [remaining,setRemaining] = useState(0);
  const [status,setStatus] = useState('Ready for a two-minute paper observation.');
  useEffect(() => {
    if (!session || session.status !== 'running') return;
    const tick = () => setRemaining(Math.max(0,Math.ceil((session.endsAt-Date.now())/1000)));
    tick();
    const id = setInterval(tick,500);
    return () => clearInterval(id);
  },[session]);
  useEffect(() => {
    if (session?.status === 'running' && remaining === 0) finish(session);
  },[remaining]);
  async function getAnalysis(symbol) {
    const response = await fetch('/api/market-data?symbol='+encodeURIComponent(symbol)+'&interval=1min&outputsize=60');
    const payload = await response.json();
    if (!response.ok || !Array.isArray(payload.candles)) throw new Error(payload.error || 'Market data unavailable');
    return {symbol, ...analyse(payload.candles)};
  }
  async function scan() {
    if (busy || session?.status === 'running') return;
    setBusy(true); setStatus('Checking the fixed watchlist against the two-minute observation rules…');
    const results=[];
    for (const symbol of WATCHLIST) {
      try { results.push(await getAnalysis(symbol)); }
      catch(error) { results.push({symbol,error:error.message,setupReady:false}); }
    }
    const ranked=results.filter(r=>r.setupReady).sort((a,b)=>(b.volRatio||0)-(a.volRatio||0)).slice(0,5);
    const selected=ranked.length ? ranked : results.filter(r=>!r.error).slice(0,5);
    if (!selected.length) { setStatus('No valid market data returned. Try again when the provider is available.'); setBusy(false); return; }
    const startedAt=Date.now();
    const next={id:startedAt,status:'running',startedAt,endsAt:startedAt+120000,stocks:selected,history:[]};
    setSession(next); setRemaining(120);
    setStatus('Two-minute observation started. Signals are educational and paper-only; no orders are placed.');
    setBusy(false);
  }
  async function refresh(current) {
    const updates=[];
    for (const stock of current.stocks) {
      try { updates.push(await getAnalysis(stock.symbol)); }
      catch(error) { updates.push({symbol:stock.symbol,error:error.message,setupReady:false}); }
    }
    setSession(s => s?.id===current.id && s.status==='running' ? {...s,latest:updates,history:[...(s.history||[]),{at:Date.now(),stocks:updates}]} : s);
  }
  async function finish(current) {
    if (busy || current.status !== 'running') return;
    setBusy(true); setStatus('Two minutes complete. Refreshing final observations…');
    await refresh(current);
    setSession(s=>s?.id===current.id?{...s,status:'complete'}:s);
    setStatus('Two-minute paper observation complete. Review the recorded patterns and data quality.');
    setBusy(false);
  }
  return <section style={{margin:'0 0 20px',padding:20,border:'1px solid rgba(97,228,210,.28)',borderRadius:16,background:'linear-gradient(135deg,rgba(24,69,76,.38),rgba(9,16,28,.95))'}}>
    <div className="eyebrow">BLACK · TWO-MINUTE SCALPING LAB</div>
    <h2 style={{margin:'7px 0',color:'#edf5fc'}}>2-Minute Strategy Test</h2>
    <p style={{color:'#aab6c9',fontSize:12,lineHeight:1.6,maxWidth:820}}>Screens five symbols from a fixed watchlist using one-minute OHLCV candles, then observes the selected setups for two minutes. VWAP is calculated over the available 60-candle window (a proxy, not a verified exchange-session VWAP). This is an educational paper-analysis tool only.</p>
    <button className="black-load" onClick={scan} disabled={busy||session?.status==='running'}>{busy?'Working…':session?.status==='running'?'Observation running':'Start 2-minute session'}</button>
    <button className="black-learn-button" style={{marginLeft:8}} onClick={()=>session&&refresh(session)} disabled={!session||busy}>Refresh observations</button>
    <p className="black-ai-message" role="status">{status}</p>
    {session && <>
      <div style={{fontSize:26,fontWeight:800,color:'#7ce5cb',fontVariantNumeric:'tabular-nums'}}>{session.status==='running'?Math.floor(remaining/60)+':'+String(remaining%60).padStart(2,'0'):'Complete'}</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(245px,1fr))',gap:10,marginTop:12}}>
        {(session.latest||session.stocks).map(row=><article key={row.symbol} className="black-result">
          <div className="black-result-top"><div><b>{row.symbol}</b><small>{row.lastCandle||row.error||'Initial scan'}</small></div><span className="black-time-chip">{row.bias||'Unavailable'}</span></div>
          {row.error ? <p className="black-error">{row.error}</p> : <>
            <div style={{fontSize:13,fontWeight:800,color:row.setupReady?'#9ce1c8':'#e5c58a',margin:'12px 0'}}>{row.pattern}</div>
            <div className="black-data-grid">
              <div><small>Last price</small><b>{money(row.price)}</b></div>
              <div><small>VWAP (60-candle)</small><b>{money(row.vwap)}</b></div>
              <div><small>EMA 9 / 21</small><b>{money(row.e9)} / {money(row.e21)}</b></div>
              <div><small>Relative volume</small><b>{row.volumeText}</b></div>
            </div>
            <p className="black-indicator-note">Micro-pattern: {row.pattern}. Candle trigger: {row.candleTrigger}</p>
            {row.setupReady ? <div className="black-data-grid" style={{marginTop:8}}>
              <div><small>Hypothetical entry</small><b>{money(row.entry)}</b></div>
              <div><small>Invalidation</small><b>{money(row.stop)}</b></div>
              <div><small>Target 1 · 1:1.5</small><b>{money(row.target1)}</b></div>
              <div><small>Target 2 · 1:2.5</small><b>{money(row.target2)}</b></div>
            </div> : <p className="black-error">NO TRADE. {row.riskNote||'No sufficiently confirmed setup.'}</p>}
            <p className="black-indicator-note">Risk check: {row.riskNote} Levels are hypothetical study annotations, not orders or a recommendation.</p>
          </>}
        </article>)}
      </div>
      <p className="black-indicator-note">This scan cannot verify pre-market or prior-day levels, true order flow, exchange-session VWAP, bid/ask spread or news volatility from the available candle endpoint. Missing data is not invented. Historical candles can be delayed and the two-minute timer does not make the feed real-time.</p>
    </>}
  </section>;
}
