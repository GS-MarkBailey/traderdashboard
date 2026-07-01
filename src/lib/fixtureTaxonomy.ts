import type {
  Fixture,
  FixtureLeague,
  FixtureTaxonomy,
  IssueTimelinePoint,
  MainMarketSettings,
  Player,
} from '../types/trading'
import { createDefaultMainMarkets } from './mainMarkets'
import type { ProposalMap } from './proposals'

export interface FixtureSession {
  players: Player[]
  proposals: ProposalMap
  mainMarkets: MainMarketSettings
  matchMinute: number
  issueTimeline: IssueTimelinePoint[]
}

export function createEmptyFixtureSession(): FixtureSession {
  return {
    players: [],
    proposals: {},
    mainMarkets: createDefaultMainMarkets(),
    matchMinute: 0,
    issueTimeline: [],
  }
}

function fixture(
  id: string,
  homeTeam: string,
  awayTeam: string,
  kickoffAt: string,
  tournament: string,
  traderName = 'Mark Bailey',
): Fixture {
  return { id, homeTeam, awayTeam, traderName, kickoffAt, tournament }
}

function buildCountries(
  leagueOverrides: Partial<Record<string, FixtureLeague[]>> = {},
): FixtureTaxonomy[number]['countries'] {
  return FIXTURE_COUNTRY_DEFINITIONS.map(({ id, name, countryCode }) => ({
    id,
    name,
    countryCode,
    leagues: leagueOverrides[id] ?? [],
  }))
}

function sport(
  id: string,
  name: string,
  iconSlug: string,
  leagueOverrides: Partial<Record<string, FixtureLeague[]>> = {},
): FixtureTaxonomy[number] {
  return {
    id,
    name,
    iconSlug,
    countries: buildCountries(leagueOverrides),
  }
}

