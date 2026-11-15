# Part Two — No-trade discipline

Part Two now applies hard paper-observation vetoes after the relative historical-risk ranking. A candidate can look comparatively safer than peers and still be rejected.

## Automatic no-trade gates
- Latest candle older than five minutes, or an unparseable timestamp.
- Historical one-minute return volatility above 0.35%.
- Maximum drawdown across the fetched sample above 1.5%.
- Mean high-low range over the latest 14 candles above 0.25% of close.
- Absolute latest one-minute close-to-close move above 0.30%.

A failed candidate remains visible with its filter count but cannot be selected. Exactly five eligible candidates are still required. These are conservative research thresholds, not calibrated probabilities or guarantees; they should be reviewed against a larger labelled dataset before interpreting their effectiveness.

## Design principles
- Veto first, rank second: hard risk gates override relative rank.
- No forced participation: if fewer than five candidates pass, wait and rescan later.
- Missing/stale data is not treated as a neutral signal.
- Paper-only; no broker connection or live execution.
- Part One remains untouched.

## Limitations
The thresholds are initial guardrails, not validated predictive rules. One-minute data can be noisy; data-provider timestamps, market hours, spreads, gaps and missing volume can affect results. The local journal remains browser/device-specific.
