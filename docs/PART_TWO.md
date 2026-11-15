# PART TWO — Loss-Control Learning Experiment

**Status:** Implementation brief  
**Purpose:** Study how to reduce simulated losses and drawdown while retaining the complete Part One baseline.

## 1. Home screen and navigation

Replace the current home-screen content with three clear category buttons:

- Stocks
- Crypto
- Forex

Selecting a category opens a dedicated category screen. Each category presents 30 instruments. The user may select up to five instruments and then press Start.

## 2. Candidate ranking — no guarantee language

The requested concept of instruments "least likely to lose money" cannot be known or guaranteed. The application must instead label these as **30 lowest observed-risk candidates in the available data**, with the ranking method and data timestamp visible.

Rank candidates using available historical data and a transparent risk score, prioritising:
- lower realised volatility over the selected observation horizon;
- smaller recent peak-to-trough drawdown;
- adequate candle history and data freshness;
- stable spread/liquidity proxies when reliable provider data exists;
- penalties for missing, stale, thin, or inconsistent data.

Do not rank by recent positive returns alone. A low historical-risk score does not mean an instrument cannot lose value. If data is unavailable, show the instrument as unavailable rather than inventing a score.

## 3. Five-instrument selection and session flow

1. Choose Stocks, Crypto, or Forex.
2. Display 30 ranked instruments with risk score, data timestamp, and a concise explanation.
3. Allow selection of up to five instruments; require exactly five before Start.
4. After Start, reveal three duration controls: 1 minute, 3 minutes, and 5 minutes.
5. The selected duration is the maximum paper-observation window.
6. The simulator may record an earlier hypothetical exit when its pre-declared risk rules trigger.
7. At the end of the selected period, close all remaining simulated observations automatically and record the outcomes.

No live brokerage orders, real-money positions, or financial execution should be added.

## 4. Loss-control method

Part Two should prioritise capital preservation in the simulation:
- define an initial virtual stake per selected instrument;
- define a maximum simulated loss per instrument and a session-level loss ceiling;
- use volatility-aware exit thresholds based on verified candles (for example ATR), with thresholds documented and versioned;
- close a paper observation early if the exit rule triggers;
- do not widen a loss threshold to avoid recording a loss;
- do not open replacement positions during the same session unless a separate experiment explicitly tests that behaviour;
- account for estimated spread/fees where reliable values are available, otherwise disclose that results exclude them.

A timer is a maximum observation period, not a promise that the price can be exited at a particular level. Gaps and missing data may prevent a reliable observation.

## 5. Loss ledger and gauge

After every completed session, append a Part Two session record containing:
- session ID, category, chosen symbols, duration, start/end timestamps;
- entry and exit observations, data source and candle timestamps;
- exit reason (risk rule, user early close, or timer);
- per-instrument simulated result and session total;
- cumulative simulated losses and cumulative net result;
- risk-score and strategy version used.

The gauge must be based on cumulative realised simulated losses / drawdown, not a decorative random number. It should move toward the high-risk zone as cumulative losses or drawdown rise and recover only when later realised results genuinely improve the defined metric. Show the numeric amount, period, and calculation beside the gauge.

Use a separate Part Two storage namespace/table so Part One records are untouched. Support local persistence and Supabase sync when configured; handle duplicate writes with stable session IDs.

## 6. Continued learning

For each completed session, store the pre-session ranking, selected candidates, all indicator/risk features, observed path, exit reason, and outcome. Compare candidate rankings with realised outcomes. Learn cautiously from repeated observations, track sample size, and evaluate on later unseen sessions. Never treat a small number of wins as proof of predictive skill.

## 7. User-facing safeguards

- Clearly label all sessions as paper simulations.
- Display data freshness and provider errors.
- Never describe any instrument as safe, guaranteed, or certain to avoid losses.
- No real-money trading, broker connection, or order-routing functionality.
- Do not imply that the one-, three-, or five-minute windows eliminate market risk.
- If fewer than 30 valid candidates can be verified, show fewer and explain why rather than filling the list with fabricated data.

## 8. Acceptance checklist

- [ ] Home screen shows only Stocks, Crypto, Forex category choices.
- [ ] Each category screen can display up to 30 verified candidates with transparent risk ranking.
- [ ] Exactly five candidates are required before Start.
- [ ] Start reveals 1-, 3-, and 5-minute duration choices.
- [ ] User can close a paper observation early.
- [ ] Remaining observations close automatically at the selected maximum duration.
- [ ] Losses are appended to a cumulative Part Two ledger after each session.
- [ ] Loss gauge reflects actual cumulative loss/drawdown data.
- [ ] Part Two learning is saved separately and continues across sessions.
- [ ] Part One records and learning remain intact.
- [ ] Mobile layout and production build are verified.