const FIXTURE_COUNTRY_DEFINITIONS = [
  { id: 'argentina', name: 'Argentina', countryCode: 'ar' },
  { id: 'australia', name: 'Australia', countryCode: 'au' },
  { id: 'bhutan', name: 'Bhutan', countryCode: 'bt' },
  { id: 'bolivia', name: 'Bolivia', countryCode: 'bo' },
  { id: 'brazil', name: 'Brazil', countryCode: 'br' },
  { id: 'bulgaria', name: 'Bulgaria', countryCode: 'bg' },
  { id: 'cameroon', name: 'Cameroon', countryCode: 'cm' },
  { id: 'canada', name: 'Canada', countryCode: 'ca' },
  { id: 'chile', name: 'Chile', countryCode: 'cl' },
  { id: 'china', name: 'China', countryCode: 'cn' },
  { id: 'colombia', name: 'Colombia', countryCode: 'co' },
  { id: 'denmark', name: 'Denmark', countryCode: 'dk' },
  { id: 'dominica', name: 'Dominica', countryCode: 'dm' },
  { id: 'ecuador', name: 'Ecuador', countryCode: 'ec' },
  { id: 'england', name: 'England', countryCode: 'gb-eng' },
  { id: 'estonia', name: 'Estonia', countryCode: 'ee' },
  { id: 'ethiopia', name: 'Ethiopia', countryCode: 'et' },
  { id: 'europe', name: 'Europe', countryCode: 'eu' },
  { id: 'faroe-islands', name: 'Faroe Islands', countryCode: 'fo' },
  { id: 'fiji', name: 'Fiji', countryCode: 'fj' },
  { id: 'finland', name: 'Finland', countryCode: 'fi' },
  { id: 'france', name: 'France', countryCode: 'fr' },
  { id: 'georgia', name: 'Georgia', countryCode: 'ge' },
  { id: 'iceland', name: 'Iceland', countryCode: 'is' },
  { id: 'iran', name: 'Iran', countryCode: 'ir' },
  { id: 'ireland', name: 'Ireland', countryCode: 'ie' },
  { id: 'italy', name: 'Italy', countryCode: 'it' },
  { id: 'kazakhstan', name: 'Kazakhstan', countryCode: 'kz' },
  { id: 'korea-rep', name: 'Korea Rep', countryCode: 'kr' },
  { id: 'kyrgyzstan', name: 'Kyrgyzstan', countryCode: 'kg' },
  { id: 'latvia', name: 'Latvia', countryCode: 'lv' },
  { id: 'lebanon', name: 'Lebanon', countryCode: 'lb' },
  { id: 'lithuania', name: 'Lithuania', countryCode: 'lt' },
  { id: 'macau', name: 'Macau', countryCode: 'mo' },
  { id: 'malaysia', name: 'Malaysia', countryCode: 'my' },
  { id: 'moldova', name: 'Moldova', countryCode: 'md' },
  { id: 'mongolia', name: 'Mongolia', countryCode: 'mn' },
  { id: 'morocco', name: 'Morocco', countryCode: 'ma' },
  { id: 'mozambique', name: 'Mozambique', countryCode: 'mz' },
  { id: 'myanmar', name: 'Myanmar', countryCode: 'mm' },
  { id: 'new-zealand', name: 'New Zealand', countryCode: 'nz' },
  { id: 'nicaragua', name: 'Nicaragua', countryCode: 'ni' },
  { id: 'northern-ireland', name: 'Northern Ireland', countryCode: 'gb-nir' },
  { id: 'norway', name: 'Norway', countryCode: 'no' },
  { id: 'paraguay', name: 'Paraguay', countryCode: 'py' },
  { id: 'peru', name: 'Peru', countryCode: 'pe' },
  { id: 'sierra-leone', name: 'Sierra Leone', countryCode: 'sl' },
  { id: 'south-africa', name: 'South Africa', countryCode: 'za' },
  { id: 'spain', name: 'Spain', countryCode: 'es' },
  { id: 'sweden', name: 'Sweden', countryCode: 'se' },
  { id: 'syria', name: 'Syria', countryCode: 'sy' },
  { id: 'tajikistan', name: 'Tajikistan', countryCode: 'tj' },
  { id: 'tanzania', name: 'Tanzania', countryCode: 'tz' },
  { id: 'test-region', name: 'Test Region', countryCode: 'un' },
  { id: 'united-states', name: 'United States of America', countryCode: 'us' },
  { id: 'uruguay', name: 'Uruguay', countryCode: 'uy' },
  { id: 'venezuela', name: 'Venezuela', countryCode: 've' },
  { id: 'vietnam', name: 'Vietnam', countryCode: 'vn' },
  { id: 'world', name: 'World', countryCode: 'un' },
  { id: 'zimbabwe', name: 'Zimbabwe', countryCode: 'zw' },
]

