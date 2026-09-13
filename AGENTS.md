# Permanent Rule — Booking App Agent Collaboration

> **MANDATORY BOOTSTRAP**
>
> Before inspecting or modifying implementation code, every AI coding/review agent must read [`BUILD_VERIFICATION.md`](BUILD_VERIFICATION.md). It is the repository's first technical entry file and defines the identity, baseline, build/test gate, required reading order, and blocking conditions.
>
> Required startup order: `BUILD_VERIFICATION.md → AGENTS.md → DEVELOPMENT_PROCESS.md → assigned role file → exact GitHub issue/branch evidence → implementation files`.

> **ABSOLUTE MAIN-BRANCH RULE**
>
> No AI agent may merge, squash, rebase, fast-forward, force-update, or directly write code to `main` unless the Repository Owner gives an explicit merge instruction for the specific PR/change. Instructions such as “solve it,” “fix it,” “go ahead,” “continue,” “approve the fix,” or “finish the issue” authorize work on the issue branch only; they do **not** authorize a merge to `main`.

> **PR CODE OWNERSHIP RULE**
>
> All implementation code in every PR is the responsibility of the approved project specialist team. GitHub Copilot is not a project implementer and may not own the final code of a PR.
>
> Copilot may provide an optional initial seed commit, but the assigned specialist agent must then inspect, adopt/correct/replace it, run the required checks, and own the final branch head and `RESULT_SUBMITTED` evidence.
>
> After the team implementation is ready, Copilot acts as an independent reviewer only. The team must address or disposition Copilot findings. **Raelvi (`raelvim`) has the final technical review word on every code PR.** Only after Raelvi approves the exact final head may the PR proceed to Repository Owner merge authorization.

This repository uses a small specialist-agent team inspired by the CORNER collaboration model.

For work containing two or more independent technical tasks, the Lead Integrator should delegate in parallel when useful to the relevant specialist agents:

- Database & Payments;
- Frontend & Security;
- Testing & Architecture.

Delegation is used to improve speed and reliability. It must not weaken process controls or create unnecessary duplicate documentation.

The Lead Integrator remains responsible for final repository integration, cross-branch consistency, pull-request review, merge ordering, and release readiness. Specialist agents must not merge into `main` or deploy production changes unless explicitly authorized by the Repository Owner.

## Mandatory process

All implementation work must follow [`DEVELOPMENT_PROCESS.md`](DEVELOPMENT_PROCESS.md).

As in CORNER, a conversation instruction does not permit an agent to skip a required transition. GitHub provides the canonical process evidence for this project: issue, branch, commits, pull request, CI, reviews, merge and deployment verification.

The blocking process chain for code PRs is:

`ISSUE_CREATED → ISSUE_ACCEPTED → AGENT_ASSIGNED → BRANCH_CREATED → IMPLEMENTATION_IN_PROGRESS → RESULT_SUBMITTED → QA_CONFORM → COPILOT_REVIEWED → RAELVI_APPROVED → LEAD_APPROVED → OWNER_APPROVED → MERGE_AUTHORIZED → MERGED → DEPLOYMENT_DECIDED → DEPLOYED → VERIFIED → CLOSED`

When deployment is not applicable, `DEPLOYMENT_DECIDED` must explicitly record `NOT_REQUIRED`; the change still requires repository/CI verification before closure.

Rules:

1. One issue maps to one primary team-owned branch and one primary team-owned pull request.
2. Every branch must identify the issue it fixes.
3. Every transition requires the previous valid state and current evidence.
4. Evidence belongs to the exact branch/commit SHA being reviewed; materially changed code requires revalidation.
5. No specialist may silently expand the issue scope.
6. Any cross-domain change must be handed off to the relevant specialist or reviewed by the Lead Integrator.
7. A failing test, unresolved security concern, migration uncertainty, payment-integrity concern, unknown deployment outcome, or merge conflict blocks forward progress.
8. No agent may expose, commit, rotate, or replace production secrets unless the Repository Owner explicitly authorizes the operation.
9. Production database changes must include a migration/rollback plan when they can affect existing data.
10. Payment-flow changes must preserve idempotency and must never trust client-supplied prices as authoritative.
11. Refactors must preserve externally visible behavior unless the issue explicitly authorizes a behavior change.
12. An issue is not complete until evidence is recorded: changed files, tests/checks performed, review result, deployment decision/result when applicable, known risks, and remaining follow-up.
13. Evidence added after an unauthorized action does not retroactively authorize that action. Stop and escalate to the Lead Integrator.
14. Specialist agents do not merge their own work unless explicitly authorized.
15. `OWNER_APPROVED` is not inferred from implementation instructions. It must be an explicit approval record for the exact PR/head SHA.
16. `MERGED` requires a separate explicit owner instruction to merge that exact PR/change into `main`; approval to implement or review is insufficient.
17. Copilot cannot transition an issue to `RESULT_SUBMITTED`, `QA_CONFORM`, `LEAD_APPROVED`, or any ownership state. Its normal authority is review only after team implementation.
18. A Copilot seed commit is non-authoritative until a designated team specialist takes responsibility for the resulting code and final head.
19. A code PR cannot reach final technical approval without Raelvi's explicit review of the exact final head SHA.
20. A material code change after Copilot review or Raelvi approval invalidates that review and requires a new review against the new head.

## Agent definitions

- `agents/AGT-LEAD-001-LEAD-INTEGRATOR.md`
- `agents/AGT-DATA-001-DATABASE-PAYMENTS.md`
- `agents/AGT-WEB-001-FRONTEND-SECURITY.md`
- `agents/AGT-QA-001-TESTING-ARCHITECTURE.md`

## Review roles outside the implementation team

### GitHub Copilot

Reviewer role. May optionally provide a seed commit when explicitly useful, but may not remain the implementation owner. Reviews the team-owned final candidate and reports findings before Raelvi's final technical review.

### Raelvi (`raelvim`)

Final technical reviewer for every code PR. Raelvi's approval is required after Copilot review and after all material code changes are complete. Raelvi does not authorize merge to `main`; that remains the Repository Owner's authority.

## Current issue ownership

- Database & Payments: issues #1, #2, #5.
- Frontend & Security: issues #3, #4, #6, #17.
- Testing & Architecture: issues #7, #8, #9.
- Lead Integrator: coordinates all issues and owns integration decisions.

## Canonical evidence

Do not create a separate status document for every issue. Use the GitHub issue and PR history as the authoritative record. When a process-state comment is useful, use the structured format defined in `DEVELOPMENT_PROCESS.md`.
