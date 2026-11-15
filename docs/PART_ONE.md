# PART ONE — Preserved Learning Record

**Project:** Stocktrends  
**Repository:** nicomonlineza-alt/Stocktrends  
**Status:** Archived baseline — preserve; do not overwrite with Part Two.

Part One is the existing research and learning baseline. The application must continue to retain its prior journal records and learned observations. Part Two is an additional loss-control experiment, not a replacement for the learning history below.

## 1. Existing learning sources and persistence

- The Black dashboard has a browser-local learning journal under `stocktrends-ai-suggestions-learning-v1`.
- The AI Suggestions workflow stores initial candidate scores, indicator snapshots, five-symbol observation results, timestamps, and chart points in that journal.
- Manual Learn snapshots store the selected timeframe, symbol, score, movement, and indicator values.
- The app also has a paper-trading journal / R100 challenge history and Supabase cloud-learning history from earlier project milestones.
- The connected Supabase project `stocktrends-learning` was checked read-only on 2026-11-15. Its `public.learning_journal_events` table contained **418 rows**, and `public.learning_review_runs` contained **9 rows**. All 418 journal events and all 9 review runs were exported into the Part One archive files listed below; the `user_id` field was omitted from the exported copies.
- Browser-local records remain tied to the browser/device. Do not clear local storage, reset the database, or overwrite existing journal keys during Part Two.

**Important:** The 418 cloud journal events and 9 cloud review runs are archived in `docs/part-one-data/`. The browser-only `stocktrends-ai-suggestions-learning-v1` journal cannot be read from GitHub or Supabase; it remains in the user's browser and is preserved by leaving the existing application storage key untouched. Export that browser journal separately from the app if a complete cross-device archive is required.

## 2. Indicators already learned / measured

The existing strategy calculates and records:

- EMA 9 and EMA 21 for short/medium trend alignment.
- RSI(14) for momentum and overbought/oversold context.
- MACD (12, 26, 9), signal line, and histogram.
- ATR(14) as a volatility reference for stop/target analysis.
- 20-candle momentum and recent five-candle movement.
- Relative volume against the preceding 20 candles, when provider volume exists.
- Candle count, timestamp, source, OHLC range, and market-data availability.

Missing volume, insufficient history, stale data, and provider errors must remain explicitly unavailable. Never fill missing values with invented or illustrative data and label them live.

## 3. Existing scoring approach

The documented baseline score weights are:

- Trend: 30%
- Momentum: 22%
- MACD: 20%
- RSI condition: 16%
- Relative volume: 12%

The Black dashboard's simpler observation score awards points for EMA alignment, positive MACD histogram, a preferred RSI band, relative volume, and recent positive movement.

After at least five closed paper observations with stored entry features, indicator weights may adjust modestly using observed feature/outcome relationships. This is exploratory online adjustment, not a validated predictive model. It can overfit and must be evaluated on unseen periods.

## 4. Existing entry / exit research rules

- A BUY research setup requires price above EMA21, EMA9 above EMA21, RSI between 45 and 68, and a positive MACD histogram.
- An EXIT / SELL research signal is raised when price is below EMA21, or RSI is below 38 while MACD is negative.
- Otherwise the system reports WAIT.
- The historic reference stop is 1.5 ATR below the observed price; the target reference is 2 ATR above it.

These are testable educational rules, not optimal settings or guarantees. Gaps, spread, slippage, fees, delayed candles, incomplete sessions, and execution differences can change outcomes.

## 5. Existing market-data approach and limitations

- Market data is requested through the server-side `/api/market-data` endpoint.
- Finnhub supports plain US-equity tickers; Twelve Data is used as fallback / pair-data provider, including slash-formatted forex and crypto pairs.
- Provider credentials belong only in server-side environment variables (`FINNHUB_API_KEY`, `TWELVE_DATA_API_KEY`). Never place secrets in frontend code or commit them.
- Black's documented views include 1-minute, 5-minute, 15-minute, 1-hour, and a 3-hour view grouped from hourly candles.
- A successful diagnostic confirms historical candle retrieval only. It does not guarantee tick-level or real-time quotes.
- The documented daily-candle research is slower swing-style analysis, not a tick-level day-trading system.
- The README has previously identified illustrative dashboard values and sample candidate movements. They must not be presented as verified market prices or genuine AI-generated selections.

## 6. Existing AI Suggestions experiment

- The earlier workflow scanned a fixed ten-symbol educational watchlist.
- It ranked available one-minute historical data using transparent RSI, EMA, MACD, relative-volume, and recent-movement rules.
- It selected five symbols for a five-minute paper-observation window.
- It saved starting rankings, prices, final observations, chart points, and timestamps to the browser-local learning journal.
- It did not place orders and did not calculate executed cash P&L. It did not include fees, spread, slippage, or confirmed fills.

## 7. Evaluation standards carried forward

Any future strategy evaluation should:

1. Freeze candidate picks before the evaluation period.
2. Test on unseen periods rather than only the data used to tune the rules.
3. Track win rate, average win/loss, expectancy, maximum drawdown, turnover, benchmark return, and prediction accuracy by horizon.
4. Include realistic transaction-cost, spread, and slippage assumptions.
5. Compare against a simple benchmark.
6. Label the sample size and data-quality limitations.
7. Never claim a strategy is profitable or safe without repeatable, out-of-sample evidence.

## 8. Preservation rules for Part Two

- Keep Part One immutable as the baseline record.
- Do not delete or rename existing learning keys, Supabase tables, journal events, or Part One source components.
- Part Two must use separate versioned records and identify its own methodology.
- Existing records may be read for analysis, but must not be silently rewritten.
- The application remains educational and paper-simulation only; there is no brokerage connection or real-money order execution.
