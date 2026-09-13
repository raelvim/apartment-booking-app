# BUILD_VERIFICATION.md — AI Agent Bootstrap

> **FIRST FILE RULE**
>
> Every AI coding/review agent working in this repository must read this file before inspecting or modifying implementation code. If the environment automatically loads `AGENTS.md` first, `AGENTS.md` immediately redirects the agent here before any repository action.

This file is the technical entry point for the apartment-booking project. It plays the same role as the initial build/verification gate in the CORNER workflow: establish repository identity, current revision, authorized task, build/test state, and process permissions before work begins.

## 1. Repository identity

- Repository: `SebCorner08/apartment-booking-app`
- Canonical integration branch: `main`
- Frontend: static files under `public/`
- Backend: Node.js / Express under `server/`
- Primary database on the current baseline: SQLite
- Payment provider: Stripe
- External availability source: Airbnb iCal
- Frontend deployment configuration: `netlify.toml`
- Backend deployment configuration: `render.yaml`

An agent must not assume a different repository, branch, deployment target, database, or environment from memory or another conversation.

## 2. Mandatory reading order

Before implementation or review, read in this order:

1. `BUILD_VERIFICATION.md` — this file.
2. `AGENTS.md` — permanent collaboration and authorization rules.
3. `DEVELOPMENT_PROCESS.md` — canonical state transitions and blocking gates.
4. The assigned role file under `agents/`.
5. The exact GitHub issue being worked on.
6. The exact branch and current commit SHA for that issue.
7. Only then, the implementation files relevant to the issue.

Do not begin implementation because a chat message says to “go ahead” if the GitHub/process evidence required by `DEVELOPMENT_PROCESS.md` is missing.

## 3. Startup verification gate

Before changing code, the acting agent must establish all of the following:

- [ ] Correct repository confirmed.
- [ ] Current branch confirmed.
- [ ] Current commit SHA recorded.
- [ ] GitHub issue exists and matches the requested work.
- [ ] Issue is accepted for implementation.
- [ ] Responsible agent role is identified.
- [ ] Dedicated issue branch exists or creation is authorized.
- [ ] No unrelated changes are being mixed into the branch.
- [ ] Relevant secrets are not present in tracked files.
- [ ] Existing build/test capability for the branch has been identified.

If any identity, branch, authorization, or scope item is uncertain, stop before modifying code and hand the uncertainty to the Lead Integrator.

## 4. Baseline technical verification

The agent must verify the starting state before claiming a fix improved it.

### Dependency installation

Use the lockfile:

```bash
npm ci
```

Do not replace the lockfile casually and do not use a dependency upgrade as an unrelated fix.

### Available runtime commands on the current baseline

```bash
npm start
npm run dev
```

`package.json` on the original reviewed baseline does not yet provide a canonical `npm test`; issue #7 is responsible for establishing automated CI/test entry points. Once that work is merged, `npm test` becomes part of the normal gate.

### Existing test scripts

The repository currently includes:

```bash
node test-security.js
node test-booking-flow.js
```

These scripts must run only against an isolated development/test database and mock/test payment configuration. Never run destructive cleanup or integration tests against production booking data.

### Server verification

When the issue affects runtime behavior, verify the server can start with an explicitly safe development/test environment and check:

```text
GET /health
```

A successful process start alone is not proof that bookings, payments, admin authentication, persistence, or deployment are correct.

## 5. Build/test evidence rule

For every implementation result, record evidence tied to the exact commit SHA:

- commands actually run;
- exit status/result;
- tests passed/failed;
- relevant manual verification;
- files changed;
- known unverified areas;
- migration or rollback notes when applicable.

Never write “tests pass,” “build verified,” “deployment successful,” or equivalent without execution evidence from the same material revision.

If code changes after verification in a material way, the affected checks must be rerun.

## 6. Blocking conditions

The agent must stop forward progression when any of these applies:

- wrong or unknown branch/revision;
- issue scope does not authorize the requested change;
- required agent role is not identified;
- merge conflict or stale base materially affects the result;
- dependency installation/build fails;
- required tests fail;
- payment idempotency is uncertain;
- client-supplied price could become authoritative;
- production data migration/rollback is undefined;
- production SQLite persistence is uncertain;
- secrets or personal booking data may be committed;
- security regression is unresolved;
- deployment outcome is unknown;
- required QA/Lead/Owner approval is absent.

Evidence added after an unauthorized action does not retroactively authorize it.

## 7. Domain-specific non-negotiable checks

### Database / persistence

Any change affecting bookings, holds, manual charges, pricing settings, or migrations must verify:

- existing data preservation;
- migration behavior;
- rollback/recovery path;
- isolation of test data;
- no runtime database is committed to Git.

### Payments

Any Stripe/payment change must verify:

- server-side authoritative pricing;
- webhook signature validation;
- durable persistence before successful acknowledgement where required;
- idempotency for duplicate webhook/browser confirmation;
- failure/retry behavior.

### Admin / security

Any admin/security change must verify:

- authentication and authorization boundaries;
- XSS/CSP implications;
- token/cookie exposure;
- rate limits where relevant;
- no secret leakage.

### Booking availability

Any availability change must verify overlap logic across:

- confirmed direct bookings;
- active payment holds;
- imported Airbnb/external blocks;
- simultaneous booking attempts.

## 8. Required development state chain

No stage may be silently skipped:

`ISSUE_CREATED → ISSUE_ACCEPTED → AGENT_ASSIGNED → BRANCH_CREATED → IMPLEMENTATION_IN_PROGRESS → RESULT_SUBMITTED → QA_CONFORM → LEAD_APPROVED → OWNER_APPROVED → MERGED → DEPLOYMENT_DECIDED → DEPLOYED → VERIFIED → CLOSED`

The detailed actor permissions, state evidence, retry rules, and `NOT_REQUIRED` deployment path are defined in `DEVELOPMENT_PROCESS.md`.

## 9. Merge and deployment authority

Specialist agents may implement and submit evidence on their authorized issue branch.

They must not independently:

- merge their own PR into `main`;
- deploy production changes;
- rotate production secrets;
- delete production data;
- change hosting/account ownership;
- expand an issue into unrelated architecture changes.

The Lead Integrator controls technical readiness. The Repository Owner controls final owner approval and production deployment authorization.

## 10. First response from an AI agent

After reading the required files, an AI agent beginning technical work should be able to state, internally or in its work report:

```text
Repository: SebCorner08/apartment-booking-app
Role: <agent role>
Issue: #<number>
Branch: <branch>
Baseline SHA: <sha>
Process state: <current valid state>
Build/test gate: <verified / blocked + evidence>
Authorized next action: <action>
```

If the agent cannot fill these fields from repository evidence, implementation is not authorized to proceed.

## 11. Completion gate

A technical task is not complete merely because code was changed. Completion requires the process evidence defined in `DEVELOPMENT_PROCESS.md`, including QA/review, exact revision evidence, owner decision where required, and post-merge/deployment verification when applicable.

This file is the mandatory bootstrap. `AGENTS.md` governs collaboration; `DEVELOPMENT_PROCESS.md` governs transitions; the role file governs specialist authority; the GitHub issue/PR history provides the canonical execution evidence.
