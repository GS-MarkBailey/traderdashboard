export const MARKET_COLUMNS = [
  { key: 'goals', label: 'Goals' },
  { key: 'headedGoal', label: 'Headed Goal' },
  { key: 'goalOotB', label: 'Goal OotB' },
  { key: 'assists', label: 'Assists' },
  { key: 'yellowCards', label: 'Yellow Cards' },
  { key: 'redCards', label: 'Red Cards' },
  { key: 'shots', label: 'Shots' },
  { key: 'sot', label: 'Shots on Target' },
  { key: 'foulsCommitted', label: 'Fouls Committed' },
  { key: 'foulsWon', label: 'Fouls Won' },
] as const

export type MarketKey = (typeof MARKET_COLUMNS)[number]['key']

export type TeamSide = 'home' | 'away'

import type { BookmakerId } from '../lib/bookmakers'

export type { BookmakerId }

export type MainMarketSectionId =
  | 'goals'
  | 'corners'
  | 'cards'
  | 'shotsOnTarget'
  | 'shots'

export type MainMarketKey =
  | 'totalGoalsOu'
  | 'matchResult'
  | 'nextTeamToScore'
  | 'asianHandicap'
  | 'halfTimeTotalGoals'
  | 'extraTimeTotalGoals'
  | 'extraTimeMatchResult'
  | 'extraTimeAsianHandicap'
  | 'toWinTie'
  | 'homeTeamTotalGoalsOu'
  | 'cornersOu'
  | 'cornersAsianHandicap'
  | 'cornersMatchResult'
  | 'cornersHomeTeamOu'
  | 'cornersAwayTeamOu'
  | 'cardsTotal'
  | 'cardsAsianHandicap'
  | 'cardsHomeTeamOu'
  | 'cardsAwayTeamOu'
  | 'totalSotOu'
  | 'totalSotHomeTeamOu'
  | 'totalSotAwayTeamOu'
  | 'totalShotsOu'
  | 'totalShotsHomeTeamOu'
  | 'totalShotsAwayTeamOu'

export type MainMarketsLayout = 'stacked' | 'columns'

export type MainMarketSectionStatus = 'trading' | 'suspended' | 'closed'

export interface MainMarketSectionScore {
  home: number
  away: number
}

export type MainMarketPriceColumnKind = 'price' | 'line'

export interface MainMarketPriceColumn {
  label: string
  kind: MainMarketPriceColumnKind
  /** Section strength slot that drives BM0 for price columns. */
  strengthSlotIndex: number
  /** Line value shown in line columns (e.g. 2.5). */
  line?: number
}

export const MAIN_MARKET_MAX_PRICE_COLUMNS = 3

export interface MainMarketPriceSnapshot {
  columns: MainMarketPriceColumn[]
  bookmaker: BookmakerId
  primaryPrices: (number | null)[]
  averagePrices: (number | null)[]
  averageBookmakersByColumn: BookmakerPriceQuote[][]
}

export interface MainMarketSettings {
  sectionStrengths: Record<MainMarketSectionId, number[]>
  sectionStatus: Record<MainMarketSectionId, MainMarketSectionStatus>
  sectionScores: Record<MainMarketSectionId, MainMarketSectionScore>
  markets: Record<MainMarketKey, MainMarketPriceSnapshot>
}

export interface MainMarketDefinition {
  key: MainMarketKey
  label: string
}

export interface MainMarketSectionConfig {
  id: MainMarketSectionId
  label: string
  layout: 'wide' | 'narrow'
  strengthSlotCount: number
  strengthLines: readonly number[]
  markets: MainMarketDefinition[]
}

export interface MainMarketSetting {
  primaryLine: number
  strengths: number[]
}

export type LegacyMainMarketSettings = Record<MarketKey, MainMarketSetting>

export interface BookmakerPriceQuote {
  bookmaker: BookmakerId
  price: number
}

export interface LinePriceQuote {
  line: number
  price: number
}

export interface PlayerMarket {
  strength: number
  statsCount: number
  suspended: boolean
  ourLine: number
  primaryPrice: number
  primaryLine: number
  averagePrice: number
  averageBookmakers: BookmakerPriceQuote[]
  linePrices: LinePriceQuote[]
  bookmaker: BookmakerId
}

export interface Player {
  id: string
  name: string
  team: TeamSide
  teamBadge: string
  active: boolean
  markets: Record<MarketKey, PlayerMarket>
}

export type StrengthMode = 'absolute' | 'relative'

export type TeamFilter = 'all' | 'home' | 'away'
export type PricingFilter = 'all' | 'priced' | 'unpriced'
export type StatusFilter = 'all' | 'active' | 'inactive'
export type IssueFilter = 'all' | 'highlighted'

export interface TableFilters {
  search: string
  team: TeamFilter
  pricing: PricingFilter
  status: StatusFilter
  issues: IssueFilter
}

export interface Fixture {
  id: string
  homeTeam: string
  awayTeam: string
  traderName: string
  /** ISO 8601 kickoff datetime. */
  kickoffAt: string
  tournament: string
}

export interface FixtureLeague {
  id: string
  name: string
  logoUrl: string
  fixtures: Fixture[]
}

export interface FixtureCountry {
  id: string
  name: string
  /** ISO 3166-1 alpha-2 or flagcdn subdivision code (e.g. gb-eng). */
  countryCode: string
  leagues: FixtureLeague[]
}

export interface FixtureSport {
  id: string
  name: string
  /** Sporticon slug — PNG filename in public/sports/ (without extension). */
  iconSlug: string
  countries: FixtureCountry[]
}

export type FixtureTaxonomy = FixtureSport[]

export interface CellValidation {
  hasZeroStrength: boolean
  hasPriceIssue: boolean
  hasLineIssue: boolean
  hasAnyIssue: boolean
}

export interface IssueTimelinePoint {
  minute: number
  issueCells: number
  unpricedCells: number
  priceIssueCells: number
  lineIssueCells: number
}