const FIXTURE_TAXONOMY: FixtureTaxonomy = [
  sport('american-football', 'American Football', 'american_football'),
  sport('aussie-rules', 'Aussie Rules', 'australian_football'),
  sport('badminton', 'Badminton', 'badminton'),
  sport('baseball', 'Baseball', 'baseball'),
  sport('basketball', 'Basketball', 'basketball', {
    'united-states': [
      {
        id: 'nba',
        name: 'NBA',
        logoUrl: '/competitions/nba.svg',
        fixtures: [
          fixture(
            'NBA-2026-00821',
            'Los Angeles Lakers',
            'Boston Celtics',
            '2026-07-05T02:00:00',
            'NBA',
            'Chris Morgan',
          ),
          fixture(
            'NBA-2026-00829',
            'Golden State Warriors',
            'Denver Nuggets',
            '2026-07-06T03:30:00',
            'NBA',
          ),
        ],
      },
    ],
  }),
  sport('beach-volleyball', 'Beach Volleyball', 'beach_volleyball'),
  sport('bowls', 'Bowls', 'bowling'),
  sport('boxing', 'Boxing', 'combat'),
  sport('cricket', 'Cricket', 'softball'),
  sport('darts', 'Darts', 'large_ball'),
  sport('esports', 'eSports', 'extreme_sports'),
  sport('football', 'Football', 'soccer', {
    england: [
      {
        id: 'premier-league',
        name: 'Premier League',
        logoUrl: '/competitions/premier-league.svg',
        fixtures: [
          fixture(
            'PL-2026-03842',
            'Arsenal',
            'Chelsea',
            '2026-06-30T15:00:00',
            'Premier League',
          ),
          fixture(
            'PL-2026-03851',
            'Liverpool',
            'Manchester City',
            '2026-06-30T17:30:00',
            'Premier League',
            'Sarah Chen',
          ),
          fixture(
            'PL-2026-03860',
            'Tottenham',
            'Manchester United',
            '2026-07-01T20:00:00',
            'Premier League',
            'James Okafor',
          ),
        ],
      },
      {
        id: 'championship',
        name: 'Championship',
        logoUrl: '/competitions/championship.svg',
        fixtures: [
          fixture(
            'CH-2026-01204',
            'Leeds United',
            'Southampton',
            '2026-06-30T19:45:00',
            'Championship',
            'Emma Walsh',
          ),
          fixture(
            'CH-2026-01211',
            'Norwich City',
            'West Brom',
            '2026-07-01T15:00:00',
            'Championship',
          ),
        ],
      },
    ],
    spain: [
      {
        id: 'la-liga',
        name: 'La Liga',
        logoUrl: '/competitions/la-liga.svg',
        fixtures: [
          fixture(
            'LL-2026-02018',
            'Real Madrid',
            'Barcelona',
            '2026-07-02T21:00:00',
            'La Liga',
            'Luca Rossi',
          ),
          fixture(
            'LL-2026-02025',
            'Atlético Madrid',
            'Sevilla',
            '2026-07-03T18:30:00',
            'La Liga',
          ),
        ],
      },
    ],
    italy: [
      {
        id: 'serie-a',
        name: 'Serie A',
        logoUrl: '/competitions/serie-a.svg',
        fixtures: [
          fixture(
            'SA-2026-01502',
            'Inter',
            'AC Milan',
            '2026-07-04T20:45:00',
            'Serie A',
            'Nina Patel',
          ),
        ],
      },
    ],
  }),
  sport('futsal', 'Futsal', 'futsal'),
  sport('gaelic-football', 'Gaelic Football', 'gaelic_football'),
  sport('handball', 'Handball', 'handball'),
  sport('hockey', 'Hockey', 'hockey'),
  sport('hurling', 'Hurling', 'hurling'),
  sport('ice-hockey', 'Ice Hockey', 'ice_hockey'),
  sport('martial-arts', 'Martial Arts', 'combat'),
  sport('motor-sport', 'Motor Sport', 'motorsports'),
  sport('pickleball', 'Pickleball', 'pickleball'),
  sport('pool', 'Pool', 'bowling'),
  sport('rugby-league', 'Rugby League', 'tag_rugby'),
  sport('rugby-union', 'Rugby Union', 'rugby'),
  sport('snooker', 'Snooker', 'bowling'),
  sport('squash', 'Squash', 'squash'),
  sport('table-tennis', 'Table Tennis', 'table_tennis'),
  sport('tennis', 'Tennis', 'tennis', {
    france: [
      {
        id: 'roland-garros',
        name: 'Roland Garros',
        logoUrl: '/competitions/roland-garros.svg',
        fixtures: [
          fixture(
            'RG-2026-00412',
            'C. Alcaraz',
            'J. Sinner',
            '2026-07-08T14:00:00',
            'Roland Garros',
            'Olivia Grant',
          ),
        ],
      },
    ],
  }),
  sport('virtual-cricket', 'Virtual Cricket', 'softball'),
  sport('volleyball', 'Volleyball', 'volleyball'),
  sport('water-polo', 'Water Polo', 'water_polo'),
]

