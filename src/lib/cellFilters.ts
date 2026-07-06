import type {
  Fixture,
  MainMarketSettings,
  MarketKey,
  Player,
  StrengthMode,
  TableFilters,
} from '../types/trading'
import { MARKET_COLUMNS } from '../types/trading'
import {
  calculatePriceFromStrength,
  getEffectiveStrength,
  marketMatchesPricingFilter,
  playerHasPricingIssue,
  playerMatchesPricingFilter,
  validateMarketCell,
} from './pricing'
import { proposalKey } from './proposals'
import { comparePlayersDefaultOrder } from './playerSort'

export interface FilteredCellRow {
  player: Player
  marketKey: MarketKey
  marketLabel: string
  cellKey: string
  fixtureId?: string
  competition?: string
}

function passesBasePlayerFilters(
  player: Player,
  filters: TableFilters,
  searchLower: string,
): boolean {
  if (searchLower && !player.name.toLowerCase().includes(searchLower)) {
    return false
  }

  if (filters.team !== 'all' && player.team !== filters.team) {
    return false
  }

  if (filters.status === 'active' && !player.active) return false
  if (filters.status === 'inactive' && player.active) return false

  return true
}

function marketHasHighlightedIssue(
  market: Player['markets'][MarketKey],
  strengthMode: StrengthMode,
  maxStrengthInMatch: number,
): boolean {
  const effectiveStrength = getEffectiveStrength(
    market.strength,
    strengthMode,
    maxStrengthInMatch,
  )
  const ourPrice = calculatePriceFromStrength(effectiveStrength)
  return validateMarketCell(market, ourPrice).hasAnyIssue
}

export function filterPlayersForGrid(
  players: Player[],
  filters: TableFilters,
  strengthMode: StrengthMode,
  maxStrengthInMatch: number,
): Player[] {
  const searchLower = filters.search.trim().toLowerCase()

  return players
    .filter((player) => {
      if (!passesBasePlayerFilters(player, filters, searchLower)) {
        return false
      }

      const marketValues = Object.values(player.markets)

      if (
        !playerMatchesPricingFilter(
          marketValues,
          filters.pricing,
          strengthMode,
          maxStrengthInMatch,
        )
      ) {
        return false
      }

      if (
        filters.issues === 'highlighted' &&
        !playerHasPricingIssue(marketValues, strengthMode, maxStrengthInMatch)
      ) {
        return false
      }

      return true
    })
    .sort(comparePlayersDefaultOrder)
}

export function filterCellRowsForList(
  players: Player[],
  filters: TableFilters,
  strengthMode: StrengthMode,
  maxStrengthInMatch: number,
): FilteredCellRow[] {
  const searchLower = filters.search.trim().toLowerCase()
  const rows: FilteredCellRow[] = []

  const filteredPlayers = players
    .filter((player) => passesBasePlayerFilters(player, filters, searchLower))
    .sort(comparePlayersDefaultOrder)

  for (const player of filteredPlayers) {
    for (const column of MARKET_COLUMNS) {
      const market = player.markets[column.key]

      if (
        !marketMatchesPricingFilter(
          market,
          filters.pricing,
          strengthMode,
          maxStrengthInMatch,
        )
      ) {
        continue
      }

      if (
        filters.issues === 'highlighted' &&
        !marketHasHighlightedIssue(market, strengthMode, maxStrengthInMatch)
      ) {
        continue
      }

      rows.push({
        player,
        marketKey: column.key,
        marketLabel: column.label,
        cellKey: proposalKey(player.id, column.key),
      })
    }
  }

  return rows
}

export interface TradingFixtureBundle {
  fixture: Fixture
  fixtureId: string
  competition: string
  country: string
  players: Player[]
  mainMarkets: MainMarketSettings
}

export interface TradingTableFilters extends TableFilters {
  competition: string
}

export function filterTradingCellRows(
  bundles: TradingFixtureBundle[],
  filters: TradingTableFilters,
  strengthMode: StrengthMode,
  maxStrengthInMatch: number,
): FilteredCellRow[] {
  const searchLower = filters.search.trim().toLowerCase()
  const rows: FilteredCellRow[] = []

  const visibleBundles =
    filters.competition === 'all'
      ? bundles
      : bundles.filter((bundle) => bundle.competition === filters.competition)

  for (const bundle of visibleBundles) {
    const filteredPlayers = bundle.players
      .filter((player) => passesBasePlayerFilters(player, filters, searchLower))
      .sort(comparePlayersDefaultOrder)

    for (const player of filteredPlayers) {
      for (const column of MARKET_COLUMNS) {
        const market = player.markets[column.key]

        if (
          !marketMatchesPricingFilter(
            market,
            filters.pricing,
            strengthMode,
            maxStrengthInMatch,
          )
        ) {
          continue
        }

        if (
          filters.issues === 'highlighted' &&
          !marketHasHighlightedIssue(market, strengthMode, maxStrengthInMatch)
        ) {
          continue
        }

        rows.push({
          player,
          marketKey: column.key,
          marketLabel: column.label,
          cellKey: proposalKey(player.id, column.key),
          fixtureId: bundle.fixtureId,
          competition: bundle.competition,
        })
      }
    }
  }

  return rows.sort(
    (left, right) =>
      (left.competition ?? '').localeCompare(right.competition ?? '') ||
      (left.fixtureId ?? '').localeCompare(right.fixtureId ?? '') ||
      comparePlayersDefaultOrder(left.player, right.player) ||
      left.marketLabel.localeCompare(right.marketLabel),
  )
}
