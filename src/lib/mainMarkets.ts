import type {
  MainMarketKey,
  MainMarketPriceColumn,
  MainMarketPriceSnapshot,
  MainMarketSectionConfig,
  MainMarketSectionId,
  MainMarketSectionScore,
  MainMarketSectionStatus,
  MainMarketSettings,
  BookmakerPriceQuote,
} from '../types/trading'
import { createAverageBookmakerQuotes } from './averageBookmakers'
import { pickPrimaryBookmakerForCell, type BookmakerId } from './bookmakers'
import { calculatePriceFromStrength, clampStrength } from './pricing'

export const MAIN_MARKET_SLOT_COUNT = 6

export const MAIN_MARKET_GOALS_STRENGTH_LINES = [0.5, 1.5, 2.5, 3.5, 4.5, 5.5] as const

export const MAIN_MARKET_NARROW_STRENGTH_LINES = [0.5, 1.5] as const

export const DEFAULT_SECTION_SCORES: Record<
  MainMarketSectionId,
  MainMarketSectionScore
> = {
  goals: { home: 2, away: 0 },
  corners: { home: 5, away: 3 },
  cards: { home: 1, away: 2 },
  shotsOnTarget: { home: 4, away: 2 },
  shots: { home: 12, away: 8 },
}

export function formatSectionScore(score: MainMarketSectionScore): string {
  return `${score.home}:${score.away}`
}

export const MAIN_MARKET_SECTIONS: MainMarketSectionConfig[] = [
  {
    id: 'goals',
    label: 'Main × Goals',
    layout: 'wide',
    strengthSlotCount: 6,
    strengthLines: MAIN_MARKET_GOALS_STRENGTH_LINES,
    markets: [
      { key: 'totalGoalsOu', label: 'Total Goals O/U' },
      { key: 'matchResult', label: 'Match Result' },
      { key: 'nextTeamToScore', label: 'Next Team to Score' },
      { key: 'asianHandicap', label: 'Asian Handicap' },
      { key: 'halfTimeTotalGoals', label: 'Half-Time Total Goals' },
      { key: 'extraTimeTotalGoals', label: 'Extra-Time Total Goals' },
      { key: 'extraTimeMatchResult', label: 'Extra-Time Match Result' },
      { key: 'extraTimeAsianHandicap', label: 'Extra-Time Asian Handicap' },
      { key: 'toWinTie', label: 'To Win Tie' },
      { key: 'homeTeamTotalGoalsOu', label: 'Home Team Total Goals O/U' },
    ],
  },
  {
    id: 'corners',
    label: 'Corners',
    layout: 'narrow',
    strengthSlotCount: 2,
    strengthLines: MAIN_MARKET_NARROW_STRENGTH_LINES,
    markets: [
      { key: 'cornersOu', label: 'Corners O/U' },
      { key: 'cornersAsianHandicap', label: 'Corners Asian Handicap' },
      { key: 'cornersMatchResult', label: 'Corners Match Result' },
      { key: 'cornersHomeTeamOu', label: 'Corners Home Team O/U' },
      { key: 'cornersAwayTeamOu', label: 'Corners Away Team O/U' },
    ],
  },
  {
    id: 'cards',
    label: 'Cards',
    layout: 'narrow',
    strengthSlotCount: 2,
    strengthLines: MAIN_MARKET_NARROW_STRENGTH_LINES,
    markets: [
      { key: 'cardsTotal', label: 'Cards Total' },
      { key: 'cardsAsianHandicap', label: 'Cards Asian Handicap' },
      { key: 'cardsHomeTeamOu', label: 'Cards Home Team O/U' },
      { key: 'cardsAwayTeamOu', label: 'Cards Away Team O/U' },
    ],
  },
  {
    id: 'shotsOnTarget',
    label: 'Shots on Target',
    layout: 'narrow',
    strengthSlotCount: 2,
    strengthLines: MAIN_MARKET_NARROW_STRENGTH_LINES,
    markets: [
      { key: 'totalSotOu', label: 'Total Shots on Target O/U' },
      { key: 'totalSotHomeTeamOu', label: 'Total Shots on Target Home Team O/U' },
      { key: 'totalSotAwayTeamOu', label: 'Total Shots on Target Away Team O/U' },
    ],
  },
  {
    id: 'shots',
    label: 'Shots',
    layout: 'narrow',
    strengthSlotCount: 2,
    strengthLines: MAIN_MARKET_NARROW_STRENGTH_LINES,
    markets: [
      { key: 'totalShotsOu', label: 'Total Shots O/U' },
      { key: 'totalShotsHomeTeamOu', label: 'Total Shots Home Team O/U' },
      { key: 'totalShotsAwayTeamOu', label: 'Total Shots Away Team O/U' },
    ],
  },
]