export function getFixtureTaxonomy(): FixtureTaxonomy {
  return FIXTURE_TAXONOMY
}

export function getDefaultFixtureId(): string {
  const football = FIXTURE_TAXONOMY.find((item) => item.id === 'football')
  const england = football!.countries.find((item) => item.id === 'england')
  return england!.leagues[0].fixtures[0].id
}

export function findFixtureById(fixtureId: string): Fixture | null {
  for (const sport of FIXTURE_TAXONOMY) {
    for (const country of sport.countries) {
      for (const league of country.leagues) {
        const match = league.fixtures.find((item) => item.id === fixtureId)
        if (match) return match
      }
    }
  }

  return null
}

export function findTournamentLogoForFixture(fixtureId: string): string | null {
  for (const sport of FIXTURE_TAXONOMY) {
    for (const country of sport.countries) {
      for (const league of country.leagues) {
        if (league.fixtures.some((item) => item.id === fixtureId)) {
          return league.logoUrl
        }
      }
    }
  }

  return null
}

export const ALL_SPORTS_GROUP_ID = 'all-sports'

export type TaxonomyNodeKind = 'group' | 'sport' | 'country' | 'league'

export function taxonomyNodeId(
  kind: TaxonomyNodeKind,
  ...segments: string[]
): string {
  return `${kind}:${segments.join(':')}`
}

export function getAllSportsGroupNodeId(): string {
  return taxonomyNodeId('group', ALL_SPORTS_GROUP_ID)
}

function withAllSportsGroupExpanded(nodeIds: string[]): string[] {
  return [getAllSportsGroupNodeId(), ...nodeIds]
}

export function getExpandedNodeIdsForFixture(fixtureId: string): string[] {
  for (const sport of FIXTURE_TAXONOMY) {
    for (const country of sport.countries) {
      for (const league of country.leagues) {
        if (league.fixtures.some((item) => item.id === fixtureId)) {
          return withAllSportsGroupExpanded([
            taxonomyNodeId('sport', sport.id),
            taxonomyNodeId('country', sport.id, country.id),
            taxonomyNodeId('league', sport.id, country.id, league.id),
          ])
        }
      }
    }
  }

  return []
}

export function formatFixtureLabel(fixture: Fixture): string {
  return `${fixture.homeTeam} v ${fixture.awayTeam}`
}

export interface LeagueSelection {
  sportId: string
  countryId: string
  leagueId: string
}

export interface SportSelection {
  sportId: string
}

export interface CountrySelection {
  sportId: string
  countryId: string
}

export interface FixtureListEntry {
  fixture: Fixture
  competition: string
  competitionLogoUrl: string
  country?: string
}

export type FixtureNavigation =
  | { kind: 'sport'; sportId: string }
  | { kind: 'country'; sportId: string; countryId: string }
  | { kind: 'league'; sportId: string; countryId: string; leagueId: string }
  | { kind: 'fixture'; fixtureId: string }

export function leagueSelectionKey(selection: LeagueSelection): string {
  return `${selection.sportId}:${selection.countryId}:${selection.leagueId}`
}

export function getDefaultLeagueSelection(): LeagueSelection {
  return {
    sportId: 'football',
    countryId: 'england',
    leagueId: 'premier-league',
  }
}

export function getDefaultNavigation(): FixtureNavigation {
  return { kind: 'fixture', fixtureId: getDefaultFixtureId() }
}

export function findLeagueBySelection(selection: LeagueSelection): {
  sportName: string
  countryName: string
  league: FixtureLeague
} | null {
  const sport = FIXTURE_TAXONOMY.find((item) => item.id === selection.sportId)
  if (!sport) return null

  const country = sport.countries.find((item) => item.id === selection.countryId)
  if (!country) return null

  const league = country.leagues.find((item) => item.id === selection.leagueId)
  if (!league) return null

  return { sportName: sport.name, countryName: country.name, league }
}

