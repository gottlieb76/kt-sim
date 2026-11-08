# Probability engine

The engine in `src/engine` is independent of React and game rules. It enumerates
finite alternatives using exact, reduced bigint fractions. Decimal conversion
is for display only and may lose precision.

```ts
import { ProbabilityTree, classifyFaces, die, rerollWhen } from './src/engine'

const d6 = die()
const results = ProbabilityTree.from('Initial roll', d6)
  .then('Reroll only 2', rerollWhen(face => face === 2, d6))
  .map('Classify', classifyFaces({
    1: 'miss', 2: 'miss', 3: 'miss', 4: 'hit', 5: 'hit', 6: 'crit',
  }))

results.evaluate(outcome => outcome) // Map: miss 5/12, hit 7/18, crit 7/36
results.probabilityOf(outcome => outcome !== 'miss').toString() // "7/12"
results.branches // Each final value, exact probability, and full stage history
```

Each `then` callback supplies a normalized conditional distribution for its input.
The engine multiplies parent probabilities by conditional probabilities. `map`
is a deterministic stage. `evaluate` adds probabilities sharing a key; use stable
primitive keys for grouping, since Map compares object keys by reference.

A reroll stage replaces selected branches exactly once. A replacement 2 is kept;
another reroll requires another explicit stage. Rerolling only 2 adds 1/12 to the
original 1/2 chance of 4+. Rerolling all misses instead gives 3/4.

Stages may change the state type. To retain several dice or earlier decisions,
return objects containing that state. Keep state objects and stage callbacks
immutable and deterministic; histories retain references, not deep copies.
Use `certain` for deterministic alternatives and `uniform` for equally likely ones.
Weighted distributions can use `Fraction` directly. Negative probabilities,
empty distributions, and distributions not summing exactly to one are rejected.

The tree retains separate paths even when they reach equal values. Enumeration
grows exponentially: a default limit of 100,000 active branches throws rather
than silently approximating. `ProbabilityTree.from` accepts a custom limit as its
third argument. Large dice pools will need a future aggregated evaluation strategy.
This engine does not yet implement Kill Team combat resolution.

## Dice pool calculator

`calculatePool` in `src/engine/pool.ts` provides exact distributions for 1–12 D6s.
It uses the tree stages above and merges equivalent count states between rolls.
Returned stage distributions retain counts rather than individual dice histories;
use `ProbabilityTree` directly when individual path inspection is needed.

The page configures dice count, hit and crit thresholds (2+ through 6+), a shared
reroll budget, and an eligibility policy. Crits take priority over ordinary hits.
Success counts include both hits and crits. Reroll budgets are shared across the
pool, not applied to every die. Only original dice are eligible, each at most once.
Policies are misses, only faces showing 2, or non-crits (misses first, then hits).
The face-2 policy applies even when 2 is configured as a hit or crit. Unused
rerolls are skipped. These policies are explicit choices, not an optimal combat strategy.

`poolSummary` calculates expected successes/crits and probabilities of any crit
or all dice succeeding. `Fraction.toPercentage(2)` formats rounded percentage
strings using bigint arithmetic; the exact internal distribution is unchanged.
The page compares stages and displays success counts and joint hit/crit outcomes.
