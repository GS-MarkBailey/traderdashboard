import type { MarketKey, Player, StrengthMode } from '../types/trading'
import { MARKET_COLUMNS } from '../types/trading'
import { strengthChangesPrice } from './pricing'

export interface StrengthProposal {
  strength: number
}

export type ProposalMap = Record<string, StrengthProposal>

export function proposalKey(playerId: string, marketKey: MarketKey): string {
  return `${playerId}:${marketKey}`
}

export function parseProposalKey(key: string): {
  playerId: string
  marketKey: MarketKey
} {
  const separatorIndex = key.indexOf(':')
  return {
    playerId: key.slice(0, separatorIndex),
    marketKey: key.slice(separatorIndex + 1) as MarketKey,
  }
}

export function strengthsEqual(a: number, b: number): boolean {
  return Math.abs(a - b) < 0.00005
}

export function pricesEqual(a: number | null, b: number | null): boolean {
  if (a === null && b === null) return true
  if (a === null || b === null) return false
  return a === b
}

export function countProposals(proposals: ProposalMap): number {
  return Object.keys(proposals).length
}

export function mergePendingProposal(
  proposals: ProposalMap,
  pending: { playerId: string; marketKey: MarketKey; strength: number } | undefined,
  players: Player[],
  strengthMode: StrengthMode,
  maxStrengthInMatch: number,
): ProposalMap {
  const toApply: ProposalMap = { ...proposals }

  if (!pending) return toApply

  const player = players.find((entry) => entry.id === pending.playerId)
  const committedStrength = player?.markets[pending.marketKey].strength ?? 0
  const key = proposalKey(pending.playerId, pending.marketKey)

  if (
    !strengthChangesPrice(
      committedStrength,
      pending.strength,
      strengthMode,
      maxStrengthInMatch,
    )
  ) {
    delete toApply[key]
  } else {
    toApply[key] = { strength: pending.strength }
  }

  return toApply
}

export function applyProposalsToPlayers(
  players: Player[],
  toApply: ProposalMap,
): Player[] {
  if (Object.keys(toApply).length === 0) return players

  return players.map((player) => {
    let markets = player.markets
    let changed = false

    for (const column of MARKET_COLUMNS) {
      const key = proposalKey(player.id, column.key)
      const proposal = toApply[key]
      if (!proposal) continue

      markets = {
        ...markets,
        [column.key]: {
          ...markets[column.key],
          strength: proposal.strength,
        },
      }
      changed = true
    }

    return changed ? { ...player, markets } : player
  })
}

export interface ProposalSummary {
  key: string
  playerId: string
  playerName: string
  teamBadge: string
  marketKey: MarketKey
  marketLabel: string
  committedStrength: number
  proposedStrength: number
  committedPrice: string
  proposedPrice: string
}
