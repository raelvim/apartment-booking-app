# BUILD_VERIFICATION.md — AI Agent Bootstrap

> ## GOLDEN RULE
>
> **The principal assistant/coordinator is not allowed to code in this repository.**
>
> Only designated technical agents from the approved project team may write, modify, delete, or commit implementation code, tests, migrations, runtime configuration, or CI changes on their assigned issue branches:
>
> - `AGT-DATA-001` — Database & Payments
> - `AGT-WEB-001` — Frontend & Security
> - `AGT-QA-001` — Testing & Architecture
>
> The principal assistant may coordinate, inspect, assign work, review evidence, report status, and maintain governance/process documentation when explicitly requested by the Repository Owner. It must not impersonate a specialist agent by switching roles and implementing code itself.
>
> If no designated team agent is available to implement a task, the task is **BLOCKED**. The principal assistant must report that blocker instead of coding.
>
> No agent or coordinator may merge anything into `main` without a separate, explicit Repository Owner instruction authorizing that specific merge.

> **FIRST FILE RULE**
>
> Every technical agent must read this file before inspecting or modifying implementation code.

## 1. Repository identity

- Repository: `SebCorner08/apartment-booking-app`
- Canonical integration branch: `main`
- Frontend: `public/`
- Backend: `server/`
- Current database baseline: SQLite
- Payment provider: Stripe
- External availability source: Airbnb iCal
- Frontend deployment: `netlify.toml`
- Backend deployment: `render.yaml`

## 2. Mandatory reading order

1. `BUILD_VERIFICATION.md`
2. `AGENTS.md`
3. `DEVELOPMENT_PROCESS.md`
4. Assigned role file under `agents/`
5. Exact GitHub issue
6. Exact issue branch and commit SHA
7. Relevant implementation files

A chat instruction such as “go ahead,” “solve it,” “fix it,” “continue,” or “finish it” authorizes branch work only. It never authorizes a merge to `main`.

## 3. Startup verification gate

Before implementation, the acting specialist agent must confirm:

- [ ] Correct repository
- [ ] Correct issue
- [ ] Correct assigned specialist role
- [ ] Correct branch
- [ ] Current branch SHA
- [ ] Approved baseline SHA
- [ ] Accepted issue scope
- [ ] No unrelated branch changes
- [ ] Build/test capability identified
- [ ] No tracked secrets or customer data exposure
- [ ] Actor is a designated team specialist, not the principal assistant

If any item is uncertain, implementation stops.

## 4. Baseline technical verification

Use the lockfile:

```bash
npm ci
```

Current baseline runtime commands:

```bash
npm start
npm run dev
```

Existing test scripts include:

```bash
node test-security.js
node test-booking-flow.js
```

Tests must use isolated development/test data and test/mock payment configuration. Never run destructive tests against production data.

## 5. Evidence rule

For every implementation result, record evidence tied to the exact commit SHA:

- specialist agent identity;
- files changed;
- commands actually run;
- test results;
- relevant manual checks;
- known unverified areas;
- migration/rollback notes when applicable.

Never claim a test, build, deployment, or verification succeeded without evidence from the same material revision.

## 6. Blocking conditions

Forward progress stops if any of the following applies:

- wrong or unknown issue/branch/SHA;
- no designated specialist agent is available;
- the principal assistant would have to code;
- issue scope does not authorize the change;
- relevant tests fail;
- payment integrity is uncertain;
- database migration/rollback is undefined;
- customer data or secrets may be exposed;
- security regression is unresolved;
- merge conflict materially changes the result;
- deployment outcome is unknown;
- required QA/Lead/Owner evidence is absent;
- explicit merge authorization is absent.

Evidence added after an unauthorized action does not retroactively authorize it.

## 7. Domain checks

### Database / persistence

Verify data preservation, migration behavior, rollback/recovery, test isolation, and that runtime databases are not committed.

### Payments

Verify server-authoritative pricing, webhook signature validation, durable persistence, idempotency, and failure/retry behavior.

### Admin / security

Verify authentication/authorization, XSS/CSP implications, token/cookie exposure, rate limiting where relevant, and no secret leakage.

### Booking availability

Verify overlap behavior across confirmed bookings, active payment holds, imported external blocks, and simultaneous booking attempts.

## 8. Required process chain

No stage may be silently skipped:

`ISSUE_CREATED → ISSUE_ACCEPTED → AGENT_ASSIGNED → BRANCH_CREATED → IMPLEMENTATION_IN_PROGRESS → RESULT_SUBMITTED → QA_CONFORM → LEAD_APPROVED → OWNER_APPROVED → MERGE_AUTHORIZED → MERGED → DEPLOYMENT_DECIDED → DEPLOYED → VERIFIED → CLOSED`

`MERGE_AUTHORIZED` requires a separate explicit instruction from the Repository Owner identifying the PR or explicitly authorizing the merge to `main`.

## 9. Authority boundaries

Specialist agents may implement only on their assigned issue branches.

They may not independently:

- merge to `main`;
- deploy production changes;
- rotate production secrets;
- delete production data;
- change hosting/account ownership;
- expand the issue into unrelated work.

The principal assistant/coordinator may not implement code at all.

## 10. Required technical work report

A specialist beginning work must be able to report:

```text
Repository: SebCorner08/apartment-booking-app
Role: <specialist agent>
Issue: #<number>
Branch: <branch>
Baseline SHA: <sha>
Current SHA: <sha>
Process state: <state>
Build/test gate: <verified or blocked>
Authorized next action: <action>
```

If those fields cannot be established from repository evidence, implementation is blocked.

## 11. Completion gate

A task is not complete because code exists. Completion requires current QA/review evidence, exact revision identity, explicit merge authorization, and post-merge/deployment verification when applicable.

This file is the mandatory first technical file. `AGENTS.md` governs collaboration, `DEVELOPMENT_PROCESS.md` governs transitions, the role file governs specialist authority, and GitHub provides the canonical execution evidence.
