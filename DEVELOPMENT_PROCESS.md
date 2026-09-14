---
type: booking-development-process
process_id: PROC-DEV-001
status: ACTIVE
owner: Repository Owner
coordinator: AGT-LEAD-001
---

# Booking App — Development and Release Process

## Purpose

GitHub is the canonical execution record for issues, branches, commits, PRs, reviews, merges, deployments, and verification.

A chat instruction never skips a required gate. Evidence belongs to the exact issue, branch, and head SHA being evaluated.

## Non-negotiable ownership rules

1. The principal assistant is the Lead Integrator and permanent **Web Implementation Owner**.
2. The principal assistant may implement approved frontend/browser/web-security work on issue branches, but may not replace the Data or independent QA specialists.
3. `AGT-DATA-001` owns Database & Payments implementation.
4. `AGT-QA-001` owns Testing & Architecture implementation and normally supplies independent QA.
5. If `AGT-QA-001` is itself the implementation owner, the Lead assigns another qualified independent reviewer for `QA_CONFORM`.
6. GitHub Copilot may provide an optional initial seed commit, but it is not the final implementation owner.
7. The implementation owner must inspect/adopt/correct/replace seed work and take responsibility for the final branch head, tests, and `RESULT_SUBMITTED` evidence.
8. After implementation and independent QA, Copilot reviews the exact candidate.
9. Valid Copilot findings return to the implementation owner.
10. **Raelvi (`raelvim`) gives the final technical review word on every code PR** against the exact final head SHA.
11. **Only the Repository Owner can authorize merge to `main`.** Raelvi approval is technical approval, not merge authorization.
12. No AI actor may merge, squash, rebase, fast-forward, force-update, or directly write implementation code to `main` without a separate Repository Owner instruction for that exact PR/change.

## Roles

### Repository Owner

Final authority for merge authorization, production deployment authorization, destructive operations, secret changes, and irreversible migrations.

### AGT-LEAD-001 / Principal assistant

Coordinates issues, assigns specialists, checks scope/branch identity, controls integration readiness, and owns frontend/browser/web-security implementation.

As Web Implementation Owner, the principal assistant may modify active `public/` files, `netlify.toml`, and frontend-focused regression tests within accepted issue scope. It may also handle browser-side API routing, DOM/rendering, XSS/CSP, and browser-side admin session behavior.

The principal assistant must hand off backend database/payment/persistence/server-architecture work to `AGT-DATA-001` and may not independently certify its own web changes as `QA_CONFORM`.

### AGT-DATA-001 — Database & Payments

Owns database, persistence, migration, payment, Stripe, and backend data-integrity implementation.

### AGT-QA-001 — Testing & Architecture

Owns test/CI/architecture implementation and performs independent QA when it is not the implementation owner.

### GitHub Copilot

Independent reviewer after implementation + QA. Optional seed commits are allowed but never establish final ownership.

### Raelvi (`raelvim`)

Final technical reviewer for code PRs after implementation, independent QA, Copilot review, and resolution/disposition of findings.

## Canonical process chain

For code changes:

`ISSUE_CREATED → ISSUE_ACCEPTED → IMPLEMENTATION_OWNER_ASSIGNED → BRANCH_CREATED → IMPLEMENTATION_IN_PROGRESS → RESULT_SUBMITTED → QA_CONFORM → COPILOT_REVIEWED → RAELVI_APPROVED → LEAD_APPROVED → OWNER_APPROVED → MERGE_AUTHORIZED → MERGED → DEPLOYMENT_DECIDED → DEPLOYED → VERIFIED → CLOSED`

For documentation-only or repository-only changes with no runtime effect, deployment may be recorded as `NOT_REQUIRED` before verification.

No state may be silently skipped.

## State rules

### ISSUE_CREATED

Requires a GitHub issue with problem, scope, acceptance criteria, and risk/priority when relevant.

### ISSUE_ACCEPTED

Lead confirms the issue is valid, scoped, non-duplicate, and testable.

### IMPLEMENTATION_OWNER_ASSIGNED

Lead records one implementation owner:

- Principal/Web for frontend/browser/web-security work;
- `AGT-DATA-001` for database/payment/persistence work;
- `AGT-QA-001` for testing/architecture work;
- another explicitly approved owner only when the Repository Owner or Lead records that exception.

Copilot is never the final implementation owner.

### BRANCH_CREATED

One accepted issue maps to one primary implementation branch. Normal name: `issue-<number>-<short-name>`. Record baseline SHA.

A Copilot branch/commit may be referenced as seed material, but the authoritative implementation remains on the designated issue branch.

### IMPLEMENTATION_IN_PROGRESS

The implementation owner may modify only authorized scope, add/update tests, and produce evidence.

For Web work, the principal assistant may implement directly under the authority defined in `BUILD_VERIFICATION.md`.

For Data or QA domains, the principal assistant must not impersonate the specialist.

### RESULT_SUBMITTED

**Actor: identified implementation owner.**

Required evidence:
- branch;
- exact head SHA;
- files changed;
- checks/tests actually run and results;
- known limitations;
- migration/rollback notes where applicable;
- confirmation that any Copilot seed was inspected and adopted/corrected/replaced by the owner.

For web issues, the principal assistant may submit `RESULT_SUBMITTED`.

