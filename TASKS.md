# TASKS.md — Implementation Backlog

**Status:** Specification files prepared; implementation not started. All implementation tasks are unchecked.

**Authority:** [AGENTS.md](AGENTS.md) defines global rules. Topic requirements reside in the capitalized root documents. Task completion requires verifiable acceptance criteria.

## Tracking rules

- Complete epics in dependency order, allowing non-blocking documentation improvements.
- Mark `- [x]` only after implementation, relevant tests and quality checks pass.
- Files in this package are specification drafts; their existence alone does **not** satisfy implementation/documentation delivery tasks.
- Record blockers and notable design decisions in the owning topic file; do not silently alter the fixed join-request, removal or webhook decisions.
- A user-visible string is not complete until it has a stable ID, complete English value, validated placeholders and fallback coverage.

## Progress

**0 / 73 tasks completed** · **9 epics**

## EPIC 01 — Repository Foundation

**Acceptance:** Project installs, validates configuration and translation catalogs, typechecks, lints and executes an empty test suite without configuration errors.

- [ ] **TASK-001** — Initialize Node.js and TypeScript project.
- [ ] **TASK-002** — Configure the strict TypeScript compiler.
- [ ] **TASK-003** — Configure ESLint and Prettier.
- [ ] **TASK-004** — Configure Vitest and the separate test directory.
- [ ] **TASK-005** — Create modular source directory structure.
- [ ] **TASK-006** — Implement validated environment configuration, including required `BOT_LANGUAGE`.
- [ ] **TASK-007** — Establish structured logging and application bootstrap.
- [ ] **TASK-008** — Implement flat JSON translation catalog loading and validation with a complete canonical English catalog.
- [ ] **TASK-009** — Implement `AUTO`/fixed locale selection and exact/base/English fallback resolution.

## EPIC 02 — Domain Modeling

**Acceptance:** Domain logic can be tested without a Telegram connection or HTTP server and exposes only language-neutral states and outcomes.

- [ ] **TASK-010** — Define membership states and normalization rules.
- [ ] **TASK-011** — Define enrollment lifecycle states.
- [ ] **TASK-012** — Define domain errors and operation outcomes.
- [ ] **TASK-013** — Define authorization and eligibility policies.
- [ ] **TASK-014** — Define Telegram gateway contracts.
- [ ] **TASK-015** — Define persistence contracts.
- [ ] **TASK-016** — Define removal recovery state transitions.

## EPIC 03 — Telegram Integration

**Acceptance:** Every Telegram operation is encapsulated behind an interface and covered by mocked integration tests.

- [ ] **TASK-017** — Implement Telegram membership gateway.
- [ ] **TASK-018** — Implement invitation-link management.
- [ ] **TASK-019** — Implement join-request approval gateway.
- [ ] **TASK-020** — Implement member removal and unban gateway.
- [ ] **TASK-021** — Implement permission and group capability checks.
- [ ] **TASK-022** — Implement Telegram API error classification.

## EPIC 04 — Webhook Infrastructure

**Acceptance:** Duplicate or unauthorized webhook deliveries cannot cause unauthorized or repeated mutations, and Telegram locale metadata cannot affect behavior outside presentation.

- [ ] **TASK-023** — Configure the Fastify HTTP application.
- [ ] **TASK-024** — Register the Telegram webhook route.
- [ ] **TASK-025** — Validate webhook authentication.
- [ ] **TASK-026** — Validate incoming update payloads.
- [ ] **TASK-027** — Configure explicit Telegram update subscriptions.
- [ ] **TASK-028** — Implement durable webhook deduplication.
- [ ] **TASK-029** — Implement health and readiness endpoints, including catalog readiness.
- [ ] **TASK-030** — Implement graceful shutdown and retry-safe processing.

## EPIC 05 — Enrollment Workflow

**Acceptance:** An eligible non-member can request to join and become a verified member through the bot-managed flow, with every visible response localized through a stable ID and safe fallback.

- [ ] **TASK-031** — Implement initial membership checking.
- [ ] **TASK-032** — Implement localized private-chat presentation and command descriptions.
- [ ] **TASK-033** — Implement localized Enroll keyboard.
- [ ] **TASK-034** — Implement invitation-link issuance and reuse.
- [ ] **TASK-035** — Implement enrollment intent persistence.
- [ ] **TASK-036** — Implement join-request event controller.
- [ ] **TASK-037** — Implement request eligibility and provenance validation.
- [ ] **TASK-038** — Implement automatic request approval.
- [ ] **TASK-039** — Implement post-approval membership verification.
- [ ] **TASK-040** — Implement localized pending, completed and failed enrollment responses.

