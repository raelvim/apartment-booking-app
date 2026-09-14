# BUILD_VERIFICATION.md — AI Agent Bootstrap

> ## ABSOLUTE COPILOT RESTRICTION — OVERRIDES ALL CONFLICTING TEXT
>
> This rule has priority over any conflicting Copilot language anywhere else in this file or in repository governance documents until those documents are synchronized.
>
> - GitHub Copilot MUST NEVER be assigned to a GitHub issue, pull request, task, or repository workflow as an assignee, coding agent, implementation agent, or code-generation actor.
> - The Principal/Lead MUST NEVER trigger any GitHub action, assignment, automation, connector action, or workflow that can cause Copilot to create or modify implementation code, branches, commits, pull requests, patches, or implementation candidates.
> - Copilot MUST NEVER create an implementation branch, commit, pull request, patch, seed commit, seed PR, or other implementation artifact.
> - Copilot MAY ONLY act as a reviewer after the designated implementation owner has submitted `RESULT_SUBMITTED` and an independent reviewer has recorded `QA_CONFORM` for the exact candidate head SHA.
> - A Copilot review must be explicitly requested on the existing implementation PR. Copilot findings return to the designated implementation owner; Copilot must not implement the fixes.
> - Any Copilot-generated implementation artifact created contrary to this rule is **UNAUTHORIZED**. It must not be merged, adopted, cherry-picked, copied into the authoritative branch, or treated as implementation evidence unless the Repository Owner gives a separate explicit exception naming the exact artifact and permitted use.
> - If an unauthorized Copilot artifact appears, stop, report it to the Repository Owner, and wait for explicit disposition instructions. Do not silently reuse or delete it.
> - GitHub automation, connectors, coding agents, or other tooling MUST NOT substitute for `AGT-DATA-001`, `AGT-QA-001`, the Principal/Web Implementation Owner, or any other designated implementation owner/reviewer.
> - Any lower-priority text that says Copilot may provide seed code, seed commits, seed branches, or implementation work is obsolete and MUST NOT be followed.

> ## GOLDEN RULE — IMPLEMENTATION OWNERSHIP
>
> The principal assistant/coordinator is also the permanent **Web Implementation Owner** for this repository.
>
> The principal assistant MAY implement approved frontend/browser/security work on the assigned issue branch, including active files under `public/`, `netlify.toml`, frontend-focused regression tests, and browser-side authentication/session behavior. The principal assistant must keep those changes inside the accepted issue scope.
>
> The principal assistant MUST NOT take over the remaining specialist responsibilities:
>
> - `AGT-DATA-001` — Database & Payments
> - `AGT-QA-001` — Testing & Architecture / independent QA
>
> Backend data, payment, persistence, migration, server architecture, CI/test infrastructure, and independent QA remain team responsibilities. If web work requires a backend/data/payment change, hand that portion to `AGT-DATA-001`. If independent verification is required, it must be performed by `AGT-QA-001` or another Lead-designated independent reviewer; the principal assistant may not self-certify its own implementation as QA.
>
> If a required non-web specialist is unavailable, the affected work is **BLOCKED**. The principal assistant must not impersonate that specialist.
>
> No agent, specialist, reviewer, or coordinator may merge anything into `main` without a separate, explicit Repository Owner instruction authorizing that specific PR/change.

> ## GOLDEN RULE — PR OWNERSHIP AND REVIEW
>
> Every implementation PR must have a clearly identified implementation owner:
>
> - Frontend / browser / web security PRs: the principal assistant acting as Web Implementation Owner.
> - Database / payments PRs: `AGT-DATA-001`.
> - Testing / architecture PRs: `AGT-QA-001` when that agent is the implementer; independent QA must then be assigned to another qualified reviewer.
>
> GitHub Copilot is reviewer-only. Copilot must not provide seed commits, implementation branches, implementation PRs, or implementation fixes. The identified implementation owner is solely responsible for producing the implementation candidate and taking responsibility for the final branch head.
>
> After implementation and independent QA, Copilot may review the exact candidate. Valid Copilot findings return to the implementation owner. **Raelvi (`raelvim`) has the final technical review word on every code PR** against the exact final head SHA.
>
> Raelvi approval is not merge authorization. Only the Repository Owner can authorize a merge to `main`.

Normal web code-PR sequence:

