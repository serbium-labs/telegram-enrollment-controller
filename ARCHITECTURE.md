# Architecture and Domain Specification

**Authority:** Cross-cutting rules in [AGENTS.md](AGENTS.md). This document owns system behavior and component boundaries.

## 1. System purpose and boundaries

Implement one Telegram bot for a predefined **private supergroup with forum topics**. The bot interacts with members through private chat; `getChatMember` is authoritative for group-level membership. Topic identifiers do not alter membership. Only the authenticated actor can request their own removal.

**Fixed decisions:** controlled join-request enrollment with automatic eligible approval; confirm-and-remove unenrollment; HTTPS webhook; TypeScript OOP modules.

## 2. Layers and dependencies

| Layer | Owns | Must not own |
| --- | --- | --- |
| Presentation | `/start`, callback and Telegram update handlers; locale selection; localized keyboard/message formatting | Admission policy, Telegram mutation logic |
| Application | Membership, enrollment, join-request, unenrollment and reconciliation orchestration | Framework-specific request parsing |
| Domain | States, result types, authorization policy, contracts, invariants, typed errors | grammY/Fastify/persistence SDK usage |
| Infrastructure | Telegram API gateway, persistence, webhook server, config, logging | Core business policy decisions |
| Bootstrap | Dependency composition, registration, startup capability checks, shutdown | Ongoing user-specific decisions |

Dependencies point inward through explicit contracts. Use constructor injection and modular classes; no circular imports or service locator.

Suggested components: `MembershipService`, `EnrollmentService`, `UnenrollmentService`, `JoinRequestService`, `MembershipReconciliationService`, `LocalizationService`, `TranslationCatalogGateway`, `MembershipController`, `JoinRequestController`, `TelegramMembershipGateway`, persistence adapters and webhook host.

## 3. Membership normalization

| Telegram status | Domain state | UI/operation |
| --- | --- | --- |
| `creator` / `owner` | `PRIVILEGED_MEMBER` | Status only; no removal |
| `administrator` | `PRIVILEGED_MEMBER` | Status only; no removal |
| `member` | `ENROLLED` | Unenroll |
| `restricted` and `is_member=true` | `ENROLLED` | Unenroll, subject to permission checks |
| `restricted` and `is_member=false` | `NOT_ENROLLED` | Enroll |
| `left` | `NOT_ENROLLED` | Enroll |
| `kicked` / banned | `BANNED` | No normal enrollment |
| Error or inconclusive result | `UNKNOWN` | Retry, no mutation |

Treat all decisions about changing state as requiring a fresh Telegram lookup. Persistence is for operations; not a substitute for Telegram membership.

UI labels in this document are the canonical English meanings. Presentation resolves their stable string IDs for the selected locale before sending them.

## 4. Enrollment workflow

1. Authenticated user opens `/start` in private chat.
2. Service calls `getChatMember` with configured group ID and actor ID.
3. For `NOT_ENROLLED`, present the localized `action.enroll` label.
4. On Enroll, revalidate user identity and current membership; check existing valid enrollment intent; create or reuse a controlled invitation link via `createChatInviteLink(creates_join_request=true)`.
5. Present a join-request link. **Link issuance is not request submission.**
6. Receive `chat_join_request` for configured group. Validate update provenance, actor, allowed invitation and admission policy.
7. Persist processing intent/idempotency before mutation; approve eligible applicant via `approveChatJoinRequest`.
8. Refresh via `getChatMember` and/or membership update; record completion only after membership confirmation. Handle another admin's prior approval via reconciliation.
9. Render status where the bot can deliver messages; failures must not be masked as success.

Default admission policy: **only eligible join requests associated with an authorized bot-managed invite are auto-approved**. External/unattributed invite requests must not be automatically approved under this baseline. If invitation provenance is not available or untrustworthy, fail closed and record for controlled operator resolution.

State distinctions: `INVITATION_ISSUED`, `JOIN_REQUEST_RECEIVED`, `APPROVAL_IN_PROGRESS`, `MEMBERSHIP_CONFIRMED`, `FAILED`/`EXPIRED`. These are operation states, not replacements for the actual Telegram membership enum. There is no observed pending join request merely because the invitation was displayed.

Invite policy: one controlled invite strategy for the private group; bounded lifetime or reuse and cleanup; prevent link storms; no `member_limit` with join-request links. Ensure alternative join paths are governed by the same admission policy.

## 5. Unenrollment workflow

