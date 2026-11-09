import { describe, expect, it } from 'vitest'
import { certain, ProbabilityTree } from './probability'
import { assignOutcome, classifyDice, emptyExperiment, rerollSelected, rollDice, selectReroll } from './experiment'

const classify = classifyDice('Classify', 3, 6)
const start = () => ProbabilityTree.from('Start', certain(emptyExperiment()))

describe('complete-history experiment stages', () => {
  it('Given a roll When a successor is classified Then earlier snapshots and nested provenance stay immutable', () => {
    const rolled = start().then('Roll', rollDice('Roll', 1))
    const old = rolled.branches[1].value
    const classified = classify(old)[0].value
    expect(old.dice[0].interpretations).toEqual([])
    expect(classified.dice[0].interpretations[0].outcome).toBe('miss')
    expect(() => (old.dice as unknown as unknown[]).push({})).toThrow()
    expect(() => Object.assign(old.dice[0].rolls[0], { face: 6 })).toThrow()
  })

  it('Given selected original dice When rerolled Then targets remain fixed, provenance survives, and current classification is invalidated', () => {
    const classified = start().then('Roll', rollDice('Roll', 2)).then('Classify', classify)
    const initial = classified.branches.find(branch => branch.value.dice.every(die => die.face === 2))!.value
    const selected = selectReroll('Select', 'both twos', 2, state => state.dice.map(die => die.id), 2)(initial)[0].value
    const replacements = rerollSelected('Reroll')(selected)
    expect(replacements).toHaveLength(36)
    expect(replacements.every(entry => entry.probability.toString() === '1/36')).toBe(true)
    const next = replacements.find(entry => entry.value.dice[0].face === 3 && entry.value.dice[1].face === 5)!.value
    expect(next.dice.map(die => die.id)).toEqual(initial.dice.map(die => die.id))
    expect(next.dice[0].rolls.map(roll => roll.face)).toEqual([2, 3])
    expect(next.dice[0].interpretations).toEqual(initial.dice[0].interpretations)
    expect(next.dice[0].currentOutcome).toBeUndefined()
    expect(() => selectReroll('Again', 'illegal', 1, state => [state.dice[0].id])(next)).toThrow('already rerolled')
    expect(() => rerollSelected('Stale')({ ...selected, revision: selected.revision + 1 })).toThrow('stale')
  })

  it('Given two selected failed dice When replacements are classified Then independent success counts are 1/9, 4/9, 4/9', () => {
    const initial = start().then('Roll', rollDice('Roll', 3)).branches.find(branch => branch.value.dice.map(die => die.face).join() === '2,2,6')!.value
    const result = ProbabilityTree.from('Given', certain(initial))
      .then('Select', selectReroll('Select', 'failed dice', 2, state => state.dice.filter(die => die.face < 3).map(die => die.id)))
      .then('Reroll', rerollSelected('Reroll'))
      .then('Classify', classify)
    const counts = result.evaluate(state => state.dice.filter(die => die.currentOutcome !== 'miss').length)
    expect([...counts].map(([count, probability]) => [count, probability.toString()])).toEqual([[1, '1/9'], [2, '4/9'], [3, '4/9']])
    expect(result.probabilityOf(() => true).toString()).toBe('1')
  })

  it('Given a classified hit When assigned a miss Then face and historical classification remain intact', () => {
    const hit = start().then('Roll', rollDice('Roll', 1)).then('Classify', classify).branches[2].value
    const assigned = assignOutcome('Assign', 'example policy', hit.dice[0].id, 'miss')(hit)[0].value
    expect(assigned.dice[0].face).toBe(3)
    expect(assigned.dice[0].interpretations.map(item => item.outcome)).toEqual(['hit', 'miss'])
    expect(hit.dice[0].currentOutcome).toBe('hit')
    expect(() => assignOutcome('Assign', 'rule', 'missing', 'miss')(hit)).toThrow('Unknown die')
    expect(() => assignOutcome('Assign', 'rule', hit.dice[0].id, 'miss')({ ...hit, dice: hit.dice.map(die => ({ ...die, currentOutcome: undefined })) } as never)).toThrow('classification')
  })

  it('rejects discarded information, invalid selection, configuration, and bounded expansions', () => {
    expect(() => rollDice('Roll', -1)).toThrow('count')
    expect(() => classifyDice('Classify', 0, 6)).toThrow('Threshold')
    expect(() => selectReroll('Select', 'policy', -1, () => [])).toThrow('budget')
    expect(() => classify({ retention: 'counts' } as never)).toThrow('complete-history')
    expect(() => start().then('Roll', rollDice('Roll', 7))).toThrow('limit')
    const state = start().then('Roll', rollDice('Roll', 1)).branches[0].value
    expect(() => selectReroll('Select', 'policy', 1, () => ['missing'])(state)).toThrow('Unknown die')
    expect(() => selectReroll('Select', 'policy', 1, s => [s.dice[0].id, s.dice[0].id])(state)).toThrow()
  })

  it('Given mutable caller state When a stage executes Then mutations cannot change its returned snapshot', () => {
    const original = start().then('Roll', rollDice('Roll', 1)).branches[0].value
    const mutable = { ...original, dice: original.dice.map(die => ({ ...die, rolls: die.rolls.map(roll => ({ ...roll })), interpretations: [] })) }
    const successor = classify(mutable)[0].value
    mutable.dice[0].rolls[0].face = 6
    expect(successor.dice[0].rolls[0].face).toBe(1)
    expect(() => selectReroll('Select', 'mutating policy', 1, state => {
      Object.assign(state.dice[0], { face: 6 })
      return []
    })(original)).toThrow()
  })

  it('Given branch-specific same-face choices When a policy handles ties and no matches Then choices are deterministic and add no mass', () => {
    const choose = selectReroll('Select', 'largest failed-face group; ties lowest face', 3, state => {
      const groups = [1, 2].map(face => ({ face, targets: state.dice.filter(die => die.face === face && die.rolls.length === 1).map(die => die.id) }))
      groups.sort((a, b) => b.targets.length - a.targets.length || a.face - b.face)
      return { targets: groups[0].targets, selectedFace: groups[0].targets.length ? groups[0].face : undefined }
    })
    const rolled = start().then('Roll', rollDice('Roll', 3))
    const selected = rolled.then('Select', choose)
    for (const [faces, expected] of [['1,2,6', 'die-1'], ['2,2,6', 'die-1,die-2'], ['3,4,6', '']] as const) {
      const branch = selected.branches.find(entry => entry.value.dice.map(die => die.face).join() === faces)!
      expect(branch.value.selection.targets.join()).toBe(expected)
      expect(branch.probability.toString()).toBe('1/216')
    }
    expect(selected.probabilityOf(() => true).toString()).toBe('1')
    const selectedOne = selected.branches.find(entry => entry.value.selection.targets.length === 1)!.value
    expect(() => rerollSelected('Reroll')({ ...selectedOne, dice: selectedOne.dice.map(die => ({ ...die, face: 6, rolls: [{ ...die.rolls[0], face: 6 }] })) })).toThrow('stale')
  })

  it('rejects malformed public snapshot and selection records before evaluation', () => {
    const state = start().then('Roll', rollDice('Roll', 2)).branches[0].value
    for (const invalid of [
      { ...state, revision: NaN },
      { ...state, dice: [state.dice[0], state.dice[0]] },
      { ...state, dice: [{ ...state.dice[0], face: 6 }] },
      { ...state, dice: [{ ...state.dice[0], rolls: [] }] },
      { ...state, dice: [{ ...state.dice[0], currentOutcome: 'hit' as const }] },
    ]) expect(() => classify(invalid)).toThrow('Invalid')
    const selected = selectReroll('Select', 'policy', 1, s => [s.dice[0].id])(state)[0].value
    for (const selection of [
      { ...selected.selection, budget: NaN },
      { ...selected.selection, policy: '' },
      { ...selected.selection, selectedFace: -1 },
    ]) expect(() => rerollSelected('Reroll')({ ...selected, selection, selections: [selection] })).toThrow()
    expect(() => rerollSelected('Reroll')({ ...selected, selections: [] })).toThrow('selection')
  })

  it('Given a rule that changes hits When stage order changes Then the exact outcome changes', () => {
    const tree = start().then('Roll', rollDice('Roll', 1)).then('Classify', classify)
    const assigned = tree.then('Assign', state => assignOutcome('Assign', 'rule', state.dice[0].id, 'miss')(state))
    expect(assigned.probabilityOf(state => state.dice[0].currentOutcome === 'hit').toString()).toBe('0')
    expect(assigned.then('Reclassify', classify).probabilityOf(state => state.dice[0].currentOutcome === 'hit').toString()).toBe('1/2')
  })
})

// These invalid connections must remain compile-time errors, independently of runtime checks.
function invalidConnections(state: ReturnType<typeof emptyExperiment>) {
  // @ts-expect-error A current classification is required before assignment.
  assignOutcome('Assign', 'rule', 'die-1', 'miss')(state)
  // @ts-expect-error A recorded selection is required before replacement rolls.
  rerollSelected('Reroll')(state)
}
void invalidConnections