`Principal/Web implementation → independent QA → Copilot review → Principal/Web addresses findings → Raelvi final technical approval → Repository Owner MERGE_AUTHORIZED → merge`

Normal specialist code-PR sequence:

`Team specialist implementation → independent QA → Copilot review → implementation owner addresses findings → Raelvi final technical approval → Repository Owner MERGE_AUTHORIZED → merge`

> **FIRST FILE RULE**
>
> Every technical actor must read this file before inspecting or modifying implementation code.

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
4. Assigned specialist role file under `agents/` when the work belongs to a specialist agent
5. Exact GitHub issue
6. Exact issue branch and commit SHA
7. Relevant implementation files

For frontend/browser/security issues owned by the principal assistant, there is no separate Web Agent role file. `BUILD_VERIFICATION.md`, `AGENTS.md`, and `DEVELOPMENT_PROCESS.md` define that authority directly.

A chat instruction such as “go ahead,” “solve it,” “fix it,” “continue,” or “finish it” authorizes branch work only. It never authorizes a merge to `main`.

## 3. Startup verification gate

Before implementation, confirm:

- [ ] Correct repository
- [ ] Correct issue
- [ ] Correct implementation owner
- [ ] Correct branch
- [ ] Current branch SHA
- [ ] Approved baseline SHA
- [ ] Accepted issue scope
- [ ] No unrelated branch changes
- [ ] Build/test capability identified
- [ ] No tracked secrets or customer data exposure
- [ ] Copilot is not assigned as an issue/PR assignee, coding agent, implementation agent, or code-generation actor
- [ ] No Copilot-generated implementation branch/commit/PR/patch is being used
- [ ] Independent QA ownership is identified

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

- implementation owner identity;
- files changed;
- commands actually run;
- test results;
- relevant manual checks;
- known unverified areas;
- migration/rollback notes when applicable;
- independent QA result;
- Copilot review result when the PR contains code;
- Raelvi final technical review result when the PR contains code.

Never write “tests pass,” “build verified,” “deployment successful,” or equivalent without execution evidence from the same material revision.

If code changes materially after verification or review, repeat the affected checks and reviews against the new head SHA.

## 6. Blocking conditions

Forward progress stops if any of the following applies:

- wrong or unknown issue/branch/SHA;
- required non-web specialist unavailable;
- principal assistant would need to impersonate Data, QA, or another independent specialist;
- Copilot is assigned to an issue/PR/task as a coding or implementation agent;
- an action would trigger Copilot to create or modify implementation code, a branch, commit, PR, patch, or candidate;
- an unauthorized Copilot-generated implementation artifact exists in the proposed implementation path;
- GitHub automation, a connector, coding agent, or other tool is substituting for a designated specialist or implementation owner;
- issue scope does not authorize the change;
- relevant tests fail;
- payment integrity is uncertain;
- database migration/rollback is undefined;
- customer data or secrets may be exposed;
- security regression is unresolved;
- merge conflict materially changes the result;
- independent QA is missing;
- required Copilot review is missing on a code PR;
- required Raelvi final technical review is missing on a code PR;
- deployment outcome is unknown;
- required Lead/Owner evidence is absent;
- explicit merge authorization is absent.

Evidence added after an unauthorized action does not retroactively authorize it.

## 7. Domain checks

### Frontend / browser / web security — Principal/Web Implementation Owner

Authorized scope includes active `public/` files, `netlify.toml`, frontend regression tests, API routing in the browser, DOM rendering, XSS/CSP controls, and browser-side admin session behavior. Preserve mobile/desktop behavior and server-authoritative pricing/payment semantics. Backend authentication/data changes require `AGT-DATA-001` coordination.

### Database / persistence — AGT-DATA-001

Verify data preservation, migration behavior, rollback/recovery, test isolation, and that runtime databases are not committed.

### Payments — AGT-DATA-001

Verify server-authoritative pricing, webhook signature validation, durable persistence, idempotency, and failure/retry behavior.

### Testing / architecture / independent QA — AGT-QA-001

Verify meaningful automated coverage, isolated test data, CI behavior, regression risk, architecture changes, and independent confirmation of implementation evidence.

### Booking availability

Verify overlap behavior across confirmed bookings, active payment holds, imported external blocks, and simultaneous booking attempts.

## 8. Required process chain