const marketLabelByKey = new Map(
  MAIN_MARKET_SECTIONS.flatMap((section) =>
    section.markets.map((market) => [market.key, market.label] as const),
  ),
)

const marketSectionByKey = new Map(
  MAIN_MARKET_SECTIONS.flatMap((section) =>
    section.markets.map((market) => [market.key, section.id] as const),
  ),
)

export function getMainMarketLabel(marketKey: MainMarketKey): string {
  return marketLabelByKey.get(marketKey) ?? marketKey
}

const MAIN_MARKET_KEYS = MAIN_MARKET_SECTIONS.flatMap((section) =>
  section.markets.map((market) => market.key),
)

export function getMainMarketBookmaker(marketKey: MainMarketKey): BookmakerId {
  const index = MAIN_MARKET_KEYS.indexOf(marketKey)
  if (index === -1) {
    throw new Error(`Unknown main market: ${marketKey}`)
  }

  return pickPrimaryBookmakerForCell(index, MAIN_MARKET_KEYS.length)
}

export function getMainMarketSectionIdForMarket(
  marketKey: MainMarketKey,
): MainMarketSectionId {
  const sectionId = marketSectionByKey.get(marketKey)
  if (!sectionId) {
    throw new Error(`Unknown main market: ${marketKey}`)
  }
  return sectionId
}

export function getMainMarketSection(
  sectionId: MainMarketSectionId,
): MainMarketSectionConfig {
  const section = MAIN_MARKET_SECTIONS.find((item) => item.id === sectionId)
  if (!section) {
    throw new Error(`Unknown main market section: ${sectionId}`)
  }
  return section
}

function deriveSectionStrengths(slotCount: number, seed: number): number[] {
  const base = clampStrength(0.001 + (seed % 7) * 0.0001)

  return Array.from({ length: slotCount }, (_, index) => {
    const offset = (index - (slotCount - 1) / 2) * 0.00012
    return clampStrength(base + offset)
  })
}

export function getStrengthForMainMarketColumn(
  sectionStrengths: number[],
  columnIndex: number,
): number {
  return (
    sectionStrengths[columnIndex] ??
    sectionStrengths[sectionStrengths.length - 1] ??
    0
  )
}

export function getMainMarketBm0Price(
  sectionStrengths: number[],
  columnIndex: number,
): number | null {
  return calculatePriceFromStrength(
    getStrengthForMainMarketColumn(sectionStrengths, columnIndex),
  )
}

export function getMainMarketBm0Prices(
  marketKey: MainMarketKey,
  settings: MainMarketSettings,
): (number | null)[] {
  const snapshot = settings.markets[marketKey]
  if (!snapshot) return []

  const sectionId = getMainMarketSectionIdForMarket(marketKey)
  const sectionStrengths = settings.sectionStrengths[sectionId] ?? []

  return snapshot.columns.map((column) => {
    if (column.kind === 'line') return null
    return getMainMarketBm0Price(sectionStrengths, column.strengthSlotIndex)
  })
}

