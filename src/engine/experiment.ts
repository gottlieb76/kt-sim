import { Fraction } from './fraction'
import { certain } from './probability'
import type { Distribution, Stage } from './probability'

export type DieOutcome = 'miss' | 'hit' | 'crit'
export type RollFact = Readonly<{ face: number; stage: string }>
export type Interpretation = Readonly<{
  outcome: DieOutcome
  rollRevision: number
  stage: string
  reference: string
}>
export type ExperimentDie = Readonly<{
  id: string
  face: number
  rolls: readonly RollFact[]
  interpretations: readonly Interpretation[]
  currentOutcome?: DieOutcome
}>
export type RerollChoice = Readonly<{ targets: readonly string[]; selectedFace?: number }>
export type RerollSelection = Readonly<{
  stage: string
  policy: string
  budget: number
  targets: readonly string[]
  selectedFace?: number
  inputRevision: number
  inputDice: string
}>
export type DiceSnapshot = Readonly<{
  retention: 'complete-history'
  revision: number
  dice: readonly ExperimentDie[]
  selections: readonly RerollSelection[]
}>
export type ClassifiedSnapshot = DiceSnapshot & Readonly<{
  dice: readonly (ExperimentDie & Readonly<{ currentOutcome: DieOutcome }>)[]
}>
export type SelectedSnapshot = DiceSnapshot & Readonly<{ selection: RerollSelection }>

/** Copy caller-owned plain state, protecting nested public snapshot boundaries. */
function snapshot<T extends DiceSnapshot>(state: T): T {
  const selections = state.selections.map(selection => Object.freeze({
    ...selection, targets: Object.freeze([...selection.targets]),
  }))
  const dice = state.dice.map(die => Object.freeze({
    ...die,
    rolls: Object.freeze(die.rolls.map(roll => Object.freeze({ ...roll }))),
    interpretations: Object.freeze(die.interpretations.map(item => Object.freeze({ ...item }))),
  }))
  return Object.freeze({ ...state, dice: Object.freeze(dice), selections: Object.freeze(selections),
    ...('selection' in state ? { selection: selections[selections.length - 1] } : {}),
  }) as T
}

function validOutcome(value: unknown): value is DieOutcome {
  return value === 'miss' || value === 'hit' || value === 'crit'
}

function validSelection(selection: RerollSelection): boolean {
  return !!selection && typeof selection.stage === 'string' && !!selection.stage.trim()
    && typeof selection.policy === 'string' && !!selection.policy.trim()
    && Number.isSafeInteger(selection.budget) && selection.budget >= 0 && selection.budget <= 12
    && Number.isSafeInteger(selection.inputRevision) && selection.inputRevision >= 0
    && typeof selection.inputDice === 'string'
    && Array.isArray(selection.targets) && selection.targets.length <= selection.budget
    && selection.targets.every(id => typeof id === 'string' && !!id.trim())
    && new Set(selection.targets).size === selection.targets.length
    && (selection.selectedFace === undefined || (Number.isSafeInteger(selection.selectedFace) && selection.selectedFace >= 1))
}

function requireHistory(state: DiceSnapshot): void {
  if (!state || state.retention !== 'complete-history' || !Array.isArray(state.dice) || !Array.isArray(state.selections)) {
    throw new Error('This stage requires complete-history dice state; count aggregation discarded the required information')
  }
  if (!Number.isSafeInteger(state.revision) || state.revision < 0) throw new Error('Invalid snapshot revision')
  const ids = new Set<string>()
  for (const die of state.dice) {
    if (!die || typeof die.id !== 'string' || !die.id.trim() || ids.has(die.id)) throw new Error('Invalid or duplicate die identity')
    ids.add(die.id)
    if (!Array.isArray(die.rolls) || die.rolls.length === 0 || !die.rolls.every((roll: RollFact) =>
      roll && Number.isSafeInteger(roll.face) && roll.face >= 1 && typeof roll.stage === 'string' && !!roll.stage.trim())
      || die.face !== die.rolls[die.rolls.length - 1].face) throw new Error('Invalid die face or roll provenance')
    if (!Array.isArray(die.interpretations) || !die.interpretations.every((item: Interpretation) =>
      item && validOutcome(item.outcome) && Number.isSafeInteger(item.rollRevision)
      && item.rollRevision >= 0 && item.rollRevision < die.rolls.length
      && typeof item.stage === 'string' && !!item.stage.trim()
      && typeof item.reference === 'string' && !!item.reference.trim())) throw new Error('Invalid interpretation history')
    const latest = die.interpretations[die.interpretations.length - 1]
    if (die.currentOutcome !== undefined && (!validOutcome(die.currentOutcome) || !latest
      || latest.rollRevision !== die.rolls.length - 1 || latest.outcome !== die.currentOutcome)) {
      throw new Error('Invalid current classification; classify replacements first')
    }
  }
  if (!state.selections.every(validSelection)) throw new Error('Invalid historical reroll selection')
  if ('selection' in state && (!validSelection(state.selection as RerollSelection)
    || JSON.stringify(state.selection) !== JSON.stringify(state.selections[state.selections.length - 1]))) {
    throw new Error('Invalid active reroll selection; historical record does not match')
  }
}

