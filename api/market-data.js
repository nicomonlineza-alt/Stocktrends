// Vercel serverless endpoint for Twelve Data.
// The API key is read only on the server; never expose it to browser code.
const ALLOWED_INTERVALS = new Set(["1day", "1h", "30min", "15min", "5min", "1min"]);

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: "Market data is not configured yet.",
      code: "MARKET_DATA_NOT_CONFIGURED"
    });
  }

  const symbol = String(req.query.symbol || "AAPL").trim().toUpperCase();
  const interval = String(req.query.interval || "1day").trim();
  const requestedSize = Number.parseInt(String(req.query.outputsize || "21"), 10);
  const outputsize = Number.isFinite(requestedSize) ? Math.min(100, Math.max(21, requestedSize)) : 21;

  if (!/^[A-Z./]{1,12}$/.test(symbol)) {
    return res.status(400).json({ error: "Invalid stock symbol." });
  }
  if (!ALLOWED_INTERVALS.has(interval)) {
    return res.status(400).json({ error: "Unsupported candle interval." });
  }

  try {
    const url = new URL("https://api.twelvedata.com/time_series");
    url.searchParams.set("symbol", symbol);
    url.searchParams.set("interval", interval);
    url.searchParams.set("outputsize", String(outputsize));
    url.searchParams.set("format", "JSON");

    const upstream = await fetch(url, {
      headers: { Authorization: `apikey ${apiKey}` },
      signal: AbortSignal.timeout(10000)
    });
    const payload = await upstream.json();

    if (!upstream.ok || payload.status === "error" || !Array.isArray(payload.values)) {
      const message = payload.message || payload.error || "Market data provider returned an unexpected response.";
      const status = upstream.status === 429 ? 429 : upstream.status >= 500 ? 502 : 400;
      return res.status(status).json({
        error: message,
        code: payload.code || "MARKET_DATA_PROVIDER_ERROR"
      });
    }

    const candles = payload.values
      .map(row => ({
        datetime: row.datetime,
        open: Number(row.open),
        high: Number(row.high),
        low: Number(row.low),
        close: Number(row.close),
        volume: row.volume == null ? null : Number(row.volume)
      }))
      .filter(row =>
        row.datetime &&
        [row.open, row.high, row.low, row.close].every(Number.isFinite) &&
        row.high >= row.low
      );

    if (candles.length < 21) {
      return res.status(502).json({
        error: "Fewer than 21 valid candles were returned; analysis is unavailable.",
        code: "INSUFFICIENT_CANDLES"
      });
    }

    return res.status(200).json({
      source: "Twelve Data",
      symbol: payload.meta?.symbol || symbol,
      exchange: payload.meta?.exchange || null,
      currency: payload.meta?.currency || "USD",
      interval,
      fetchedAt: new Date().toISOString(),
      candleCount: candles.length,
      candles
    });
  } catch (error) {
    const timedOut = error?.name === "TimeoutError";
    return res.status(timedOut ? 504 : 502).json({
      error: timedOut ? "Market data request timed out." : "Unable to reach the market data provider.",
      code: timedOut ? "MARKET_DATA_TIMEOUT" : "MARKET_DATA_UNAVAILABLE"
    });
  }
}