/** Outcome columns: home/over first, line always last when present. */
function ouPriceColumns(line: number): MainMarketPriceColumn[] {
  return [
    { label: 'Over', kind: 'price', strengthSlotIndex: 0 },
    { label: 'Under', kind: 'price', strengthSlotIndex: 1 },
    { label: 'Line', kind: 'line', strengthSlotIndex: 0, line },
  ]
}

function matchResultPriceColumns(): MainMarketPriceColumn[] {
  return [
    { label: 'Home', kind: 'price', strengthSlotIndex: 0 },
    { label: 'Draw', kind: 'price', strengthSlotIndex: 1 },
    { label: 'Away', kind: 'price', strengthSlotIndex: 2 },
  ]
}

function asianHandicapPriceColumns(line: number): MainMarketPriceColumn[] {
  return [
    { label: 'Home', kind: 'price', strengthSlotIndex: 0 },
    { label: 'Away', kind: 'price', strengthSlotIndex: 1 },
    { label: 'Line', kind: 'line', strengthSlotIndex: 0, line },
  ]
}

function twoWayPriceColumns(
  firstLabel: string,
  secondLabel: string,
): MainMarketPriceColumn[] {
  return [
    { label: firstLabel, kind: 'price', strengthSlotIndex: 0 },
    { label: secondLabel, kind: 'price', strengthSlotIndex: 1 },
  ]
}

function primaryLineForSection(section: MainMarketSectionConfig): number {
  return section.strengthLines[0] ?? 0.5
}

export function getMarketPriceColumns(
  marketKey: MainMarketKey,
  sectionId: MainMarketSectionId,
): MainMarketPriceColumn[] {
  const section = getMainMarketSection(sectionId)

  switch (marketKey) {
    case 'matchResult':
    case 'extraTimeMatchResult':
    case 'cornersMatchResult':
      return matchResultPriceColumns()

    case 'nextTeamToScore':
      return [
        { label: 'Home', kind: 'price', strengthSlotIndex: 0 },
        { label: 'No Goal', kind: 'price', strengthSlotIndex: 1 },
        { label: 'Away', kind: 'price', strengthSlotIndex: 2 },
      ]

    case 'toWinTie':
      return twoWayPriceColumns('Home', 'Away')

    case 'asianHandicap':
      return asianHandicapPriceColumns(0)
    case 'extraTimeAsianHandicap':
    case 'cornersAsianHandicap':
    case 'cardsAsianHandicap':
      return asianHandicapPriceColumns(-0.5)

    case 'totalGoalsOu':
      return ouPriceColumns(2.5)
    case 'halfTimeTotalGoals':
    case 'extraTimeTotalGoals':
    case 'homeTeamTotalGoalsOu':
      return ouPriceColumns(1.5)

    case 'cornersOu':
      return ouPriceColumns(10.5)
    case 'cornersHomeTeamOu':
    case 'cornersAwayTeamOu':
      return ouPriceColumns(4.5)

    case 'cardsTotal':
      return ouPriceColumns(3.5)
    case 'cardsHomeTeamOu':
    case 'cardsAwayTeamOu':
      return ouPriceColumns(1.5)

    case 'totalSotOu':
      return ouPriceColumns(8.5)
    case 'totalSotHomeTeamOu':
    case 'totalSotAwayTeamOu':
      return ouPriceColumns(primaryLineForSection(section))

    case 'totalShotsOu':
      return ouPriceColumns(22.5)
    case 'totalShotsHomeTeamOu':
    case 'totalShotsAwayTeamOu':
      return ouPriceColumns(primaryLineForSection(section))

    default:
      return ouPriceColumns(primaryLineForSection(section))
  }
}

function roundPrice(value: number): number {
  return Math.round(value * 100) / 100
}

