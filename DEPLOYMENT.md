# Setup, Webhook Deployment and Operations

**Status:** Deployment guide requirements for the future implementation. No application code, translation catalogs, `.env.example` or runnable commands have been delivered in this documentation-only scaffold. Refer to [AGENTS.md](AGENTS.md) for fixed decisions.

## 1. Prerequisites

- Node.js 24 LTS satisfying `>=24.22.0 <25` and a compatible deployed runtime/container.
- Bot token from Telegram **@BotFather**.
- One **private supergroup** with forum topics enabled and a known numeric chat ID.
- Bot is a group admin with capabilities required for invite creation/approval and restriction/removal (`can_invite_users`, `can_restrict_members`).
- Public HTTPS endpoint with a trusted certificate and controlled ingress.
- Durable persistence for invitation intent, webhook receipt deduplication and operation recovery.
- Translation catalogs packaged with the application, including a complete validated English catalog.
- Secure environment/secret store and operational monitoring.

## 2. Telegram setup

1. Create the bot with @BotFather; record token in a secret manager.
2. Create or select the private supergroup, enable topics, and obtain its **numeric supergroup ID** (commonly a negative `-100...`-prefixed identifier, but validate rather than guess).
3. Add bot as administrator and grant required invite management/join-request approval and user restriction permissions.
4. Restrict alternative invitation paths to preserve the bot's admission policy; review links owned by other admins.
5. Validate the bot's access and permissions at startup and after `my_chat_member` updates.
6. Ensure a safe non-production group exists for integration verification.

## 3. Required environment contract

| Variable | Purpose | Requirement |
| --- | --- | --- |
| `BOT_TOKEN` | Bot API authentication | Secret, required |
| `TARGET_GROUP_ID` | Target group numeric identifier | Required, validate identifier |
| `WEBHOOK_PUBLIC_URL` | Complete public HTTPS endpoint | Required, validate TLS URL |
| `WEBHOOK_SECRET_TOKEN` | Telegram webhook secret header | Secret, required; Bot API-compatible chars/length |
| `PORT` | Local server port | Required or safe documented default |
| `NODE_ENV` | Runtime mode | Required |
| `LOG_LEVEL` | Structured log level | Required or documented default |
| `PERSISTENCE_URL` | Durable storage connection | Required, secure |
| `BOT_LANGUAGE` | UI locale selection | Required; `AUTO`, supported BCP 47 locale, or `ENGLISH` alias |

Optional: `ENROLLMENT_LINK_TTL_SECONDS`, `ENROLLMENT_AUTO_APPROVE` (true under fixed baseline), `MAX_OPERATION_RETRIES`, `OPERATION_TIMEOUT_MS`, `INVITATION_LINK_NAME`. Validate all configuration at startup; never print secrets, invite URLs or rendered private messages.

`BOT_LANGUAGE=AUTO` selects per interaction from Telegram `User.language_code`; a missing, invalid or unsupported value resolves to English. A fixed normalized locale such as `ru` or `pt-BR` ignores Telegram's value and applies to every user. `ENGLISH` is accepted as an alias for `en`. Both modes resolve exact locale, then base language, then English. Startup must fail when `BOT_LANGUAGE` is absent or invalid, the English catalog is missing/invalid, or fixed mode has no usable exact or base catalog.

The eventual `.env.example` must include all configuration keys with safe placeholders and no real values. A local `.env` must be ignored by version control.

## 4. Webhook registration

Use Telegram `setWebhook` with:

- `url`: the public HTTPS `WEBHOOK_PUBLIC_URL` pointing to `POST /telegram/webhook`.
- `secret_token`: matches `WEBHOOK_SECRET_TOKEN`.
- `allowed_updates`: `message`, `callback_query`, `chat_join_request`, `chat_member`, `my_chat_member`.
- A documented `max_connections` policy for initial single-instance operation.

Fastify must verify `X-Telegram-Bot-Api-Secret-Token`, validate request payloads, enforce body-size limits and return safe HTTP responses. Do not log raw tokens or assume request-path secrecy replaces header authentication. Avoid polling when the webhook is active.

## 5. Runtime endpoints

| Route | Purpose | Success |
| --- | --- | --- |
| `POST /telegram/webhook` | Telegram update intake | Only after durable acceptance or safe completed processing |
| `GET /health/live` | Process liveness | Service process responsive |
| `GET /health/ready` | Configuration/catalog/storage/Telegram capability readiness | Safe to accept updates |

Update retries must not duplicate approval/removal. Persist `update_id`, operation state and recovery markers. Avoid expensive synchronous processing before acknowledgment; use durable handoff if necessary.

## 6. Build and deploy procedure

1. Install pinned dependencies on the chosen Node.js LTS runtime.
2. Package the complete English catalog and all supported locale catalogs in the runtime artifact.
3. Supply secrets and `BOT_LANGUAGE` through secure environment injection; validate config and every catalog.
4. Apply/initialize persistent storage and validate access and backup policy.
5. Start HTTP service; check liveness/readiness and safe shutdown behavior.
6. Establish public HTTPS and only then register webhook.
7. Verify `getWebhookInfo`, allowed updates, TLS reachability, secret-header validation and error rates.
8. Run non-production end-to-end flows in English and at least one fallback scenario: start, join request, approval confirmation, removal and safe re-enrollment.
9. Monitor failures, webhook lag, duplicate updates, lost permissions and stuck removal recovery records.

Production rollout must require passing typecheck, lint, format check, tests, coverage and documented regression checks. The exact runtime/start/deployment commands must be written after implementation and actually validated.

## 7. Failure handling and recovery

- **Bot loses admin permissions:** readiness degrades for mutating workflows; present a safe user-facing failure and alert operator.
- **Webhook retries or process restarts:** resume durably accepted operations and deduplicate; do not repeat a destructive mutation without reconciliation.
- **Invitation expires/revoked:** replace or recover controlled link and let user retry; never mark request submitted from an issued link.
- **Ban succeeds/unban fails:** mark `RECOVERY_REQUIRED`; only unban if recovery record proves this operation created the ban and policy still authorizes recovery.
- **Telegram API timeout:** status may be uncertain; query Telegram to reconcile before retrying.
- **Storage unavailable:** fail readiness or stop mutations rather than executing untracked operations.
- **Catalog or fixed locale invalid:** fail startup/readiness and report stable catalog error codes; never expose raw string IDs or serve blank labels.
- **AUTO locale unsupported:** resolve through the documented exact/base/English chain without affecting authorization or membership behavior.
- **Rollback:** preserve persistent operation records; ensure old/new schema compatibility and avoid losing deduplication state.

## 8. Operational security

Restrict administrator rights to the necessary permissions. Protect runtime secrets, join links and data backups. Treat deployed catalogs as reviewed application assets and restrict write access. Rotate compromised bot/webhook tokens with planned webhook re-registration. Log event IDs, stable string/error IDs, safe error categories and operation states, not raw sensitive payloads or rendered private messages. Establish data retention and deletion policies in [SECURITY.md](SECURITY.md).
