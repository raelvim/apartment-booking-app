# Permanent Rule — Booking App Agent Collaboration

This repository uses a small specialist-agent team inspired by the CORNER collaboration model.

For work containing two or more independent technical tasks, the Lead Integrator should delegate in parallel when useful to the relevant specialist agents:

- Database & Payments;
- Frontend & Security;
- Testing & Architecture.

Delegation is used to improve speed and reliability. It must not create unnecessary administrative steps.

The Lead Integrator remains responsible for final repository integration, cross-branch consistency, pull-request review, merge ordering, and release readiness. Specialist agents must not merge into `main` or deploy production changes unless explicitly authorized by the Repository Owner.

## Core workflow

The normal engineering chain is:

`ISSUE → BRANCH → IMPLEMENTATION → TESTS → PR → REVIEW → OWNER APPROVAL → MERGE → DEPLOYMENT VERIFICATION`

Rules:

1. One issue maps to one primary branch and one primary pull request.
2. Every branch must identify the issue it fixes.
3. No specialist may silently expand the issue scope.
4. Any cross-domain change must be handed off to the relevant specialist or reviewed by the Lead Integrator.
5. A failing test, unresolved security concern, migration uncertainty, payment-integrity concern, or merge conflict blocks release.
6. No agent may expose, commit, rotate, or replace production secrets unless the Repository Owner explicitly authorizes the operation.
7. Production database changes must include a migration/rollback plan when they can affect existing data.
8. Payment-flow changes must preserve idempotency and must never trust client-supplied prices as authoritative.
9. Refactors must preserve externally visible behavior unless the issue explicitly authorizes a behavior change.
10. An issue is not complete until evidence is recorded: changed files, tests/checks performed, known risks, and remaining follow-up.

## Agent definitions

- `agents/AGT-LEAD-001-LEAD-INTEGRATOR.md`
- `agents/AGT-DATA-001-DATABASE-PAYMENTS.md`
- `agents/AGT-WEB-001-FRONTEND-SECURITY.md`
- `agents/AGT-QA-001-TESTING-ARCHITECTURE.md`

## Current issue ownership

- Database & Payments: issues #1, #2, #5.
- Frontend & Security: issues #3, #4, #6.
- Testing & Architecture: issues #7, #8, #9.
- Lead Integrator: coordinates all issues and owns integration decisions.
