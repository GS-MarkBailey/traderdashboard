import type { LinePriceQuote } from '../types/trading'

export const ALTERNATE_LINES = [0.5, 1.5, 2.5, 3.5, 4.5] as const

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

export function createLinePrices(
  seed: number,
  anchorLine: number,
  anchorPrice: number,
): LinePriceQuote[] {
  return ALTERNATE_LINES.map((line, index) => {
    const lineDiff = line - anchorLine
    const multiplier =
      1 + lineDiff * 0.32 + (((seed + index * 3) % 7) - 3) * 0.008

    return {
      line,
      price: round2(Math.max(1.01, Math.min(250, anchorPrice * multiplier))),
    }
  })
}
