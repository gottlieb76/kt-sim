# Working on KT-Sim

## Product and development approach

- Build a quality decision tool through small, usable, independently verified
  deliverables. Read `docs/roadmap.md` and the relevant acceptance criteria in
  `docs/probability-lab-backlog.md` before feature work.
- Refine the next deliverable; keep later ideas provisional. Separate required
  behavior from future improvements rather than expanding a task indefinitely.
- Follow the Agile Manifesto: favor collaboration, working software, and responding
  to feedback. Deliver small increments of value with working software at each
  increment; keep process and documentation useful and lightweight.
- Organize goal-driven work as milestone > feature > story > task. A story is
  the smallest releasable increment of user value; tasks are implementation steps,
  not independent release commitments. Map existing deliverables into this
  hierarchy when refining them without silently rewriting the current backlog.
- Product managers define deliverables and value per story and prioritize work.
  Refine enough to implement the next story, then adapt using delivery feedback.
- State the user problem, intended behavior, acceptance criteria, and important
  assumptions before substantial implementation. Resolve routine details
  autonomously; ask about decisions that materially change scope or behavior.
- Deliver the smallest coherent change, follow existing conventions, and avoid
  speculative abstractions and unrelated refactoring.

## Architecture and correctness

- Engineers apply clean code and clean architecture principles pragmatically:
  clear names, cohesive responsibilities, explicit dependencies, and testable
  boundaries. Preserve behavior while refactoring; avoid speculative layers.
- Architects evaluate architectural health, challenge engineering decisions, and
  propose larger refactorings when boundaries or maintainability deteriorate.
  Make those proposals explicit, with value, tradeoffs, and a staged delivery plan;
  do not hide them in unrelated feature work.
- Architects design lightweight ADRs in `docs/adr/` for significant architectural
  decisions. Engineers consult accepted ADRs and flag conflicts before proceeding.
  Use the template there; distinguish proposals from accepted decisions and keep
  superseded decisions for context. Routine choices do not need an ADR.

- `src/engine` is deterministic TypeScript independent of React and named game
  rules. See `docs/probability-engine.md` for implemented contracts and limits.
- Keep exact, reduced bigint fractions throughout evaluation and comparison.
  Round only for display. Never silently approximate or return partial results.
- Preserve conditional dependencies and deliberately retain required state.
  Do not reconstruct histories discarded by aggregation or replace random
  upstream values with expectations.
- Validate configuration, state requirements, and evaluation limits explicitly;
  present actionable errors. Keep expensive evaluation from freezing the UI.
- Keep generic operations, future game-rule behavior, profile data, and UI
  separate. Record rules revision and data provenance when adding game content.
- Respect milestone boundaries: consult the roadmap rather than assuming future
  capabilities already exist. Unsupported behavior must be clear to users.
- For UI changes, check accessible labels, keyboard interaction, responsive
  presentation, and useful loading/error/empty states where applicable.

## Verification and delivery

- Use Node.js 24 and npm. Install with `npm ci`; start with `npm run dev`.
- For code changes run `npm run typecheck`, `npm run lint`, `npm test`, and
  `npm run build`. Report anything not run or failing accurately.
- Engineers work in TDD increments: write a meaningful failing test, confirm
  that it fails for the intended reason, make the smallest implementation pass,
  then refactor while tests stay green. Report evidence honestly; do not claim a
  red/green cycle when it was not observed. Apply this to executable behavior,
  not documentation-only changes.
- Testers challenge engineers' test definitions and assumptions, perform exploratory
  testing, and add BDD-style tests expressed as Given/When/Then scenarios tied to
  story acceptance criteria. Use the existing test stack unless a new tool has a
  demonstrated need; BDD does not require introducing a framework.
- A story is releasable when its value and acceptance criteria are demonstrated,
  relevant checks pass, independent testing covers material risks, architecture
  guidance is respected, and material security findings are addressed or explicitly
  recorded for a maintainer decision. Report gaps rather than claiming completion.
- Test externally meaningful behavior and regressions. For probability changes,
  use independent small-case enumeration or known mathematical examples alongside
  mass conservation, nonnegative probabilities, and applicable count invariants.
  Include boundaries, invalid inputs, and limit failures relevant to the change.
- Do not use the production algorithm as its own reference oracle. Prefer
  deterministic tests; add regression cases for confirmed defects.
- Inspect rendered UI when changing interaction or layout if browser tooling is
  available; disclose when visual validation was unavailable.
- Documentation-only changes need link/content checks, not the full app suite.
- Update affected documentation and roadmap status when behavior is delivered.
  Summarize what changed, evidence of correctness, and remaining limitations.
- Preserve unrelated work. Do not commit, push, publish, or contact others unless
  the user requests it. Keep shared instructions free of secrets and local paths.

## Specialist collaboration

Custom agents live in `.codex/agents/`. They inherit the selected model and
reasoning settings so contributors can use their own available models.

Interpret role shorthand case-insensitively: `PM` means Product Manager
(`product_manager`), and `Security` means Security Engineer (`security_engineer`).
These are conversational aliases for the existing agents, not separate roles.

- `product_manager`: define deliverables, story value, priorities, and acceptance criteria.
- `architect`: challenge designs, assess architectural health, propose refactorings,
  and design lightweight ADRs.
- `engineer`: implement releasable stories in TDD increments with clean code and architecture.
- `tester`: challenge TDD assumptions, explore behavior, and add BDD-style tests.
- `security_engineer`: evaluate security gaps affecting correctness and integrity,
  including input boundaries, resource exhaustion, dependencies, and build tooling.

Use specialists where they add value: product refinement for unclear scope,
architecture review for changed engine contracts, and independent tester review
for nontrivial behavior changes, especially probability math. Include security
review when inputs, dependencies, imports, execution, storage, or deployment change.
Review architectural health periodically as features accumulate. Skip delegation for
trivial edits. Give each agent a concrete question and relevant context; do not
require every role for every task or let delegated agents recursively build teams.
Keep write ownership explicit and avoid concurrent edits to the same files.
The primary agent integrates findings, resolves disagreements using evidence,
and remains responsible for completion. Review-only role instructions are
behavioral boundaries, not separate permission sandboxes.

Example requests:

- "Have PM refine the next deliverable into acceptance criteria."
- "Have architect review these stage contracts before implementation."
- "Have engineer implement this story with TDD, then tester explore it and add BDD tests."
- "Have Security review the new input boundary and integrity risks."

## Code Review Rules

Prioritize incorrect probabilities, lost dependencies, invalid state transitions,
behavior regressions, unsupported claims, and missing meaningful verification.
Report concrete findings with file references, impact, and reproduction evidence.
Distinguish confirmed defects from risks and avoid style-only review noise.
