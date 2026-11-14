// Server-side MarketAux news proxy. The API token never reaches the browser.
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=300");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const apiKey = process.env.MARKETAUX_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "Market news is not configured.", code: "MARKET_NEWS_NOT_CONFIGURED" });
  const symbols = String(req.query.symbols || "AAPL,NVDA,MSFT,AMZN,BTC,ETH")
    .toUpperCase().split(",").map(s => s.trim()).filter(s => /^[A-Z0-9.-]{1,12}$/.test(s)).slice(0, 12);
  const url = new URL("https://api.marketaux.com/v1/news/all");
  url.searchParams.set("api_token", apiKey);
  url.searchParams.set("symbols", symbols.join(","));
  url.searchParams.set("filter_entities", "true");
  url.searchParams.set("must_have_entities", "true");
  url.searchParams.set("language", "en");
  url.searchParams.set("limit", "12");
  try {
    const upstream = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const payload = await upstream.json();
    if (!upstream.ok || !Array.isArray(payload.data)) return res.status(upstream.status === 429 ? 429 : 502).json({ error: payload.error || payload.message || "Market news provider returned an unexpected response.", code: "MARKET_NEWS_PROVIDER_ERROR" });
    const articles = payload.data.map(article => ({
      id: article.uuid, title: article.title, description: article.description || article.snippet || "",
      url: article.url, source: article.source || article.domain || "Market news", publishedAt: article.published_at,
      entities: (article.entities || []).map(entity => ({ symbol: entity.symbol, name: entity.name, sentiment: entity.sentiment_score }))
    }));
    return res.status(200).json({ source: "MarketAux", fetchedAt: new Date().toISOString(), articles });
  } catch (error) {
    return res.status(error?.name === "TimeoutError" ? 504 : 502).json({ error: error?.message || "Unable to reach the market news provider.", code: "MARKET_NEWS_UNAVAILABLE" });
  }
}