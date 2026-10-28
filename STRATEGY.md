# Selection Strategy — Technical Indicators + Paper Learning

## Live analysis

Stocktrends requests 60 daily candles per candidate through the server-side Twelve Data endpoint. The private key must be configured as `TWELVE_DATA_API_KEY` in the Vercel environment. If the key is missing, the provider is rate-limited, or candles are invalid, the app reports the issue and preserves its last saved history rather than pretending sample data is live.

The indicator engine calculates:
- **EMA 9 and EMA 21:** short/medium trend alignment.
- **RSI(14):** momentum condition; avoids treating very overbought readings as fresh entries.
- **MACD (12, 26, 9):** momentum direction and histogram change.
- **ATR(14):** volatility-aware stop and target reference.
- **20-candle momentum:** recent trend strength.
- **Relative volume:** latest volume compared with prior candles, when provider volume is available.

The score blends trend (30%), momentum (22%), MACD (20%), RSI condition (16%) and relative volume (12%). Once there are at least five closed paper trades with stored entry features, weights adapt modestly using the observed relationship between each entry feature and the trade outcome. This small online adjustment is exploratory and may overfit; it is not a validated machine-learning model.

## Entry and exit rules

A **BUY setup** requires price above EMA21, EMA9 above EMA21, RSI between 45 and 68, and a positive MACD histogram. A **SELL / EXIT** signal is generated when price is below EMA21 or RSI is below 38 while MACD is negative. Otherwise the signal is **WAIT**. The initial stop reference is 1.5 ATR below the observed price and the target reference is 2 ATR above it.

These are testable rules, not an optimal or guaranteed point. Gaps, spreads, delayed candles, incomplete sessions and price slippage can change outcomes. The daily-candle analysis is a slower swing-style signal, not a tick-level day-trading system.

## Paper trading and learning

When the user presses **Scan market & paper trade**, the app scans the candidate list sequentially, records the latest candle timestamp, exits existing paper positions when an exit rule fires, and opens one-share simulated positions on qualifying BUY setups up to five concurrent holdings. Each simulated transaction stores its reason and available entry features. Closed-trade results feed the modest adaptive weighting described above.

The scan is not a background process: it runs only while the app is open and the user triggers it. No brokerage is connected and no real orders are placed. Browser storage is local to that browser; it is not a durable multi-device journal.

## Evaluation needed before trusting the strategy

Freeze picks before the forecast period, then evaluate on unseen periods with execution assumptions fixed in advance. Track win rate, average win/loss, expectancy, maximum drawdown, turnover, benchmark return, and prediction accuracy by forecast horizon. Include transaction costs and compare against a simple buy-and-hold baseline. Do not tune the strategy solely on the same trades used to judge it.