## EPIC 06 — Unenrollment Workflow

**Acceptance:** A regular member can voluntarily leave through the bot without remaining intentionally banned, failures are reported accurately, and translated labels never determine the requested action.

- [ ] **TASK-041** — Implement localized Unenroll keyboard.
- [ ] **TASK-042** — Implement localized confirmation and cancellation with stable callback actions.
- [ ] **TASK-043** — Implement authenticated actor validation.
- [ ] **TASK-044** — Implement protected-member rejection.
- [ ] **TASK-045** — Implement removal operation coordination.
- [ ] **TASK-046** — Implement ban-then-unban sequence.
- [ ] **TASK-047** — Implement partial-failure recovery.
- [ ] **TASK-048** — Implement final membership verification and localized interface refresh.

## EPIC 07 — Resilience and Security

**Acceptance:** All documented abuse and failure scenarios have deterministic, safe outcomes independent of locale or translated copy.

- [ ] **TASK-049** — Implement stale callback protection.
- [ ] **TASK-050** — Implement repeated-action handling.
- [ ] **TASK-051** — Implement per-user concurrency safeguards.
- [ ] **TASK-052** — Implement bounded retry and rate-limit handling.
- [ ] **TASK-053** — Implement membership event reconciliation.
- [ ] **TASK-054** — Implement bot permission-loss detection.
- [ ] **TASK-055** — Implement sensitive-data and rendered-message redaction with operational recovery.
- [ ] **TASK-056** — Implement retention and cleanup policies.

## EPIC 08 — Testing and Quality

**Acceptance:** All tests, catalog checks and static quality gates pass without bypasses.

- [ ] **TASK-057** — Implement domain unit tests.
- [ ] **TASK-058** — Implement application service unit tests.
- [ ] **TASK-059** — Implement Telegram gateway integration tests.
- [ ] **TASK-060** — Implement webhook integration tests.
- [ ] **TASK-061** — Implement enrollment lifecycle tests.
- [ ] **TASK-062** — Implement removal and partial-failure tests.
- [ ] **TASK-063** — Implement security and concurrency tests.
- [ ] **TASK-064** — Implement catalog validation, locale selection, fallback, interpolation and language-neutral callback tests.
- [ ] **TASK-065** — Configure automated typecheck, lint, tests, catalog validation and coverage gates.

## EPIC 09 — Documentation and Delivery

**Acceptance:** A developer unfamiliar with the repository can configure languages, translate UI copy, test, deploy and operate the bot using repository documentation alone.

- [ ] **TASK-066** — Write complete README, including operator locale selection and translator onboarding.
- [ ] **TASK-067** — Write architecture documentation, including localization boundaries and fallback behavior.
- [ ] **TASK-068** — Write development standards, including string-ID and catalog contribution rules.
- [ ] **TASK-069** — Write webhook deployment guide, including catalog packaging and `BOT_LANGUAGE` validation.
- [ ] **TASK-070** — Write security and recovery documentation, including localization trust boundaries.
- [ ] **TASK-071** — Write testing documentation, including mandatory localization cases.
- [ ] **TASK-072** — Validate installation from a clean environment in `AUTO` and fixed locale modes.
- [ ] **TASK-073** — Validate production deployment, English fallback and operational recovery.

## Final project acceptance

- [ ] Non-members are offered controlled join-request enrollment; only eligible requests are automatically approved.
- [ ] Membership confirmation is based on Telegram, not invitation issuance or optimistic approval.
- [ ] Ordinary members may confirm own removal; privileged members and pre-existing banned users are protected.
- [ ] Ban/unban partial failure is durably recoverable and never misreported as clean success.
- [ ] Webhook uses HTTPS, secret header verification, durable deduplication and explicit allowed updates.
- [ ] Every bot-authored visible string has a stable semantic ID and a value in the complete English JSON catalog.
- [ ] `BOT_LANGUAGE=AUTO` and fixed locale mode implement exact locale → base language → English fallback; `ENGLISH` aliases `en`.
- [ ] Missing translations never expose blank text or raw IDs, and translated text never controls callbacks, authorization, persistence or Telegram mutations.
- [ ] Catalogs reject malformed JSON, duplicate/unknown IDs, invalid values and placeholder mismatches before readiness.
- [ ] Strict explicit TypeScript types, clean modular OOP boundaries and no source comments.
- [ ] All tests in `tests/`; security, localization and coverage thresholds pass.
- [ ] README and all capitalized root documents match real, verified build/deployment behavior.
