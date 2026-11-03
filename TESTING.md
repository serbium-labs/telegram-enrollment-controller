# Testing Strategy and Quality Gates

See [AGENTS.md](AGENTS.md) for mandatory engineering standards and [TASKS.md](TASKS.md) for implementation tracking.

## 1. Framework and location

Use **Vitest**. Store all automated test source files in the top-level `tests/` tree, never alongside implementation in `src/`.

```text
tests/
  unit/
  integration/
  security/
  fixtures/
  helpers/
```

Tests must use deterministic fixtures, injected clocks when time matters, controlled Telegram API mocks and isolated temporary persistence. Do **not** use real production bot credentials or group mutation in the automated suite.

## 2. Unit test targets

- Telegram status → domain status mapping, including `restricted.is_member` and API UNKNOWN.
- State-machine invariants for invitation issued, request received, approval in progress, verified enrollment, failure and expiry.
- Actor/group authorization checks and privileged user denial.
- Invitation reuse/creation policy and non-member eligibility.
- Ban/unban operation outcomes and partial-failure recovery decisions.
- Callback validation, stale UI and cancel/confirmation logic.
- Domain error classification and structured operation results.
- Translation catalog parsing and validation, including duplicate keys, unknown IDs, empty values and placeholder mismatches.
- Locale normalization and selection for `AUTO`, fixed BCP 47 values and the `ENGLISH` alias.
- Exact-locale → base-language → English lookup, including missing entries and malformed/unsupported Telegram language codes.
- Named interpolation and parse-mode escaping for externally sourced values.

## 3. Integration test targets

- grammY controller ↔ application service collaboration.
- Telegram gateway's `getChatMember`, `createChatInviteLink`, `approveChatJoinRequest`, `banChatMember`, `unbanChatMember` usage and errors.
- Fastify webhook authentication, payload validation, body-size limit, allowed updates and safe HTTP acknowledgment.
- Persistence adapter storage, deduplication and recovery after simulated restart.
- Telegram `chat_join_request`, `chat_member` and `my_chat_member` reconciliation.
- Startup config validation and capability checks.
- Presentation rendering through stable string IDs for keyboards, prompts, statuses, errors and command descriptions.
- Build/deployment artifact inclusion and startup validation of the English and configured fixed-locale catalogs.

## 4. Required security and failure matrix

| Test ID | Case | Expected result |
| --- | --- | --- |
| SEC-01 | No/invalid webhook secret | Reject request without mutation |
| SEC-02 | Forged callback target user | Ignore claimed target; actor-only authorization |
| SEC-03 | Wrong group ID | No target-group mutation |
| SEC-04 | Owner/admin selects Unenroll | Denied before API mutation |
| SEC-05 | Already banned user selects Enroll | No invite and no unban |
| SEC-06 | Join request through unauthorized invite | No automatic approval |
| SEC-07 | Replayed callback or duplicate webhook | No repeated harmful effects |
| SEC-08 | Rapid concurrent clicks | Coordinated single safe operation |
| SEC-09 | Timeout after Telegram mutation | Reconcile before retry |
| SEC-10 | Ban succeeds; unban fails | `RECOVERY_REQUIRED`, no false success |
| SEC-11 | User was banned before operation | Never unban automatically |
| SEC-12 | Bot loses admin permissions | Fail closed; log actionable error |
| SEC-13 | Invite issued but never opened | Not marked as join-request pending |
| SEC-14 | Request approved elsewhere | Reconcile actual membership |
| SEC-15 | Malformed payload/oversized body | Safe rejection |
| SEC-16 | Storage fails during mutation intake | Do not execute untracked mutation |
| SEC-17 | Translated button label is changed or forged | Stable callback action still controls routing and authorization |
| SEC-18 | Malformed/unsupported Telegram language code | English UI; actor and operation behavior unchanged |
| SEC-19 | Catalog contains unknown ID or placeholder mismatch | Startup/readiness fails with safe stable error code |
| SEC-20 | Interpolation value contains Telegram markup | Value is escaped for the active parse mode; no formatting injection |

## 5. Critical behavior acceptance tests

1. Verified `NOT_ENROLLED` user sees Enroll.
2. Eligible join-request event is automatically approved, then actual membership is verified.
3. Issued link without submitted request does not appear as enrollment success.
4. Verified ordinary member sees Unenroll and must confirm.
5. Successful ban+unban+verification displays clean unenrollment.
6. Unknown status receives Retry and does not trigger a mutation.
7. Forum-topic metadata has no effect on supergroup membership decisions.
8. Duplicate webhook deliveries are safe across process restarts.
9. Secrets and sensitive invite URLs are absent from logs and errors.
10. Every bot-authored visible string is requested by a stable ID present in the complete English catalog.
11. `AUTO` mode resolves exact locale, base language and English in order; missing or invalid Telegram language metadata uses English.
12. Fixed locale mode ignores Telegram language metadata and uses the same fallback chain; `ENGLISH` resolves to `en`.
13. Missing non-English entries fall back to English without displaying a raw ID or blank text.
14. Switching translations cannot change callback routing, authorization, persistence state or Telegram mutations.

## 6. Quality gates

Once code exists, CI must run scripts equivalent to:

```text
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run test:coverage
npm run build
```

Exact npm scripts must be added and documented during implementation. Tests and lint/typecheck must pass without suppression. Catalog validation must prove that the English catalog covers every referenced string ID and that all other catalogs satisfy the canonical ID/placeholder contract. Target **≥90% statement and branch coverage** of domain and application layers. Coverage is not permission to skip critical authorization, fallback or partial-failure tests.

## 7. Manual staging validation

Use a dedicated non-production private supergroup and bot credentials. Verify the end-to-end journey for ordinary member, non-member, admin/owner, banned member, unsubmitted invite and externally changed membership. Exercise `AUTO` with supported, regional, unsupported and absent Telegram language codes; exercise fixed locale and English fallback; inspect keyboards, prompts, statuses and errors. Verify webhook secret/HTTPS setup, `getWebhookInfo`, bot permission changes, safe redeploy, packaged catalogs and removal recovery. Do not run destructive tests against the production group.

## 8. Done criteria

A test is complete when assertions cover specified success, denial, duplicate, localization fallback and failure paths; mocks are deterministic; CI gates pass; and localized user-visible outcomes match verified Telegram state. Document any operational scenario that cannot be automated and its manual verification steps.
