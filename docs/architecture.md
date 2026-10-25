# Architecture

## Current prototype
- Vite + React frontend.
- Responsive CSS and Lucide icons.
- Illustrative market data in `src/App.jsx`.
- Paper account, positions, and ledger persisted in browser localStorage.
- External company information links open Yahoo Finance pages.

## Planned architecture
- Frontend dashboard calls a server-side API route.
- Server-side route reads the Twelve Data API key from a protected environment variable.
- Data service validates and normalizes quotes and records timestamps.
- Selection service ranks candidates using versioned, documented rules.
- Persistence layer stores daily picks, quote snapshots, simulated orders, and evaluation results.
- Evaluation service computes outcomes after a fixed forecast horizon without altering original predictions.

## Security and reliability
- Keep secrets server-side.
- Validate symbols and provider responses.
- Show data freshness and error states.
- Do not silently substitute sample data for failed live data.
- Keep paper trading separate from any future broker integration.
