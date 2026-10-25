# Paper Trading and Performance Rules

## Initial simulation
- Starting simulated cash: USD $100,000.
- Initial order size: one share per click.
- Orders use the dashboard's displayed sample price in this prototype.
- Buy/sell actions are simulated only; no real order is transmitted.
- Browser storage is local to this browser and is not a shared or server-backed database.

## Future evaluation requirements
Before testing the strategy, define the order execution price, spread, commissions, slippage, dividends, market hours, missing-data behavior, and forecast horizon. Keep those assumptions constant across the strategy and its baseline.

Track at least:
- Total return and return percentage.
- Closed-trade results and win rate.
- Unrealized and realized P/L separately.
- Maximum drawdown.
- Exposure, number of trades, and turnover.
- Benchmark return over the same period.
- Prediction accuracy by forecast horizon.

## Prototype limitation
This version's prices are illustrative and static. Portfolio P/L therefore does not represent real market performance. The score and day-change fields are placeholders and must not be used to make financial decisions.
