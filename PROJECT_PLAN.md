# Stocktrends Project Plan

## Goal
Build a clear, evidence-led NASDAQ research dashboard that selects five candidates for daily observation, records the selection before outcomes are known, and evaluates a paper-trading strategy over time.

## User experience
- Overview with five candidates, price movement, score, and research link.
- Simulated cash balance, holdings, trade ledger, and performance metrics.
- Explanations for each candidate and transparent data-status labels.
- Responsive interface suitable for mobile and desktop.

## Implementation stages
1. **Foundation:** responsive dashboard, sample data labels, browser-local paper-trading ledger.
2. **Market data:** integrate Twelve Data via a secure server-side endpoint; show timestamp, market session, and stale/error state.
3. **Selection method:** document explicit ranking criteria and the time each daily pick is locked.
4. **Evaluation:** compare predictions to future outcomes, include transaction-cost assumptions, and test on unseen periods.
5. **Reporting:** charts, win/loss statistics, drawdown, benchmark comparison, and downloadable results.
6. **Deployment:** configure environment variables securely and deploy after GitHub version is stable.

## Data and security rules
- Never commit API keys, tokens, passwords, or account details.
- Do not expose paid market-data credentials in frontend code.
- Clearly distinguish sample values from verified live values.
- Keep this app in paper-trading mode; no broker orders or real-money execution.
- Do not claim profitability without repeatable, out-of-sample evidence.

## Acceptance criteria for the first milestone
- Five stocks are visible in a readable table.
- Up/down moves and sample scores are visible.
- Research links open in a new tab.
- Paper buy/sell actions update simulated cash and positions.
- Trade history and simulated portfolio state survive a page refresh in the same browser.
- Mobile layout remains usable.
