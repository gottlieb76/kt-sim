# 0004: Immutable state and single-purpose stages

Status: Accepted
Date: 2026-11-09

## Context and goal

The next [Compose experiments deliverable](../roadmap.md#next-deliverable--compose-experiments)
needs inspectable, typed stage contracts. Counts alone cannot establish which die
was rerolled or distinguish a rolled face from a rule-assigned outcome. Losing
this information can invalidate later rules despite conserving probability mass.

Apply the responsibility boundaries of [ADR 0002](0002-clean-architecture-and-solid-principles.md)
and the exact evaluation contract of [ADR 0003](0003-exact-deterministic-probability-evaluation.md).

## Decision

### Immutable state objects

Represent each branch's stage state as an explicit, typed immutable object.
Give state objects cohesive responsibilities: die facts, outcome interpretations,
and experiment context may be composed without becoming one object responsible
for rolling, interpreting rules, rendering, and persistence. No inheritance is
required. Exact TypeScript shapes remain an implementation decision.

A stage consumes a state snapshot and produces weighted successor snapshots.
Never mutate earlier snapshots or nested values shared with them. Structural
sharing is allowed only for immutable data. TypeScript `readonly` alone does not
establish runtime immutability; implementation must protect the contract at public
boundaries and verify it with regression tests.

Retain stable die identity and complete ordered roll provenance, including original
and replacement faces and the stages responsible. A reroll changes the current
face in a successor snapshot, preserving the previous snapshot and the relationship
between the original roll and replacement. Eligibility rules inspect this explicit
provenance: a rule forbidding another reroll cannot be bypassed by treating the
replacement as a new die. Keep shared budgets and selection policies explicit.

### One semantic operation per stage

Each stage performs one named semantic operation. Rolling, rerolling, classifying,
and assigning an outcome are separate stages. A stage may inspect the complete
pool and associated context to perform its operation. A roll stage may roll three
dice, and a selection stage may compare their faces; single responsibility does
not require one stage per die. Validation and provenance recording needed for an
operation belong with it, but unrelated operations must not be hidden inside it.

Separate a pool-dependent choice from the random operation it controls: first
select and record targets, then roll their replacements. A convenience workflow
may compose these stages without hiding either result.

Composed workflows may group stages for convenience while preserving their
individual contracts and inspectable results. Stages declare input/output types
and required information; reject incompatible connections or missing information
before evaluation wherever it can be established. Validate remaining branch-specific
conditions explicitly during evaluation, without returning partial results.

### Faces and interpretations are separate

Rolling and rerolling establish physical die facts, not automatic hit/miss meaning.
A classification stage assigns an interpretation using explicit configuration.
A later assignment stage may change a normal success to a miss without changing
the face, its roll provenance, or the earlier classification snapshot. Retain the
interpretation change and its rule or policy reference for inspection.

Interpretations refer to the die revision they describe. Rerolling a classified die
must invalidate its current interpretation; a separate classification stage must
interpret the replacement before a consumer can use that outcome. Earlier
interpretations remain historical facts rather than labels for the replacement.
An assignment based on a classified success requires a valid current classification.

For example, one possible branch is:

1. **Roll three dice:** die A = 2, B = 3, C = 5; no outcomes assigned.
2. **Reroll one die:** an explicit policy selects A; it becomes 1 with provenance
   `2 → 1`. B and C retain their faces. Under a once-per-die rule, A is ineligible
   for another reroll.
3. **Classify at 3+:** A is a miss; B and C are normal successes under this
   example's configuration.
4. **Assign one success as a miss:** an explicit special-rule policy selects B.
   Its face remains 3; its current assigned outcome is miss, and its previous
   normal-success interpretation remains inspectable.

Each step creates a successor state; none rewrites a previous step. Evaluation
includes all legal random alternatives with exact weights, not just this example.

### Branch-specific choices and pool-wide rules

Evaluate a selection policy against each branch's complete current pool, retaining
the information it needs, such as equal face values, valid interpretations, and
reroll eligibility. Record the choice as immutable state: the policy or rule
reference, selected face where applicable, stable target die IDs, and the input
revision to which the choice applies. The execution stage validates that the
selection is still applicable and legal before generating replacements. Do not
reselect targets as replacement results appear within the same reroll operation.

A deterministic policy produces one choice per input branch and adds no random
probability. Alternative player choices are separate policies or decision
alternatives, not equally weighted random branches. Randomized policies require
explicit probabilities. State the objective and tie-breaking behavior before
claiming a policy is optimal; legality alone does not determine a player's choice.

Ceaseless illustrates this boundary. Its wording permits choosing attack dice of
one face value; matching duplicates are not a prerequisite, and selecting only a
subset is possible. See the [official weapon rules](https://assets.warhammer-community.com/killteam_keydownloads_literules_eng-jfhe9v0j7c-n0x6ozmgo9.pdf).
This example uses 3+ hits, criticals on 6, no other modifiers, and a policy that
chooses the largest eligible failed-face group, breaks ties by lowest face, and
rerolls all eligible dice in that group; it selects nothing when none qualify.
It is an illustrative policy, not a universally optimal strategy.

1. **Roll four dice:** one branch has `A:1, B:2, C:2, D:6`.
2. **Select reroll targets:** inspect the pool, choose face 2, and record IDs B
   and C. Selecting face 1 would also be legal but is not this policy's choice.
3. **Reroll selected dice:** enumerate the 36 ordered replacement pairs with
   conditional probability `1/36` each. One successor is
   `A:1, B:2→3, C:2→5, D:6`. Both B and C retain their identity and reroll history,
   even if a replacement has the same face as its original roll.
4. **Classify:** interpret current faces; this successor has one miss, two normal
   successes, and one critical success.

The selection policy may inspect faces against an explicit hit threshold without
assigning outcomes. If it consumes assigned interpretations instead, classification
must precede selection and rerolled dice need classification again afterwards.

For four independent fair D6s, each ordered initial branch has probability
`1/1296`; each complete ordered path through this particular two-die reroll has
probability `1/1296 × 1/36 = 1/46656`. Other initial branches may select different
numbers of dice and therefore have different conditional expansions. Accumulate
final probabilities as a sum over initial pools of their probability multiplied
by the conditional probability of the outcome under that pool's recorded choice.
Replacement rolls are independent conditional on selection; selection is dependent
on the joint initial pool. Do not substitute an independent per-die reroll chance.

### Preserve dependencies and information

Retain upstream random values needed by downstream stages. Never replace a random
pool size with its expectation or combine shared dependencies as independent
marginals. Counts are derived views, not replacements for required die facts.
For example, hit/miss totals cannot distinguish failed faces 1 and 2 for a
same-face selection policy. Face histograms may suffice for restricted calculations,
but do not replace die identity and provenance required by this history contract.

Aggregation is permitted only when merged states are equivalent for all supported
downstream operations and the promised inspection detail is preserved. Full-history
inspection must retain contributing histories explicitly; counts cannot reconstruct
them. A deliberately reduced representation must declare its information loss and
reject stages or inspection requests needing discarded facts. It must not claim
to implement this complete-history state contract. Use explicit limits when keeping
the required information is too expensive.

## Alternatives and tradeoffs

- Mutable dice are compact but can rewrite earlier stage results and destroy
  provenance used for eligibility or explanations.
- Combining roll, classification, and reroll in one stage simplifies a fixed
  calculator but hides ordering and prevents independent rule composition.
- Count-only state is efficient for some calculations but cannot generally support
  die-specific reroll restrictions, assignments, or complete explanations.
- Copying every snapshot deeply is simple but potentially expensive. Immutable
  structural sharing can preserve the contract without mandating a storage design.

## Consequences and verification

This decision guides the composition foundation; it does not claim the current
calculator already implements it. The existing pool calculator deliberately
discards histories, and the low-level tree retains references to callback values.
Preserve existing calculator outputs while introducing and testing the new state
contracts. Document reduced legacy representations honestly; do not silently
upgrade their claims. Rules illustrated here specify architectural capabilities,
not delivery of named game rules or deep explanation UI in the next story.

Verify that successor creation cannot alter prior snapshots; stable identity and
provenance survive rerolls; a once-per-die rule rejects rerolling a replacement;
classification is separate from rolling; rerolls invalidate current classification;
and assignments change interpretation without changing faces. Test a meaningful
stage-order difference, missing state requirements, conditional dependencies, and
aggregation rejection when provenance matters. Compare small cases against
independent enumeration alongside the exactness checks in ADR 0003. For pool-wide
selection, cover single occurrences, repeated faces, ties, no eligible targets,
and already-rerolled dice. Verify choices are branch-specific, add no probability
mass, and remain fixed during their reroll operation. Conditional on the example's
initial pool and selecting both 2s, the final success counts 1, 2, and 3 have
probabilities `1/9`, `4/9`, and `4/9` respectively; use this as a small known case
alongside full-pool enumeration when implementing the capability.
