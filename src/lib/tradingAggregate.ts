import type { Fixture } from '../types/trading'
import { getFixtureTaxonomy } from './fixtureTaxonomy'
import { generateMockPlayersForSquads } from './mockData'
import type { TradingFixtureBundle } from './cellFilters'

const FIRST_NAMES = [
  'James',
  'Marco',
  'Lucas',
  'Noah',
  'Ethan',
  'Oliver',
  'Mateo',
  'Leo',
  'Hugo',
  'Finn',
  'Kai',
  'Theo',
]

const LAST_NAMES = [
  'Silva',
  'García',
  'Schmidt',
  'Rossi',
  'Dubois',
  'Johnson',
  'Williams',
  'Martinez',
  'Andersen',
  'Kowalski',
  'Santos',
  'Müller',
]

const ARSENAL_SQUAD = [
  'Gabriel Martinelli',
  'Bukayo Saka',
  'Martin Ødegaard',
  'Declan Rice',
  'William Saliba',
  'Gabriel Magalhães',
  'Mikel Merino',
  'Kai Havertz',
]

const CHELSEA_SQUAD = [
  'Cole Palmer',
  'Nicolas Jackson',
  'Enzo Fernández',
  'Moises Caicedo',
  'Reece James',
  'Pedro Neto',
  'Christopher Nkunku',
  'Noni Madueke',
]

function teamBadge(teamName: string): string {
  const words = teamName
    .replace(/[^a-zA-Z\s]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (words.length === 0) return 'TM'
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase()
  return `${words[0][0]}${words[words.length - 1].slice(0, 2)}`.toUpperCase()
}

function buildGenericSquad(_teamName: string, count: number, seed: number): string[] {
  return Array.from({ length: count }, (_, index) => {
    const first = FIRST_NAMES[(seed + index) % FIRST_NAMES.length]
    const last = LAST_NAMES[(seed * 2 + index * 3) % LAST_NAMES.length]
    return `${first} ${last}`
  })
}

function squadsForFixture(fixture: Fixture, seed: number) {
  if (fixture.id === 'PL-2026-03842') {
    return {
      homeSquad: ARSENAL_SQUAD,
      awaySquad: CHELSEA_SQUAD,
      homeBadge: 'ARS',
      awayBadge: 'CHE',
    }
  }

  const squadSize = 8
  return {
    homeSquad: buildGenericSquad(fixture.homeTeam, squadSize, seed),
    awaySquad: buildGenericSquad(fixture.awayTeam, squadSize, seed + 17),
    homeBadge: teamBadge(fixture.homeTeam),
    awayBadge: teamBadge(fixture.awayTeam),
  }
}

export function collectTradingFixtures(): Array<{
  fixture: Fixture
  competition: string
  country: string
}> {
  const entries: Array<{ fixture: Fixture; competition: string; country: string }> = []

  for (const sport of getFixtureTaxonomy()) {
    for (const country of sport.countries) {
      for (const league of country.leagues) {
        for (const fixtureEntry of league.fixtures) {
          entries.push({
            fixture: fixtureEntry,
            competition: league.name,
            country: country.name,
          })
        }
      }
    }
  }

  return entries
}

export function buildTradingFixtureBundles(): TradingFixtureBundle[] {
  return collectTradingFixtures().map(({ fixture, competition, country }, index) => {
    const squads = squadsForFixture(fixture, index + 1)

    return {
      fixtureId: fixture.id,
      competition,
      country,
      players: generateMockPlayersForSquads({
        idPrefix: fixture.id,
        ...squads,
        seed: index + 1,
      }),
    }
  })
}

export function getTradingCompetitions(bundles: TradingFixtureBundle[]): string[] {
  return [...new Set(bundles.map((bundle) => bundle.competition))].sort((left, right) =>
    left.localeCompare(right),
  )
}

export function flattenTradingPlayers(bundles: TradingFixtureBundle[]) {
  return bundles.flatMap((bundle) => bundle.players)
}
