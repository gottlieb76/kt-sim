import { describe, expect, it } from 'vitest'
import { Fraction, assignOutcome, classifyDice, rerollSelected, rollDice, selectReroll } from '../engine'
import type { ClassifiedSnapshot, DiceSnapshot } from '../engine'
import { calculatePool } from '../engine/pool'
import { failure, start } from './support/experiments'

// Acceptance criteria: story #4 — Define stage and extension contracts.
describe('Reject invalid or oversized experiments without completed partial results', () => {
  it('Given a statically oversized roll, When its operation is configured, Then it fails before any branch expansion', () => {
    const error = failure(() => rollDice('Oversized initial pool', 7))
    expect(error.message).toMatch(/Oversized initial pool/)
    expect(error.message).toMatch(/limit/i)
    expect(error.message).toMatch(/fewer|reduce/i)
  })

  it('Given invalid thresholds, When the operation is configured, Then the error names the stage and legal bounds', () => {
    const error = failure(() => classifyDice('Interpret attack', 0, 6))
    expect(error.message).toContain('Interpret attack')
    expect(error.message).toMatch(/2.*6/)
  })

  it('Given valid earlier stages and a small tree limit, When another roll exceeds it, Then failure identifies the stage and correction', () => {
    const first = start(6).then('First roll', rollDice('First roll', 1))
    let completed: unknown
    const error = failure(() => { completed = first.then('Second roll', rollDice('Second roll', 1)) })
    expect(completed).toBeUndefined()
    expect(first.probabilityOf(() => true).toString()).toBe('1')
    expect(error.message).toContain('Second roll')
    expect(error.message).toMatch(/limit/i)
    expect(error.message).toMatch(/fewer|reduce|increase/i)
  })

  it('Given a missing branch-specific target, When selection executes, Then failure names the stage and explains the invalid target', () => {
    const rolled = start().then('Roll', rollDice('Roll', 1))
    const error = failure(() => rolled.then('Choose original die',
      selectReroll('Choose original die', 'invalid example', 1, () => ['missing-id'])))
    expect(error.message).toContain('Choose original die')
    expect(error.message).toContain('missing-id')
    expect(error.message).toMatch(/select|choose|valid/i)
  })

  it('Given a reduced calculator state, When a history-requiring operation is forced at runtime, Then it rejects discarded information', () => {
    const counts = calculatePool({ dice: 1, hitTarget: 4, critTarget: 6, rerolls: 0, policy: 'misses' })[0].distribution[0].value
    const error = failure(() => classifyDice('Needs history', 4, 6)(counts as unknown as DiceSnapshot))
    expect(error.message).toMatch(/complete-history/)
    expect(error.message).toMatch(/discarded/)
  })

  it('Given an invalid conditional distribution, When a custom stage executes, Then evaluation fails rather than normalizing it', () => {
    for (const probabilities of [[new Fraction(1, 2)], [new Fraction(-1), new Fraction(2)]]) {
      failure(() => start().then('Invalid custom weights', state =>
        probabilities.map(probability => ({ value: state, probability }))))
    }
  })

  it('Given a replacement die, When assignment is attempted without reclassification, Then the missing interpretation is rejected', () => {
    const replaced = start().then('Roll', rollDice('Roll', 1))
      .then('Classify', classifyDice('Classify', 4, 6))
      .then('Select', selectReroll('Select', 'first original', 1, state => [state.dice[0].id]))
      .then('Replace', rerollSelected('Replace'))
    failure(() => replaced.then('Assign stale', state =>
      assignOutcome('Assign stale', 'example', state.dice[0].id, 'miss')(state as ClassifiedSnapshot)))
  })
})

// Compile-time acceptance evidence for existing stage connections. The eventual
// experiment API must preserve these guarantees; #22/#23 must extend this to its
// own public types if it introduces a separate composition API.
function incompatibleConnections() {
  const unclassified = start().then('Roll', rollDice('Roll', 1))
  // @ts-expect-error Assignment requires current classifications.
  unclassified.then('Assign', assignOutcome('Assign', 'example', 'die-1', 'miss'))
  // @ts-expect-error Reroll execution requires a recorded selection.
  unclassified.then('Replace', rerollSelected('Replace'))
}
void incompatibleConnections
