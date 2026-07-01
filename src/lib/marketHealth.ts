import type { MarketKey, Player, StrengthMode } from '../types/trading'
import { MARKET_COLUMNS } from '../types/trading'
import {
  calculatePriceFromStrength,
  getEffectiveStrength,
  validateMarketCell,
} from './pricing'
import { proposalKey, type ProposalMap } from './proposals'

export type CellHealthStatus =
  | 'healthy'
  | 'suspended'
  | 'unpriced'
  | 'price'
  | 'line'
  | 'multiple'

export interface CellHealthIssue {
  playerId: string
  playerName: string
  teamBadge: string
  team: Player['team']
  marketKey: MarketKey
  marketLabel: string
  status: CellHealthStatus
  detail: string
}

export interface MarketColumnHealth {
  marketKey: MarketKey
  marketLabel: string
  total: number
  healthy: number
  suspended: number
  unpriced: number
  priceIssues: number
  lineIssues: number
  issueCells: number
}

export interface MarketHealthSnapshot {
  totalCells: number
  activeCells: number
  healthyCells: number
  suspendedCells: number
  unpricedCells: number
  priceIssueCells: number
  lineIssueCells: number
  issueCells: number
  pendingProposals: number
  activePlayers: number
  inactivePlayers: number
  healthScore: number
  overallStatus: 'healthy' | 'attention' | 'critical'
  byMarket: MarketColumnHealth[]
  issues: CellHealthIssue[]
}

function classifyCell(
  market: Player['markets'][MarketKey],
  ourPrice: number | null,
): CellHealthStatus {
  const validation = validateMarketCell(market, ourPrice)

  if (market.suspended) return 'suspended'
  if (validation.hasZeroStrength) return 'unpriced'

  const hasPrice = validation.hasPriceIssue
  const hasLine = validation.hasLineIssue

  if (hasPrice && hasLine) return 'multiple'
  if (hasPrice) return 'price'
  if (hasLine) return 'line'
  return 'healthy'
}

function issueDetail(status: CellHealthStatus): string {
  switch (status) {
    case 'suspended':
      return 'Market suspended'
    case 'unpriced':
      return 'Not priced'
    case 'price':
      return 'Price off primary (>2%)'
    case 'line':
      return 'Line mismatch'
    case 'multiple':
      return 'Price and line issues'
    default:
      return 'Healthy'
  }
}

export const CELL_STATUS_DOT: Record<
  CellHealthStatus,
  { color: string; label: string }
> = {
  healthy: { color: '#d1d5db', label: 'Healthy' },
  suspended: { color: '#fbbf24', label: 'Suspended' },
  unpriced: { color: '#fca5a5', label: 'Unpriced' },
  price: { color: '#ef4444', label: 'Price drift' },
  line: { color: '#ef4444', label: 'Line mismatch' },
  multiple: { color: '#991b1b', label: 'Price + line' },
}

export function getCellHealthStatus(
  market: Player['markets'][MarketKey],
  ourPrice: number | null,
): CellHealthStatus {
  return classifyCell(market, ourPrice)
}

export function getCellStatusDetail(status: CellHealthStatus): string {
  return issueDetail(status)
}

const ISSUE_PRIORITY: Record<CellHealthStatus, number> = {
  multiple: 0,
  price: 1,
  line: 2,
  unpriced: 3,
  suspended: 4,
  healthy: 5,
}

export function buildMarketHealthSnapshot(
  players: Player[],
  proposals: ProposalMap,
  strengthMode: StrengthMode,
  maxStrengthInMatch: number,
): MarketHealthSnapshot {
  const byMarket = MARKET_COLUMNS.map((column) => ({
    marketKey: column.key,
    marketLabel: column.label,
    total: 0,
    healthy: 0,
    suspended: 0,
    unpriced: 0,
    priceIssues: 0,
    lineIssues: 0,
    issueCells: 0,
  }))

  const marketIndex = new Map(
    MARKET_COLUMNS.map((column, index) => [column.key, index]),
  )

  const issues: CellHealthIssue[] = []
  let totalCells = 0
  let activeCells = 0
  let healthyCells = 0
  let suspendedCells = 0
  let unpricedCells = 0
  let priceIssueCells = 0
  let lineIssueCells = 0
  let issueCells = 0

  for (const player of players) {
    for (const column of MARKET_COLUMNS) {
      const market = player.markets[column.key]
      const index = marketIndex.get(column.key)!
      const columnStats = byMarket[index]

      totalCells += 1
      columnStats.total += 1

      if (!market.suspended) {
        activeCells += 1
      }

      const proposal = proposals[proposalKey(player.id, column.key)]
      const strength = proposal?.strength ?? market.strength
      const effectiveStrength = getEffectiveStrength(
        strength,
        strengthMode,
        maxStrengthInMatch,
      )
      const ourPrice = calculatePriceFromStrength(effectiveStrength)
      const status = classifyCell(market, ourPrice)

      switch (status) {
        case 'healthy':
          healthyCells += 1
          columnStats.healthy += 1
          break
        case 'suspended':
          suspendedCells += 1
          columnStats.suspended += 1
          break
        case 'unpriced':
          unpricedCells += 1
          columnStats.unpriced += 1
          break
        case 'price':
          priceIssueCells += 1
          columnStats.priceIssues += 1
          break
        case 'line':
          lineIssueCells += 1
          columnStats.lineIssues += 1
          break
        case 'multiple':
          issueCells += 1
          priceIssueCells += 1
          lineIssueCells += 1
          columnStats.priceIssues += 1
          columnStats.lineIssues += 1
          break
      }

      if (status === 'unpriced' || status === 'price' || status === 'line') {
        issueCells += 1
        columnStats.issueCells += 1
      }

      if (status === 'multiple') {
        columnStats.issueCells += 1
      }

      if (status !== 'healthy' && status !== 'suspended') {
        issues.push({
          playerId: player.id,
          playerName: player.name,
          teamBadge: player.teamBadge,
          team: player.team,
          marketKey: column.key,
          marketLabel: column.label,
          status,
          detail: issueDetail(status),
        })
      }
    }
  }

  issues.sort(
    (a, b) =>
      ISSUE_PRIORITY[a.status] - ISSUE_PRIORITY[b.status] ||
      a.playerName.localeCompare(b.playerName) ||
      a.marketLabel.localeCompare(b.marketLabel),
  )

  const actionableCells = totalCells - suspendedCells
  const healthScore =
    actionableCells > 0
      ? Math.round((healthyCells / actionableCells) * 100)
      : 100

  let overallStatus: MarketHealthSnapshot['overallStatus'] = 'healthy'
  if (healthScore < 90 || unpricedCells > 0) {
    overallStatus = 'critical'
  } else if (healthScore < 98 || issueCells > 0) {
    overallStatus = 'attention'
  }

  return {
    totalCells,
    activeCells,
    healthyCells,
    suspendedCells,
    unpricedCells,
    priceIssueCells,
    lineIssueCells,
    issueCells,
    pendingProposals: Object.keys(proposals).length,
    activePlayers: players.filter((player) => player.active).length,
    inactivePlayers: players.filter((player) => !player.active).length,
    healthScore,
    overallStatus,
    byMarket,
    issues,
  }
}

export function getMaxStrengthInMatch(players: Player[], proposals: ProposalMap): number {
  if (players.length === 0) return 0

  return Math.max(
    ...players.flatMap((player) =>
      MARKET_COLUMNS.map((column) => {
        const proposal = proposals[proposalKey(player.id, column.key)]
        return proposal?.strength ?? player.markets[column.key].strength
      }),
    ),
  )
}
