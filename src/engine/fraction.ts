function integer(value: number | bigint): bigint {
  if (typeof value === 'number' && !Number.isSafeInteger(value)) {
    throw new Error('Fractions require safe integers or bigint values')
  }
  return BigInt(value)
}

/** Immutable, reduced exact rational arithmetic. */
export class Fraction {
  readonly numerator: bigint
  readonly denominator: bigint

  constructor(numerator: number | bigint, denominator: number | bigint = 1) {
    let n = integer(numerator)
    let d = integer(denominator)
    if (d === 0n) throw new Error('Denominator must not be zero')
    if (d < 0n) { n = -n; d = -d }
    let a = n < 0n ? -n : n
    let b = d
    while (b !== 0n) { const remainder = a % b; a = b; b = remainder }
    this.numerator = n / a
    this.denominator = d / a
    Object.freeze(this)
  }

  add(other: Fraction): Fraction {
    return new Fraction(
      this.numerator * other.denominator + other.numerator * this.denominator,
      this.denominator * other.denominator,
    )
  }

  multiply(other: Fraction): Fraction {
    return new Fraction(this.numerator * other.numerator, this.denominator * other.denominator)
  }

  equals(other: Fraction): boolean {
    return this.numerator === other.numerator && this.denominator === other.denominator
  }

  toNumber(): number {
    return Number(this.numerator) / Number(this.denominator)
  }

  toString(): string {
    return this.denominator === 1n ? `${this.numerator}` : `${this.numerator}/${this.denominator}`
  }

  /** Rounded percentage display without converting large bigint values to floats. */
  toPercentage(decimalPlaces = 2): string {
    if (!Number.isInteger(decimalPlaces) || decimalPlaces < 0 || decimalPlaces > 10) {
      throw new Error('Percentage precision must be an integer from 0 to 10')
    }
    const scale = 10n ** BigInt(decimalPlaces)
    const absolute = this.numerator < 0n ? -this.numerator : this.numerator
    const rounded = (absolute * 100n * scale * 2n + this.denominator) / (2n * this.denominator)
    const sign = this.numerator < 0n && rounded !== 0n ? '-' : ''
    const decimals = decimalPlaces === 0 ? '' : `.${(rounded % scale).toString().padStart(decimalPlaces, '0')}`
    return `${sign}${rounded / scale}${decimals}%`
  }

  toJSON(): string { return this.toString() }
}