function createInitialMarketSnapshot(
  marketKey: MainMarketKey,
  sectionId: MainMarketSectionId,
  sectionStrengths: number[],
  seed: number,
): MainMarketPriceSnapshot {
  const columns = getMarketPriceColumns(marketKey, sectionId)
  const bookmaker = getMainMarketBookmaker(marketKey)

  const primaryPrices = columns.map((column, columnIndex) => {
    if (column.kind === 'line') return null

    const bm0 = getMainMarketBm0Price(sectionStrengths, column.strengthSlotIndex)
    if (bm0 === null) return null

    if (marketKey === 'nextTeamToScore' && columnIndex === 0) {
      return roundPrice(bm0 * 1.05)
    }

    if ((seed + columnIndex) % 13 === 0) {
      return roundPrice(bm0 * 0.97)
    }

    return bm0
  })

  const averageBookmakersByColumn: BookmakerPriceQuote[][] = []
  const averagePrices = primaryPrices.map((primary, columnIndex) => {
    if (primary === null) {
      averageBookmakersByColumn.push([])
      return null
    }

    const { averageBookmakers, averagePrice } = createAverageBookmakerQuotes(
      seed * 10 + columnIndex,
      primary,
    )
    averageBookmakersByColumn.push(averageBookmakers)
    return averagePrice
  })

  return {
    columns,
    bookmaker,
    primaryPrices,
    averagePrices,
    averageBookmakersByColumn,
  }
}

export function createDefaultMainMarkets(): MainMarketSettings {
  const sectionStrengths = MAIN_MARKET_SECTIONS.reduce(
    (acc, section, sectionIndex) => {
      acc[section.id] = deriveSectionStrengths(
        section.strengthSlotCount,
        sectionIndex + 1,
      )
      return acc
    },
    {} as Record<MainMarketSectionId, number[]>,
  )

  const sectionStatus = MAIN_MARKET_SECTIONS.reduce(
    (acc, section) => {
      acc[section.id] = 'trading'
      return acc
    },
    {} as Record<MainMarketSectionId, MainMarketSectionStatus>,
  )

  const sectionScores = { ...DEFAULT_SECTION_SCORES }

  const markets = MAIN_MARKET_SECTIONS.flatMap((section) =>
    section.markets.map((market, marketIndex) => ({
      key: market.key,
      sectionId: section.id,
      seed: marketIndex + 1,
    })),
  ).reduce(
    (acc, { key, sectionId, seed }) => {
      acc[key] = createInitialMarketSnapshot(
        key,
        sectionId,
        sectionStrengths[sectionId],
        seed,
      )
      return acc
    },
    {} as Record<MainMarketKey, MainMarketPriceSnapshot>,
  )

  return { sectionStrengths, sectionStatus, sectionScores, markets }
}

export function updateMainMarketSectionStatus(
  settings: MainMarketSettings,
  sectionId: MainMarketSectionId,
  status: MainMarketSectionStatus,
): MainMarketSettings {
  return {
    ...settings,
    sectionStatus: {
      ...settings.sectionStatus,
      [sectionId]: status,
    },
  }
}

export function updateMainMarketSectionStrength(
  settings: MainMarketSettings,
  sectionId: MainMarketSectionId,
  slotIndex: number,
  strength: number,
): MainMarketSettings {
  const section = getMainMarketSection(sectionId)
  const nextStrength = clampStrength(strength)
  const currentStrengths = settings.sectionStrengths[sectionId] ?? []

  const nextSectionStrengths = Array.from(
    { length: section.strengthSlotCount },
    (_, index) => {
      if (index === slotIndex) return nextStrength
      return currentStrengths[index] ?? 0
    },
  )

  return {
    ...settings,
    sectionStrengths: {
      ...settings.sectionStrengths,
      [sectionId]: nextSectionStrengths,
    },
  }
}

export function updateMainMarketSlotStrength(
  settings: MainMarketSettings,
  sectionId: MainMarketSectionId,
  slotIndex: number,
  strength: number,
): MainMarketSettings {
  return updateMainMarketSectionStrength(settings, sectionId, slotIndex, strength)
}

export function isPrimaryMainMarketSlot(slotIndex: number): boolean {
  return slotIndex === 0
}

/** @deprecated Main markets are match-level and no longer derived from player rows. */
export function deriveMainMarketsFromPlayers(): MainMarketSettings {
  return createDefaultMainMarkets()
}
