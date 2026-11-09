import { describe, expect, it } from 'vitest'
import { Fraction, assignOutcome, classifyDice, rerollSelected, rollDice, selectReroll } from '../engine'
import type { ClassifiedSnapshot, DiceSnapshot, Distribution, Stage } from '../engine'
import { inspect, mass, rerollTwos, start } from './support/experiments'

// Acceptance criteria: story #4 — Define stage and extension contracts.
describe('Define, evaluate, and inspect an exact named experiment', () => {
  it('Given a complete code-defined experiment, When evaluated, Then every named stage is inspectable in order', () => {
    const stages = inspect(rerollTwos())
    expect(stages.map(stage => stage.name)).toEqual(['Start', 'Roll', 'Select twos', 'Replace', 'Classify'])
    for (const stage of stages) {
      expect(mass(stage.distribution).toString()).toBe('1')
      expect(stage.distribution.every(branch => branch.probability.numerator >= 0n)).toBe(true)
    }
    const final = stages.at(-1)!.distribution as Distribution<ClassifiedSnapshot>
    const probability = final.filter(branch => branch.value.dice[0].currentOutcome !== 'miss')
      .reduce((total, branch) => total.add(branch.probability), new Fraction(0))
    // Three original successful faces plus a replacement success following a 2.
    expect(probability.toString()).toBe('7/12')
  })

  it('Given a two-die experiment, When final outcomes are grouped, Then earlier faces and separate histories remain inspectable', () => {
    const result = start().then('Roll two', rollDice('Roll two', 2))
      .then('Classify', classifyDice('Classify', 4, 6))
    const before = inspect(result)
    const original = JSON.stringify(before)
    const counts = result.evaluate(state => state.dice.filter(die => die.currentOutcome !== 'miss').length)
    // Independent binomial calculation for two fair dice succeeding on 4+.
    expect([...counts].map(([count, probability]) => [count, probability.toString()]))
      .toEqual([[0, '1/4'], [1, '1/2'], [2, '1/4']])
    const rolled = before.find(stage => stage.name === 'Roll two')!.distribution as Distribution<DiceSnapshot>
    expect(rolled).toHaveLength(36)
    expect(rolled.some(branch => branch.value.dice.map(die => die.face).join() === '1,2')).toBe(true)
    expect(rolled.some(branch => branch.value.dice.map(die => die.face).join() === '2,1')).toBe(true)
    expect(JSON.stringify(inspect(result))).toBe(original)
    expect(() => Object.assign(rolled[0].value.dice[0].rolls[0], { face: 6 })).toThrow()
  })

  it('Given an original 2, When selected and replaced, Then named snapshots retain identity and the old interpretation', () => {
    const initial = start().then('Roll', rollDice('Roll', 1))
      .then('Initial classification', classifyDice('Initial classification', 4, 6))
    const result = initial
      .then('Select', selectReroll('Select', 'only twos', 1,
        state => state.dice.filter(die => die.face === 2).map(die => die.id)))
      .then('Replace', rerollSelected('Replace'))
      .then('Final classification', classifyDice('Final classification', 4, 6))
    const stages = inspect(result)
    const replaced = stages.find(stage => stage.name === 'Replace')!.distribution as Distribution<DiceSnapshot>
    const branch = replaced.find(entry => entry.value.dice[0].rolls.map(roll => roll.face).join() === '2,6')!
    expect(branch.probability.toString()).toBe('1/36')
    const die = branch.value.dice[0]
    expect(die.id).toBe('die-1')
    expect(die.currentOutcome).toBeUndefined()
    expect(die.interpretations.map(item => [item.outcome, item.rollRevision])).toEqual([['miss', 0]])
    expect(die.rolls.map(roll => roll.stage)).toEqual(['Roll', 'Replace'])
    const earlier = stages.find(stage => stage.name === 'Initial classification')!.distribution as Distribution<ClassifiedSnapshot>
    expect(earlier.find(entry => entry.value.dice[0].face === 2)!.value.dice[0].rolls).toHaveLength(1)
  })

  it('Given a trusted deterministic extension, When reordered with classification, Then exact outcomes change as predicted', () => {
    const classify = classifyDice('Classify', 4, 6)
    const forceMiss: Stage<ClassifiedSnapshot, ClassifiedSnapshot> = state =>
      assignOutcome('Assign miss', 'illustrative deterministic policy', state.dice[0].id, 'miss')(state)
    const classified = start().then('Roll', rollDice('Roll', 1)).then('Classify', classify)
    const assignedLast = classified.then('Assign miss', forceMiss)
    const classifiedLast = assignedLast.then('Classify again', classify)
    const succeeds = (state: ClassifiedSnapshot) => state.dice[0].currentOutcome !== 'miss'
    expect(assignedLast.probabilityOf(succeeds).toString()).toBe('0')
    expect(classifiedLast.probabilityOf(succeeds).toString()).toBe('1/2')
    expect(classified.probabilityOf(succeeds).toString()).toBe('1/2')
    expect(classifiedLast.branches.every(branch => branch.value.dice[0].rolls.length === 1)).toBe(true)
  })

  it('Given a branch-dependent reroll policy, When all paths are evaluated, Then results match separate ordered-pair enumeration', () => {
    // Enumerate 36 equally likely (original, spare) pairs, even when spare is unused.
    // This reference never calls the tree, stage operations, or production classifiers.
    const counts = { miss: 0, hit: 0, crit: 0 }
    for (let original = 1; original <= 6; original++) {
      for (let spare = 1; spare <= 6; spare++) {
        const face = original === 2 ? spare : original
        counts[face === 6 ? 'crit' : face >= 4 ? 'hit' : 'miss']++
      }
    }
    const experiment = rerollTwos()
    const grouped = experiment.evaluate(state => state.dice[0].currentOutcome)
    for (const category of ['miss', 'hit', 'crit'] as const) {
      expect(grouped.get(category)?.toString()).toBe(new Fraction(counts[category], 36).toString())
    }
    expect(experiment.probabilityOf(() => true).toString()).toBe('1')
    expect(experiment.branches.every(branch => branch.probability.numerator >= 0n && branch.value.dice.length === 1)).toBe(true)
    const replaced = experiment.branches.filter(branch => branch.value.dice[0].rolls.length === 2)
    expect(replaced).toHaveLength(6)
    expect(replaced.every(branch => branch.probability.toString() === '1/36')).toBe(true)
  })
})

