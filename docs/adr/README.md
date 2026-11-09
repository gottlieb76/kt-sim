# Architecture decision records

Keep architectural decisions lightweight and close to the code. Architects draft
and maintain ADRs; engineers consult accepted decisions during implementation.
Record significant boundaries, contracts, or tradeoffs, not every coding choice.

Copy [template.md](template.md) to `NNNN-short-title.md` using the next available
number. Start as Proposed. Mark Accepted only after an explicit maintainer decision
or an architectural choice already authorized by the task; ask when unclear.
Preserve superseded records and link their replacements. The template is not a
decision.

## Decisions

- [0001: Browser application without a required backend](0001-browser-application-without-required-backend.md) — Accepted.
- [0002: Clean architecture and pragmatic SOLID principles](0002-clean-architecture-and-solid-principles.md) — Accepted.
- [0003: Exact, deterministic probability evaluation](0003-exact-deterministic-probability-evaluation.md) — Accepted.
- [0004: Immutable state and single-purpose stages](0004-immutable-state-and-single-purpose-stages.md) — Accepted.

Capture enough context for someone to understand the decision, alternatives,
consequences, and how it will be validated. Larger refactorings should describe
incremental migration so each delivered story leaves working software.