export function findSportBySelection(selection: SportSelection): {
  sportName: string
  entries: FixtureListEntry[]
} | null {
  const sport = FIXTURE_TAXONOMY.find((item) => item.id === selection.sportId)
  if (!sport) return null

  const entries = sport.countries.flatMap((country) =>
    country.leagues.flatMap((league) =>
      league.fixtures.map((fixture) => ({
        fixture,
        competition: league.name,
        competitionLogoUrl: league.logoUrl,
        country: country.name,
      })),
    ),
  )

  entries.sort(
    (left, right) =>
      new Date(left.fixture.kickoffAt).getTime() -
      new Date(right.fixture.kickoffAt).getTime(),
  )

  return { sportName: sport.name, entries }
}

export function findCountryBySelection(selection: CountrySelection): {
  sportName: string
  countryName: string
  entries: FixtureListEntry[]
} | null {
  const sport = FIXTURE_TAXONOMY.find((item) => item.id === selection.sportId)
  if (!sport) return null

  const country = sport.countries.find((item) => item.id === selection.countryId)
  if (!country) return null

  const entries = country.leagues.flatMap((league) =>
    league.fixtures.map((fixture) => ({
      fixture,
      competition: league.name,
      competitionLogoUrl: league.logoUrl,
    })),
  )

  entries.sort(
    (left, right) =>
      new Date(left.fixture.kickoffAt).getTime() -
      new Date(right.fixture.kickoffAt).getTime(),
  )

  return { sportName: sport.name, countryName: country.name, entries }
}

export function leagueToFixtureEntries(league: FixtureLeague): FixtureListEntry[] {
  return league.fixtures.map((fixture) => ({
    fixture,
    competition: league.name,
    competitionLogoUrl: league.logoUrl,
  }))
}

export function getExpandedNodeIdsForSport(selection: SportSelection): string[] {
  return withAllSportsGroupExpanded([taxonomyNodeId('sport', selection.sportId)])
}

export function getExpandedNodeIdsForCountry(selection: CountrySelection): string[] {
  return withAllSportsGroupExpanded([
    taxonomyNodeId('sport', selection.sportId),
    taxonomyNodeId('country', selection.sportId, selection.countryId),
  ])
}

export function getExpandedNodeIdsForLeague(selection: LeagueSelection): string[] {
  return withAllSportsGroupExpanded([
    taxonomyNodeId('sport', selection.sportId),
    taxonomyNodeId('country', selection.sportId, selection.countryId),
    taxonomyNodeId('league', selection.sportId, selection.countryId, selection.leagueId),
  ])
}

export function getExpandedNodeIdsForNavigation(
  navigation: FixtureNavigation,
): string[] {
  if (navigation.kind === 'fixture') {
    return getExpandedNodeIdsForFixture(navigation.fixtureId)
  }

  if (navigation.kind === 'sport') {
    return getExpandedNodeIdsForSport({ sportId: navigation.sportId })
  }

  if (navigation.kind === 'country') {
    return getExpandedNodeIdsForCountry({
      sportId: navigation.sportId,
      countryId: navigation.countryId,
    })
  }

  return getExpandedNodeIdsForLeague({
    sportId: navigation.sportId,
    countryId: navigation.countryId,
    leagueId: navigation.leagueId,
  })
}

export function isSportSelected(
  navigation: FixtureNavigation,
  selection: SportSelection,
): boolean {
  return navigation.kind === 'sport' && navigation.sportId === selection.sportId
}

export function isCountrySelected(
  navigation: FixtureNavigation,
  selection: CountrySelection,
): boolean {
  return (
    navigation.kind === 'country' &&
    navigation.sportId === selection.sportId &&
    navigation.countryId === selection.countryId
  )
}

export function isLeagueSelected(
  navigation: FixtureNavigation,
  selection: LeagueSelection,
): boolean {
  return (
    navigation.kind === 'league' &&
    navigation.sportId === selection.sportId &&
    navigation.countryId === selection.countryId &&
    navigation.leagueId === selection.leagueId
  )
}
