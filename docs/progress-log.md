# Progress Log

## 2026-10-25 — Initial GitHub foundation
- Confirmed public repository: `nicomonlineza-alt/Stocktrends`.
- Confirmed default branch: `main`; write access is available.
- Added Vite + React app foundation.
- Added responsive dark/glass-style dashboard.
- Added five-stock sample watchlist, score bars, up/down badges, and external research links.
- Added simulated buy/sell controls, browser-local account persistence, trade ledger, and reset action.
- Added project plan, strategy draft, performance rules, requirements, and architecture documentation.
- All stock prices, day changes, and scores are labelled as illustrative sample data.
- No live quote provider or AI model is connected yet.
- No real-money trading or broker connection is implemented.

## Next steps
1. Verify all files and run a production build.
2. Connect Twelve Data through a secure server-side endpoint without committing the API key.
3. Replace illustrative values only when verified live quote data is available.
4. Implement versioned daily selection records and evaluation on unseen data.

  
## 2026-10-25 — Prototype v0.2 committed
- Expanded the illustrative candidate universe to ten stocks.
- Added transparent demo ranking formula (momentum 35%, relative strength 30%, volume 20%, volatility penalty 15%).
- Added daily pick snapshots keyed to the New York calendar date; prior dates are retained in local storage.
- Added prediction-log screen with rank, reference price, score, direction, and manual outcome controls.
- Added portfolio breakdown, average-cost positions, adjustable paper-trade quantity, and JSON export.
- Updated README and strategy documentation to state clearly that scores and prices are illustrative, not live data or a connected AI.
- GitHub commits made on `main`; no Vercel deployment was attempted, per project workflow.
- Build verification remains outstanding because no build runner was executed in this GitHub-only phase.

## Next phase
1. Run `npm install` and `npm run build` in a project environment; fix any compile issues before adding new features.
2. Integrate Twelve Data through a server-side endpoint with secrets held in environment variables.
3. Replace manual outcome marking with verified, timestamped outcome evaluation and persistent prediction storage.


## 2026-11-11 — Market-data connection diagnostics
- Audited the current Black dashboard, server-side market-data endpoint, provider environment-variable names, and latest production deployment.
- Confirmed that the Vercel project has production entries for FINNHUB_API_KEY and TWELVE_DATA_API_KEY; secret values were not retrieved or exposed.
- Confirmed that the latest production deployment is READY and points to the current main-branch Black observatory commit.
- Added an in-app five-timeframe connection check using AAPL historical candles. It reports the provider, candle count, latest candle timestamp, or the exact provider error for each timeframe.
- The 3-hour view is explicitly identified as a grouped view derived from hourly candles; it is not a native 3-hour provider interval.
- The diagnostic is a historical-data connectivity check only. It does not claim real-time quote access or prediction accuracy.
- Next: run the diagnostic in the deployed app, resolve provider access or rate-limit issues, then implement transparent indicator calculations against verified candles.
