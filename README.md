# Stocktrends — AI Stock Research & Paper Trading

Stocktrends is an educational NASDAQ stock-research dashboard. It presents five watchlist candidates, explains the demo selection signals, and lets users record simulated paper trades without placing real orders.

## Current status
- Initial responsive dashboard foundation.
- Five illustrative NASDAQ watchlist candidates.
- Clearly labelled demo market data (not live quotes).
- Paper-trading buy/sell controls saved in the browser.
- Performance summary and trade history.
- Links to company and market information.

## Important
The current prices, daily movements, and signal scores are **sample data for interface testing**, not live market data or investment recommendations. No brokerage connection or real-money trading is implemented. Future market-data integration must keep API keys on a server, never in browser code.

## Run locally
Requires Node.js 18 or newer.

```bash
npm install
npm run dev
```

## Roadmap
1. Dashboard foundation and paper-trading ledger.
2. Secure server-side Twelve Data integration.
3. Historical data and transparent stock-ranking rules.
4. Prediction snapshots and out-of-sample evaluation.
5. Charts, reporting, and later deployment.

See [PROJECT_PLAN.md](./PROJECT_PLAN.md), [STRATEGY.md](./STRATEGY.md), and [docs/progress-log.md](./docs/progress-log.md).
