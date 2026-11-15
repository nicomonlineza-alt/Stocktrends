# Part One — Cloud Learning Data Archive

Exported read-only from Supabase project `stocktrends-learning` on 2026-11-15.

- Source: `public.learning_journal_events` — 418 rows, exported in five ordered JSON batches.
- Source: `public.learning_review_runs` — 9 rows, exported to `review-runs.json`.
- Exported copies omit the internal `user_id` field. All other columns, including nested entry/exit snapshots and source payloads, are preserved.
- Files: `events-001.json` (100), `events-002.json` (100), `events-003.json` (100), `events-004.json` (100), `events-005.json` (18), and `review-runs.json` (9).
- The export is a snapshot, not a live sync. New Part One events created after this export are not included.
- Browser-local learning data under `stocktrends-ai-suggestions-learning-v1` is separate and is not stored in these cloud tables; it remains untouched in the user's browser.
- No Supabase rows were changed or deleted.