1. For verified ordinary `ENROLLED` members, show the localized `action.unenroll` label.
2. On button press, authenticate the actor, check the stable callback action, refresh membership and show localized `action.confirm_unenroll` / `action.cancel` labels.
3. On confirmation, validate the actor and current membership again; coordinate concurrency and record operation state.
4. Reject owner/administrator removal; never act on a target user supplied by callback payload.
5. Call `banChatMember` for the authenticated eligible member.
6. Call `unbanChatMember` with `only_if_banned=true` **only for the ban established by this authorized operation**.
7. Verify final membership and ban status. If both steps succeed and Telegram confirms the user is no longer a member and not banned, report completed unenrollment.
8. If ban succeeds but unban fails, record `RECOVERY_REQUIRED`; never claim successful clean unenrollment. Recover from this operation only, without unbanning a pre-existing ban.

Telegram provides no atomic remove-and-restore-reentry operation. Network timeouts after mutations are uncertain outcomes: reconcile before retrying destructive calls.

## 6. Update ingestion, idempotency and order

Webhook route: `POST /telegram/webhook`. Authenticated input: verify `X-Telegram-Bot-Api-Secret-Token`; validate body shape and configured target group. Subscribe to `message`, `callback_query`, `chat_join_request`, `chat_member`, `my_chat_member`.

Store `update_id` and durable intake/processing metadata. Duplicate update arrivals must be idempotent. Telegram events may be delayed or processed out of business-event order; authoritative membership queries resolve state conflicts. On restart, recover accepted pending work; do not acknowledge processing that is neither completed nor durably accepted. Bound retries and use Telegram `retry_after` when supplied.

Readiness must account for configuration, persistence and the bot's known capabilities. `my_chat_member` helps detect revoked admin permissions or bot removal; fail safe when mutations are no longer allowed.

## 7. Persistence and data minimization

Recommended contract families:

- **Enrollment intent:** authenticated user ID, group ID, state, controlled invitation reference, timestamps, expiry and last verified transition.
- **Webhook receipt:** update ID, processing state, attempts, completion timestamp.
- **Membership operation:** actor ID, group ID, operation type, state, timestamps and sanitized error category.

Persist durable coordination state and recovery metadata. Avoid indefinite retention of raw Telegram updates, private data, secret links, or user profile fields. A lightweight persistent adapter is sufficient for initial single-instance hosting. Horizontal scaling requires shared idempotency and distributed per-user locking.

## 8. Localization and presentation

Localization is a presentation concern. Application and domain layers return language-neutral states, outcomes and typed errors; they never return translated strings. Presentation requests a string by stable semantic ID and supplies typed named interpolation values. Callback payloads contain stable action identifiers and operation state, never translated labels.

Translation catalogs are flat UTF-8 JSON objects stored under `translations/` and named by normalized BCP 47 locale, for example `en.json`, `ru.json` and `pt-BR.json`. Keys use semantic namespaces such as `action.enroll`, `status.enrollment_pending` and `error.telegram_unavailable`. Values are non-empty user-visible strings. The complete English catalog is the canonical list of allowed IDs and named placeholder sets; non-English catalogs may omit entries but may not add unknown IDs or change required placeholders.

`BOT_LANGUAGE` controls locale selection:

- `AUTO` reads the authenticated Telegram actor's `User.language_code` for each interaction.
- A supported BCP 47 locale forces that locale for every user and ignores Telegram's language code.
- `ENGLISH` is a documented alias for `en`.

Normalize locale tags without inventing a language from malformed input. Resolution tries the exact locale, its base language and then `en`. For `pt-BR`, lookup order is `pt-BR`, `pt`, `en`; missing, invalid or unsupported Telegram language codes start at `en`. Fixed configuration must identify a usable exact or base catalog, otherwise startup fails. English itself never falls through to another catalog.

Startup validation must reject a missing or invalid English catalog, malformed JSON, duplicate JSON keys, non-string or empty values, unknown translated IDs and placeholder mismatches. A missing non-English entry is valid and resolves from English. A lookup that cannot resolve an English ID is a programming/configuration error: emit a safe generic response where possible, record a stable error code and never expose a raw string ID or blank label to the user.

Interpolation accepts named values only. Values derived from Telegram or configuration must be escaped for the selected Telegram parse mode; translation values are trusted deployment resources but must not contain executable expressions. Command tokens such as `/start` and internal enum/error values remain stable, while bot-authored command descriptions, labels, prompts, statuses and errors are localized. Persisted operations and structured logs store stable IDs/codes rather than rendered copy.

## 9. Error model and operational invariants

Use distinct outcomes: success, already-in-desired-state, forbidden, banned, in-progress, uncertain-result, Telegram unavailable, insufficient permission, invalid update and partial recovery required. API errors never imply non-membership.

**Invariants:** no cross-user removal; no privileged-user removal; no normal banned-user invitation; no success from an invitation alone; no 'clean removal' success while a newly imposed ban remains; no unsafe automatic unban of someone already banned; no auto-approval from unrelated invite links.

## 10. Explicit exclusions

No multi-group management, topic-specific access controls, general admin moderation, manual-approval dashboard, persisted locale preferences, language-picker UI, long polling, arbitrary targeting, or membership mirroring as a separate authority.
