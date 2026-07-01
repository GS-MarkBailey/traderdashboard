import type { CellValidation, PlayerMarket, PricingFilter, StrengthMode } from '../types/trading'
import { pricesEqual } from './proposals'

const MIN_PRICE = 0.01
const MAX_PRICE = 250
const MIN_STRENGTH = 0.0001
const STRENGTH_AT_MIN_PRICE = 1
const PRICE_RATIO = MAX_PRICE / MIN_PRICE
const PRICE_DEVIATION_THRESHOLD = 0.02

function roundPrice(value: number): number {
  return Math.round(value * 100) / 100
}

export function clampStrength(value: number): number {
  return Math.min(1, Math.max(0, value))
}

export function formatStrength(value: number): string {
  return clampStrength(value).toFixed(4)
}

export function parseStrengthInput(raw: string): number {
  const parsed = Number.parseFloat(raw)
  if (Number.isNaN(parsed)) return 0
  return clampStrength(parsed)
}

export function adjustStrength(value: number, delta: number): number {
  return clampStrength(Math.round((value + delta) * 10000) / 10000)
}

export function calculatePriceFromStrength(strength: number): number | null {
  if (strength <= 0) return null

  const clampedStrength = clampStrength(strength)
  if (clampedStrength >= STRENGTH_AT_MIN_PRICE) return MIN_PRICE
  if (clampedStrength <= MIN_STRENGTH) return MAX_PRICE

  const exponent = (1 - clampedStrength) / (1 - MIN_STRENGTH)
  const raw = MIN_PRICE * PRICE_RATIO ** exponent
  return roundPrice(Math.min(MAX_PRICE, Math.max(MIN_PRICE, raw)))
}

export function strengthForPrice(price: number): number {
  const clampedPrice = Math.min(MAX_PRICE, Math.max(MIN_PRICE, price))
  if (clampedPrice <= MIN_PRICE) return STRENGTH_AT_MIN_PRICE
  if (clampedPrice >= MAX_PRICE) return MIN_STRENGTH

  const exponent =
    Math.log(clampedPrice / MIN_PRICE) / Math.log(PRICE_RATIO)
  return clampStrength(1 - exponent * (1 - MIN_STRENGTH))
}

/** Strength whose derived price is within threshold of the primary bookmaker price. */
export function strengthAlignedToPrimaryPrice(primaryPrice: number): number {
  const target = roundPrice(Math.min(MAX_PRICE, Math.max(MIN_PRICE, primaryPrice)))
  if (target <= MIN_PRICE) return STRENGTH_AT_MIN_PRICE

  let low = MIN_STRENGTH
  let high = STRENGTH_AT_MIN_PRICE
  let bestStrength = strengthForPrice(target)
  let bestDelta = Number.POSITIVE_INFINITY

  for (let i = 0; i < 64; i += 1) {
    const mid = (low + high) / 2
    const price = calculatePriceFromStrength(mid)
    if (price === null) break

    const delta = Math.abs(price - target) / target
    if (delta < bestDelta) {
      bestDelta = delta
      bestStrength = mid
    }

    if (delta <= PRICE_DEVIATION_THRESHOLD) {
      return clampStrength(mid)
    }

    if (price > target) {
      low = mid
    } else {
      high = mid
    }
  }

  return clampStrength(bestStrength)
}

export function pricesWithinPrimaryThreshold(
  ourPrice: number | null,
  primaryPrice: number,
): boolean {
  if (ourPrice === null || primaryPrice <= 0) return false
  return (
    Math.abs(ourPrice - primaryPrice) / primaryPrice <= PRICE_DEVIATION_THRESHOLD
  )
}

export function formatPrice(price: number | null): string {
  if (price === null) return '—'
  return price.toFixed(2)
}

export function formatLine(line: number): string {
  return Number.isInteger(line) ? line.toFixed(1) : line.toFixed(1)
}

export function getEffectiveStrength(
  strength: number,
  mode: StrengthMode,
  maxStrengthInMatch: number,
): number {
  if (mode === 'absolute' || maxStrengthInMatch <= 0) return strength
  return strength / maxStrengthInMatch
}

export function strengthChangesPrice(
  committedStrength: number,
  proposedStrength: number,
  strengthMode: StrengthMode,
  maxStrengthInMatch: number,
): boolean {
  const committedPrice = calculatePriceFromStrength(
    getEffectiveStrength(committedStrength, strengthMode, maxStrengthInMatch),
  )
  const proposedPrice = calculatePriceFromStrength(
    getEffectiveStrength(proposedStrength, strengthMode, maxStrengthInMatch),
  )
  return !pricesEqual(committedPrice, proposedPrice)
}

export function validateMarketCell(
  market: PlayerMarket,
  ourPrice: number | null,
): CellValidation {
  const hasZeroStrength = ourPrice === null
  const hasPriceIssue =
    ourPrice !== null &&
    market.primaryPrice > 0 &&
    Math.abs(ourPrice - market.primaryPrice) / market.primaryPrice >
      PRICE_DEVIATION_THRESHOLD

  const hasLineIssue = market.ourLine !== market.primaryLine

  return {
    hasZeroStrength,
    hasPriceIssue,
    hasLineIssue,
    hasAnyIssue: hasZeroStrength || hasPriceIssue || hasLineIssue,
  }
}

export function validateMainMarketPriceColumn(
  ourPrice: number | null,
  primaryPrice: number | null,
): Pick<CellValidation, 'hasZeroStrength' | 'hasPriceIssue'> {
  const hasZeroStrength = ourPrice === null
  const hasPriceIssue =
    ourPrice !== null &&
    primaryPrice !== null &&
    primaryPrice > 0 &&
    Math.abs(ourPrice - primaryPrice) / primaryPrice > PRICE_DEVIATION_THRESHOLD

  return { hasZeroStrength, hasPriceIssue }
}

export function playerHasPricingIssue(
  markets: PlayerMarket[],
  strengthMode: StrengthMode,
  maxStrength: number,
): boolean {
  return markets.some((market) => {
    const effectiveStrength = getEffectiveStrength(
      market.strength,
      strengthMode,
      maxStrength,
    )
    const ourPrice = calculatePriceFromStrength(effectiveStrength)
    return validateMarketCell(market, ourPrice).hasAnyIssue
  })
}

export function isMarketPriced(
  market: PlayerMarket,
  strengthMode: StrengthMode,
  maxStrength: number,
): boolean {
  const effectiveStrength = getEffectiveStrength(
    market.strength,
    strengthMode,
    maxStrength,
  )
  return effectiveStrength > 0 && calculatePriceFromStrength(effectiveStrength) !== null
}

export function marketMatchesPricingFilter(
  market: PlayerMarket,
  filter: PricingFilter,
  strengthMode: StrengthMode,
  maxStrength: number,
): boolean {
  if (filter === 'all') return true
  const priced = isMarketPriced(market, strengthMode, maxStrength)
  return filter === 'priced' ? priced : !priced
}

export function playerMatchesPricingFilter(
  markets: PlayerMarket[],
  filter: PricingFilter,
  strengthMode: StrengthMode,
  maxStrength: number,
): boolean {
  if (filter === 'all') return true
  return markets.some((market) =>
    marketMatchesPricingFilter(market, filter, strengthMode, maxStrength),
  )
}

export function playerIsPriced(
  markets: PlayerMarket[],
  strengthMode: StrengthMode,
  maxStrength: number,
): boolean {
  return markets.some((market) =>
    isMarketPriced(market, strengthMode, maxStrength),
  )
}
