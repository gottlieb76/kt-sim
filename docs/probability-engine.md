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

## Complete-history composition foundation

`src/engine/experiment.ts` adds the bounded snapshot contract from ADR 0004.
This API is separate from the reduced calculator above: it retains stable die IDs,
ordered rolls (face and responsible stage), interpretation history linked to each
roll revision, and recorded selection policies and target IDs. Each operation copies
and freezes its output's nested state. Caller-owned inputs are copied rather than
frozen in place; policy callbacks receive protected snapshots.

```ts
import {
  ProbabilityTree, certain, emptyExperiment, rollDice, selectReroll,
  rerollSelected, classifyDice, assignOutcome,
} from './src/engine'

const rolled = ProbabilityTree.from('Start', certain(emptyExperiment()))
  .then('Roll two', rollDice('Roll two', 2))
const selected = rolled.then('Select misses', selectReroll(
  'Select misses', 'lowest ID failing die at 3+', 1,
  state => state.dice.filter(die => die.face < 3).slice(0, 1).map(die => die.id),
))
const replaced = selected.then('Reroll', rerollSelected('Reroll'))
const classified = replaced.then('Classify', classifyDice('Classify', 3, 6))
const assigned = classified.then('Assign example', state => assignOutcome(
  'Assign example', 'illustrative assignment policy', state.dice[0].id, 'miss',
)(state))
const chance = assigned.probabilityOf(state => state.dice.every(die => die.currentOutcome !== 'miss'))
// Keep rolled/selected/replaced/classified to inspect intermediate snapshots.
```

Selection is deterministic and branch-specific; it adds no random mass. Its budget
is per selection operation, targets are chosen before replacement, and execution
rejects stale selections and already-rerolled dice. Every die can be rerolled at
most once in this foundation. `selectedFace` optionally constrains every target
to the chosen face; it does not imply any named game rule. Arbitrary TypeScript
policies are trusted developer code, not browser-provided scripts.

Rerolling invalidates a die's current interpretation while retaining historical
interpretations. Classification and assignment are separate operations. Assignment
requires valid current classifications; it changes no face or roll provenance.
TypeScript distinguishes classified and selected snapshots, while runtime checks
reject missing or discarded information. Adding a custom deterministic stage can
use `map` and existing operations, for example reclassifying with a different
threshold. Callbacks must remain pure and preserve the retained-information contract.

Each roll/reroll operation rejects expansions above 100,000 alternatives before
allocating them, and the enclosing tree separately enforces its active branch limit.
The full-history API therefore cannot enumerate a complete seven-D6 roll under
these limits. The reduced calculator continues to support 12 dice, intentionally
without full histories. A custom tree limit does not raise the per-operation limit.
Reduce dice/targets or use the reduced calculator when its information is sufficient;
no mode silently approximates or truncates results. Full-history stages reject
count-only states rather than inventing lost facts.

The legacy count state now retains `eligibleMisses` separately from total eligible
dice. This prevents replacement misses from being selected again while original
hits remain eligible under the non-crits policy. For two dice at 3+/6 with two
non-crits rerolls, the corrected all-success probability is `169/324`.

`src/application/pool-analysis.ts` coordinates the fixed calculator and prepares
exact summaries and grouped results independently of React. The workbench consumes
its ready/error result and hides results on failure; correcting settings or resetting
recovers evaluation. The fixed calculator remains the workbench's efficient path;
a general composed-experiment workbench, dependent pools, opposing resolution,
and deep explanation UI remain future work. A future dependent-pool stage must
read each branch's upstream state rather than its expectation. Resolution must
retain the joint state its policy needs; reducing counts cannot recover die histories.
