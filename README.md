# Telegram Group Membership Manager

**Status: implementation in progress — repository foundation complete; bot behavior has not been implemented.**

A TypeScript Telegram bot for one **private supergroup with forum topics**. In a private chat, the bot presents a localized **Enroll** action to non-members and **Unenroll** to ordinary members. Enrollment goes through bot-controlled join-request links and automatic eligible-request approval; removal is member-initiated and confirmation-gated. Production updates arrive through an **HTTPS webhook**. Operators may select each user's Telegram language automatically or force one supported language for everyone, with English as the final fallback.

## Start here

- **AI agents / developers:** read [AGENTS.md](AGENTS.md) first.
- **Implementation plan:** [TASKS.md](TASKS.md) contains 73 numbered tasks across nine epics.
- **Architecture and behavior:** [ARCHITECTURE.md](ARCHITECTURE.md).
- **Conventions and local development:** [DEVELOPMENT.md](DEVELOPMENT.md).
- **Bot, group and production setup:** [DEPLOYMENT.md](DEPLOYMENT.md).
- **Security policies:** [SECURITY.md](SECURITY.md).
- **Tests and quality gates:** [TESTING.md](TESTING.md).

## Functional behavior

| Actual state | Bot interface | Action |
| --- | --- | --- |
| Not enrolled | **Enroll** | Provide controlled join-request invitation; wait for Telegram request and approval |
| Invitation issued, no request observed | **Refresh Status** | Check membership; do not imply request is pending |
| Join request received | **Enrollment Pending** | Validate eligibility, approve, reconcile |
| Ordinary member | **Unenroll** | Confirm then remove and lift newly created ban |
| Administrator / owner | Membership status only | Do not offer destructive removal |
| Already banned | Unavailable | Do not issue normal invite or unban |
| Telegram status indeterminate | Retry / error | Never guess non-membership |

**Important:** Forum topics share a single supergroup membership. There is no topic-by-topic enrollment in scope.

Labels in this table describe the canonical English copy. The implemented bot must render every visible label, prompt, status and error through the selected translation catalog.

## Technical baseline

Node.js 24 LTS · TypeScript (strict with explicit annotations) · grammY · Fastify · Vitest · ESLint · Prettier · runtime schema validation · structured logging · durable operational persistence.

Translation resources use validated flat UTF-8 JSON catalogs with named placeholders and no runtime dependency on spreadsheet formats.

The selected production transport is **HTTPS webhook**; long polling is out of scope. Avoid additional infrastructure unless necessary for operational safety.

## Prerequisites

1. A Telegram bot created with **@BotFather** and its token.
2. A **private supergroup** with the **Topics** feature enabled.
3. Bot added as an administrator with permissions needed for invitation management, join-request approval and member restriction/removal (notably `can_invite_users` and `can_restrict_members`).
4. The numeric target supergroup ID and a protected HTTPS webhook endpoint.
5. Persistent storage for enrollment intents, deduplication and recovery.

Do not expose the token, join links, webhook secret or operational data in version control.

## Setup guide — required behavior after implementation

1. Install the documented supported Node.js version and project dependencies.
2. Copy `.env.example` to a local environment file and configure all required values.
3. Set `BOT_LANGUAGE` to `AUTO`, a supported BCP 47 locale such as `ru` or `pt-BR`, or the documented `ENGLISH` alias.
4. Configure the target **private** supergroup, add the bot as administrator, and validate its permissions.
5. Register the public HTTPS webhook with Telegram using `setWebhook`, the configured secret token and the exact allowed updates.
6. Confirm translation catalog validation, liveness and readiness endpoints, test webhook verification, and run a safe end-to-end enrollment/removal test in a **non-production group**.
7. Run typecheck, lint, format check, tests and coverage gates before production deployment.

A runnable `.env.example`, translation catalog files, HTTP service and application implementation belong to later TASKS.md epics. Foundation package scripts are available now; configuration, catalogs and deployable bot behavior are not. See [DEPLOYMENT.md](DEPLOYMENT.md) for the required environment contract and deployment steps.

## Localization contract

Every user-visible button label, prompt, status, error and command description has a stable semantic ID such as `action.enroll` or `error.telegram_unavailable`. Catalogs are flat UTF-8 JSON objects; the planned `translations/en.json` is complete and defines the allowed IDs and named placeholders.

```json
{
  "action.enroll": "Enroll",
  "action.unenroll": "Unenroll",
  "prompt.unenroll_confirmation": "Are you sure you want to leave {groupName}?"
}
```

`BOT_LANGUAGE=AUTO` uses Telegram's `User.language_code` for each actor. Locale lookup tries the normalized exact locale, its base language and then `en`; for example, `pt-BR` resolves through `pt-BR` → `pt` → `en`. A missing, invalid or unsupported Telegram language code resolves to English. A fixed BCP 47 value ignores Telegram's language code and uses the same fallback chain; `BOT_LANGUAGE=ENGLISH` is an alias for `en`.

Non-English catalogs may be incomplete because missing entries fall back to English. The service must fail startup when English is missing or invalid, when catalogs contain unknown IDs or placeholder mismatches, or when a fixed configured locale has no usable catalog. Callback payloads and authorization use stable internal action identifiers, never translated labels.

## Available bot commands and interaction requirements

- `/start`: validate actor, fetch membership and render current action.
- **Enroll**: recheck state, issue/reuse eligible join-request link, explain how to submit the Telegram request.
- **Unenroll**: request confirmation; on confirmation execute authorized remove-and-unban workflow.
- **Cancel**: abort confirmation without changing membership.
- **Refresh Status**: query Telegram and refresh the keyboard.

No unverified success messages or unsafe public-chat controls. Command tokens such as `/start` remain stable; their descriptions and all bot-authored visible copy are localized.

## Troubleshooting guide

| Symptom | First check |
| --- | --- |
| Join request is never received | Private-group invitation has `creates_join_request=true`; bot has `can_invite_users`; webhook receives `chat_join_request` |
| Approval fails | Bot permissions, eligibility checks, another admin's actions, Telegram API result |
| Cannot remove user | User is not owner/admin; bot has `can_restrict_members`; no conflicting admin hierarchy |
| User remains banned | Partial remove-and-unban operation; consult recovery procedure |
| Bot sees wrong status | Target group ID, `getChatMember` response, restricted `is_member`, rate limits |
| Webhook retries | Secret validation, endpoint responses, durable update deduplication |
| Ready endpoint fails | Environment, Telegram capabilities, persistence connection, initialization |
| UI appears in the wrong language | `BOT_LANGUAGE`, Telegram `language_code`, packaged locale catalogs and exact/base/English fallback |
| Raw string ID or blank label appears | English catalog/reference validation; service should not have become ready |

## Documentation scope

The capitalized root documents define **what to build**, while the implementation is being added in dependency order under `src/` and `tests/`. [AGENTS.md](AGENTS.md) is the central engineering contract and the other root documents provide focused detail without duplicating the entire specification.
