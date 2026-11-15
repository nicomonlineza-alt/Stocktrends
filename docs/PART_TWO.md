# PART TWO — Loss-Control Learning Experiment

**Implementation:** Built and pushed to `part-two-loss-control` on 2026-11-15.  
**Application:** Part Two Loss Control Observatory.  
**Storage:** Separate browser-local journal key: `stocktrends-part-two-loss-control-v1`. Part One keys and Supabase tables are not changed.

## 1. Home screen and category selection

The home screen presents three category buttons only: Stocks, Crypto and Forex. Selecting a category scans a curated universe of 30 named instruments. It displays every instrument for which at least 35 valid historical one-minute candles can be retrieved. Unsupported or missing symbols are excluded with no fabricated placeholders.

## 2. Ranking method

Candidates are ranked from lower to higher observed historical risk using the last 60 available one-minute candles. The transparent composite risk measure is:

- 45% realised volatility of log returns;
- 30% maximum peak-to-trough drawdown;
- 25% mean high-low candle range as a percentage of close.

The displayed 0–100 score is relative to the candidate set returned in that scan. It is not an absolute safety score or forecast. Volume coverage is retained in the analysis model but is not currently included in the score. Spread, slippage, liquidity depth, fees and market impact are not measured.

Stale candles (more than five minutes old, or with an unparseable timestamp) remain visible for research but cannot be selected for a timed paper session. This matters when markets are closed or a provider returns delayed data. The user must select exactly five fresh candidates.

## 3. Session flow

1. Choose Stocks, Crypto or Forex.
2. Review up to 30 candidates ranked by historical risk.
3. Select exactly five fresh candidates and press Start.
4. Choose a maximum observation window of 1, 3 or 5 minutes.
5. Each position is a hypothetical long-only paper observation with a virtual R100 stake.
6. The app polls for new market candles during the session.
7. A simulated risk exit is triggered if a refreshed price is at least 0.5% below its entry; the user can also close all observations early.
8. Any remaining observations are automatically closed when the selected timer expires.

If the provider does not return a new candle after entry, that observation is marked unavailable rather than being falsely counted as a zero-return result. No brokerage connection, real-money orders, short selling or order routing is implemented.

## 4. Loss ledger and gauge

After a completed session, the app appends a Part Two record containing category, selected instruments, start/end timestamps, duration, entry/exit observations, exit reason, source, risk features, per-position hypothetical result, gross losses, gross profit and net result.

The ledger accumulates:
- Gross simulated losses (losses are not erased by later wins);
- Gross simulated profits;
- Cumulative net paper result;
- Session count and recent session history.

The gauge uses a defined scale of R10 cumulative gross simulated losses = 100/100. It therefore increases as cumulative losses accumulate and does not artificially recover after a profitable session. The numeric amount and scale are shown alongside the gauge.

## 5. Continued learning

The versioned Part Two journal stores candidate risk features and session outcomes separately from Part One. The current implementation preserves this evidence for later comparison; it does not claim to train a validated predictive AI model. Future model changes should use sufficient sample sizes and out-of-sample testing.

## 6. Persistence and known limitations

Part Two data is currently saved to browser local storage on the device/browser running the app. It survives normal reloads on that same browser but is not yet synchronised across devices or browsers. Clearing browser storage can remove it. A future authenticated cloud-sync phase should migrate the Part Two journal without touching the Part One archive.

The market-data endpoint returns historical one-minute candles. A 1-minute observation can finish before a new candle becomes available. Market closures, provider delays, stale data, gaps and missing volume affect availability. The current R100 virtual stake and 0.5% stop are experiment settings, not validated optimal risk parameters. Paper outcomes exclude real transaction costs and execution effects.

## 7. Acceptance checklist

- [x] Home screen shows Stocks, Crypto and Forex.
- [x] Each category has a 30-instrument curated universe.
- [x] Only verified historical data is ranked; missing data is not invented.
- [x] Candidates are ranked using volatility, drawdown and candle-range risk.
- [x] Stale candidates remain visible but cannot be selected for timed sessions.
- [x] Exactly five fresh candidates are required.
- [x] Start reveals 1-, 3- and 5-minute duration choices.
- [x] User can close all paper observations early.
- [x] 0.5% adverse-move paper risk stop is monitored.
- [x] Remaining observations close automatically at the selected maximum duration.
- [x] Results are accumulated in a separate Part Two loss ledger.
- [x] Gauge reflects cumulative gross simulated losses.
- [x] Part Two session records remain separate from Part One.
- [x] Responsive mobile layout included.
- [x] Vercel preview build succeeded; runtime category scan and end-to-end paper session still require user-side testing.
