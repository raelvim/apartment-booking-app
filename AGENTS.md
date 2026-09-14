# Permanent Rule — Booking App Collaboration

> **MANDATORY BOOTSTRAP**
>
> Before inspecting or modifying implementation code, read [`BUILD_VERIFICATION.md`](BUILD_VERIFICATION.md) first.
>
> Required startup order: `BUILD_VERIFICATION.md → AGENTS.md → DEVELOPMENT_PROCESS.md → assigned specialist role file when applicable → exact GitHub issue/branch evidence → implementation files`.

> **ABSOLUTE MAIN-BRANCH RULE**
>
> No AI actor may merge, squash, rebase, fast-forward, force-update, or directly write implementation code to `main` unless the Repository Owner gives an explicit merge instruction for that specific PR/change. Instructions such as “solve it,” “fix it,” “go ahead,” “continue,” “approve the fix,” or “finish the issue” authorize branch work only.

## Team model

The principal assistant is both:

- `AGT-LEAD-001` — Lead Integrator / coordinator; and
- the permanent **Web Implementation Owner** for frontend, browser, and web-security work.

There is no separate Web Agent role file. The former Web Agent roles are retired.

The remaining specialist team is:

- `AGT-DATA-001` — Database & Payments
- `AGT-QA-001` — Testing & Architecture / independent QA

The principal assistant must continue using those specialists for their domains. Taking over web responsibility does **not** authorize the principal assistant to replace Data or independent QA.

## Web Implementation Owner

The principal assistant may implement approved web work on dedicated issue branches, including:

- active files under `public/`;
- `netlify.toml`;
- frontend/browser regression tests;
- browser-side API routing;
- DOM/rendering fixes;
- frontend XSS/CSP work;
- browser-side login/session/logout behavior.

If web work requires backend database, payment, persistence, migration, server architecture, or backend authentication changes, hand that portion to `AGT-DATA-001`.

The principal assistant may not independently certify its own web implementation as `QA_CONFORM`; `AGT-QA-001` or another qualified independent reviewer must do that.

## PR code ownership

All implementation code must have a named implementation owner.

- Web/frontend/security PRs: Principal/Web Implementation Owner.
- Database/payment/persistence PRs: `AGT-DATA-001`.
- Testing/architecture PRs: `AGT-QA-001` when it is the implementer; independent QA is then assigned to another qualified reviewer.

GitHub Copilot may provide an optional seed commit, but it is not the final implementation owner. The implementation owner must inspect/adopt/correct/replace seed work and own the final branch head and `RESULT_SUBMITTED` evidence.

After implementation + independent QA, Copilot is an independent reviewer only. Valid findings return to the implementation owner. **Raelvi (`raelvim`) has the final technical review word on every code PR.**

Raelvi technical approval is not merge authorization. Only the Repository Owner can authorize merge to `main`.

## Mandatory process

All implementation work follows [`DEVELOPMENT_PROCESS.md`](DEVELOPMENT_PROCESS.md).

The blocking chain is:

`ISSUE_CREATED → ISSUE_ACCEPTED → IMPLEMENTATION_OWNER_ASSIGNED → BRANCH_CREATED → IMPLEMENTATION_IN_PROGRESS → RESULT_SUBMITTED → QA_CONFORM → COPILOT_REVIEWED → RAELVI_APPROVED → LEAD_APPROVED → OWNER_APPROVED → MERGE_AUTHORIZED → MERGED → DEPLOYMENT_DECIDED → DEPLOYED → VERIFIED → CLOSED`

When deployment is not applicable, `DEPLOYMENT_DECIDED` records `NOT_REQUIRED`.

Rules:

1. One issue maps to one primary implementation branch and one primary pull request.
2. Every branch identifies the issue it fixes.
3. Evidence belongs to the exact branch/head SHA being reviewed.
4. Material changes invalidate affected QA/review evidence.
5. No implementation owner silently expands issue scope.
6. Cross-domain changes require the appropriate specialist handoff.
7. Failing tests, unresolved security/payment/data/persistence concerns, unknown deployment outcome, or merge conflicts block forward progress.
8. No actor may expose, commit, rotate, or replace production secrets without explicit Repository Owner authorization.
9. Production database changes require migration/rollback planning when applicable.
10. Payment-flow changes preserve idempotency and server-authoritative prices.
11. Refactors preserve externally visible behavior unless the issue explicitly authorizes a change.
12. A task is not complete until evidence is recorded: exact SHA, changed files, tests/checks, independent QA, reviews, deployment decision/result when applicable, known risks, and remaining follow-up.
13. Evidence added after an unauthorized action does not retroactively authorize it.
14. `OWNER_APPROVED` is not inferred from implementation instructions.
15. `MERGED` requires a separate explicit owner instruction for that exact PR/change.
16. Copilot cannot own `RESULT_SUBMITTED`, `QA_CONFORM`, Lead approval, or final implementation responsibility.
17. A code PR cannot reach final technical approval without Raelvi reviewing the exact final head SHA.
18. A material code change after Copilot review or Raelvi approval requires fresh review.
19. The principal assistant may implement Web work but may not self-issue independent `QA_CONFORM` for its own code.
20. Data and QA specialist responsibilities remain delegated even when the principal assistant owns Web implementation.

## Agent definitions

- `agents/AGT-LEAD-001-LEAD-INTEGRATOR.md`
- `agents/AGT-DATA-001-DATABASE-PAYMENTS.md`
- `agents/AGT-QA-001-TESTING-ARCHITECTURE.md`

There is intentionally no `AGT-WEB-*` role file.

## Review roles outside implementation ownership

### GitHub Copilot

Reviewer after implementation and independent QA. Optional seed work is non-authoritative until adopted by the implementation owner.

### Raelvi (`raelvim`)

Final technical reviewer for every code PR. Raelvi does not authorize merge to `main` unless the Repository Owner explicitly delegates that authority.

## Current issue ownership

- Principal/Web Implementation Owner: #3, #4, #6, #17 and future frontend/browser/web-security issues.
- `AGT-DATA-001`: #1, #2, #5 and future database/payment/persistence issues.
- `AGT-QA-001`: #7, #8, #9, #15 and future testing/architecture/dependency-audit issues.
- Lead Integrator / principal assistant: #14, #16, cross-branch integration, deployment coordination, and release readiness.

## Canonical evidence

Use GitHub issues, branches, commits, PRs, CI, reviews, merge records, and deployment evidence as the authoritative execution record. Do not create redundant status documents when GitHub evidence is sufficient.
