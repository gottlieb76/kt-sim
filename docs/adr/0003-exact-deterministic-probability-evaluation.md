# 0003: Exact, deterministic probability evaluation

Status: Accepted
Date: 2026-11-09

## Context and goal

KT-Sim is a decision tool: comparisons and explanations must be mathematically
reliable, including small probabilities and strategy ties. The
[Probability Lab roadmap](../roadmap.md) introduces composition and additional
evaluation strategies. Their implementation must preserve the same mathematical
meaning within the client-side architecture of [ADR 0001](0001-browser-application-without-required-backend.md).

## Decision

Use exact, reduced bigint fractions for probabilities, expectations, and
comparisons throughout evaluation. Round only for presentation; never feed rounded
or floating-point display values back into calculations or rankings.

Evaluation is deterministic: the same experiment, inputs, policies, and applicable
rules revision produce the same exact result. Enumerate weighted alternatives or
use equivalent exact aggregation; do not sample random rolls to estimate results.
An illustrated roll sequence is a possible branch, not a sampled reference answer.

Validate configurations and distributions, including nonnegative probabilities
and total mass exactly equal to one. Preserve conditional dependencies and apply
explicit evaluation limits. Invalid, unsupported, or oversized evaluations fail
with actionable errors; never silently approximate, truncate probability mass,
or present partial distributions as completed results.

Alternative execution strategies, including workers, must preserve these contracts.
Transport must preserve bigint fractions exactly. Limits may differ explicitly
between strategies; a successful calculation must have the same exact meaning.

## Alternatives and tradeoffs

- Floating-point evaluation is convenient but introduces rounding errors into
  equality, probability totals, and comparisons.
- Monte Carlo estimation can scale to larger problems but introduces uncertainty
  and is outside this exact evaluator's contract. Adding an explicitly approximate
  mode would require a separate architectural decision and clear result semantics.
- Unbounded enumeration preserves exactness only when it completes and risks
  exhausting browser resources. Explicit supported limits make failure predictable.

## Consequences and verification

Exactness supports reproducible results and trustworthy comparisons at the cost of
bigint arithmetic, potentially large state spaces, and bounded supported inputs.
This formalizes existing engine behavior rather than delivering a new evaluator.

Verify probability changes using known mathematical examples and independent
small-case enumeration, not the production algorithm as its own oracle. Check mass
conservation, nonnegative probabilities, relevant count invariants, exact ties,
boundary inputs, and explicit limit failures. Verify equivalent strategies and
serialization preserve exact results when introduced. Keep concrete performance
limits and worker implementation choices with their delivery stories.
