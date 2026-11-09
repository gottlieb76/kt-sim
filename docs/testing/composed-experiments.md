# Composed experiment acceptance tests

Parent: [Define stage and extension contracts](https://github.com/gottlieb76/kt-sim/issues/4).
Independent final evaluation remains [task #27](https://github.com/gottlieb76/kt-sim/issues/27).

The tester-owned executable suites live in `src/acceptance/`:

- [Composed experiments](../../src/acceptance/composed-experiments.test.ts)
- [Experiment validation](../../src/acceptance/experiment-validation.test.ts)
- [Calculator compatibility](../../src/acceptance/calculator-compatibility.test.ts)

Shared fixtures and assertion helpers live in `src/acceptance/support/`.
The suites use Vitest and public engine primitives, without a substitute evaluator,
mocked results, skipped tests, or expected-failure markers.

## Running and initial evidence

Before creating the test file, the working branch was changed from `trunk` to
`story/4-stage-extension-contracts`. Existing uncommitted roadmap/backlog work was
preserved. No production code was changed.

```sh
npm test -- src/acceptance
```

Initial result on Node 24.22.2: **7 failed, 7 passed**. These are observed assertion
failures, not import or compilation failures:

- Three inspection scenarios fail because the proposed public named-stage result
  accessor is absent.
- A configured seven-D6 roll does not reject its statically knowable expansion
  limit until the operation executes.
- Invalid thresholds, tree-limit overflow, and an invalid selected target fail
  without the stage context required by the story.

The full `npm test` result is **7 failed, 43 passed**, including all 36 existing
tests passing. `npm run typecheck`, `npm run lint`, and `npm run build` pass.
This records the red phase only; no green implementation cycle is claimed.

## Acceptance coverage

| Story criterion | Executable evidence |
| --- | --- |
| Define and compose | Named roll/select/replace/classify experiment; developer-defined deterministic assignment extension; supported reordering |
| Validate | Compile-time incompatible assignment/reroll connections; invalid configuration; branch-specific missing target; stale classification; invalid conditional weights |
| Inspect | Ordered named stage distributions; exact intermediate mass and final success probability; grouping retains distinct `1,2` and `2,1` histories |
| Preserve state | Earlier named snapshots, die identity, ordered original/replacement rolls, historical interpretation, invalidated current classification, nested immutability |
| Stay exact and bounded | Reduced fractions, mass, nonnegative weights, count invariants, statically oversized operation, active-tree limit failure without a completed result |
| Demonstrate extension and order | Assignment then reclassification changes success probability from `0` to `1/2`, while the previous snapshot stays unchanged |
| Preserve calculator boundary | Every supported pool size 1–12; independent all-success probabilities; corrected two-die non-crits regression `169/324`; rejection of reduced input by history operations |
| Verify independently | Separate 36-pair original/spare enumeration for rerolling only twos; elementary binomial and independent-die calculations |

## Contract review and final acceptance gaps

Task #22 has not yet settled the inspection API. The test's `inspect` accessor
proposes `tree.stages` with named distributions as a minimal observable surface.
This is a reviewable API assumption, not an architectural decision that the story
requires changing `ProbabilityTree`. Adapt the accessor and call sites to the
reviewed API, preserving scenario outcomes. Never reconstruct stage results in
the test accessor to make the tests pass. Existing compile-time tests must also
be extended to any separate public composition API introduced by #23.

The early oversized-roll test currently checks the operation factory because its
count, sides, and limit are known there. If the reviewed API uses a separate
preflight phase, move that assertion to preflight and verify that no earlier
stage executes. Preserve the before-expansion requirement.

Inspection scenarios currently stop at the missing-accessor assertion. Their
later probability, retention, and immutability assertions have not yet executed;
they require review and rerunning once the contract is implemented. The current
failure tests cover throwing public primitives; evaluate any future structured
experiment failure result to ensure it cannot advertise partial completion.

Documentation completeness, future-extension guidance for #18/#8, architecture
and applicable security review, and final independent exploratory testing remain
acceptance work. The suite does not implement dependent pools, opposing
resolution, workers, or UI behavior. It does not measure time or memory limits.
Story #4 and tester task #27 remain unaccepted until the delivered revision and
material findings have been independently evaluated.
