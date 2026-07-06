import type {
  BookmakerId,
  MarketKey,
  Player,
  PlayerMarket,
  TeamSide,
} from '../types/trading'
import { MARKET_COLUMNS } from '../types/trading'
import { buildPrimaryBookmakerSequence } from './bookmakers'
import { createAverageBookmakerQuotes } from './averageBookmakers'
import { createLinePrices } from './linePrices'
import { getMainMarketSection } from './mainMarkets'
import { getMainSectionForPlayerMarket } from './mainMarketPlayerSync'
import {
  calculatePriceFromStrength,
  clampStrength,
  pricesWithinPrimaryThreshold,
  strengthAlignedToPrimaryPrice,
} from './pricing'

const HOME_BADGE = 'ARS'
const AWAY_BADGE = 'CHE'

/** Target share of cells with a price or unpriced issue on import. */
const ISSUE_RATE = 0.05

/** Line mismatches are uncommon — kept separate from price/unpriced issues. */
const LINE_ISSUE_RATE = 0.005

const HOME_SQUAD = [
  'Gabriel Martinelli',
  'Bukayo Saka',
  'Martin Ødegaard',
  'Declan Rice',
  'William Saliba',
  'Gabriel Magalhães',
  'Jurriën Timber',
  'Ben White',
  'Myles Lewis-Skelly',
  'Mikel Merino',
  'Leandro Trossard',
  'Kai Havertz',
  'Raheem Sterling',
  'Ethan Nwaneri',
  'David Raya',
  'Neto',
  'Riccardo Calafiori',
  'Jorginho',
]

const AWAY_SQUAD = [
  'Cole Palmer',
  'Nicolas Jackson',
  'Enzo Fernández',
  'Moises Caicedo',
  'Reece James',
  'Pedro Neto',
  'Marc Cucurella',
  'Wesley Fofana',
  'Levi Colwill',
  'Malo Gusto',
  'Trevoh Chalobah',
  'Christopher Nkunku',
  'Noni Madueke',
  'Axel Disasi',
  'Robert Sánchez',
  'Filip Jørgensen',
  'Mykhailo Mudryk',
  'Romeo Lavia',
]

const MARKET_LINES = [0.5, 1.5, 2.5] as const

type IssueKind = 'price' | 'line' | 'unpriced'

const PRICE_ISSUE_KINDS: Array<'price' | 'unpriced'> = ['price', 'unpriced']

function getLinesForPlayerMarket(marketKey: MarketKey): readonly number[] {
  const sectionId = getMainSectionForPlayerMarket(marketKey)
  if (sectionId) {
    return getMainMarketSection(sectionId).strengthLines
  }

  return MARKET_LINES
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

function createAccurateMarket(
  seed: number,
  bookmaker: BookmakerId,
  marketKey: MarketKey,
): PlayerMarket {
  const primaryPrice = round2(1.8 + (seed % 65) / 10)
  const strength = strengthAlignedToPrimaryPrice(primaryPrice)
  const lines = getLinesForPlayerMarket(marketKey)
  const line = lines[seed % lines.length]
  const { averageBookmakers, averagePrice } = createAverageBookmakerQuotes(
    seed,
    primaryPrice,
  )
  const linePrices = createLinePrices(seed, line, primaryPrice)

  return {
    strength,
    statsCount: seed % 4,
    suspended: false,
    ourLine: line,
    primaryLine: line,
    primaryPrice,
    averagePrice,
    averageBookmakers,
    linePrices,
    bookmaker,
  }
}

function shuffleInPlace<T>(items: T[]): void {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[items[i], items[j]] = [items[j], items[i]]
  }
}

function buildRandomIssuePlan(totalCells: number): Map<number, IssueKind> {
  const lineIssueCount = Math.round(totalCells * LINE_ISSUE_RATE)
  const priceIssueCount = Math.round(totalCells * ISSUE_RATE)
  const cellIndices = Array.from({ length: totalCells }, (_, index) => index)
  shuffleInPlace(cellIndices)

  const plan = new Map<number, IssueKind>()
  let cursor = 0

  for (let i = 0; i < lineIssueCount && cursor < cellIndices.length; i += 1, cursor += 1) {
    plan.set(cellIndices[cursor], 'line')
  }

  for (let i = 0; i < priceIssueCount && cursor < cellIndices.length; i += 1, cursor += 1) {
    const kind = PRICE_ISSUE_KINDS[Math.floor(Math.random() * PRICE_ISSUE_KINDS.length)]
    plan.set(cellIndices[cursor], kind)
  }

  return plan
}

