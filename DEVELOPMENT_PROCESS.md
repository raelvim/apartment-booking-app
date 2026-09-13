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

1. **The principal assistant/coordinator does not write implementation code.**
2. **All final implementation code in a PR is owned by the approved project team.**
3. GitHub Copilot may provide an optional initial seed commit, but it is not the final implementer or PR owner.
4. A designated team specialist must inspect/adopt/correct/replace any Copilot seed and take responsibility for the final branch head, tests, and implementation evidence.
5. After team implementation/QA is ready, **Copilot reviews the team-owned candidate**.
6. The team addresses or explicitly dispositions Copilot findings.
7. **Raelvi (`raelvim`) gives the final technical review word on every code PR** against the exact final head SHA.
8. **Only the Repository Owner can authorize merge to `main`.** Raelvi approval is technical approval, not merge authorization.
9. No AI agent may merge, squash, rebase, fast-forward, force-update, or directly write code to `main` without a separate explicit Repository Owner instruction for that exact PR/change.

## Roles

### Repository Owner

Final authority for merge authorization, production deployment authorization, destructive operations, secret changes, and irreversible migrations.

### AGT-LEAD-001 — Lead Integrator

Coordinates issues, assigns specialists, checks scope/branch identity, controls integration readiness, verifies review gates, and stops unsafe or incomplete work.

### Project-team specialists

- `AGT-DATA-001` — Database & Payments
- `AGT-WEB-001` — Frontend & Security
- `AGT-QA-001` — Testing & Architecture

The assigned specialist owns the implementation result for its issue.

### GitHub Copilot

Independent reviewer after the team has produced a reviewable candidate. Copilot may optionally provide an initial seed commit, but may not own `RESULT_SUBMITTED`, QA, lead approval, or final implementation responsibility.

### Raelvi (`raelvim`)

Final technical reviewer for every code PR. Raelvi reviews only after team implementation, team QA, and Copilot review findings have been addressed. Material code changes after Raelvi approval require a new Raelvi review.

## Canonical process chain

For code changes:

`ISSUE_CREATED → ISSUE_ACCEPTED → AGENT_ASSIGNED → BRANCH_CREATED → IMPLEMENTATION_IN_PROGRESS → RESULT_SUBMITTED → QA_CONFORM → COPILOT_REVIEWED → RAELVI_APPROVED → LEAD_APPROVED → OWNER_APPROVED → MERGE_AUTHORIZED → MERGED → DEPLOYMENT_DECIDED → DEPLOYED → VERIFIED → CLOSED`

For documentation-only or repository-only changes with no runtime effect, deployment may be recorded as `NOT_REQUIRED` before verification.

No state may be silently skipped.

## State rules

### ISSUE_CREATED

Requires a GitHub issue with problem, scope, acceptance criteria, and risk/priority when relevant.

### ISSUE_ACCEPTED

Lead confirms the issue is valid, scoped, non-duplicate, and testable.

### AGENT_ASSIGNED

Lead assigns the primary project-team specialist. Copilot is not the primary specialist.

### BRANCH_CREATED

One accepted issue maps to one primary team-owned branch. Normal name: `issue-<number>-<short-name>`. Record baseline SHA.

A Copilot branch/commit may be referenced as seed material, but the authoritative implementation branch remains team-owned.

### IMPLEMENTATION_IN_PROGRESS

Assigned team specialist may modify only authorized scope, add/update tests, and produce evidence. Principal assistant does not code.

If a Copilot seed exists, the team specialist must review it before adopting any of it.

### RESULT_SUBMITTED

**Actor: assigned project-team specialist only.**

Required evidence:
- branch;
- exact head SHA;
- files changed;
- checks/tests actually run and results;
- known limitations;
- migration/rollback notes where applicable;
- confirmation that any Copilot seed was inspected and the team owns the resulting final code.

Copilot cannot submit this state.

### QA_CONFORM

**Actor: AGT-QA-001 or Lead-designated independent team reviewer.**

QA checks relevant tests/regressions, security/data/payment impact, CI, and absence of unrelated files. Failed or missing required tests return work to implementation.

### COPILOT_REVIEWED

Copilot reviews the exact team-owned candidate head. Findings must be captured in the PR.

If Copilot identifies a valid issue, the team fixes it and reruns affected checks. Material changes require a new Copilot review.

Copilot review does not replace team QA and does not approve merge.

