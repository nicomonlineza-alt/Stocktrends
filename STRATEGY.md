# Selection Strategy — Prototype v0.2

## Current status

The app uses illustrative sample values only. It is not connected to Twelve Data, live quotes, or an AI model. The current score is a transparent demo formula to test the ranking and recording workflow; it is not a validated trading strategy.

## Current demonstration formula

Each candidate has illustrative feature values on a 0–100 scale:

- Momentum: 35%
- Relative strength: 30%
- Volume activity: 20%
- Volatility penalty: 15%, calculated as (100 − volatility)

`demo_score = round(momentum × 0.35 + relative_strength × 0.30 + volume × 0.20 + (100 − volatility) × 0.15)`

The app sorts candidates by score, with ticker symbol as a deterministic tie-breaker, and records the top five. Directional bias is currently based on the illustrative daily percentage change. Neither the feature values nor the resulting direction are live or predictive.

## Daily prediction record

For each daily selection, the prototype saves:
- New York calendar date and creation timestamp.
- Symbol, rank, and demo score.
- Illustrative reference price and daily change.
- Directional bias, brief rationale, and strategy version.
- A pending outcome field that can be manually marked for interface testing.

The app preserves prior dates in local browser storage. It does not replace an existing record for the same date. Since data is browser-local, it is not yet durable across devices or browser-storage deletion.

## Required live-data milestone

Before the scores can be used for real evaluation:
1. Fetch quotes and historical candles from Twelve Data through a secure server-side endpoint.
2. Record provider timestamps, market session, symbol, feature values, and stale/error states.
3. Calculate features only from data that was available at prediction time.
4. Freeze daily selections and store them durably outside the browser.
5. Resolve predictions automatically only after the documented forecast horizon, using verified future prices.
6. Evaluate on unseen periods, including transaction costs, drawdown, benchmark performance, sample size, and multiple market regimes.

## Safety boundary

This is an educational research and paper-trading project. No strategy can guarantee profit. Prediction accuracy and simulated trading returns must be measured separately. No real brokerage orders are part of this project.