function text(value: string, label: string): void {
  if (!value.trim()) throw new Error(`${label} must not be empty`)
}

function sidesValid(sides: number): void {
  if (!Number.isSafeInteger(sides) || sides < 1 || sides > 100_000) throw new Error('Die sides must be from 1 to 100000')
}

/** Each individual operation is bounded before allocating its alternatives. */
function expansion(sides: number, count: number): void {
  let branches = 1
  for (let i = 0; i < count; i++) {
    branches *= sides
    if (branches > 100_000) throw new Error('Operation branch limit exceeded; use fewer dice or fewer reroll targets')
  }
}

function fingerprint(state: DiceSnapshot): string { return JSON.stringify(state.dice) }

export function emptyExperiment(): DiceSnapshot {
  return snapshot({ retention: 'complete-history', revision: 0, dice: [], selections: [] })
}

export function rollDice(name: string, count: number, sides = 6): Stage<DiceSnapshot, DiceSnapshot> {
  text(name, 'Stage name')
  if (!Number.isSafeInteger(count) || count < 0 || count > 12) throw new Error('Dice count must be from 0 to 12')
  sidesValid(sides)
  return input => {
    requireHistory(input)
    expansion(sides, count)
    let alternatives: Distribution<DiceSnapshot> = certain(snapshot(input))
    const usedIds = new Set(input.dice.map(die => die.id))
    let nextId = 1
    for (let index = 0; index < count; index++) {
      while (usedIds.has(`die-${nextId}`)) nextId++
      const id = `die-${nextId}`
      usedIds.add(id)
      alternatives = alternatives.flatMap(entry => Array.from({ length: sides }, (_, faceIndex) => {
        const face = faceIndex + 1
        return { probability: entry.probability.multiply(new Fraction(1, sides)), value: snapshot({
          ...entry.value,
          revision: input.revision + 1,
          dice: [...entry.value.dice, { id, face,
            rolls: [{ face, stage: name }], interpretations: [] }],
        }) }
      }))
    }
    return alternatives
  }
}

export function classifyDice(name: string, hitTarget: number, critTarget: number): Stage<DiceSnapshot, ClassifiedSnapshot> {
  text(name, 'Stage name')
  if (![hitTarget, critTarget].every(value => Number.isSafeInteger(value) && value >= 2 && value <= 6)) {
    throw new Error('Thresholds must be from 2 to 6')
  }
  return input => {
    requireHistory(input)
    const dice = input.dice.map(die => {
      const outcome: DieOutcome = die.face >= critTarget ? 'crit' : die.face >= hitTarget ? 'hit' : 'miss'
      return { ...die, currentOutcome: outcome, interpretations: [...die.interpretations, {
        outcome, rollRevision: die.rolls.length - 1, stage: name, reference: `hit ${hitTarget}+, crit ${critTarget}+`,
      }] }
    })
    return certain(snapshot({ ...input, revision: input.revision + 1, dice }))
  }
}

