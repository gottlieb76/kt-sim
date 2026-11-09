# KT-Sim — from probability engine to decision tool

This is the living roadmap. Milestones describe usable outcomes; deliverables
are smaller stopping points. Linked issues are evolving ideas, not a fixed
delivery contract. No dates are committed. GitHub tracking issues represent
milestones because the connected tooling cannot create native milestones.

## Current state

The app has an exact D6 calculator with a fixed roll/classify/reroll sequence
and stage inspection. The low-level tree supports typed state transitions and
retained paths; the pool calculator aggregates counts and discards individual
histories. Original eligible miss counts are retained to prevent rerolling replacements.
A bounded, immutable complete-history stage API now separates rolling, selection,
rerolling, classification, and assignment. Calculator orchestration is independent
of React and the workbench handles evaluation errors. These foundations partially
implement Compose experiments; the workbench still uses the reduced fixed pipeline,
and the deliverable is not yet complete. See the
[engine documentation](probability-engine.md) for implemented behavior.

## Milestone 1 — Probability Lab: the base engine

[Tracking issue #14](https://github.com/gottlieb76/kt-sim/issues/14).

**Outcome:** define, evaluate, explain, and compare generic dice experiments
through a typed TypeScript API and a minimal inspection workbench. Start with
D6; keep the engine extensible to other dice. No named game-rule linkage.

| Deliverable | Capability | Ideas | Status |
| --- | --- | --- | --- |
| Compose experiments | Define named stages, inputs, and retained state in code; inspect each stage | [#4](https://github.com/gottlieb76/kt-sim/issues/4), [#5](https://github.com/gottlieb76/kt-sim/issues/5) | Next |
| Chain dependent pools | Use earlier counts to determine later dice: hits → wounds → saves, including zero dice | [#18](https://github.com/gottlieb76/kt-sim/issues/18) | Planned |
| Resolve interacting pools | Combine opposing pools with explicit cancellation, matching, and decision policies | [#8](https://github.com/gottlieb76/kt-sim/issues/8) | Planned |
| Ask and explain | Query outcomes, inspect summaries, and explore bounded contributing paths | [#1](https://github.com/gottlieb76/kt-sim/issues/1), [#3](https://github.com/gottlieb76/kt-sim/issues/3), [#6](https://github.com/gottlieb76/kt-sim/issues/6) | Planned |
| Compare and discover | Compare experiments, input sensitivity, and reroll policies against explicit objectives | [#2](https://github.com/gottlieb76/kt-sim/issues/2), [#7](https://github.com/gottlieb76/kt-sim/issues/7), [#19](https://github.com/gottlieb76/kt-sim/issues/19) | Planned |

Stages consume explicit data and configured operations. “Hit”, “wound”, and
“save” are labels, not automatic rules. A threshold changing from 4+ to 3+
must expose the actual change, classification, and bounds. Independent pools
differ from pools sharing upstream random state: retain dependencies rather
than multiplying their marginal distributions.

### Next deliverable — Compose experiments

1. Define stage contracts in the React-independent engine (#4): input/output
   types, required and retained information, configuration validation, exact
   evaluation, and explicit limits. Document face information, reroll eligibility,
   and aggregation information loss. Catch incompatible types in the API and
   invalid configurations before evaluation.
2. Compose the existing calculator example through the API (#5), preserving its
   exact distributions and configuration behavior. Code defines and reorders
   stages; the workbench displays names, stage selection, results, and actionable
   errors. Preserve the existing 1–12 dice calculator; a bounded complete-history
   example may initially coexist with its reduced evaluation. Full visual chain
   editing and browser-provided scripts are deferred.
3. Document a complete experiment and small extension. Describe how dependent
   pools and resolution fit the contracts without implementing every future
   operation in this first deliverable.
4. Verify against the existing calculator and independent small-case enumeration.
   Test retained state, a meaningful stage-order difference, invalid connections,
   invalid configuration, and explicit limit failures. Run typecheck, lint,
   tests, and build; add mathematical verification (#12) alongside this work.

**Done:** a developer can define and extend a named experiment in TypeScript
and inspect its exact stage results. Dependent pools, opposing resolution, and
deep path explanations are subsequent deliverables.

**Refinement status:** #4 defines the next engine/API story, including named-stage
results, validation timing, retention boundaries, examples, and explicit limits.
Reuse the implemented immutable operations rather than treating them as missing.
#5 is adjusted for these contracts but awaits detailed refinement of its example,
UI flow, supported configurations, and execution approach. Full-history evaluation
cannot support seven initial D6s under current operation limits; rerolls can hit
the tree limit sooner. Do not regress calculator support or silently change retention
strategies. Assess responsiveness before exposing costly experiments (#11).

### Milestone completion examples

- A hit → wound → save chain derives later pool sizes from each branch,
  including zero-result branches.
- Two opposing pools interact through explicit resolution and decision policies.
- Baseline and modified experiments show intermediate and final differences
  in expected counts and query probabilities.
- Explanations distinguish aggregated states from retained paths and account
  exactly for selected outcomes within documented tracing limits.

## Milestone 2 — First useful Kill Team support

[Tracking issue #15](https://github.com/gottlieb76/kt-sim/issues/15). Planned.

**Outcome:** a small, independently verified set of real KT matchups provides
practical value with explicit coverage boundaries.

- Select and document the rules revision and a basic combat slice.
- Start with one or two named rules ([#9](https://github.com/gottlieb76/kt-sim/issues/9));
  add required rules as separate bounded issues.
- Start with selected operatives and weapons ([#10](https://github.com/gottlieb76/kt-sim/issues/10));
  deliver a second team through a separately bounded batch. Select teams during refinement.
- Translate profiles and rules into generic engine operations. Keep profile data,
  executable rule behavior, and React separate; record data provenance and revision.
- Provide a guided matchup interface with useful queries and comparisons.
  Identify unsupported rules and interactions in the interface and documentation.

Refine these deliverables after the base engine provides their required operations.
Complete when supported matchups provide useful, independently verified results.

## Milestone candidates 3 and 4 — coverage and scenarios

### KT completeness

[Tracking issue #16](https://github.com/gottlieb76/kt-sim/issues/16). Discovery.

Comprehensive support for a chosen rules revision, measured through a coverage
inventory of teams, profiles, rules, and interactions. Add external list ingestion
through adapters into an internal roster representation. Choose actual sources
and formats during refinement; validate imported content and identify unresolved
or unsupported entries. Roster ingestion is distinct from generic experiment
export/import.

### Multi-step scenarios

[Tracking issue #17](https://github.com/gottlieb76/kt-sim/issues/17). Discovery.

Compare plans across multiple actions or turns by carrying encounter state
forward and branching on outcomes. Make available decisions, policies, and
objectives explicit. Begin with bounded encounters using supported rules and
profiles. Board geometry, movement, and full-game simulation are separate ideas.

**Ordering is provisional:** after Milestone 2, assess whether broader coverage
or a narrow scenario experience offers more value. Scenarios can start before
KT coverage is complete. “All rules” must be measured against a specific revision.

## Engineering and validation

- [#12](https://github.com/gottlieb76/kt-sim/issues/12): grow independent mathematical
  verification and CI alongside every capability. Check total probability,
  nonnegative probabilities, applicable count invariants, and independent examples.
- [#11](https://github.com/gottlieb76/kt-sim/issues/11): benchmark dependent and opposing
  pools; establish time, memory, and expansion limits. Add worker execution,
  cancellation, exact serialization, and stale-result protection before costly
  experiments reach the workbench. Never silently approximate or show partial results.
- [#13](https://github.com/gottlieb76/kt-sim/issues/13): offline use is independently
  scheduled and does not gate Milestone 1.

As capabilities arrive, validate dependent pool sizes, zero branches, shared
dependencies, stage ordering, impossible/certain queries, exact comparison
differences, strategy ties, and trace contribution totals.

## Maintaining the roadmap

Refine only the next deliverable into implementation-ready tasks. After each
delivery, update statuses and completion examples, capture discoveries as linked
issues, and reconsider the remaining sequence. Distinguish first-release
requirements from later improvements; split new work instead of continually
enlarging existing issues. Detailed acceptance criteria live in the
[linked backlog](probability-lab-backlog.md) and GitHub issues.

Defaults: exact arithmetic, D6 first, code-first construction, and no named
game-rule linkage in Milestone 1. Generic save/share and export/import remain
deferred. Later milestones retain decisions for future refinement.
