# AGENTS.md — Developer & Agent Contract

**Project:** Telegram Group Membership Manager  
**Specification:** v1.0  
**Status:** Approved for implementation; this repository currently contains specification documents only.

## Mission and fixed decisions

Build a production-ready TypeScript bot for **one predefined private Telegram supergroup with forum topics enabled**. In a private bot chat, a non-member is offered **Enroll**, which issues a controlled join-request invite link; an eligible request is **automatically approved** after server-side validation. An existing ordinary member is offered **Unenroll**, which requires confirmation and triggers bot-managed removal. Deploy by **HTTPS webhook**, not long polling.

Every user-visible label and message must be resolved through a stable localization string ID. Operators choose automatic per-user locale selection or one fixed locale; every lookup ultimately falls back to the complete English catalog.

Do not implement topic-specific membership, manual administrator approval, third-party Telegram clients, or arbitrary-user removal.

## Source of truth and document map

| File | Ownership |
| --- | --- |
| [AGENTS.md](AGENTS.md) | Global non-negotiable coding and agent instructions; architectural decisions; document precedence |
| [README.md](README.md) | Product overview, quick start and operator onboarding |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Domain states, flows, boundaries, Telegram semantics, localization and persistence |
| [DEVELOPMENT.md](DEVELOPMENT.md) | Coding conventions, translation catalog contract, toolchain and contributor workflow |
| [DEPLOYMENT.md](DEPLOYMENT.md) | BotFather, locale configuration, Telegram permissions, webhook, infrastructure and recovery |
| [SECURITY.md](SECURITY.md) | Threat model, validation, authorization, idempotency and sensitive-data handling |
| [TESTING.md](TESTING.md) | Test strategy, mandatory cases, quality gates and coverage |
| [TASKS.md](TASKS.md) | The 73-item ordered implementation backlog and acceptance criteria |

**Precedence:** AGENTS.md governs cross-cutting constraints. Topic-specific documents govern their respective details. TASKS.md tracks execution; a task checkbox does not override requirements. If documents conflict, document the discrepancy and resolve it before making a conflicting change. Do not quietly change the three fixed product decisions.

## Non-negotiable engineering rules

1. **No implementation in this document package.** When implementation begins, use strict TypeScript and Node.js LTS; use grammY for Telegram and Fastify for HTTPS webhook HTTP handling.
2. **Explicit types everywhere:** every declared variable and constant must have an explicit type annotation, including locally inferable values. Explicitly type parameters, return values, class fields and constructors as appropriate. Avoid `any`, unsafe assertions, non-null assertions, unchecked casting and implicit public contracts. External input starts as `unknown` and must be narrowed.
3. **Naming:** PascalCase classes, interfaces, types, enums, and class files; camelCase methods, parameters and local variables/constants; UPPER_SNAKE_CASE shared static constants and enum members; descriptive boolean prefixes (`is`, `has`, `can`, `should`); lowercase kebab-case directories. No ambiguous `data`, `obj`, `val`, `res`, `tmp` where a domain name exists.
4. **No comments in source code:** no inline/block/JSDoc/TODO/commented-out implementation. Put explanations in Markdown documentation. Prefer expressive types, names and decomposition.
5. **Modular OOP:** domain must be framework independent; use constructor dependency injection and replaceable gateway/persistence contracts. Controllers deal with transport, services orchestrate use cases, infrastructure speaks to external systems. Prefer composition; do not add unneeded abstractions.
6. **Tests in `/tests` only**, never colocated with `/src`. Use Vitest with deterministic mocks; no tests require live production credentials.
7. **No speculative success:** an issued invite is not a submitted request; an approved request is not confirmed membership; `banChatMember` success without successful unban is not completed unenrollment.
8. **Membership is Telegram-authoritative** for state-changing decisions. Persist operational intentions and idempotency records, not an authoritative shadow membership table.
9. **Safety before mutation:** authenticate Telegram actor, check target group, validate callback/action state, recheck actual membership, block privileged-member removal, and coordinate concurrent operations.
10. **Webhooks must be authenticated, validated, deduplicated and retry-safe.** `chat_join_request`, `chat_member`, `my_chat_member`, `callback_query` and `message` are subscribed where relevant.
11. **Errors are typed and visible at the right boundary:** protect secrets, use structured logs, observe uncertain Telegram mutation outcomes, and recover from partial removal without unbanning pre-existing banned users.
12. **No needless dependencies** or database framework. Durable persistence is required; choose a minimal adapter suitable for the selected deployment, document it, and ensure it survives restarts.
13. Keep documentation, tests and checklist status synchronized. Never mark a task complete without its acceptance criteria.
14. **Localize every user-visible string:** use stable semantic string IDs and flat UTF-8 JSON catalogs. English is the complete canonical catalog and final fallback. Translated text must never be used as a callback action, authorization input, domain state, persistence value or structured log identifier.

## Project constraints

- Single configured **private supergroup** with topics, but group-level membership only.
- Approve only validated eligible join requests through an authorized bot-managed invite; unrelated links must not receive automatic approval unless explicitly allowed by a documented future change.
- Only member-initiated removal of the actor; no removal of owner/admins.
- Telegram API removal is a multi-step `banChatMember` then `unbanChatMember(only_if_banned=true)` workflow with durable recovery.
- Production transport is HTTPS webhook authenticated with `X-Telegram-Bot-Api-Secret-Token`.
- Only private bot chats expose membership-management controls; updates from the configured group may still be consumed for reconciliation.
- `BOT_LANGUAGE=AUTO` selects from the Telegram actor's `language_code`; a fixed supported locale selects one language for all users. Resolution tries exact locale, base locale and then English. No persisted language preference or language-picker UI is in the initial scope.

## Required runtime quality

Enable TypeScript `strict`, `noImplicitAny`, `strictNullChecks`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noUnusedLocals`, and `noUnusedParameters`. Run lint, format check, typecheck, tests and coverage checks before closing tasks. Aim for **at least 90% statement and branch coverage** of domain and application logic; critical invariants require tests independent of coverage percent.

## Implementation discipline for agents

1. Read AGENTS.md, the relevant root-level topic document and the active task in TASKS.md **before making changes**.
2. Work in dependency order: foundation → domain → Telegram gateway → webhook → enrollment → unenrollment → resilience → quality → delivery.
3. Before any membership mutation, enumerate successful, failed, repeated, stale and partially completed paths; design recovery before coding.
4. Keep changes scoped to the active task; if a new decision is necessary, document it in the appropriate topic document.
5. Write or update tests and documentation with the change. Any new or changed user-visible text must update the English catalog and catalog validation tests. Run relevant quality gates and log any missing capability or blocker instead of inventing success.
6. Mark tasks complete in TASKS.md **only after verification**. Keep acceptance checklists truthful.

## Out-of-scope

No implementation artifacts in this scaffold; no user database as a source of truth for membership, multi-group management, topic-level permissions, manual-review console, arbitrary user moderation, persisted locale preferences, language-selection UI, long polling, unsolicited notifications, or automation outside the described membership workflow.
