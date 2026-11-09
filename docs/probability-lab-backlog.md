# Linked backlog

See the [living roadmap](roadmap.md) for milestone outcomes, delivery order,
status, and completion examples. The issues below are evolving idea seeds.
Compose experiments is the next deliverable: #4 is refined for implementation;
#5 reflects its integration constraints and awaits detailed refinement.
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

Part of **Milestone 1 — Probability Lab (#14) → Compose experiments**. Prerequisite to workbench integration in #5.

### User problem and value

A developer can use individual immutable dice operations today, but there is no documented experiment-level contract for composing named stages, checking their requirements, and obtaining inspectable intermediate results. The workbench still uses a separate fixed calculator.

**Story:** As a developer, I can define and extend a bounded, named D6 experiment in TypeScript, validate its supported connections and configuration, and evaluate exact intermediate results without depending on React.

This story delivers the engine/API increment. #5 delivers its workbench integration.

### Existing foundation — reuse and verify

#20 / PR #21 supplied typed immutable complete-history snapshots, stable die identity and roll/interpretation provenance, separate roll/select/reroll/classify/assign operations, recorded branch-specific selections, once-per-die validation, operation/tree limits, independent examples, and calculator/application separation. These are implemented foundations, not a claim that this story's remaining acceptance criteria are complete.

The reduced calculator deliberately discards die histories and supports 1–12 dice. The complete-history API has a 100,000-alternative per-operation limit and a separate active-branch limit; even seven initial D6s exceed the operation limit, and rerolls can exhaust the tree limit sooner.

### Required behavior and acceptance criteria

- [ ] **Define and compose:** A complete public TypeScript example defines an initial state and ordered named stages with explicit input/output types and information requirements. Supported reordering is expressed in code. Reuse existing primitives where sufficient; no new graph language or plugin framework is required.
- [ ] **Validate:** Incompatible state connections fail in compile-time contract tests. Statically knowable configuration and information errors are rejected before branch expansion; conditions dependent on a branch are checked during evaluation. Errors identify the failing stage, reason, and a useful correction.
- [ ] **Inspect:** Evaluation exposes each named stage's exact result through a documented React-independent result contract suitable for #5. It distinguishes retained branch state from grouped distribution views. Grouping for inspection does not discard state needed by later stages. If a later stage fails, the evaluation reports failure and does not present earlier results as a completed experiment.
- [ ] **Preserve state:** Built-in operations and the documented extension preserve immutable prior snapshots, stable identity, ordered provenance, explicit choices, and upstream values required later. Rerolling invalidates current classification; consumers requiring classifications reject stale or missing interpretations. Reduced count states are rejected by operations requiring discarded facts.
- [ ] **Stay exact and bounded:** Successful evaluation uses reduced bigint fractions, nonnegative normalized conditional distributions, and explicit operation and whole-experiment branch limits. Document how limits compose and exercise both failure paths. Never truncate, approximate, or silently change retention/evaluation strategy.
- [ ] **Demonstrate extension and order:** Document and test one complete small experiment and one deterministic developer-defined extension. A known small case demonstrates a meaningful stage-order difference with independently established expected probabilities. Trusted callbacks must be deterministic and respect the immutable state contract.
- [ ] **Explain future compatibility:** Document how roll, select, reroll, classify, transform/assign, resolve, and query responsibilities fit the contract. Describe how #18 would consume a retained branch-specific count, including zero, and how #8 would preserve joint upstream state and explicit decision policies. Distinguish independent inputs from shared dependencies. Dependent-pool and resolution implementations are not required here.
- [ ] **Preserve the calculator boundary:** Keep the existing 1–12 dice calculator and its exact supported configuration behavior. Document reduced versus complete-history capabilities and limits; neither representation claims information it discarded. #5 may initially integrate a bounded composed example alongside the calculator.
- [ ] **Verify and document:** Cover invalid configuration/connections, retained state, immutable successors, stage ordering, and operation/tree limit failures. Use independent small-case enumeration or known mathematical examples alongside mass conservation, nonnegative probabilities, and applicable count invariants; production evaluation is not its own oracle. Run typecheck, lint, tests, and build. Update engine documentation and roadmap progress accurately.

### Implementation tasks within this story

These are implementation tasks under this deliverable, not separate releasable stories. Each task is attached as a native GitHub sub-issue of this story. The checklist below also records the implementation order.

- [ ] #22 — Map acceptance gaps and review the experiment contract (engineer + architect).
- [ ] #23 — Implement typed composition and inspectable stage results (engineer).
- [ ] #24 — Enforce stage validation and exact limits; review changed boundaries (engineer + security).
- [ ] #25 — Add runnable examples and independent mathematical verification (engineer).
- [ ] #26 — Document contracts and assemble delivery verification evidence (engineer).
- [ ] #27 — Independently evaluate the delivered story before final acceptance (tester).

Order: #22 first; #23 and #24 follow its reviewed contract and coordinate shared files; #25 follows the implementation; #26 prepares the delivery evidence; #27 evaluates the delivered revision and verifies fixes. Tester planning may start earlier. Final story acceptance requires #27's evaluation and disposition of its material findings, not merely completion of engineering tasks.

Follow accepted ADRs 0001–0004. A larger architectural change needs an explicit proposal rather than being hidden in this story.

### Scope boundaries and completion

D6 first; generic engine code in `src/engine`, independent of React and named game rules. No workbench changes, full visual editor, browser-provided scripts, workers/cancellation (#11), new optimized evaluator, arbitrary serialization/import, named rules, deep explanation UI (#3), dependent pools (#18), or opposing resolution (#8).

Complete when a developer can run the documented experiment and extension, inspect exact named-stage results, and observe clear invalid/oversized evaluation failures with the criteria above demonstrated. Existing foundations alone do not close this issue. Add capability-specific verification from #12 alongside delivery; the whole of #12 is not a prerequisite.

Roadmap: `docs/roadmap.md`. Detailed backlog: `docs/probability-lab-backlog.md`. #5 remains subject to its own refinement.

## Next / Compose experiments — Compose code-first experiments and inspect stages

GitHub: [#5](https://github.com/gottlieb76/kt-sim/issues/5)

Part of Milestone 1 — Probability Lab: the base engine (#14).

Depends on #4. Next deliverable: Compose experiments.

Use the experiment and stage-result contracts delivered by #4 to inspect a code-defined experiment in a minimal workbench. Preserve the existing calculator's 1–12 D6 support and configuration behavior. A bounded complete-history example may initially coexist with the efficient reduced calculator; replacing the calculator with full-history enumeration is not required.

### Impact of #4 refinement — provisional

#4 owns the engine/API composition, validation, retention, and stage-result contracts. This story owns their workbench integration. Reduced distributions and complete histories have different capabilities and limits; the UI must make the selected example's supported behavior clear and must not imply that discarded histories are available.

The current complete-history operation limit cannot accommodate seven initial D6s, and rerolls can reach the tree limit sooner. Do not reduce existing calculator support or silently switch evaluation/retention strategies to satisfy this story.

Detailed refinement remains open: select the bounded example, UI flow, supported configuration envelope, and execution approach after #4's contracts are demonstrated. Assess responsiveness and bring in the needed portion of #11 before exposing costly evaluation. A full visual chain editor remains deferred.

Acceptance criteria (carry forward for later refinement):
- [ ] Integrate #4's named stages, input requirements, and retained state; allow composition and supported reordering in developer code.
- [ ] Reproduce the current roll/classify/reroll example with identical exact distributions and existing configuration behavior; retain the existing 1–12 dice calculator, with coexistence permitted.
- [ ] Expose stage names, exact distributions, and stage selection in the workbench; distinguish reduced results from retained histories and identify supported limits.
- [ ] Show actionable invalid-configuration and evaluation-limit errors without misleading partial or stale results.
- [ ] Document the runnable workbench example using #4's complete experiment and extension documentation; no named game-rule linkage or arbitrary user script execution.
- [ ] Verify integration of stage ordering, invalid connections, retained state, and unchanged calculator results, reusing #4's engine evidence and adding UI-specific coverage.
- [ ] Check accessible labels, keyboard use, responsive presentation, and useful error/loading/empty states where applicable; inspect rendered UI when tooling is available.
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
