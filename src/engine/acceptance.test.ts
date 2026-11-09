import { certain, ProbabilityTree } from './probability'
import { classifyDice, emptyExperiment, rerollSelected, rollDice, selectReroll } from './experiment'
import { expect, it } from 'vitest'
import { Fraction } from './fraction'
import { calculatePool, poolSummary } from './pool'

it('Given three dice and a full non-crits budget, When every original non-crit is rerolled, Then independent per-die probabilities multiply', () => {
  const stages = calculatePool({ dice: 3, hitTarget: 4, critTarget: 6, rerolls: 3, policy: 'non-crits' })
  // Untouched crit: 1/6. A rerolled original non-crit: (5/6)(3/6).
  // Each original die therefore succeeds with probability 7/12.
  expect(poolSummary(stages[3].distribution).allSuccesses.toString()).toBe('343/1728')
  const allCrits = stages[3].distribution.filter(branch => branch.value.crits === 3)
    .reduce((sum, branch) => sum.add(branch.probability), new Fraction(0))
  expect(allCrits.toString()).toBe('1331/46656')
})

it('Given three original dice and two shared rerolls, When replacement outcomes differ from original categories, Then exact outcomes match original-ID enumeration', () => {
  for (const [hitTarget, critTarget] of [[4, 5], [2, 6], [6, 2], [6, 6]]) {
    for (const policy of ['misses', 'twos', 'non-crits'] as const) {
      const counts = new Map<string, number>()
      for (let originalCode = 0; originalCode < 216; originalCode++) {
        const original = [originalCode % 6 + 1, Math.floor(originalCode / 6) % 6 + 1, Math.floor(originalCode / 36) + 1]
        const outcome = (face: number) => face >= critTarget ? 'crit' : face >= hitTarget ? 'hit' : 'miss'
        const targets = [0, 1, 2].filter(id => policy === 'twos' ? original[id] === 2
          : policy === 'misses' ? outcome(original[id]) === 'miss' : outcome(original[id]) !== 'crit')
        if (policy === 'non-crits') targets.sort((a, b) => Number(outcome(original[a]) !== 'miss') - Number(outcome(original[b]) !== 'miss') || a - b)
        for (let first = 1; first <= 6; first++) for (let second = 1; second <= 6; second++) {
          const faces = [...original]
          targets.slice(0, 2).forEach((id, index) => { faces[id] = [first, second][index] })
          const key = `${faces.filter(face => outcome(face) === 'hit').length},${faces.filter(face => outcome(face) === 'crit').length}`
          counts.set(key, (counts.get(key) ?? 0) + 1)
        }
      }
      const final = calculatePool({ dice: 3, hitTarget, critTarget, rerolls: 2, policy })[2]
      const actual = new Map<string, Fraction>()
      for (const branch of final.distribution) {
        const key = `${branch.value.hits},${branch.value.crits}`
        actual.set(key, (actual.get(key) ?? new Fraction(0)).add(branch.probability))
      }
      expect(actual.size).toBe(counts.size)
      for (const [key, count] of counts) expect(actual.get(key)?.toString()).toBe(new Fraction(count, 7776).toString())
    }
  }
})

it('Given complete-history input with invalid physical facts, When classified, Then invalid state is rejected', () => {
  const state = ProbabilityTree.from('Start', certain(emptyExperiment())).then('Roll', rollDice('Roll', 1)).branches[0].value
  const die = state.dice[0]
  for (const dice of [
    [{ ...die, face: 7 }],
    [{ ...die, face: Number.NaN }],
    [{ ...die, rolls: [] }],
    [die, die],
  ]) expect(() => classifyDice('Classify', 3, 6)({ ...state, dice })).toThrow()
})

it('Given a recorded selection with an invalid budget, When executed, Then the operation rejects the invalid configuration', () => {
  const state = ProbabilityTree.from('Start', certain(emptyExperiment())).then('Roll', rollDice('Roll', 1)).branches[0].value
  const selected = selectReroll('Select', 'first original', 1, input => [input.dice[0].id])(state)[0].value
  for (const budget of [Number.NaN, Number.POSITIVE_INFINITY, 13, 0.5]) {
    const selection = { ...selected.selection, budget }
    expect(() => rerollSelected('Reroll')({ ...selected, selection, selections: [selection] })).toThrow()
  }
})

it('Given a valid existing custom die ID, When another die is rolled, Then identity remains unique', () => {
  const state = ProbabilityTree.from('Start', certain(emptyExperiment())).then('Roll', rollDice('Roll', 1)).branches[0].value
  const custom = { ...state, dice: [{ ...state.dice[0], id: 'die-2' }] }
  const next = rollDice('More dice', 1)(custom)[0].value
  expect(new Set(next.dice.map(die => die.id)).size).toBe(2)
})
