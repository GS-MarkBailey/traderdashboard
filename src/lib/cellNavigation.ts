import type { MarketKey, Player, PlayerMarket, StrengthMode } from '../types/trading'
import { MARKET_COLUMNS } from '../types/trading'
import {
  calculatePriceFromStrength,
  getEffectiveStrength,
  validateMarketCell,
} from './pricing'
import { proposalKey } from './proposals'

export function marketNeedsAttention(
  market: PlayerMarket,
  strengthMode: StrengthMode,
  maxStrength: number,
  hasProposal: boolean,
): boolean {
  if (hasProposal) return true
  if (market.suspended) return false

  const effectiveStrength = getEffectiveStrength(
    market.strength,
    strengthMode,
    maxStrength,
  )
  const ourPrice = calculatePriceFromStrength(effectiveStrength)
  return validateMarketCell(market, ourPrice).hasAnyIssue
}

export function buildOrderedCellKeys(players: Player[]): string[] {
  const keys: string[] = []

  for (const player of players) {
    for (const column of MARKET_COLUMNS) {
      keys.push(proposalKey(player.id, column.key))
    }
  }

  return keys
}

export function buildAttentionCellKeys(
  players: Player[],
  proposalKeys: ReadonlySet<string>,
  strengthMode: StrengthMode,
  maxStrength: number,
): Set<string> {
  const keys = new Set<string>()

  for (const player of players) {
    for (const column of MARKET_COLUMNS) {
      const key = proposalKey(player.id, column.key)
      const market = player.markets[column.key as MarketKey]

      if (
        marketNeedsAttention(
          market,
          strengthMode,
          maxStrength,
          proposalKeys.has(key),
        )
      ) {
        keys.add(key)
      }
    }
  }

  return keys
}

export function findNextAttentionCellKey(
  orderedKeys: string[],
  attentionKeys: ReadonlySet<string>,
  currentKey: string,
): string | null {
  if (attentionKeys.size === 0 || orderedKeys.length === 0) return null

  const currentIndex = orderedKeys.indexOf(currentKey)
  const startIndex = currentIndex === -1 ? -1 : currentIndex

  for (let offset = 1; offset <= orderedKeys.length; offset += 1) {
    const index = (startIndex + offset + orderedKeys.length) % orderedKeys.length
    const key = orderedKeys[index]
    if (attentionKeys.has(key)) return key
  }

  return null
}

export function focusStrengthInput(cellKey: string): void {
  const el = document.querySelector<HTMLInputElement>(
    `[data-strength-input][data-cell-key="${CSS.escape(cellKey)}"]`,
  )
  if (!el) return

  el.focus()
  el.select()
  el.scrollIntoView({ block: 'nearest', inline: 'nearest' })
}
