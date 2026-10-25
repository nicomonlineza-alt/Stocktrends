# Product Requirements

## Core dashboard
1. Show exactly five daily candidates.
2. Show ticker, company name, price, daily percentage move, ranking score, signal label, and action buttons.
3. Link to external market information for each ticker.
4. Show a visible demo/live data indicator.
5. Display simulated cash, portfolio value, P/L, open positions, and trade count.

## Paper-trading workflow
1. Record simulated buy/sell events with timestamp, symbol, shares, and execution reference price.
2. Update simulated cash and holdings.
3. Persist state in the browser for the prototype.
4. Allow a user to reset the simulated account.
5. Make clear that no real trade is placed.

## Later data integration
- Secure server-side market-data requests.
- Quote timestamps and stale-data warnings.
- Error handling and provider limits.
- Daily pick snapshots stored independently of later outcomes.
- No API credentials in client-side code or public commits.
