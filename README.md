# Stocktrends — NASDAQ Research & Paper Trading

Stocktrends is an educational stock-research prototype focused on a five-stock daily shortlist, transparent ranking signals, a saved prediction log, and simulated paper trading.

## Prototype v0.2

- Responsive dark/glass dashboard for desktop and mobile.
- Ten illustrative NASDAQ-listed candidate examples.
- On-demand Twelve Data market scan for the 10-stock candidate universe, with verified candle timestamps and a clear sample-data fallback.
- Technical analysis of EMA 9/21, RSI(14), MACD, ATR, 20-candle momentum and relative volume; transparent BUY / HOLD / SELL signals and ATR-based stop/target levels.
- Adaptive indicator weights that begin adjusting after five closed paper trades, using logged entry features and realised outcomes.
- Five daily candidates are recorded once per New York calendar date in the browser's local storage; existing daily records are not overwritten by the daily-pick action.
- Daily prediction log with reference price, score, directional bias, and manual outcome fields.
- Daily R100 paper challenge: five locked picks receive R20 each; the end-of-day action records each pick's sample percentage move, rand profit/loss, ending value, and total daily result in a persistent browser journal.
- R100 journal history with cumulative simulated profit/loss and JSON export including all daily journal entries. A date can only be journaled once.
- Simulated cash, share positions, average cost, buy/sell ledger, and account reset.
- Export of prediction records and paper-trading data as JSON.
- Company research links.
- Initial server-side Twelve Data endpoint scaffold at `/api/market-data`, with symbol/interval validation and provider error handling.

## Important limitations

**The current dashboard still uses illustrative sample data and does not yet display live Twelve Data prices or a connected AI model. The daily R100 journal currently calculates from the illustrative percentage changes in the demo candidate list; it does not yet calculate genuine end-of-day results from verified market closes or make genuine AI-generated selections.** The server-side endpoint scaffold is committed, but it needs a private `TWELVE_DATA_API_KEY` environment variable in the hosting environment and frontend integration before live data will appear. Prices, day changes, feature values, scores, and forecast bias currently shown in the dashboard are illustrative only. Manually marked outcomes are not a verified backtest. Do not use this prototype to make investment decisions.

The browser stores the paper account, prediction log, and R100 daily journal locally on that device/browser. Data is not yet synced to a server, so clearing browser storage or switching devices will not carry it over.

No brokerage connection or real-money trading is implemented. API credentials must never be placed in frontend code or committed to GitHub.

## Run locally

Requires Node.js 18 or newer.

```bash
npm install
npm run dev
npm run build
```

The `.env.example` file documents the required variable name only; it does not contain a real key. For a local serverless-function test, use a local Vercel development environment and set `TWELVE_DATA_API_KEY` privately in your local environment. Do not commit a real `.env` file.

## Next milestones

1. Verify production build and endpoint behaviour.
2. Verify that the private Twelve Data key is configured in the Vercel production environment and test the live scan end-to-end.
3. Add a durable server-side database so paper positions and learning history persist across devices.
4. Automatically evaluate frozen daily picks against verified future prices; add spread/fees, slippage, drawdown, benchmark comparisons, and out-of-sample testing.
5. Add a scheduled scan service only after the rules have been validated; browser-triggered scans do not run when the app is closed.

See [PROJECT_PLAN.md](./PROJECT_PLAN.md), [STRATEGY.md](./STRATEGY.md), and [docs/progress-log.md](./docs/progress-log.md).
