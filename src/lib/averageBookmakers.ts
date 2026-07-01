import type { BookmakerPriceQuote } from '../types/trading'
import type { BookmakerId } from './bookmakers'

const AVERAGE_CONTRIBUTOR_POOL: BookmakerId[] = [
  'bet365',
  'ladbrokes',
  'williamhill',
  'paddypower',
  'coral',
  'bwin',
  'unibet',
  'betonline',
  'boylesports',
  'spreadex',
]

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

export function createAverageBookmakerQuotes(
  seed: number,
  anchorPrice: number,
): { averageBookmakers: BookmakerPriceQuote[]; averagePrice: number } {
  const count = 5
  const selected: BookmakerId[] = []

  for (let i = 0; selected.length < count; i += 1) {
    const bookmaker =
      AVERAGE_CONTRIBUTOR_POOL[(seed + i * 7) % AVERAGE_CONTRIBUTOR_POOL.length]
    if (!selected.includes(bookmaker)) {
      selected.push(bookmaker)
    }
  }

  const averageBookmakers = selected.map((bookmaker, index) => ({
    bookmaker,
    price: round2(anchorPrice * (1 + (((seed + index) % 11) - 5) * 0.008)),
  }))
  const averagePrice = round2(
    averageBookmakers.reduce((sum, quote) => sum + quote.price, 0) /
      averageBookmakers.length,
  )

  return { averageBookmakers, averagePrice }
}
