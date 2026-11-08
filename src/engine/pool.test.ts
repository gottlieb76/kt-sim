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
    for (const stage of calculatePool({ ...config, dice: 12, rerolls: 12 })) {
      const total = stage.distribution.reduce((sum, branch) => sum.add(branch.probability), new Fraction(0))
      expect(total.toString()).toBe('1')
      for (const { value } of stage.distribution) {
        expect(value.misses + value.hits + value.crits).toBe(12)
        expect(Math.min(value.misses, value.hits, value.crits, value.eligible)).toBeGreaterThanOrEqual(0)
      }
    }
  })

  it('validates configuration', () => {
    expect(() => calculatePool({ ...config, dice: 13 })).toThrow()
    expect(() => calculatePool({ ...config, rerolls: 5 })).toThrow()
    expect(() => calculatePool({ ...config, critTarget: 7 })).toThrow()
  })
})