function applyIssue(market: PlayerMarket, kind: IssueKind): PlayerMarket {
  switch (kind) {
    case 'price':
      return {
        ...market,
        strength: clampStrength(market.strength * 0.82),
      }
    case 'line': {
      const alternate = market.linePrices.find(
        (quote) => quote.line !== market.primaryLine,
      )
      if (!alternate) return market

      return {
        ...market,
        ourLine: alternate.line,
      }
    }
    case 'unpriced':
      return {
        ...market,
        strength: 0,
        statsCount: 0,
      }
  }
}

function createMarketForCell(
  cellIndex: number,
  bookmakerSequence: BookmakerId[],
  issuePlan: Map<number, IssueKind>,
  marketKey: MarketKey,
): PlayerMarket {
  const bookmaker = bookmakerSequence[cellIndex]
  const market = createAccurateMarket(cellIndex, bookmaker, marketKey)
  const issueKind = issuePlan.get(cellIndex)

  if (!issueKind) {
    return market
  }

  return applyIssue(market, issueKind)
}

function createMarketsForPlayer(
  playerIndex: number,
  bookmakerSequence: BookmakerId[],
  issuePlan: Map<number, IssueKind>,
): Record<MarketKey, PlayerMarket> {
  return MARKET_COLUMNS.reduce(
    (acc, { key }, marketIndex) => {
      const cellIndex = playerIndex * MARKET_COLUMNS.length + marketIndex
      acc[key] = createMarketForCell(cellIndex, bookmakerSequence, issuePlan, key)
      return acc
    },
    {} as Record<MarketKey, PlayerMarket>,
  )
}

function createSquadPlayers(
  names: string[],
  team: TeamSide,
  badge: string,
  playerOffset: number,
  bookmakerSequence: BookmakerId[],
  issuePlan: Map<number, IssueKind>,
  idPrefix?: string,
): Player[] {
  return names.map((name, index) => {
    const playerIndex = playerOffset + index
    const isActive = index < 11
    const markets = createMarketsForPlayer(
      playerIndex,
      bookmakerSequence,
      issuePlan,
    )
    const marketsWithActiveState = Object.fromEntries(
      Object.entries(markets).map(([key, market]) => [
        key,
        { ...market, suspended: !isActive },
      ]),
    ) as Record<MarketKey, PlayerMarket>

    return {
      id: idPrefix ? `${idPrefix}-${team}-${index + 1}` : `${team}-${index + 1}`,
      name,
      team,
      teamBadge: badge,
      active: isActive,
      markets: marketsWithActiveState,
    }
  })
}

export function generateMockPlayersForSquads({
  idPrefix,
  homeSquad,
  awaySquad,
  homeBadge,
  awayBadge,
  seed = 0,
}: {
  idPrefix: string
  homeSquad: string[]
  awaySquad: string[]
  homeBadge: string
  awayBadge: string
  seed?: number
}): Player[] {
  const totalPlayers = homeSquad.length + awaySquad.length
  const totalCells = totalPlayers * MARKET_COLUMNS.length
  const bookmakerSequence = buildPrimaryBookmakerSequence(totalCells)
  const issuePlan = buildRandomIssuePlan(totalCells)

  const playerOffset = seed * 37

  return [
    ...createSquadPlayers(
      homeSquad,
      'home',
      homeBadge,
      playerOffset,
      bookmakerSequence,
      issuePlan,
      idPrefix,
    ),
    ...createSquadPlayers(
      awaySquad,
      'away',
      awayBadge,
      playerOffset + homeSquad.length,
      bookmakerSequence,
      issuePlan,
      idPrefix,
    ),
  ]
}

export function generateMockPlayers(): Player[] {
  const totalPlayers = HOME_SQUAD.length + AWAY_SQUAD.length
  const totalCells = totalPlayers * MARKET_COLUMNS.length
  const bookmakerSequence = buildPrimaryBookmakerSequence(totalCells)
  const issuePlan = buildRandomIssuePlan(totalCells)

  return [
    ...createSquadPlayers(
      HOME_SQUAD,
      'home',
      HOME_BADGE,
      0,
      bookmakerSequence,
      issuePlan,
    ),
    ...createSquadPlayers(
      AWAY_SQUAD,
      'away',
      AWAY_BADGE,
      HOME_SQUAD.length,
      bookmakerSequence,
      issuePlan,
    ),
  ]
}

/** Dev helper: verify imported mock data meets the target accuracy rate. */
export function getMockDataAccuracyStats(players: Player[]) {
  let accurate = 0
  let total = 0

  for (const player of players) {
    for (const market of Object.values(player.markets)) {
      total += 1
      const ourPrice = calculatePriceFromStrength(market.strength)
      const priceOk = pricesWithinPrimaryThreshold(ourPrice, market.primaryPrice)
      const lineOk = market.ourLine === market.primaryLine
      const strengthOk = market.strength > 0

      if (priceOk && lineOk && strengthOk) accurate += 1
    }
  }

  return { accurate, total, rate: total > 0 ? accurate / total : 0 }
}
