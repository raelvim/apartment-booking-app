# Issue #1 — SQLite repository data hygiene

## Decision

Production remains on the persistent Render SQLite database introduced by Issue #23:

- service: `escapelakenorman-api`
- database path: `/var/data/reservations.db`
- configuration: `RESERVATIONS_DB_PATH=/var/data/reservations.db`
- persistent disk mount: `/var/data`

The runtime database must never be a repository artifact. This issue removes `server/reservations.db` from the active Git tree while keeping the existing `.gitignore` rule.

For local development, the application may still fall back to `server/reservations.db`. `server/database.js` creates/opens the file and initializes the required tables at runtime, so a pre-populated database file does not need to be committed.

## Existing persistence work reused from Issue #23

Issue #1 does not duplicate the completed production cutover work:

- `server/database-path.js` provides a configurable SQLite path with the local fallback.
- `render.yaml` declares the paid service and dedicated 1 GB `/var/data` disk.
- `docs/ISSUE-23-RENDER-SQLITE-CUTOVER.md` contains backup, integrity, migration and rollback guidance.
- production has already been verified using `/var/data/reservations.db` across a service restart.

## Git-history review

`server/reservations.db` has existed as a tracked binary SQLite artifact in repository history. GitHub path history returns multiple historical revisions of that file, including commits such as:

- `125a6fb0989d7abf4e14f8e64822470abe1f075f`
- `01c64345d346132607101fa6ce8f484b75e18444`
- `f45543fb563114b9a6ed1cf9c20980ed421afd47`
- `d8c0d6dbec028f349c8ed920356b20b0119e23e1`

The database schema includes `manual_charges.guest_name` and `manual_charges.guest_email`, so a committed runtime database is inherently capable of containing customer PII. The currently tracked database also contains runtime/test state rather than source code.

No verified production guest PII or secret was identified from the repository-visible evidence reviewed for this change. However, because historical SQLite blobs are binary and remain retrievable from Git history, absence of PII in every historical blob cannot be proven from the available connector inspection. The repository history must therefore be treated conservatively as potentially sensitive.

## Remediation scope

This change performs the safe non-destructive remediation now:

1. Remove `server/reservations.db` from the current branch.
2. Keep `server/reservations.db` in `.gitignore`.
3. Keep production data only on the Render persistent disk, not in Git.
4. Keep local/test database creation isolated and runtime-generated.

This change deliberately does **not** rewrite Git history. A history rewrite would be destructive for existing clones, branches, tags and open work and requires separate explicit Repository Owner authorization.

If a later investigation confirms real guest PII in a historical database blob, the recommended follow-up is a coordinated history purge (for example with `git filter-repo`) followed by force-updating affected refs. Before such a purge, inventory branches/tags/forks and create a repository backup. Any exposed credential or secret would require rotation; no credential exposure is established by this issue.

## Postgres planning

Managed Postgres remains a future option, not a prerequisite for closing this issue. The current production requirement is satisfied by persistent SQLite on a single Render service.

A future Postgres migration should be a separate issue and include:

- schema mapping for bookings, holds, external blocks, tax settings and manual charges;
- preservation of the unique Stripe-session/payment idempotency constraint;
- transactional overlap/hold semantics;
- export/import validation with row counts and representative IDs;
- rollback/cutover steps and a verified backup;
- application tests against an isolated Postgres database before production migration.

## Rollback / safety

No production database is deleted or modified by this repository cleanup. Production continues using `/var/data/reservations.db` through `RESERVATIONS_DB_PATH`.

Before merge, the branch can be abandoned or reverted without affecting production data. After merge, restoring a tracked runtime database is not the preferred rollback; fix any local bootstrap problem by allowing `server/database.js` to create a fresh ignored local DB or by setting `RESERVATIONS_DB_PATH` explicitly.
