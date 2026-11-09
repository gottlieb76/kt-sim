# Linked backlog

See the [living roadmap](roadmap.md) for milestone outcomes, delivery order,
status, and completion examples. The issues below are evolving idea seeds.
Only Compose experiments (#4 and #5) is refined as the next deliverable.
All original acceptance criteria are retained or explicitly revised for the
code-first direction. Offline use is independently scheduled.

## M1 / Ask and explain — Ask probability questions

GitHub: [#1](https://github.com/gottlieb76/kt-sim/issues/1)

Part of Milestone 1 — Probability Lab: the base engine (#14).

Let users ask exactly N, at least N, or at most N successes, ordinary hits,
crits, or misses, and combine count conditions with AND.

Acceptance criteria:

- [ ] Show exact fractions and rounded percentages for each query at the selected stage.
- [ ] Explain that successes include ordinary hits and crits.
- [ ] Handle impossible and certain events as 0% and 100%.
- [ ] Test boundary conditions and combined conditions against enumerated outcomes.

Roadmap: `docs/roadmap.md`. D6 first; exact arithmetic. Generic experiment export/import and save/share remain deferred.

## M1 / Compare and discover — Compare a baseline and variant

GitHub: [#2](https://github.com/gottlieb76/kt-sim/issues/2)

Part of Milestone 1 — Probability Lab: the base engine (#14).

Compare two independently configurable setups and a shared probability question.

Acceptance criteria:

- [ ] Show expected counts and query probabilities side by side.
- [ ] Show absolute probability differences in percentage points.
- [ ] Support copying the baseline into the variant and swapping setups.
- [ ] Identical setups produce zero differences; all differences use exact arithmetic.

Roadmap: `docs/roadmap.md`. D6 first; exact arithmetic. Generic experiment export/import and save/share remain deferred.

## M1 / Ask and explain — Explain an outcome's contributing paths

GitHub: [#3](https://github.com/gottlieb76/kt-sim/issues/3)

Part of Milestone 1 — Probability Lab: the base engine (#14).

Show why an outcome has its calculated probability, including original rolls,
reroll decisions, and conditional probabilities.

Acceptance criteria:

- [ ] Select an outcome or query and inspect its contributing probability mass.
- [ ] Distinguish aggregated states from individual paths; do not invent discarded history.
- [ ] Show conditional and cumulative probabilities for supported traced examples.
- [ ] Bound trace expansion and explain limits without freezing the page.
- [ ] Verify displayed contributions sum exactly to the selected result.

Roadmap: `docs/roadmap.md`. D6 first; exact arithmetic. Generic experiment export/import and save/share remain deferred.

## Next / Compose experiments — Define stage and extension contracts

GitHub: [#4](https://github.com/gottlieb76/kt-sim/issues/4)

Part of Milestone 1 — Probability Lab: the base engine (#14).

Specify the typed TypeScript contracts for named stages, input requirements, retained state, and inspectable results. Keep the implementation in src/engine independent of React and named game rules.

Acceptance criteria:
- [ ] Describe contracts for roll, classify, reroll, transform, resolve, and query stages; implement the composition foundation without implementing every future operation.
- [ ] Make face-level information, original-versus-rerolled dice, and aggregation information loss explicit.
- [ ] Catch incompatible state types through the typed API; reject invalid configuration and unmet information requirements before evaluation.
- [ ] Retain upstream values deliberately; distinguish conditional dependent pools from independent pool combinations.
- [ ] Use exact fractions and explicit evaluation limits; report failures without partial or approximate distributions.
- [ ] Document how dependent-pool and resolution extensions can use the contract.
- [ ] Provide a small deterministic extension and contract tests; do not execute arbitrary browser-provided scripts.

Implementation progress (tech debt #20): the bounded complete-history API now
provides immutable die snapshots and separate roll/select/reroll/classify/assign
operations, typed state requirements, explicit limits, and independent examples.
The reduced calculator remains a separate representation; general experiment
orchestration and workbench integration are still pending. These partial foundations
do not mark the complete acceptance criteria as delivered.

Next deliverable: Compose experiments. Implement before #5; add independent small-case verification from #12 alongside it. Preserve the existing calculator behavior during migration.

Roadmap: `docs/roadmap.md`. D6 first; exact arithmetic. Generic experiment export/import and save/share remain deferred.

## Next / Compose experiments — Compose code-first experiments and inspect stages

GitHub: [#5](https://github.com/gottlieb76/kt-sim/issues/5)

Part of Milestone 1 — Probability Lab: the base engine (#14).

Depends on #4. Next deliverable: Compose experiments.

Replace the fixed calculator pipeline with a code-defined experiment using a typed TypeScript API. Keep the workbench minimal; a full visual chain editor is deferred.

Acceptance criteria:
- [ ] Define named stages, their input requirements, and retained state in TypeScript; allow composition and supported reordering in code.
- [ ] Reproduce the current roll/classify/reroll example with identical exact distributions and existing configuration behavior.
- [ ] Expose stage names, exact distributions, and stage selection in the workbench.
- [ ] Show actionable invalid-configuration and evaluation-limit errors without misleading partial results.
- [ ] Document a complete small experiment and an extension example; no named game-rule linkage or arbitrary user script execution.
- [ ] Verify a case where stage order changes the result, invalid connections, retained state, and unchanged calculator results.
- [ ] Run typecheck, lint, tests, and build.

Dependent pool construction (#18), opposing resolution (#8), deep explanations (#3), and a richer visual builder are subsequent deliverables.

Roadmap: `docs/roadmap.md`. D6 first; exact arithmetic. Generic experiment export/import and save/share remain deferred.

## M1 / Ask and explain — Expand statistical summaries

GitHub: [#6](https://github.com/gottlieb76/kt-sim/issues/6)

Part of Milestone 1 — Probability Lab: the base engine (#14).

Make the calculation easier to validate through visible statistical summaries.

Acceptance criteria:

- [ ] Show expected hits, crits, misses, and successes.
- [ ] Provide variance and cumulative probabilities for a selected count.
- [ ] Distinguish expected counts from event probabilities.
- [ ] Derive summaries from the exact distribution and test against known examples.

Roadmap: `docs/roadmap.md`. D6 first; exact arithmetic. Generic experiment export/import and save/share remain deferred.

## M1 / Compare and discover — Compare reroll strategies against an objective

GitHub: [#7](https://github.com/gottlieb76/kt-sim/issues/7)

Part of Milestone 1 — Probability Lab: the base engine (#14).

Acceptance criteria:

- [ ] Compare existing policies against maximizing expected successes or expected crits.
- [ ] State the objective, legal choices, shared budget, and once-per-die constraint.
- [ ] Report ties and distinguish an optimal strategy from a fixed heuristic.
- [ ] Check small cases by exhaustive decision enumeration.

Roadmap: `docs/roadmap.md`. D6 first; exact arithmetic. Generic experiment export/import and save/share remain deferred.

## M1 / Resolve interacting pools — Resolve interacting pools

GitHub: [#8](https://github.com/gottlieb76/kt-sim/issues/8)

Part of Milestone 1 — Probability Lab: the base engine (#14).

Depends on: [Define stage and extension contracts](https://github.com/gottlieb76/kt-sim/issues/4).

Acceptance criteria:

- [ ] Combine independent pools with explicit resolution operations such as configured cancellation or matching; labels carry no automatic game semantics.
- [ ] Preserve shared dependencies when combining pools derived from the same upstream branch; do not assume their marginals are independent.
- [ ] Retain ordinary and critical outcomes where resolution needs them.
- [ ] Represent player decisions as an explicit policy rather than silently assuming one.
- [ ] Show final distributions and preserve total probability.
- [ ] Validate small cases with independently calculated examples.

Roadmap: `docs/roadmap.md`. D6 first; exact arithmetic. Generic experiment export/import and save/share remain deferred.

## M2 / First rules — Implement the first one or two Kill Team rules

GitHub: [#9](https://github.com/gottlieb76/kt-sim/issues/9)

Part of Milestone 2 — First useful Kill Team support (#15).

Depends on: [Resolve interacting pools](https://github.com/gottlieb76/kt-sim/issues/8); [Define stage and extension contracts](https://github.com/gottlieb76/kt-sim/issues/4).

Acceptance criteria:

- [ ] Confirm the target edition/revision and select one or two named rules before implementation.
- [ ] Document each selected rule's behavior and its place in the calculation chain.
- [ ] Implement only those selected rules, with independently checked regression examples.
- [ ] Identify unsupported rules and interactions in the interface and documentation.
- [ ] Track subsequent rules as separate, similarly bounded issues rather than expanding this issue.

Roadmap: `docs/roadmap.md`. D6 first; exact arithmetic. Generic experiment export/import and save/share remain deferred.

## M2 / Initial profiles — Add the first Kill Team operative and weapon profiles

GitHub: [#10](https://github.com/gottlieb76/kt-sim/issues/10)

Part of Milestone 2 — First useful Kill Team support (#15).

Depends on: [Implement the first one or two Kill Team rules](https://github.com/gottlieb76/kt-sim/issues/9).

Acceptance criteria:

- [ ] Select the first team and a small set of operatives/weapons before implementation; deliver a second team through a separately bounded batch for Milestone 2.
- [ ] Keep profile data separate from executable rule behavior and the React interface.
- [ ] Allow selecting the supported profiles to populate calculator inputs.
- [ ] Make unsupported profile rules explicit; do not silently present incomplete results as full combat resolution.
- [ ] Record data sources and rules revision, keeping third-party content provenance and licensing distinct from the project's MIT code.
- [ ] Track further teams and profile batches separately.

Roadmap: `docs/roadmap.md`. D6 first; exact arithmetic. Generic experiment export/import and save/share remain deferred.

## M1 / Engineering — Engineering: Keep exact evaluation responsive

GitHub: [#11](https://github.com/gottlieb76/kt-sim/issues/11)

Part of Milestone 1 — Probability Lab: the base engine (#14).

Acceptance criteria:

- [ ] Benchmark representative and worst-supported experiments, including dependent and opposing pools.
- [ ] Establish limits for time, memory, and state expansion; introduce worker execution and cancellation before costly experiments reach the workbench.
- [ ] Move expensive evaluation off the UI thread with cancellation and stale-result protection.
- [ ] Preserve exact results through worker serialization.
- [ ] Never silently substitute approximate results or return incomplete distributions.

Roadmap: `docs/roadmap.md`. D6 first; exact arithmetic. Generic experiment export/import and save/share remain deferred.

## M1 / Engineering — Engineering: Add independent mathematical verification

GitHub: [#12](https://github.com/gottlieb76/kt-sim/issues/12)

Part of Milestone 1 — Probability Lab: the base engine (#14).

Acceptance criteria:

- [ ] Compare aggregated evaluation against a separate brute-force reference for small cases.
- [ ] Check mass conservation, nonnegative probabilities, and conserved dice counts.
- [ ] Cover threshold extremes, reroll budgets, category overlap, and stage-order cases, branch-dependent pool sizes, zero-result branches, and shared dependencies when combining pools.
- [ ] Use deterministic generated cases and retain regression cases for discovered defects.
- [ ] Run the verification suite in GitHub Actions with type checking, lint, and build.

Roadmap: `docs/roadmap.md`. D6 first; exact arithmetic. Generic experiment export/import and save/share remain deferred.

## Independent / Offline usability — Engineering: Add offline application caching

GitHub: [#13](https://github.com/gottlieb76/kt-sim/issues/13)

Independently scheduled usability idea. Related to #14; not a Milestone 1 completion requirement.

Acceptance criteria:

- [ ] After one successful online load, reopen and use the lab without a network connection.
- [ ] Cache required application assets and bundled data without external runtime dependencies.
- [ ] Handle application updates without combining incompatible asset versions.
- [ ] Avoid clearing existing browser data during application updates.
- [ ] Verify offline reload and recovery after reconnecting.

Roadmap: `docs/roadmap.md`. D6 first; exact arithmetic. Generic experiment export/import and save/share remain deferred.

## M1 / Chain dependent pools — Chain dependent dice pools

GitHub: [#18](https://github.com/gottlieb76/kt-sim/issues/18)

Part of Probability Lab milestone #14. Depends on #4 and #5.

Use a branch's earlier outcome to determine later pool sizes: hit → wound → save. Names carry no automatic game semantics.

Acceptance criteria:
- [ ] Select a retained upstream count as a later pool's dice count, with documented bounds.
- [ ] Treat zero dice as a certain empty result and continue the chain.
- [ ] Preserve branch dependencies; do not replace a random pool size with its expectation or multiply unrelated marginals.
- [ ] Inspect exact distributions at each stage.
- [ ] Verify small chains against independent enumeration, including zero and maximum counts, and conserve total probability.

Idea seed: refine implementation after Compose experiments.

## M1 / Compare and discover — Explain sensitivity to experiment inputs

GitHub: [#19](https://github.com/gottlieb76/kt-sim/issues/19)

Part of Probability Lab milestone #14. Builds on #2 and #6.

Show what changing one raw input does to intermediate and final results—for example, a hit threshold changing from 4+ to 3+.

Acceptance criteria:
- [ ] Show the baseline, changed input, and configured bounds explicitly.
- [ ] Compare exact expected counts and event probabilities at corresponding stages and the final outcome.
- [ ] Display probability differences in percentage points.
- [ ] Keep crit classification and other inputs explicit; do not infer named game-rule behavior from '+1 to hit'.
- [ ] Test unchanged inputs, threshold boundaries, and a dependent chain where a change propagates to later rolls.

Idea seed: refine implementation after baseline comparison.
