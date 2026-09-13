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

> ## GOLDEN RULE — PR OWNERSHIP AND REVIEW
>
> **Every pull request containing implementation code is owned by the approved project team, not by GitHub Copilot.**
>
> - The designated specialist team agent is responsible for the final code, tests, evidence, and `RESULT_SUBMITTED` state of the PR.
> - GitHub Copilot may create an optional **initial seed commit** when useful, but that commit is only a starting point. It does not make Copilot the implementer, PR owner, or code authority.
> - Before a PR can leave implementation, the assigned project-team specialist must inspect, adopt, correct, or replace any Copilot seed work and take responsibility for the resulting branch head.
> - After the team has produced the reviewable branch head, **Copilot's role is reviewer only**. Copilot must not continue implementing fixes unless the Repository Owner explicitly changes this rule for a specific task.
> - The project team must address or disposition Copilot review findings.
> - **Raelvi (`raelvim`) has the final technical review word on every code PR.** A code PR cannot reach final technical approval without Raelvi's review/approval of the exact final head SHA.
> - Raelvi's technical approval is not merge authorization. Only the Repository Owner can authorize a merge to `main`.
>
> Normal code-PR sequence:
>
> `Team specialist implementation → team QA → Copilot review → team addresses findings → Raelvi final technical approval → Repository Owner MERGE_AUTHORIZED → merge`

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
- [ ] If Copilot supplied a seed commit, the assigned team specialist has explicitly taken ownership of reviewing/adopting it

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
- migration/rollback notes when applicable;
- Copilot review result when the PR contains code;
- Raelvi final technical review result when the PR contains code.

Never write “tests pass,” “build verified,” “deployment successful,” or equivalent without execution evidence from the same material revision.

If code changes after verification or review in a material way, the affected checks and reviews must be repeated against the new head SHA.

## 6. Blocking conditions

Forward progress stops if any of the following applies:

- wrong or unknown issue/branch/SHA;
- no designated specialist agent is available;
- the principal assistant would have to code;
- Copilot is acting as final implementer or PR owner instead of reviewer;
- the team has not taken responsibility for a Copilot seed commit;
- issue scope does not authorize the change;
- relevant tests fail;
- payment integrity is uncertain;
- database migration/rollback is undefined;
- customer data or secrets may be exposed;
- security regression is unresolved;
- merge conflict materially changes the result;
- required Copilot review is missing on a code PR;
- required Raelvi final technical review is missing on a code PR;
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

`ISSUE_CREATED → ISSUE_ACCEPTED → AGENT_ASSIGNED → BRANCH_CREATED → IMPLEMENTATION_IN_PROGRESS → RESULT_SUBMITTED → QA_CONFORM → COPILOT_REVIEWED → RAELVI_APPROVED → LEAD_APPROVED → OWNER_APPROVED → MERGE_AUTHORIZED → MERGED → DEPLOYMENT_DECIDED → DEPLOYED → VERIFIED → CLOSED`

For code PRs:

- `RESULT_SUBMITTED` must come from the assigned project-team specialist, never Copilot.
- `COPILOT_REVIEWED` means Copilot reviewed the team-owned final candidate and findings were addressed or explicitly dispositioned.
- `RAELVI_APPROVED` means Raelvi reviewed the exact final candidate head and gave the final technical approval.
- A material code change after either review invalidates that review and requires it again.

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

GitHub Copilot may not own the final implementation. Its normal role is independent PR review; an initial seed commit is permitted only as a non-authoritative starting point for a designated team specialist.

Raelvi is the final technical reviewer for code PRs but does not have Repository Owner merge authority unless the Repository Owner explicitly delegates it.

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

A task is not complete because code exists. Completion requires team ownership of the final code, current QA evidence, Copilot review, Raelvi final technical approval, exact revision identity, explicit Repository Owner merge authorization, and post-merge/deployment verification when applicable.

This file is the mandatory first technical file. `AGENTS.md` governs collaboration, `DEVELOPMENT_PROCESS.md` governs transitions, the role file governs specialist authority, and GitHub provides the canonical execution evidence.
