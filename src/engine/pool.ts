import { Fraction } from './fraction'
import { certain, ProbabilityTree } from './probability'
import type { Distribution } from './probability'

export type RerollPolicy = 'misses' | 'twos' | 'non-crits'
export type PoolConfig = Readonly<{
  dice: number
  hitTarget: number
  critTarget: number
  rerolls: number
  policy: RerollPolicy
}>
export type PoolState = Readonly<{ misses: number; hits: number; crits: number; eligible: number }>
export type PoolStage = Readonly<{ name: string; distribution: Distribution<PoolState> }>

function key(state: PoolState): string {
  return `${state.misses},${state.hits},${state.crits},${state.eligible}`
}

function aggregate(tree: ProbabilityTree<PoolState>): Distribution<PoolState> {
  const states = new Map(tree.branches.map(branch => [key(branch.value), branch.value]))
  return [...tree.evaluate(key)].map(([id, probability]) => ({ value: states.get(id)!, probability }))
}

/** Exact count distributions, merging equivalent states between dice and rerolls. */
export function calculatePool(config: PoolConfig): readonly PoolStage[] {
  const { dice, hitTarget, critTarget, rerolls, policy } = config
  if (!Number.isInteger(dice) || dice < 1 || dice > 12) throw new Error('Use 1–12 dice')
  if (![hitTarget, critTarget].every(value => Number.isInteger(value) && value >= 2 && value <= 6)) {
    throw new Error('Thresholds must be from 2 to 6')
  }
  if (!Number.isInteger(rerolls) || rerolls < 0 || rerolls > dice) throw new Error('Invalid reroll budget')
  if (!['misses', 'twos', 'non-crits'].includes(policy)) throw new Error('Unknown reroll policy')

  const outcome = (face: number): 'misses' | 'hits' | 'crits' =>
    face >= critTarget ? 'crits' : face >= hitTarget ? 'hits' : 'misses'
  const eligible = (face: number) => policy === 'twos' ? face === 2
    : policy === 'misses' ? outcome(face) === 'misses' : outcome(face) !== 'crits'
  const faces = Array.from({ length: 6 }, (_, index) => index + 1)
  let distribution = certain<PoolState>({ misses: 0, hits: 0, crits: 0, eligible: 0 })
  for (let index = 0; index < dice; index++) {
    distribution = aggregate(ProbabilityTree.from('Pool', distribution).then('Roll die', state =>
      faces.map(face => ({
        value: { ...state, [outcome(face)]: state[outcome(face)] + 1, eligible: state.eligible + Number(eligible(face)) },
        probability: new Fraction(1, 6),
      }))))
  }
  const stages: PoolStage[] = [{ name: 'Initial roll', distribution }]
  for (let index = 0; index < rerolls; index++) {
    distribution = aggregate(ProbabilityTree.from('Pool', distribution).then('Reroll', state => {
      if (state.eligible === 0) return certain(state)
      // Misses first, then hits; the explicit face-2 policy follows its configured category.
      const removed = policy === 'twos' ? outcome(2) : state.misses > 0 ? 'misses' : 'hits'
      return faces.map(face => ({
        value: {
          ...state,
          [removed]: state[removed] - 1,
          [outcome(face)]: state[outcome(face)] - Number(removed === outcome(face)) + 1,
          eligible: state.eligible - 1,
        },
        probability: new Fraction(1, 6),
      }))
    }))
    stages.push({ name: `After reroll ${index + 1}`, distribution })
  }
  return stages
}

export function poolSummary(distribution: Distribution<PoolState>) {
  const expected = (count: (state: PoolState) => number) => distribution.reduce(
    (sum, branch) => sum.add(branch.probability.multiply(new Fraction(count(branch.value)))), new Fraction(0))
  return {
    successes: expected(state => state.hits + state.crits),
    crits: expected(state => state.crits),
    anyCrit: expected(state => Number(state.crits > 0)),
    allSuccesses: expected(state => Number(state.misses === 0)),
  }
}
