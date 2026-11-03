# Development Standards and Contributor Workflow

Read [AGENTS.md](AGENTS.md) first. This document expands engineering conventions and local workflow; it does not authorize scope changes.

## 1. Toolchain

Use Node.js 24 LTS with the repository baseline `24.22.2`, the compatible engine range `>=24.22.0 <25`, and npm `11.19.1`. Use TypeScript, grammY, Fastify, Vitest, ESLint, Prettier, runtime schema validation (Zod or equivalent), structured logger (Pino or equivalent), and lightweight durable persistence. Keep compatible versions pinned and documented. Do not add a database framework, broker or microservices without a justified requirement.

## 2. Directory plan

```text
src/
  domain/{enums,types,errors,policies,contracts}/
  application/{services,dto}/
  infrastructure/{telegram,persistence,http,configuration,logging}/
  presentation/{controllers,keyboards,localization,messages}/
  bootstrap/
  index.ts
tests/{unit,integration,security,fixtures,helpers}/
translations/{en,<locale>}.json
AGENTS.md
ARCHITECTURE.md
DEPLOYMENT.md
DEVELOPMENT.md
SECURITY.md
TASKS.md
TESTING.md
README.md
```

Class file names use PascalCase; folder names lowercase kebab-case. All test files live under `tests/`, not `src/`.

## 3. Strict type contract

- Type **every variable and constant declaration**, including local values with obvious inferred types.
- Type all arguments and return values, class properties, and constructor parameters.
- Use discriminated unions for operation results and `unknown` for untrusted inputs before validation.
- Prohibit `any`, unsafe casts and unchecked non-null assertions. If an exception seems necessary, revisit interface design and document the rationale before proceeding.
- Required TS flags: `strict`, `noImplicitAny`, `strictNullChecks`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noUnusedLocals`, `noUnusedParameters`.
- Avoid public APIs with generic unvalidated objects; create named domain types.

## 4. Naming contract

| Kind | Pattern | Example |
| --- | --- | --- |
| Class / interface / type | PascalCase | `MembershipService`, `MembershipGateway` |
| Enum and its member | PascalCase / UPPER_SNAKE_CASE | `MembershipStatus.NOT_ENROLLED` |
| Method | verb-first camelCase | `getMembershipStatus` |
| Local variable/constant | semantic camelCase | `telegramUserId`, `currentMembershipStatus` |
| Shared static constant | UPPER_SNAKE_CASE | `MAX_RETRY_ATTEMPTS` |
| Boolean | `is/has/can/should` prefix | `isGroupMember` |
| Class file | PascalCase | `EnrollmentService.ts` |
| Directory | lowercase kebab-case | `join-request` |

No meaningless `data`, `obj`, `tmp`, `val`, `res` if a precise domain name exists.

## 5. Modularity and OO rules

Use single-responsibility classes and constructor injection. Domain must not import Telegram or HTTP frameworks. Presenters parse updates and render responses, applications execute use cases, infrastructure supplies external adapters. Services must be small and independently testable; prefer composition. Avoid hidden global state, circular dependencies, bloated controllers, generic god-services, and speculative abstractions.

## 6. Translation catalog contract

Store one flat UTF-8 JSON object per locale under `translations/`. Use normalized BCP 47 file names such as `en.json`, `ru.json` and `pt-BR.json`. Do not nest catalogs or use English source text as a key. String IDs are stable, semantic and namespaced in lowercase dot notation, for example `action.enroll`, `prompt.unenroll_confirmation`, `status.enrollment_complete` and `error.telegram_unavailable`.

`translations/en.json` is required, complete and canonical. Its keys define every allowed user-visible string ID, and its named placeholders define each string's interpolation contract. Non-English catalogs may omit IDs because lookup falls back to English, but they may not introduce unknown IDs. Example:

```json
{
  "action.enroll": "Enroll",
  "action.unenroll": "Unenroll",
  "prompt.unenroll_confirmation": "Are you sure you want to leave {groupName}?"
}
```

Catalog validation must detect malformed JSON and duplicate keys before normal object parsing can hide them. It must also reject non-string or empty values, unknown translated IDs, and missing, extra or malformed named placeholders. All catalog files must be included in build and deployment artifacts. Do not add a runtime dependency merely to read JSON unless the selected Node.js/TypeScript toolchain requires one.

Presentation code depends on a localization contract; domain and application results remain language-neutral. Interpolation uses named typed values and escapes externally sourced values for the active Telegram parse mode. Never branch on rendered text. Callback payloads, domain enums, typed errors, persistence records and structured logs use stable internal identifiers.

When adding or changing bot-authored visible copy, update the English catalog and its tests in the same task. Translators may then add or update locale catalogs independently. Removing or renaming an ID is an interface change: update all references and validate every catalog. Command tokens remain stable while command descriptions are catalog entries.

## 7. Comment-free code policy

No source comments, including inline/block/JSDoc/TODO/commented-out code. Use descriptive naming, exact types, and narrow methods. Explain non-obvious design decisions in the relevant Markdown file, not the source. Do not suppress lint/type errors with comments.

## 8. Required quality commands

The repository exposes:

```text
npm run typecheck
npm run lint
npm run format:check
npm run test
npm run test:coverage
npm run build
```

These scripts must remain deterministic and CI-safe. TASK-065 owns the final automated CI and coverage-gate integration.

## 9. Working procedure

1. Read [AGENTS.md](AGENTS.md), the owning topic file and active [TASKS.md](TASKS.md) tasks.
2. Verify upstream dependencies before starting the task.
3. Define interfaces, domain behavior and failure states before integrating APIs.
4. Write tests for expected behavior and failure/abuse cases, including locale fallback for presentation changes.
5. Implement the minimal scoped change without code comments; update the English catalog for every changed user-visible string.
6. Run formatting, lint, typecheck, tests and relevant coverage; address failures.
7. Update docs and check a task only after its acceptance criteria are met.

Maintain stable, backwards-compatible public interfaces when possible. Do not claim deployment or test success without actually executing validation.

## 10. Review checklist

Changes must preserve actor-only actions, Telegram-authoritative membership, automatic approval from trusted invites, admin/owner removal protections, webhook verification, deduplication, removal recovery and private-chat-only controls. All external inputs require runtime validation. User-visible copy must use catalog IDs with English fallback, and translated text must not control behavior. Logs must omit secrets, invitation tokens and rendered private messages.
