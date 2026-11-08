import { Fraction } from './fraction'

export type Weighted<T> = Readonly<{ value: T; probability: Fraction }>
export type Distribution<T> = readonly Weighted<T>[]
export type TraceStep = Readonly<{
  stage: string
  value: unknown
  conditionalProbability: Fraction
  pathProbability: Fraction
}>
export type Branch<T> = Weighted<T> & Readonly<{ history: readonly TraceStep[] }>
export type Stage<Input, Output> = (value: Input) => Distribution<Output>

const ONE = new Fraction(1)
const ZERO = new Fraction(0)

function validate<T>(distribution: Distribution<T>): void {
  if (distribution.length === 0) throw new Error('Distribution must not be empty')
  let total = ZERO
  for (const entry of distribution) {
    if (entry.probability.numerator < 0n) throw new Error('Probability must not be negative')
    total = total.add(entry.probability)
  }
  if (!total.equals(ONE)) throw new Error('Probabilities must sum to one')
}

/** Equal-probability alternatives; repeated values remain separate branches. */
export function uniform<T>(values: readonly T[]): Distribution<T> {
  if (values.length === 0) throw new Error('At least one alternative is required')
  return values.map(value => ({ value, probability: new Fraction(1, values.length) }))
}

export function certain<T>(value: T): Distribution<T> {
  return [{ value, probability: ONE }]
}

/** Finite probability tree. Stage callbacks must treat values as immutable. */
export class ProbabilityTree<T> {
  readonly branches: readonly Branch<T>[]
  private readonly maxBranches: number

  private constructor(
    branches: readonly Branch<T>[],
    maxBranches: number,
  ) {
    this.branches = branches
    this.maxBranches = maxBranches
  }

  static from<T>(name: string, distribution: Distribution<T>, maxBranches = 100_000): ProbabilityTree<T> {
    if (!Number.isSafeInteger(maxBranches) || maxBranches < 1) throw new Error('Invalid branch limit')
    validate(distribution)
    const branches: Branch<T>[] = []
    for (const { value, probability } of distribution) {
      if (probability.numerator === 0n) continue
      if (branches.length >= maxBranches) throw new Error('Branch limit exceeded')
      branches.push(Object.freeze({ value, probability, history: Object.freeze([
        Object.freeze({ stage: name, value, conditionalProbability: probability, pathProbability: probability }),
      ]) }))
    }
    return new ProbabilityTree(Object.freeze(branches), maxBranches)
  }

  then<U>(name: string, stage: Stage<T, U>): ProbabilityTree<U> {
    const branches: Branch<U>[] = []
    for (const parent of this.branches) {
      const alternatives = stage(parent.value)
      validate(alternatives)
      for (const { value, probability: conditionalProbability } of alternatives) {
        if (conditionalProbability.numerator === 0n) continue
        if (branches.length >= this.maxBranches) throw new Error('Branch limit exceeded')
        const probability = parent.probability.multiply(conditionalProbability)
        branches.push(Object.freeze({ value, probability, history: Object.freeze([
          ...parent.history,
          Object.freeze({ stage: name, value, conditionalProbability, pathProbability: probability }),
        ]) }))
      }
    }
    return new ProbabilityTree(Object.freeze(branches), this.maxBranches)
  }

  map<U>(name: string, transform: (value: T) => U): ProbabilityTree<U> {
    return this.then(name, value => certain(transform(value)))
  }

  probabilityOf(predicate: (value: T) => boolean): Fraction {
    return this.branches.reduce((sum, branch) =>
      predicate(branch.value) ? sum.add(branch.probability) : sum, ZERO)
  }

  /** Group by explicit keys, avoiding ambiguous object equality. */
  evaluate<K>(key: (value: T) => K): ReadonlyMap<K, Fraction> {
    const totals = new Map<K, Fraction>()
    for (const branch of this.branches) {
      const outcome = key(branch.value)
      totals.set(outcome, (totals.get(outcome) ?? ZERO).add(branch.probability))
    }
    return totals
  }
}
