# Summary

Describe the change and the GitHub issue it fixes.

Closes #

## Process identity

- Issue: #
- Implementation owner: `Principal/Web` | `AGT-DATA-001` | `AGT-QA-001` | other approved owner
- Independent QA owner:
- Branch: `issue-...`
- Baseline/main SHA when work started:
- Current head SHA:
- Current process state: `RESULT_SUBMITTED`

## Scope

- [ ] Changes are limited to the accepted issue scope.
- [ ] Any cross-domain changes are identified below.
- [ ] No unrelated cleanup/refactor is bundled into this PR.

Cross-domain notes:

## Acceptance criteria

Copy the issue acceptance criteria and mark each one:

- [ ] Criterion 1
- [ ] Criterion 2

## Verification evidence

### Implementation-owner checks

Commands/checks run:

```text

```

Result:

```text

```

- [ ] No relevant test is failing.
- [ ] No no-op/fake assertion is being presented as evidence.
- [ ] Tests do not modify production/customer data.

### Independent QA

QA actor:

```text

```

QA result / evidence:

```text

```

- [ ] `QA_CONFORM` is independent of the implementation owner.

### Manual verification

Describe any manual check performed:

```text

```

## Risk gates

- [ ] No production secrets are added or exposed.
- [ ] No unexpected customer/private data is included.
- [ ] Payment behavior is unchanged, or `AGT-DATA-001` review is included.
- [ ] Database behavior is unchanged, or migration/rollback notes are included.
- [ ] Authentication/authorization is unchanged, or security review is included.
- [ ] Deployment/infrastructure is unchanged, or deployment review is included.

## Migration / rollback

Required for stateful or destructive DB/infrastructure changes. Otherwise write `N/A`.

Migration:

```text
N/A
```

Rollback:

```text
N/A
```

## Known risks / limitations

```text
None known.
```

## Required handoff

- [ ] Implementation owner submitted `RESULT_SUBMITTED` for the exact head.
- [ ] Independent `QA_CONFORM` obtained.
- [ ] Copilot reviewed the exact QA-conform candidate for code PRs.
- [ ] Valid Copilot findings were addressed/dispositioned.
- [ ] Raelvi approved the exact final head for code PRs.
- [ ] `LEAD_APPROVED` obtained.
- [ ] `OWNER_APPROVED` obtained when required by `DEVELOPMENT_PROCESS.md`.
- [ ] All blocking review threads resolved.
- [ ] Required CI checks green for the current head SHA.
- [ ] Separate Repository Owner `MERGE_AUTHORIZED` instruction received before merge.

## Deployment decision

After merge, Lead/Owner records one:

- [ ] `REQUIRED`
- [ ] `NOT_REQUIRED`
- [ ] `BLOCKED`

If deployment is required, do not close the issue until the deployed commit is verified.
