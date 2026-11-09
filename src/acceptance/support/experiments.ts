import { expect } from 'vitest'
import { Fraction, ProbabilityTree, certain, classifyDice, emptyExperiment, rerollSelected, rollDice, selectReroll } from '../../engine'
import type { Distribution } from '../../engine'

// Story #4: executable acceptance criteria, not a replacement evaluator.
// #22 must review the inspection accessor below against the chosen public API.
// All evaluation, weighting, validation, and grouping use production public APIs.
export function inspect<T>(tree: ProbabilityTree<T>) {
  // Proposed minimal inspection surface. Keep API naming assumptions here only;
  // adapting this accessor must not implement missing stage capture in test code.
  const stages: unknown = Reflect.get(tree, 'stages')
  expect(stages, 'Experiments must expose ordered named stage results through their public API').toBeDefined()
  expect(Array.isArray(stages)).toBe(true)
  return stages as readonly Readonly<{ name: string; distribution: Distribution<unknown> }>[]
}

export function start(maxBranches = 100_000) {
  return ProbabilityTree.from('Start', certain(emptyExperiment()), maxBranches)
}

export function rerollTwos() {
  return start()
    .then('Roll', rollDice('Roll', 1))
    .then('Select twos', selectReroll('Select twos', 'only original twos', 1,
      state => state.dice.filter(die => die.face === 2).map(die => die.id)))
    .then('Replace', rerollSelected('Replace'))
    .then('Classify', classifyDice('Classify', 4, 6))
}

export function mass<T>(distribution: Distribution<T>) {
  return distribution.reduce((total, branch) => total.add(branch.probability), new Fraction(0))
}

export function failure(action: () => unknown): Error {
  let caught: unknown
  try { action() } catch (error) { caught = error }
  expect(caught, 'The invalid experiment must fail instead of returning completed results').toBeInstanceOf(Error)
  return caught as Error
}