### QA_CONFORM

**Actor: independent reviewer.**

Normally `AGT-QA-001` performs QA. The QA actor must be independent of the implementation owner for the change being certified.

QA verifies relevant tests/regressions, security/data/payment impact, CI when applicable, and absence of unrelated files. Failed or missing required checks return work to implementation.

The principal assistant may not issue `QA_CONFORM` for its own Web implementation.

### COPILOT_REVIEWED

Copilot reviews the exact candidate that already has independent QA. Findings are captured in the PR.

Valid findings return to the implementation owner. Material fixes require renewed affected QA and a fresh Copilot review.

### RAELVI_APPROVED

**Actor: Raelvi (`raelvim`).**

Raelvi reviews the exact final head after implementation, independent QA, Copilot review, and resolution/disposition of findings.

Any material change after Raelvi approval requires another final review.

### LEAD_APPROVED

Lead confirms issue scope, current QA, Copilot review, Raelvi approval, dependencies, and merge readiness all refer to the same final head SHA.

### OWNER_APPROVED

Repository Owner accepts the technical result for the exact PR/head. This is **not** permission to merge.

### MERGE_AUTHORIZED

**Actor: Repository Owner only.**

Requires a separate explicit instruction identifying the exact PR/change, for example:

- “Merge PR #25 to main.”
- “You may merge the Issue #17 PR to main now.”

“Fix it,” “continue,” “approve,” “finish,” or authorization to implement/review do not count.

### MERGED

Only after all required prior gates and explicit `MERGE_AUTHORIZED`. Confirm expected head SHA and correct base.

### DEPLOYMENT_DECIDED

Record `REQUIRED`, `NOT_REQUIRED`, or `BLOCKED`.

### DEPLOYED

When required, record deployed SHA, target environment, result, and migration/config result as applicable. Merge is not deployment proof.

### VERIFIED

Runtime changes are verified against the deployed version. Repository-only changes are verified against merged state and CI/review evidence.

### CLOSED

Only after acceptance criteria and required verification are complete and follow-ups are either unnecessary or tracked separately.

## Blocking conditions

Forward progress stops for any of the following:

- wrong issue/branch/SHA;
- required Data or QA specialist unavailable;
- principal assistant would need to impersonate a non-web specialist;
- Copilot is being treated as final implementation owner;
- implementation owner has not taken responsibility for Copilot seed work;
- relevant tests fail or are misleading/no-op;
- unresolved security/payment/data/persistence risk;
- missing migration/rollback plan for stateful/destructive changes;
- implementation changed materially after QA/review without revalidation;
- unresolved review comments;
- missing independent QA;
- missing Copilot review for a code PR;
- missing Raelvi final technical approval;
- merge conflicts/dependency conflicts;
- missing explicit Repository Owner merge authorization;
- deployment outcome unknown;
- verification performed against a different version/environment.

Evidence added after an unauthorized action does not retroactively authorize it.

## Copilot seed handling

When Copilot supplies an initial commit:

1. Record the seed SHA.
2. Do not treat Copilot as implementation owner.
3. The designated implementation owner reviews the seed and decides what to adopt.
4. Final implementation stays on the issue branch/PR.
5. The implementation owner produces `RESULT_SUBMITTED` evidence.
6. Independent QA checks the final head.
7. Copilot then returns only as reviewer.

## Review order

For web PRs:

`Principal/Web implementation → independent QA → Copilot review → Principal/Web addresses findings → Raelvi final technical review → Lead readiness → Owner approval → explicit MERGE_AUTHORIZED`

For specialist PRs:

`Specialist implementation → independent QA → Copilot review → implementation owner addresses findings → Raelvi final technical review → Lead readiness → Owner approval → explicit MERGE_AUTHORIZED`

Review evidence is SHA-specific. A material change after review invalidates the affected review.

## Recovery

### QA or review failed

Return to `IMPLEMENTATION_IN_PROGRESS`, preserve failed evidence in history, fix on the issue branch, rerun checks, and repeat affected review gates.

### Copilot accidentally became implementation owner

Stop. Preserve useful commits only as seed evidence. Move implementation responsibility back to the designated owner and require a new owner-submitted candidate before review gates resume.

### Unauthorized merge

Stop immediately. Record the deviation. Do not write directly to `main` to repair it. Prepare a separate rollback PR and wait for explicit owner merge authorization.

### Deployment outcome unknown

Do not redeploy blindly. Reconcile the deployment platform first.

## Canonical evidence format

```text
PROCESS_STATE
issue: #<number>
state: <STATE>
actor: <Principal/Web | AGT-DATA-001 | AGT-QA-001 | reviewer | owner>
branch: <branch>
head_sha: <sha>
evidence:
  tests: <result or link>
  qa: <result or N/A>
  copilot_review: <result or N/A>
  raelvi_review: <result or N/A>
  deployment: <result or N/A>
blockers: none | <blockers>
```

## Current issue routing

- Principal/Web Implementation Owner: #3, #4, #6, #17.
- `AGT-DATA-001`: #1, #2, #5.
- `AGT-QA-001`: #7, #8, #9, #15.
- Lead Integrator / principal assistant: #14, #16, coordination, integration, deployment decisions, and release readiness.

Routing changes require a recorded Lead/Owner decision.
