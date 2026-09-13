---
type: booking-development-process
process_id: PROC-DEV-001
status: ACTIVE
owner: Repository Owner
coordinator: AGT-LEAD-001
---

# Booking App — Development and Release Process

## Purpose

This procedure applies the same core governance principle used by CORNER to the apartment booking application:

> An instruction in chat does not authorize skipping a required process transition. Each stage requires the previous stage, the correct actor, the same issue/branch identity, and current evidence.

The process is intentionally lighter than CORNER because this is a software application, not a scientific publication workflow. GitHub itself is the canonical record: issue, branch, commits, pull request, CI checks, reviews, merge, and deployment evidence.

No separate prose approval document is required for every change.

## Absolute main-branch rule

No AI agent may merge, squash, rebase, fast-forward, force-update, or directly write code to `main` without a separate, explicit Repository Owner instruction for the exact PR/change being merged.

The following do **not** count as merge authorization:

- “solve it”;
- “fix it”;
- “go ahead”;
- “continue”;
- “finish the issue”;
- “approve the fix”;
- approval to create a branch or PR;
- approval to run tests or QA.

Those instructions authorize work only through the review/approval stages on the issue branch. Merge authorization must explicitly identify that the approved PR/change may be merged to `main`.

## Roles

### Repository Owner

Final authority for:

- accepting high-risk changes;
- authorizing every merge to `main`;
- authorizing production deployment;
- approving destructive data operations, secret changes, or irreversible migrations.

### AGT-LEAD-001 — Lead Integrator

Responsible for:

- accepting and classifying issues;
- assigning specialist ownership;
- ensuring branch/issue identity remains consistent;
- reviewing cross-domain impact;
- deciding merge order;
- blocking incomplete or unsafe work;
- confirming release readiness.

### Specialist agents

- `AGT-DATA-001` — Database & Payments
- `AGT-WEB-001` — Frontend & Security
- `AGT-QA-001` — Testing & Architecture

A specialist implements only within the accepted issue scope unless the Lead explicitly extends or splits the issue.

## Canonical process chain

The normal chain is:

`ISSUE_CREATED → ISSUE_ACCEPTED → AGENT_ASSIGNED → BRANCH_CREATED → IMPLEMENTATION_IN_PROGRESS → RESULT_SUBMITTED → QA_CONFORM → LEAD_APPROVED → OWNER_APPROVED → MERGE_AUTHORIZED → MERGED → DEPLOYMENT_DECIDED → DEPLOYED → VERIFIED → CLOSED`

For changes that do not require a production deployment, `DEPLOYMENT_DECIDED` must explicitly record `NOT_REQUIRED`; they then proceed directly to `VERIFIED` using repository/CI verification rather than runtime verification.

No state may be silently skipped.

## State definitions and transition rules

### 1. ISSUE_CREATED

**Actor:** Repository Owner, Lead Integrator, or authorized agent.

Required evidence:

- GitHub issue number;
- clear problem statement;
- scope;
- acceptance criteria;
- priority/risk level when relevant.

The issue number becomes the permanent identity of the work.

### 2. ISSUE_ACCEPTED

**Actor:** Lead Integrator.

The Lead confirms:

- the issue is real and reproducible or otherwise justified;
- scope is sufficiently clear;
- acceptance criteria are testable;
- duplicate or overlapping work has been checked;
- dependencies on other issues are recorded.

A specialist must not begin implementation before acceptance, except for read-only diagnosis needed to define the issue.

### 3. AGENT_ASSIGNED

**Actor:** Lead Integrator.

The Lead assigns the primary specialist based on domain ownership.

Cross-domain work may name secondary reviewers, but one agent remains the primary implementer.

### 4. BRANCH_CREATED

**Actor:** Assigned specialist or Lead Integrator.

Rules:

- one accepted issue maps to one primary branch;
- branch names must identify the issue, normally `issue-<number>-<short-name>`;
- the branch starts from the approved baseline, normally current `main`;
- the baseline commit SHA must be knowable from Git history.

A branch created from an unintended baseline blocks further work until corrected or explicitly accepted by the Lead.

### 5. IMPLEMENTATION_IN_PROGRESS

**Actor:** Assigned specialist.

The specialist may:

- modify files within issue scope;
- add or update tests;
- run local/static checks;
- document migration or rollback requirements.

The specialist must stop and escalate when discovering:

- a production secret;
- unexpected customer/private data;
- destructive migration risk;
- payment-integrity uncertainty;
- a required change outside assigned authority;
- a conflict with another active branch that can invalidate the work.

### 6. RESULT_SUBMITTED

**Actor:** Assigned specialist.

The result is considered submitted only when there is auditable evidence.

Required evidence:

- branch name;
- current head commit SHA;
- changed files or concise change summary;
- tests/checks performed and their result;
- known risks or limitations;
- migration/rollback notes when applicable;
- statement of any acceptance criterion not yet met.

A specialist may not mark work complete merely because code was written.

### 7. QA_CONFORM

**Actor:** AGT-QA-001, or another independent reviewer designated by the Lead.

QA verifies as applicable:

- automated tests;
- regression behavior;
- security-impact checks;
- booking availability rules;
- payment idempotency;
- database isolation/migration behavior;
- frontend/admin behavior;
- CI configuration;
- absence of accidental unrelated files.

`QA_CONFORM` is forbidden when required tests are failing, missing, fake/no-op, or run against production/customer data.

A failed QA review returns the work to `IMPLEMENTATION_IN_PROGRESS`; the failed evidence remains part of history.

### 8. LEAD_APPROVED

**Actor:** AGT-LEAD-001.

The Lead confirms:

- issue scope and implementation still match;
- QA evidence is current for the branch head;
- no unresolved review comments remain;
- dependencies and merge order are safe;
- the PR does not silently include another issue;
- production risk is understood.

If the branch head changes after approval, approval must be revalidated when the change is material.

### 9. OWNER_APPROVED

**Actor:** Repository Owner.

`OWNER_APPROVED` means the Owner accepts the technical result/review state for the exact PR/head SHA. It is **not** permission to merge.

Required before the next transition for:

- P0 issues;
- payment behavior changes;
- database migrations affecting existing data;
- authentication/authorization changes;
- production infrastructure changes;
- destructive operations;
- any change the Lead explicitly escalates.

For low-risk P1/P2 fixes, the Owner may grant standing review approval to the Lead for a defined category. Such standing approval must be recorded before use, but it still does not authorize merges to `main`.

Silence is not approval, and implementation instructions are not approval.

### 10. MERGE_AUTHORIZED

**Actor:** Repository Owner only.

This is a distinct blocking transition.

Required evidence:

- explicit instruction that the exact PR/change may be merged to `main`;
- PR number or unambiguous change identity;
- expected head SHA when available.

Examples of valid authorization:

- “Merge PR #12 to main.”
- “You may merge issue #3 PR to main now.”

Anything less explicit does not satisfy this state.

### 11. MERGED

**Actor:** Lead Integrator or Repository Owner, but only after `MERGE_AUTHORIZED`.

Preconditions:

- approved PR;
- required CI checks green;
- correct base branch;
- expected head SHA confirmed;
- required reviews complete;
- explicit `MERGE_AUTHORIZED` evidence from the Repository Owner.

Specialist agents do not merge their own work.

The merged commit or squash SHA becomes the release evidence for that issue.

### 12. DEPLOYMENT_DECIDED

**Actor:** Lead Integrator, with Owner authority when production-impacting.

Record one of:

- `REQUIRED`;
- `NOT_REQUIRED`;
- `BLOCKED`.

`NOT_REQUIRED` is appropriate for documentation-only or repository-only changes that cannot affect runtime behavior.

### 13. DEPLOYED

**Actor:** Lead Integrator, deployment agent, or Repository Owner with deployment authority.

Required evidence when deployment is required:

- deployed commit/merge SHA;
- target environment;
- deployment result/status;
- configuration/migration result if applicable.

A successful Git merge is not proof of a successful deployment.

### 14. VERIFIED

**Actor:** QA agent or Lead Integrator, independent from the deployment action when practical.

Runtime changes must be checked against the deployed version, not merely the source branch.

Verification may include:

- `/health` endpoint;
- homepage and booking form load;
- price calculation;
- date availability;
- admin login/admin UI;
- Stripe test-mode flow/webhook handling when relevant;
- database persistence after restart/redeploy when relevant;
- security headers/CSP when relevant.

