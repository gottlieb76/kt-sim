import { ProbabilityTree } from '../engine'
import { calculatePool, poolSummary } from '../engine/pool'
import type { PoolConfig } from '../engine/pool'

/** Coordinates evaluation and derived views without React or browser dependencies. */
export function evaluatePool(config: PoolConfig, stageIndex: number | null) {
  try {
    if (stageIndex !== null && (!Number.isSafeInteger(stageIndex) || stageIndex < 0)) {
      throw new Error('Stage selection must be a nonnegative integer')
    }
    const stages = calculatePool(config).map(stage => ({ ...stage, summary: poolSummary(stage.distribution) }))
    const selectedIndex = Math.max(0, Math.min(stageIndex ?? stages.length - 1, stages.length - 1))
    const selected = stages[selectedIndex]
    const tree = ProbabilityTree.from('Results', selected.distribution)
    return {
      status: 'ready' as const, stages, selectedIndex, selected,
      summary: selected.summary, baseline: stages[0].summary,
      successes: tree.evaluate(state => state.hits + state.crits),
      joint: tree.evaluate(state => `${state.hits},${state.crits}`),
    }
  } catch (error) {
    return { status: 'error' as const, message: error instanceof Error ? error.message : 'Calculation failed. Reset the example and try again.' }
  }
}
export type PoolAnalysis = ReturnType<typeof evaluatePool>
