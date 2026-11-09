# 0002: Clean architecture and pragmatic SOLID principles

Status: Accepted
Date: 2026-11-09

## Context and goal

KT-Sim needs independently verifiable probability calculations while its interface,
game-rule coverage, and optional integrations evolve. Coupling these concerns would
make correctness harder to test and threaten the standalone client required by
[ADR 0001](0001-browser-application-without-required-backend.md).

The current engine is independent of React; `App.tsx` combines presentation and
calculator orchestration. The next [roadmap deliverable](../roadmap.md#next-deliverable--compose-experiments)
introduces stage composition, with game behavior and backend enhancements arriving
later. Establish dependency rules now without building those future features.

## Decision

Use clean architecture to separate responsibilities and direct dependencies toward
stable calculation and domain contracts. Apply SOLID principles pragmatically in
TypeScript, using functions, modules, types, or standalone classes as appropriate.
Do not use class inheritance or abstract base classes. The project is small enough
to use composition and explicit contracts for reuse and variation; classes may
encapsulate behavior without extending other classes.

### Responsibilities and dependencies

- **Generic engine:** deterministic probability operations, exact fractions,
  explicit retained state, validation, and evaluation limits. `src/engine` must
  not depend on React, named game rules, application workflows, browser APIs,
  storage, or network access.
- **Game behavior and profile data:** translate explicitly versioned rules and
  profiles into generic engine operations. Keep executable rules and profile
  data separate. These modules may depend on the engine, but the engine must
  not depend on them or know their game-specific names.
- **Application workflows:** coordinate configuration, evaluation, queries, and
  optional saves or imports. Depend on engine/domain contracts and small
  interfaces for required external capabilities, not concrete transport or
  storage implementations. Keep workflows independent of React and browser APIs.
- **Presentation and adapters:** React owns interaction and rendering. Adapters
  handle browser storage, workers, file formats, and optional backend APIs.
  Translate and validate external data at their boundaries; keep domain validation
  authoritative inside the core. Presentation and adapters depend on the contracts
  they consume or implement; core modules must not import them.
- **Composition:** wire concrete dependencies at the application entry point or a
  small composition module. A worker host may also wire its own dependencies.
  Standalone use must work without a backend adapter or persisted state.

These are responsibility boundaries, not a mandate for one directory, package,
class, or interface per responsibility. Direct calls to pure engine functions
remain appropriate for simple UI flows. Extract reusable application orchestration
when it carries workflow policy or coordinates side effects; keep probability and
game-rule decisions out of React components. Avoid circular dependencies.

### SOLID in practice

- **Single responsibility:** give each module a cohesive purpose and reason to
  change. Separate calculation, workflow policy, data conversion, and rendering
  when they change for different reasons.
- **Open/closed:** use explicit stage, policy, and adapter contracts where a
  delivered feature needs variation. Add behavior through composition where it
  fits; revise contracts deliberately when requirements change. Do not invent a
  plugin system or extension points for hypothetical features.
- **Liskov substitution:** apply behavioral substitutability to functions and
  adapters implementing a shared contract, without inheritance. A replacement
  must accept every input allowed by the contract, preserve its output and state
  guarantees, and honor its documented error behavior. It must not strengthen
  preconditions or weaken postconditions. An evaluation adapter
  must preserve exact results, required dependencies, and explicit limit failures;
  it cannot silently return approximations or partial distributions. Model
  unsupported capabilities explicitly rather than pretending implementations are
  interchangeable.
- **Interface segregation:** define small contracts around consumer needs, such
  as loading a model or saving an experiment, instead of one universal backend
  interface. Do not force standalone workflows to supply irrelevant capabilities.
- **Dependency inversion:** define external capability contracts alongside the
  application workflows that need them. Inject implementations explicitly through
  function parameters or constructors. Avoid hidden global services and service
  locators; no dependency injection framework is required.

## Alternatives and tradeoffs

- Keeping workflow, rules, and integration logic in React components minimizes
  initial files but couples correctness to UI and infrastructure changes.
- A mandatory layered class hierarchy, repository for every value, or dependency
  injection framework would enforce structure at the cost of indirection and
  boilerplate unsupported by the current scope.
- Organizing only by technical layer or only by feature does not itself enforce
  dependency direction. Choose cohesive modules for the delivered slice and review
  their actual imports and contracts.

## Consequences and verification

Core behavior can be tested without rendering React, starting a backend, or using
browser storage. Optional integrations can evolve behind explicit contracts.
The cost is maintaining those contracts and boundary mappings; abstractions must
earn that cost through an actual dependency or variation.

Adopt incrementally: preserve the existing engine boundary; apply these rules to
stage composition as it is delivered; extract workflow policy from the UI when
that work requires it; add adapters only with their corresponding stories. This
ADR does not require a wholesale rewrite or claim these boundaries are fully
implemented. Propose larger refactorings separately with value and migration steps.

For each affected story, review the absence of class inheritance, import direction,
and ownership of validation,
state, and side effects. Test core behavior independently, using mathematical
examples or independent enumeration for probability changes. Test adapters against
their shared contracts, including failure paths and exact serialization where
relevant; verify standalone behavior when optional services are absent. Retain
meaningful UI integration tests and run the required code checks for executable
changes. Consider automated dependency checks if manual review becomes inadequate;
do not add tooling solely to satisfy this record.
