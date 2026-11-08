import { describe, expect, it } from 'vitest'
import { Fraction, ProbabilityTree, certain, classifyFaces, die, rerollWhen, uniform } from './index'

const d6 = die()
const classify = classifyFaces({ 1: 'miss', 2: 'miss', 3: 'miss', 4: 'hit', 5: 'hit', 6: 'crit' })
const roll = () => ProbabilityTree.from('D6', d6)

describe('exact fractions', () => {
  it('reduces fractions and performs exact arithmetic', () => {
    expect(new Fraction(2, -4).toString()).toBe('-1/2')
    expect(new Fraction(0, 6).toString()).toBe('0')
    expect(new Fraction(1, 2).add(new Fraction(1, 12)).toString()).toBe('7/12')
    expect(new Fraction(1, 6).multiply(new Fraction(1, 6)).toString()).toBe('1/36')
    expect(new Fraction(1, 2).toNumber()).toBe(0.5)
    expect(new Fraction(10n ** 30n, 2n * 10n ** 30n).equals(new Fraction(1, 2))).toBe(true)
    expect(JSON.stringify(new Fraction(1, 2))).toBe('"1/2"')
  })

  it('rejects invalid arithmetic inputs', () => {
    expect(() => new Fraction(1, 0)).toThrow()
    expect(() => new Fraction(0.5)).toThrow()
    expect(() => new Fraction(Number.MAX_SAFE_INTEGER + 1)).toThrow()
  })
})

describe('probability pipelines', () => {
  it('evaluates configurable miss, hit, and critical outcomes', () => {
    const totals = roll().map('Classify', classify).evaluate(value => value)
    expect(totals.get('miss')?.toString()).toBe('1/2')
    expect(totals.get('hit')?.toString()).toBe('1/3')
    expect(totals.get('crit')?.toString()).toBe('1/6')
    expect(roll().probabilityOf(face => face >= 4).toString()).toBe('1/2')
  })

  it('rerolls only an initial 2, preserving the original result in the trace', () => {
    const tree = roll().then('Reroll 2', rerollWhen(face => face === 2, d6))
    expect(tree.probabilityOf(face => face >= 4).toString()).toBe('7/12')
    expect(tree.branches).toHaveLength(11)
    const branch = tree.branches.find(branch => branch.history[0].value === 2 && branch.value === 6)!
    expect(branch.probability.toString()).toBe('1/36')
    expect(branch.history.map(step => step.value)).toEqual([2, 6])
    expect(branch.history[1].conditionalProbability.toString()).toBe('1/6')
    expect(branch.history[1].pathProbability.toString()).toBe('1/36')
    expect(tree.probabilityOf(() => true).toString()).toBe('1')
    const totals = tree.map('Classify', classify).evaluate(value => value)
    expect(totals.get('miss')?.toString()).toBe('5/12')
    expect(totals.get('hit')?.toString()).toBe('7/18')
    expect(totals.get('crit')?.toString()).toBe('7/36')
  })

  it('rerolls misses once, including possible failed rerolls', () => {
    expect(roll().then('Reroll misses', rerollWhen(face => face < 4, d6))
      .probabilityOf(face => face >= 4).toString()).toBe('3/4')
  })

  it('chains independent dice while retaining state', () => {
    const tree = roll().then('Second die', first => d6.map(second => ({
      value: { first, second: second.value }, probability: second.probability,
    })))
    expect(tree.probabilityOf(({ first, second }) => first + second === 7).toString()).toBe('1/6')
    expect(tree.probabilityOf(() => true).toString()).toBe('1')
    expect(tree.evaluate(({ first, second }) => first + second).get(2)?.toString()).toBe('1/36')
  })

  it('supports weighted conditional stages and additional outcome categories', () => {
    const tree = ProbabilityTree.from('Start', certain('start')).then('Weighted', () => [
      { value: 'special', probability: new Fraction(1, 4) },
      { value: 'ordinary', probability: new Fraction(3, 4) },
    ])
    expect(tree.evaluate(value => value).get('special')?.toString()).toBe('1/4')
    expect(classifyFaces({ 1: 'fumble', 2: 'special' })(1)).toBe('fumble')
    expect(() => classifyFaces({ 1: 'miss' })(2)).toThrow('No outcome')
  })

  it('conserves probability across varied thresholds and reroll policies', () => {
    for (let threshold = 1; threshold <= 7; threshold++) {
      for (let face = 1; face <= 6; face++) {
        const tree = roll().then('Reroll', rerollWhen(value => value === face, d6))
        const successes = 7 - threshold
        const expected = new Fraction(successes, 6)
          .add(new Fraction(successes, 36))
          .add(new Fraction(face >= threshold ? -1 : 0, 6))
        expect(tree.probabilityOf(value => value >= threshold).equals(expected)).toBe(true)
        expect(tree.probabilityOf(() => true).toString()).toBe('1')
      }
    }
  })

  it('rejects invalid distributions and limits branch expansion', () => {
    expect(() => uniform([])).toThrow()
    expect(() => die(0)).toThrow()
    expect(() => die(1.5)).toThrow()
    expect(() => ProbabilityTree.from('Empty', [])).toThrow()
    expect(() => ProbabilityTree.from('Invalid', [{ value: 1, probability: new Fraction(1, 2) }])).toThrow()
    expect(() => ProbabilityTree.from('Negative', [
      { value: 1, probability: new Fraction(-1) }, { value: 2, probability: new Fraction(2) },
    ])).toThrow()
    expect(() => roll().then('Invalid', () => [])).toThrow()
    expect(() => ProbabilityTree.from('D6', d6, 5)).toThrow('Branch limit')
    expect(() => ProbabilityTree.from('D6', d6, 6).then('Expand', () => d6)).toThrow('Branch limit')
    expect(ProbabilityTree.from('Zero', [
      { value: 1, probability: new Fraction(0) }, { value: 2, probability: new Fraction(1) },
    ]).branches).toHaveLength(1)
  })
})
