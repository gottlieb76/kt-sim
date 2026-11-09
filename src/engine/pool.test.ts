import { describe, expect, it } from 'vitest'
import { Fraction } from './fraction'
import { calculatePool, poolSummary } from './pool'
import type { PoolConfig } from './pool'

const config: PoolConfig = { dice: 4, hitTarget: 3, critTarget: 6, rerolls: 1, policy: 'misses' }

describe('percentage display', () => {
  it('rounds exact ratios, including huge bigint operands', () => {
    expect(new Fraction(7, 12).toPercentage()).toBe('58.33%')
    expect(new Fraction(1, 6).toPercentage()).toBe('16.67%')
    expect(new Fraction(1, 8).toPercentage(0)).toBe('13%')
    expect(new Fraction(-1, 8).toPercentage(0)).toBe('-13%')
    expect(new Fraction(10n ** 400n, 3n * 10n ** 400n).toPercentage()).toBe('33.33%')
    expect(new Fraction(0).toPercentage()).toBe('0.00%')
    expect(() => new Fraction(1).toPercentage(-1)).toThrow()
  })
})

describe('dice pool calculator', () => {
  it('calculates the four dice, 3+, crit 6, one shared reroll example', () => {
    const stages = calculatePool(config)
    const initial = poolSummary(stages[0].distribution)
    const final = poolSummary(stages[1].distribution)
    expect(initial.successes.toString()).toBe('8/3')
    // Reroll succeeds with probability 2/3 whenever any original die missed.
    expect(final.successes.toString()).toBe('778/243')
    expect(initial.allSuccesses.toString()).toBe('16/81')
    // All successes initially, or exactly one miss rescued by the reroll.
    expect(final.allSuccesses.toString()).toBe('112/243')
    expect(final.crits.toString()).toBe('389/486')
  })

  it('matches independent exhaustive enumeration on two dice', () => {
    for (const policy of ['misses', 'twos', 'non-crits'] as const) {
      const counts = new Map<string, number>()
      for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) for (let replacement = 1; replacement <= 6; replacement++) {
        const faces = [a, b]
        let index = policy === 'twos' ? faces.findIndex(face => face === 2) : faces.findIndex(face => face < 3)
        if (index < 0 && policy === 'non-crits') index = faces.findIndex(face => face < 6)
        if (index >= 0) faces[index] = replacement
        const hits = faces.filter(face => face >= 3 && face < 6).length
        const crits = faces.filter(face => face === 6).length
        const key = `${hits},${crits}`
        counts.set(key, (counts.get(key) ?? 0) + 1)
      }
      const stages = calculatePool({ ...config, dice: 2, policy })
      const actual = new Map<string, Fraction>()
      for (const { value, probability } of stages[1].distribution) {
        const key = `${value.hits},${value.crits}`
        actual.set(key, (actual.get(key) ?? new Fraction(0)).add(probability))
      }
      expect(actual.size).toBe(counts.size)
      for (const [key, count] of counts) expect(actual.get(key)?.equals(new Fraction(count, 216))).toBe(true)
    }
  })

  it('never rerolls replacement dice, skips unavailable rerolls, and prioritizes crits', () => {
    const stages = calculatePool({ ...config, dice: 2, rerolls: 2, hitTarget: 6, critTarget: 2 })
    expect(poolSummary(stages[2].distribution).successes.toString()).toBe('35/18')
    expect(poolSummary(stages[2].distribution).crits.toString()).toBe('35/18')
    const single = calculatePool({ ...config, dice: 1, hitTarget: 4, policy: 'twos' })
    expect(poolSummary(single[1].distribution).successes.toString()).toBe('7/12')
  })

  it('conserves mass and dice counts at every stage for the largest supported pool', () => {
    for (const policy of ['misses', 'twos', 'non-crits'] as const) {
      for (const stage of calculatePool({ ...config, dice: 12, rerolls: 12, policy })) {
        const total = stage.distribution.reduce((sum, branch) => sum.add(branch.probability), new Fraction(0))
        expect(total.toString()).toBe('1')
        for (const { value } of stage.distribution) {
          expect(value.misses + value.hits + value.crits).toBe(12)
          expect(Math.min(value.misses, value.hits, value.crits, value.eligible, value.eligibleMisses)).toBeGreaterThanOrEqual(0)
          expect(value.eligibleMisses).toBeLessThanOrEqual(value.misses)
          expect(value.eligibleMisses).toBeLessThanOrEqual(value.eligible)
          expect(value.eligible).toBeLessThanOrEqual(12)
        }
      }
    }
  })

  it('validates configuration', () => {
    expect(() => calculatePool({ ...config, dice: 13 })).toThrow()
    expect(() => calculatePool({ ...config, rerolls: 5 })).toThrow()
    expect(() => calculatePool({ ...config, critTarget: 7 })).toThrow()
  })
})

it('Given two non-critical dice can be rerolled, When both budget slots are used, Then replacements stay ineligible', () => {
  const stages = calculatePool({ ...config, dice: 2, rerolls: 2, policy: 'non-crits' })
  // Each original die succeeds either as an untouched 6, or after a reroll of 1–5.
  expect(poolSummary(stages[2].distribution).allSuccesses.toString()).toBe('169/324')
})

it('matches independent original-die enumeration across budgets, policies, and threshold extremes', () => {
  for (const hitTarget of [2, 3, 6]) for (const critTarget of [2, 6]) {
    for (const policy of ['misses', 'twos', 'non-crits'] as const) for (const rerolls of [0, 1, 2]) {
      const counts = new Map<string, number>()
      for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) {
        // Decide all original target IDs before seeing any replacement.
        const original = [a, b]
        const candidates = [0, 1].filter(id => policy === 'twos' ? original[id] === 2
          : policy === 'misses' ? original[id] < Math.min(hitTarget, critTarget)
          : original[id] < critTarget)
        if (policy === 'non-crits') candidates.sort((left, right) =>
          Number(original[left] >= hitTarget) - Number(original[right] >= hitTarget) || left - right)
        const targets = candidates.slice(0, rerolls)
        // Enumerate two dummy replacement slots even if no replacement is needed.
        for (let r1 = 1; r1 <= 6; r1++) for (let r2 = 1; r2 <= 6; r2++) {
          const faces = [...original]
          targets.forEach((id, index) => { faces[id] = [r1, r2][index] })
          const crits = faces.filter(face => face >= critTarget).length
          const hits = faces.filter(face => face >= hitTarget && face < critTarget).length
          const key = `${hits},${crits}`
          counts.set(key, (counts.get(key) ?? 0) + 1)
        }
      }
      const stages = calculatePool({ dice: 2, hitTarget, critTarget, policy, rerolls })
      const actual = new Map<string, Fraction>()
      for (const { value, probability } of stages[rerolls].distribution) {
        const key = `${value.hits},${value.crits}`
        actual.set(key, (actual.get(key) ?? new Fraction(0)).add(probability))
        expect(value.misses + value.hits + value.crits).toBe(2)
        expect(probability.numerator >= 0n).toBe(true)
      }
      expect(actual.size).toBe(counts.size)
      for (const [key, count] of counts) expect(actual.get(key)?.toString()).toBe(new Fraction(count, 1296).toString())
    }
  }
})
