# Shipping cron implementation plan

Goal: monthly shipping snapshots controlled by authenticated admins, configuration persisted in Neon.
Architecture: daily Vercel scheduler at 00:00 UTC; DB decides whether due. Default 1 month, day 1 at 07:00 Asia/Ho_Chi_Minh. Config supports 1–12 months and days 1–28. Daily invocation cannot promise an exact hour; do not expose arbitrary hour controls. Alphaliner page and public RPC URL are the supported source choices. New provider requires a parser. No arbitrary remote URLs or redirects.

- [x] Add failing tests for calendar scheduling, source restrictions, missing/wrong cron secrets, runner skips/failures and source field validation.
- [x] Add additive config/run tables with constraints, audit identity, revision and expiring lease. Save configuration only after requireAdmin. Schedule edits reset next due date; running jobs cannot overwrite revised schedule.
- [x] Fetch public RPC with timeout/size bounds; validate ranks, world share against global capacity, carrier identity and record collection-date provenance. Store snapshot plus completion atomically; failure keeps last valid data and retries on next daily invocation.
- [x] Create admin form, source URL editor, persisted schedule/status/history and accessible success/error states.
- [x] Set ignored local secret; daily vercel.json cron and protected route. Apply migrations dev/production, verify configuration and development execution, run tests/lint/typecheck/build.

Risks: source format changes, unknown top-ten entrants (fail safely), concurrent requests (atomic lease), edits during run (revision check), source payload/redirect abuse (allowlist, no redirect, bounded reads), scheduler timing (daily/hour window).

Verification: production/development migration applied; 61 tests, lint, typecheck and Next production build. Dedicated development integration verifies atomic concurrent claim, failure retry, unchanged-save advancement, edits during runs, idempotent snapshots and lost lease rejection. Direct RPC fetched with curl and Node; transient connection timeouts observed and handled by the runner. Secrets ignored by Git.
Ruling: unchanged saves preserve config revision to allow active run schedule advancement. Completion requires returned run id; losing a lease fails explicitly. No Git push or remote deployment performed.