No stage may be silently skipped:

`ISSUE_CREATED → ISSUE_ACCEPTED → IMPLEMENTATION_OWNER_ASSIGNED → BRANCH_CREATED → IMPLEMENTATION_IN_PROGRESS → RESULT_SUBMITTED → QA_CONFORM → COPILOT_REVIEWED → RAELVI_APPROVED → LEAD_APPROVED → OWNER_APPROVED → MERGE_AUTHORIZED → MERGED → DEPLOYMENT_DECIDED → DEPLOYED → VERIFIED → CLOSED`

For code PRs:

- `RESULT_SUBMITTED` comes from the identified implementation owner. For web issues, that is the principal assistant.
- `QA_CONFORM` must be independent of the implementation owner.
- `COPILOT_REVIEWED` means Copilot reviewed the exact final candidate only after `RESULT_SUBMITTED` and `QA_CONFORM`; findings were addressed or explicitly dispositioned by the implementation owner.
- `RAELVI_APPROVED` means Raelvi reviewed the exact final candidate head and gave final technical approval.
- A material code change after QA, Copilot review, or Raelvi approval invalidates the affected evidence and requires it again.

`MERGE_AUTHORIZED` requires a separate explicit instruction from the Repository Owner identifying the exact PR/change that may be merged to `main`.

## 9. Authority boundaries

### Principal assistant / Lead Integrator / Web Implementation Owner

May:

- coordinate all issues and integration;
- implement frontend/browser/web-security work on approved issue branches;
- modify active `public/` files, `netlify.toml`, and frontend-focused tests within accepted scope;
- review and address Copilot findings on web PRs;
- maintain governance/process documentation when requested.

May not:

- act as `AGT-DATA-001` for database/payment/persistence implementation;
- act as `AGT-QA-001` for independent QA of its own code;
- assign or trigger Copilot as a coding/implementation agent;
- use, adopt, cherry-pick, or copy unauthorized Copilot-generated implementation work without a separate explicit Repository Owner exception naming the exact artifact;
- make broad backend/CI/architecture changes outside web scope;
- merge to `main` without explicit Repository Owner authorization;
- deploy production changes without the approvals required by the process.

### AGT-DATA-001

Owns Database & Payments implementation.

### AGT-QA-001

Owns Testing & Architecture implementation and normally performs independent QA. When QA itself implements a change, the Lead assigns a different independent reviewer for `QA_CONFORM`.

### GitHub Copilot

Reviewer-only after `RESULT_SUBMITTED` and independent `QA_CONFORM` on the exact candidate. Copilot must never be assigned as a coding agent or implementation actor and must never create or modify implementation code, branches, commits, PRs, patches, or fixes.

### Raelvi (`raelvim`)

Final technical reviewer for code PRs. Raelvi does not authorize merge to `main` unless the Repository Owner explicitly delegates that authority.

## 10. Current issue routing

- Principal/Web Implementation Owner: #3, #4, #6, #17 and future frontend/browser/web-security issues.
- `AGT-DATA-001`: #1, #2, #5 and future database/payment/persistence issues.
- `AGT-QA-001`: #7, #8, #9, #15 and future testing/architecture/dependency-audit issues.
- Lead Integrator / principal assistant: #14, #16, cross-branch integration, deployment coordination, and release readiness.

## 11. Required technical work report

An implementation owner beginning work must be able to report:

```text
Repository: SebCorner08/apartment-booking-app
Owner: <Principal/Web | AGT-DATA-001 | AGT-QA-001 | other approved owner>
Issue: #<number>
Branch: <branch>
Baseline SHA: <sha>
Current SHA: <sha>
Process state: <state>
Build/test gate: <verified or blocked>
Independent QA owner: <actor>
Authorized next action: <action>
```

If those fields cannot be established from repository evidence, implementation is blocked.

## 12. Completion gate

A task is not complete because code exists. Completion requires implementation-owner responsibility for the final code, current independent QA evidence, Copilot review, Raelvi final technical approval, exact revision identity, explicit Repository Owner merge authorization, and post-merge/deployment verification when applicable.

This file is the mandatory first technical file. `AGENTS.md` governs collaboration, `DEVELOPMENT_PROCESS.md` governs transitions, specialist role files govern Data and QA authority, and GitHub provides the canonical execution evidence.
