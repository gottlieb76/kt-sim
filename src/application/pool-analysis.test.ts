import { expect, it } from 'vitest'
import { evaluatePool } from './pool-analysis'

const config = { dice: 4, hitTarget: 3, critTarget: 6, rerolls: 1, policy: 'misses' as const }

it('prepares exact stage summaries and clamps selection after the budget shrinks', () => {
  const result = evaluatePool({ ...config, rerolls: 0 }, 12)
  expect(result.status).toBe('ready')
  if (result.status !== 'ready') throw new Error(result.message)
  expect(result.selectedIndex).toBe(0)
  expect(result.summary.successes.toString()).toBe('8/3')
  expect(result.successes.get(4)?.toString()).toBe('16/81')
})

it('returns an actionable configuration error without partial results', () => {
  const result = evaluatePool({ ...config, dice: 13 }, null)
  expect(result).toEqual({ status: 'error', message: 'Use 1–12 dice' })
})

it('rejects invalid stage selections with an actionable error', () => {
  for (const index of [NaN, 1.5, -1, Infinity]) {
    expect(evaluatePool(config, index)).toEqual({ status: 'error', message: 'Stage selection must be a nonnegative integer' })
  }
})