### RAELVI_APPROVED

**Actor: Raelvi (`raelvim`).**

Raelvi reviews the exact final head after team QA and Copilot review. Raelvi has the final technical word for the PR.

If Raelvi requests changes, the team returns to implementation. Any material code change invalidates the prior Raelvi approval and requires another final review.

### LEAD_APPROVED

Lead confirms issue scope, current QA, Copilot review, Raelvi approval, dependencies, and merge readiness all refer to the same final head SHA.

### OWNER_APPROVED

Repository Owner accepts the technical result for the exact PR/head. This is **not** permission to merge.

### MERGE_AUTHORIZED

**Actor: Repository Owner only.**

Requires a separate explicit instruction identifying the exact PR/change that may be merged to `main`, for example:

- “Merge PR #25 to main.”
- “You may merge the Issue #17 PR to main now.”

“Fix it,” “continue,” “approve,” “finish,” “solve it,” or approval to review/test do not count.

### MERGED

Only after all required prior gates and explicit `MERGE_AUTHORIZED`. Confirm expected head SHA and correct base.

### DEPLOYMENT_DECIDED

Record `REQUIRED`, `NOT_REQUIRED`, or `BLOCKED`.

### DEPLOYED

When required, record deployed SHA, target environment, result, and migration/config result as applicable. Merge is not deployment proof.

### VERIFIED

Runtime changes are verified against the deployed version. Repository-only changes are verified against merged state and CI/review evidence.

### CLOSED

Only after acceptance criteria and required verification are complete and follow-ups are either unnecessary or separate issues.

## Blocking conditions

Forward progress stops for any of the following:

- wrong issue/branch/SHA;
- no designated team specialist;
- principal assistant would need to code;
- Copilot is being treated as PR owner/final implementer;
- team has not taken responsibility for a Copilot seed;
- relevant tests fail or are misleading/no-op;
- unresolved security/payment/data/persistence risk;
- missing migration/rollback plan for stateful/destructive changes;
- branch materially changed after QA/review without revalidation;
- unresolved review comments;
- missing Copilot review for a code PR;
- missing Raelvi final technical approval for a code PR;
- merge conflicts/dependency conflicts;
- missing explicit Repository Owner merge authorization;
- deployment outcome unknown;
- verification performed against a different version/environment.

Evidence added after an unauthorized action does not retroactively authorize it.

## Copilot seed handling

When Copilot supplies an initial commit:

1. Record the seed SHA.
2. Do not treat the Copilot branch/PR as authoritative.
3. Assigned team specialist reviews the seed and decides what to adopt.
4. Final implementation lives on the team-owned issue branch/PR.
5. Team specialist produces the final implementation evidence.
6. Copilot then returns to reviewer-only role.

## Review order

For code PRs:

`Team specialist → Team QA → Copilot review → Team addresses findings → Raelvi final technical review → Lead readiness → Owner approval → explicit MERGE_AUTHORIZED`

Review evidence is SHA-specific. A material change after review invalidates the affected review.

## Recovery

### QA or review failed

Return to `IMPLEMENTATION_IN_PROGRESS`, preserve failed evidence in history, fix on the team-owned branch, rerun checks, and repeat required reviews.

### Copilot accidentally became implementer/PR owner

Stop. Preserve any useful commits as non-authoritative seed evidence. Close or demote the Copilot-owned PR, move implementation responsibility back to the designated team specialist, and require a new team-owned candidate before review gates resume.

### Unauthorized merge

Stop immediately. Record the deviation. Do not write directly to `main` to repair it. Prepare a separate rollback PR and wait for explicit Owner merge authorization.

### Deployment outcome unknown

Do not redeploy blindly. Reconcile the deployment platform first.

## Canonical evidence format

```text
PROCESS_STATE
issue: #<number>
state: <STATE>
actor: <agent-id, reviewer, or owner>
branch: <branch>
head_sha: <sha>
evidence:
  tests: <result or link>
  copilot_review: <result or N/A>
  raelvi_review: <result or N/A>
  deployment: <result or N/A>
blockers: none | <blockers>
```

## Current issue routing

- `AGT-DATA-001`: #1, #2, #5
- `AGT-WEB-001`: #3, #4, #6, #17
- `AGT-QA-001`: #7, #8, #9
- `AGT-LEAD-001`: coordination, integration, release readiness

Routing changes require a recorded Lead decision.
