# Security Model and Defensive Requirements

This document defines the security acceptance contract. See [AGENTS.md](AGENTS.md) for global rules and [ARCHITECTURE.md](ARCHITECTURE.md) for workflows.

## 1. Trust boundaries

1. **Public HTTPS ingress:** untrusted until verified by webhook secret and schema validation.
2. **Telegram update identity:** trust verified `from.id` / relevant Telegram event actor, not free-form callback values or message text.
3. **Target group:** only the configured group ID can affect membership.
4. **Application persistence:** stores potentially stale operation state; not authoritative for current Telegram membership.
5. **Telegram API:** external dependency with rate limits, partial failures and uncertain mutation outcomes.
6. **Invitations:** sensitive capability links; possession does not itself prove admission eligibility.
7. **Locale and catalogs:** Telegram language metadata is untrusted display input; deployed catalogs are reviewed presentation resources, never authority inputs.

## 2. Threats and required mitigations

| Threat / mistake | Required mitigation |
| --- | --- |
| Forged webhook | Verify `X-Telegram-Bot-Api-Secret-Token` before accepting updates; validate payload |
| Forged user ID in callback | Determine actor from authenticated Telegram update only |
| Cross-user unenrollment | Bind actions to actor; no client-supplied target ID |
| Public-chat unsafe controls | Membership controls only in private bot chat |
| Callback replay / stale keyboard | Check permitted action, expected state and fresh membership |
| Double-click / webhook duplicate | Durable idempotency and per-user operation coordination |
| Unrelated join-request invite | Require trusted bot-managed link provenance and admission policy |
| User already banned | Never issue routine invitation or automatically unban |
| Admin/owner removal | Explicit hard denial before any mutation |
| Unban after partial failure | Only recover a ban created by this exact authorized operation |
| API failure interpreted as non-member | Return UNKNOWN/error; no enrollment mutation inferred |
| Secret leakage | Redact tokens, invitation URLs, webhook secret, raw request contents |
| Loss of bot permissions | Capability check and fail closed |
| API rate limit | Bounded retries and supplied `retry_after` guidance |
| Crash between ban and unban | Durable operation phases and safe reconciliation |
| Unbounded invite creation | Reuse/revoke/expire controlled invites and limit issuance |
| Translated label used as an action | Route callbacks and authorize operations through stable internal identifiers only |
| Malformed or tampered catalog | Validate catalogs at startup; fail readiness before serving incomplete or unsafe UI |
| Interpolation/parse-mode injection | Use named placeholders and escape externally sourced values for the active Telegram parse mode |
| Locale spoofing changes behavior | Allow locale to affect rendered copy only, never eligibility, actor identity, group targeting or mutation policy |

## 3. Authorization invariants

- An authenticated actor may request **only their own** member status, enrollment and removal.
- Administrative or owner accounts are never removed through the bot's user workflow.
- Eligibility is verified server-side; a button, invitation or request event does not bypass policy.
- `getChatMember` is refreshed immediately before security-sensitive mutations.
- Mutations never proceed on `UNKNOWN` membership state.
- An unauthorized join request is not auto-approved; operator intervention or a future explicit policy is required.
- No uncontrolled unban operation or unintended admission of banned accounts.
- Locale selection and translated text cannot change authorization, operation identity, state transitions or Telegram API parameters.

## 4. Enrollment-specific protections

Use private-group bot-controlled join-request invite links. A join request must match the configured group and allowed provenance; unavailable provenance must fail closed. Protect tokens that appear in invitation links. Link issuance is distinct from request submission. Only report enrollment after Telegram confirms membership. Rate-limit invite creation per actor and reuse valid links when policy allows.

## 5. Unenrollment-specific protections

Require explicit confirmation bound to the actor and the current operation. Validate actual membership and authorization again upon confirmation. Persist state before beginning `banChatMember` then `unbanChatMember(only_if_banned=true)`. If an API call times out, reconcile rather than blindly repeating actions. Never use recovery metadata to unban someone known to have been banned before this operation. Report incomplete/uncertain outcome accurately.

## 6. Localization-specific protections

Treat Telegram `User.language_code` as optional untrusted input. Normalize only valid BCP 47 locale identifiers and use it solely to choose display text in `AUTO` mode. Unsupported, missing or malformed values fall back to English and must not cause a mutation failure or alter the actor being processed. Fixed mode ignores Telegram locale metadata.

The English catalog is the canonical allowlist of string IDs and placeholder contracts. Validate malformed JSON, duplicate keys, unknown IDs, empty/non-string values and placeholder mismatches before readiness. Translation lookup must never evaluate expressions or substitute positional values. Escape user-, Telegram- and configuration-derived interpolation values for the active Telegram parse mode.

Callback payloads, domain enums, typed errors, persistence records, metrics and structured logs use stable language-neutral IDs. Never parse or compare translated labels to determine an action. Do not include rendered private messages in logs by default; diagnostic events may record the normalized locale and stable string ID when operationally necessary.

## 7. Webhook and application hardening

- HTTPS public ingress and pinned, validated webhook secret.
- Reject oversized and invalid bodies; strict action/callback allowlist.
- Do not assume message order or exactly-once delivery.
- Persist update deduplication and operation state before acknowledging irreversible work.
- Protect persistence with least privilege and durable backups.
- Avoid exposing sensitive exception details to users.
- Apply bounded retry/backoff and reasonable timeouts.
- Deny mutation while storage/idempotency infrastructure is unhealthy.

## 8. Logging, retention and privacy

Log only needed information: update identifiers, target group ID, user ID where operationally necessary, stable action/string IDs, normalized locale where diagnostic value justifies it, phase, timestamps and sanitized error categories. Do not log raw tokens, invite links, callback secrets, full updates, rendered translations or private messages by default. Define retention durations and purge jobs before deployment. Maintain secure access controls for logs, catalogs, data and backups. Do not persist user profile fields or locale preferences not needed for membership workflows.

## 9. Security tests required

See [TESTING.md](TESTING.md). At minimum test forged webhook header, forged callback actor, wrong group ID, stale callback, replayed update, admin/owner removal, pre-existing ban, unrelated invite, failed unban recovery, uncertain Telegram timeout, missing permissions, concurrent actions, translated-label tampering, malformed locale metadata, catalog validation and safe placeholder interpolation.