/** Deterministic choice adds no random mass; order is the policy's explicit tie break. */
export function selectReroll(
  name: string, policy: string, budget: number,
  choose: (state: DiceSnapshot) => readonly string[] | RerollChoice, selectedFace?: number,
): Stage<DiceSnapshot, SelectedSnapshot> {
  text(name, 'Stage name'); text(policy, 'Policy reference')
  if (!Number.isSafeInteger(budget) || budget < 0 || budget > 12) throw new Error('Reroll budget must be from 0 to 12')
  if (selectedFace !== undefined && (!Number.isSafeInteger(selectedFace) || selectedFace < 1)) throw new Error('Selected face must be a positive integer')
  return input => {
    requireHistory(input)
    const state = snapshot(input)
    const choice = choose(state)
    const recorded = 'targets' in choice ? choice : { targets: choice, selectedFace }
    const targets = [...recorded.targets]
    const face = recorded.selectedFace
    if (face !== undefined && (!Number.isSafeInteger(face) || face < 1)) throw new Error('Selected face must be a positive integer')
    if (targets.length > budget || new Set(targets).size !== targets.length) throw new Error('Selection exceeds its budget or contains duplicate targets')
    for (const id of targets) {
      const die = state.dice.find(item => item.id === id)
      if (!die) throw new Error(`Unknown die: ${id}`)
      if (die.rolls.length !== 1) throw new Error(`Die ${id} was already rerolled`)
      if (face !== undefined && die.face !== face) throw new Error(`Die ${id} does not show selected face ${face}`)
    }
    const selection: RerollSelection = { stage: name, policy, budget, targets, selectedFace: face,
      inputRevision: state.revision, inputDice: fingerprint(state) }
    return certain(snapshot({ ...state, revision: state.revision + 1,
      selections: [...state.selections, selection], selection }))
  }
}

export function rerollSelected(name: string, sides = 6): Stage<SelectedSnapshot, DiceSnapshot> {
  text(name, 'Stage name'); sidesValid(sides)
  return input => {
    requireHistory(input)
    const selection = input.selection
    if (!selection || input.revision !== selection.inputRevision + 1 || fingerprint(input) !== selection.inputDice) {
      throw new Error('Reroll selection is missing or stale; select targets again')
    }
    if (selection.targets.length > selection.budget || new Set(selection.targets).size !== selection.targets.length) {
      throw new Error('Invalid recorded reroll targets or budget')
    }
    for (const id of selection.targets) {
      const die = input.dice.find(item => item.id === id)
      if (!die || die.rolls.length !== 1) throw new Error(`Reroll target ${id} is missing or already rerolled`)
      if (selection.selectedFace !== undefined && die.face !== selection.selectedFace) throw new Error('Recorded selected face is no longer applicable')
    }
    expansion(sides, selection.targets.length)
    // Drop the active selection, retaining its history for inspection.
    const base: DiceSnapshot = snapshot({ retention: input.retention, revision: input.revision + 1,
      dice: input.dice, selections: input.selections })
    let alternatives: Distribution<DiceSnapshot> = certain(base)
    for (const id of selection.targets) {
      alternatives = alternatives.flatMap(entry => Array.from({ length: sides }, (_, faceIndex) => {
        const face = faceIndex + 1
        return { probability: entry.probability.multiply(new Fraction(1, sides)), value: snapshot({
          ...entry.value, dice: entry.value.dice.map(die => die.id !== id ? die : {
            ...die, face, currentOutcome: undefined, rolls: [...die.rolls, { face, stage: name }],
          }),
        }) }
      }))
    }
    return alternatives
  }
}

export function assignOutcome(
  name: string, reference: string, targetId: string, outcome: DieOutcome,
): Stage<ClassifiedSnapshot, ClassifiedSnapshot> {
  text(name, 'Stage name'); text(reference, 'Rule or policy reference')
  if (!['miss', 'hit', 'crit'].includes(outcome)) throw new Error('Unknown assigned outcome')
  return input => {
    requireHistory(input)
    if (!input.dice.some(die => die.id === targetId)) throw new Error(`Unknown die: ${targetId}`)
    for (const die of input.dice) {
      const current = die.interpretations[die.interpretations.length - 1]
      if (!die.currentOutcome || !current || current.rollRevision !== die.rolls.length - 1 || current.outcome !== die.currentOutcome) {
        throw new Error('Assignment requires a valid current classification; classify replacements first')
      }
    }
    const dice = input.dice.map(die => die.id !== targetId ? { ...die, currentOutcome: die.currentOutcome! } : {
      ...die, currentOutcome: outcome, interpretations: [...die.interpretations, {
        outcome, rollRevision: die.rolls.length - 1, stage: name, reference,
      }],
    })
    return certain(snapshot({ ...input, revision: input.revision + 1, dice }))
  }
}