For `DEPLOYMENT_DECIDED=NOT_REQUIRED`, verification means confirming the merged repository state and required CI/review evidence.

### 15. CLOSED

**Actor:** Lead Integrator or Repository Owner.

An issue closes only when:

- acceptance criteria are satisfied;
- required verification is complete;
- follow-up work is either unnecessary or represented by separate issues;
- the canonical GitHub issue/PR history contains enough evidence to reconstruct what happened.

## Blocking rules

The following conditions block forward transition:

1. Wrong issue, branch, or baseline identity.
2. Missing acceptance criteria for material work.
3. Missing required specialist assignment.
4. Known failing tests relevant to the change.
5. No-op or misleading tests presented as evidence.
6. Unresolved payment-integrity risk.
7. Unresolved customer-data or persistence risk.
8. Unreviewed authentication/security changes.
9. Missing migration/rollback plan for a destructive or stateful DB change.
10. Branch head materially changed after QA/approval without revalidation.
11. Merge conflicts or dependency conflicts.
12. Missing explicit Repository Owner `MERGE_AUTHORIZED` instruction for `main`.
13. Production deployment requested without required Owner authorization.
14. Deployment outcome unknown.
15. Verification performed against a different commit/environment than the deployed target.

Evidence added after an unauthorized action does not retroactively make the action compliant. The correct response is to record the deviation, stop, and let the Owner/Lead determine recovery.

## Concurrency rules

Multiple issues may proceed in parallel when their scopes are independent.

Rules:

- each issue keeps its own branch and PR;
- agents do not share one branch for unrelated fixes;
- cross-branch dependencies are recorded explicitly;
- the Lead decides merge order;
- if one merge invalidates another branch's test evidence, that branch must be rebased/updated and revalidated before merge.

Parallel work must reduce delivery time without weakening review or evidence.

## Retry and recovery

### Implementation failed

Return to `IMPLEMENTATION_IN_PROGRESS` on the same issue/branch when practical. Do not erase failed attempts from Git/PR history.

### QA failed

Record the failure, correct the branch, rerun relevant tests, and obtain a new `QA_CONFORM` verdict.

### Merge blocked

Resolve conflicts on the issue branch, rerun relevant checks, and revalidate approvals if the resulting diff materially changed. Do not merge until the Owner issues a fresh or still-applicable `MERGE_AUTHORIZED` instruction.

### Unauthorized merge

Stop immediately. Record the deviation. Do not attempt another direct write to `main` to repair it without Owner authorization. Prepare a separate revert branch/PR and wait for explicit Owner authorization before merging the rollback.

### Deployment failed with known failure

Do not mark `DEPLOYED`. Correct through the appropriate issue/branch or perform an authorized rollback.

### Deployment outcome unknown

Do not redeploy blindly. First reconcile the deployment platform and identify whether the target commit actually reached production.

### Production regression

Create or reopen a GitHub issue immediately. The Lead decides whether to prepare a rollback or forward fix. Execution of either into `main` still requires explicit Owner merge authorization.

## Canonical evidence format

GitHub is the authoritative process record. Evidence should live in the issue and PR rather than in duplicate status documents.

A concise transition comment may use:

```text
PROCESS_STATE
issue: #<number>
state: <STATE>
actor: <agent-id or owner>
branch: <branch>
head_sha: <sha>
evidence:
  tests: <result or link>
  review: <result or link>
  deployment: <result or N/A>
blockers: none | <concise blockers>
```

The recorded SHA matters: evidence for one revision does not automatically validate a later revision.

## Required handoff sequence

Normal implementation handoff:

`Specialist → QA → Lead Integrator → Repository Owner review → explicit MERGE_AUTHORIZED → Merge/Deployment actor → QA/Lead verification`

No handoff transfers responsibility for facts that have not been verified.

## Current issue routing

- `AGT-DATA-001`: #1, #2, #5
- `AGT-WEB-001`: #3, #4, #6
- `AGT-QA-001`: #7, #8, #9
- `AGT-LEAD-001`: coordination, integration, merge order, release readiness

This routing may change only through a recorded Lead decision.