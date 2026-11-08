import { certain, uniform } from './probability'
import type { Distribution, Stage } from './probability'

export function die(sides = 6): Distribution<number> {
  if (!Number.isSafeInteger(sides) || sides < 1 || sides > 100_000) {
    throw new Error('Die sides must be an integer between 1 and 100000')
  }
  return uniform(Array.from({ length: sides }, (_, index) => index + 1))
}

/** One reroll per application. Rerolled results are not recursively rerolled. */
export function rerollWhen<T>(
  predicate: (value: T) => boolean,
  replacement: Distribution<T>,
): Stage<T, T> {
  return value => predicate(value) ? replacement : certain(value)
}

/** Map faces to any named outcomes; missing faces are errors, not implicit misses. */
export function classifyFaces<Outcome extends string>(
  outcomes: Readonly<Record<number, Outcome>>,
): (face: number) => Outcome {
  return face => {
    if (!Object.hasOwn(outcomes, face)) throw new Error(`No outcome configured for face ${face}`)
    return outcomes[face]
  }
}
