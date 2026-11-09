import { describe, expect, it } from 'vitest'
import { Fraction } from '../engine'
import { calculatePool, poolSummary } from '../engine/pool'
import { mass } from './support/experiments'

// Acceptance criteria: story #4 — Define stage and extension contracts.
describe('Preserve the existing reduced calculator', () => {
  it('Given supported pool sizes 1–12, When evaluated without rerolls, Then exact all-success probabilities and dice counts remain valid', () => {
    for (let dice = 1; dice <= 12; dice++) {
      const stages = calculatePool({ dice, hitTarget: 4, critTarget: 6, rerolls: 0, policy: 'misses' })
      const distribution = stages[0].distribution
      // Independent-dice multiplication: each succeeds with probability 1/2.
      expect(poolSummary(distribution).allSuccesses.toString()).toBe(new Fraction(1n, 2n ** BigInt(dice)).toString())
      expect(mass(distribution).toString()).toBe('1')
      expect(distribution.every(({ value }) => value.misses + value.hits + value.crits === dice)).toBe(true)
    }
  })

  it('Given two dice and two non-crits rerolls, When every original non-crit is replaced, Then the corrected all-success probability stays 169/324', () => {
    const final = calculatePool({ dice: 2, hitTarget: 3, critTarget: 6, rerolls: 2, policy: 'non-crits' }).at(-1)!
    // Per original die: 1/6 untouched crit + (5/6)(4/6) replacement success = 13/18.
    expect(poolSummary(final.distribution).allSuccesses.toString()).toBe('169/324')
  })
})

