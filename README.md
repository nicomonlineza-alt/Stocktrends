# Stocktrends — NASDAQ Research & Paper Trading

Stocktrends is an educational stock-research prototype focused on a five-stock daily shortlist, transparent ranking signals, a saved prediction log, and simulated paper trading.

## Prototype v0.2

- Responsive dark/glass dashboard for desktop and mobile.
- Ten illustrative NASDAQ-listed candidate examples.
- Transparent weighted demo score: momentum (35%), relative strength (30%), volume (20%), and a volatility penalty (15%).
- Five daily candidates are recorded once per New York calendar date in the browser's local storage; existing daily records are not overwritten by the daily-pick action.
- Daily prediction log with reference price, score, directional bias, and manual outcome fields.
- Simulated cash, share positions, average cost, buy/sell ledger, and account reset.
- Export of prediction records and paper-trading data as JSON.
- Company research links.

## Important limitations

**This version does not use live market data and does not contain a connected AI model.** Prices, day changes, feature values, scores, and forecast bias are illustrative sample data for prototyping only. Manually marked outcomes are not a verified backtest. Do not use this prototype to make investment decisions.

The browser stores the paper account and prediction log locally on that device/browser. Data is not yet synced to a server, so clearing browser storage or switching devices will not carry it over.

No brokerage connection or real-money trading is implemented. API credentials must never be placed in frontend code or committed to GitHub.

## Run locally

Requires Node.js 18 or newer.

```bash
npm install
npm run dev
```

Create a production build with:

```bash
npm run build
```

## Next milestones

1. Verify production build and improve prototype behaviour.
2. Connect Twelve Data using a secure server-side endpoint; keep API keys in environment variables.
3. Replace sample values only with timestamped, verified market data and visible stale/error states.
4. Lock daily predictions with reference quotes, forecast horizon, strategy version, and data provenance.
5. Automatically evaluate outcomes against verified future prices; add fees, drawdown, benchmark comparisons, and out-of-sample testing.
6. Deploy only after the GitHub prototype is stable.

See [PROJECT_PLAN.md](./PROJECT_PLAN.md), [STRATEGY.md](./STRATEGY.md), and [docs/progress-log.md](./docs/progress-log.md).
