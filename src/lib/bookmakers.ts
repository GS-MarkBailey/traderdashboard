export const BOOKMAKER_CONFIG = {
  '1xbet': {
    label: '1xBet',
    fallbackLabel: '1x',
    fallbackColor: '#1a5276',
    icon: '/bookmakers/1xbet.png',
  },
  '10bet': {
    label: '10Bet',
    fallbackLabel: '10',
    fallbackColor: '#111827',
    icon: '/bookmakers/10bet.png',
  },
  '188bet': {
    label: '188Bet',
    fallbackLabel: '188',
    fallbackColor: '#1f2937',
    icon: '/bookmakers/188bet.png',
  },
  bet365: {
    label: 'bet365',
    fallbackLabel: '365',
    fallbackColor: '#027b5b',
    icon: '/bookmakers/bet365.png',
  },
  betonline: {
    label: 'BetOnline',
    fallbackLabel: 'BO',
    fallbackColor: '#c8102e',
    icon: '/bookmakers/betonline.png',
  },
  bettsson: {
    label: 'Bettsson',
    fallbackLabel: 'BS',
    fallbackColor: '#f97316',
    icon: '/bookmakers/bettsson.png',
  },
  boylesports: {
    label: 'BoyleSports',
    fallbackLabel: 'BY',
    fallbackColor: '#6b21a8',
    icon: '/bookmakers/boylesports.png',
  },
  bovada: {
    label: 'Bovada',
    fallbackLabel: 'BV',
    fallbackColor: '#cc0000',
    icon: '/bookmakers/bovada.png',
  },
  bwin: {
    label: 'bwin',
    fallbackLabel: 'bw',
    fallbackColor: '#f59e0b',
    icon: '/bookmakers/bwin.png',
  },
  caeserspalace: {
    label: 'Caesars Palace',
    fallbackLabel: 'CP',
    fallbackColor: '#991b1b',
    icon: '/bookmakers/caeserspalace.png',
  },
  coral: {
    label: 'Coral',
    fallbackLabel: 'CR',
    fallbackColor: '#0046a0',
    icon: '/bookmakers/coral.png',
  },
  dafasports: {
    label: 'Dafabet',
    fallbackLabel: 'DF',
    fallbackColor: '#a6935c',
    icon: '/bookmakers/dafasports.png',
  },
  fanduel: {
    label: 'FanDuel',
    fallbackLabel: 'FD',
    fallbackColor: '#1493ff',
    icon: '/bookmakers/fanduel.png',
  },
  fonbet: {
    label: 'Fonbet',
    fallbackLabel: 'FB',
    fallbackColor: '#dc2626',
    icon: '/bookmakers/fonbet.png',
  },
  ladbrokes: {
    label: 'Ladbrokes',
    fallbackLabel: 'L',
    fallbackColor: '#e20a17',
    icon: '/bookmakers/ladbrokes.png',
  },
  paddypower: {
    label: 'Paddy Power',
    fallbackLabel: 'PP',
    fallbackColor: '#004833',
    icon: '/bookmakers/paddypower.png',
  },
  sbobet: {
    label: 'SBOBET',
    fallbackLabel: 'SB',
    fallbackColor: '#1e3a5f',
    icon: '/bookmakers/sbobet.png',
  },
  sportsbetau: {
    label: 'Sportsbet',
    fallbackLabel: 'SA',
    fallbackColor: '#2563eb',
    icon: '/bookmakers/sportsbetau.png',
  },
  spreadex: {
    label: 'Spreadex',
    fallbackLabel: 'SX',
    fallbackColor: '#111827',
    icon: '/bookmakers/spreadex.png',
  },
  unibet: {
    label: 'Unibet',
    fallbackLabel: 'U',
    fallbackColor: '#111827',
    icon: '/bookmakers/unibet.png',
  },
  williamhill: {
    label: 'William Hill',
    fallbackLabel: 'WH',
    fallbackColor: '#003580',
    icon: '/bookmakers/williamhill.png',
  },
} as const

export type BookmakerId = keyof typeof BOOKMAKER_CONFIG

export const BOOKMAKER_IDS = Object.keys(BOOKMAKER_CONFIG) as BookmakerId[]

/** Primary bookmakers used for cell pricing, in descending share of use. */
export const PRIMARY_BOOKMAKER_WEIGHTS = [
  { id: 'bet365', weight: 0.75 },
  { id: 'ladbrokes', weight: 0.15 },
  { id: 'williamhill', weight: 0.05 },
  { id: 'paddypower', weight: 0.03 },
  { id: 'coral', weight: 0.02 },
] as const satisfies ReadonlyArray<{ id: BookmakerId; weight: number }>

export const PRIMARY_BOOKMAKER_IDS = PRIMARY_BOOKMAKER_WEIGHTS.map(
  (entry) => entry.id,
)

function pseudoRandom01(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43_758.5453
  return x - Math.floor(x)
}

function shuffleBookmakerSequence(sequence: BookmakerId[]): BookmakerId[] {
  const shuffled = [...sequence]

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(pseudoRandom01(i * 7919) * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  return shuffled
}

export function buildPrimaryBookmakerSequence(totalCells: number): BookmakerId[] {
  const sequence: BookmakerId[] = []
  let assigned = 0

  for (let i = 0; i < PRIMARY_BOOKMAKER_WEIGHTS.length; i += 1) {
    const { id, weight } = PRIMARY_BOOKMAKER_WEIGHTS[i]
    const isLast = i === PRIMARY_BOOKMAKER_WEIGHTS.length - 1
    const count = isLast ? totalCells - assigned : Math.round(totalCells * weight)
    sequence.push(...Array.from({ length: count }, () => id))
    assigned += count
  }

  return shuffleBookmakerSequence(sequence)
}

/** Pick a primary bookmaker for a grid cell using weighted distribution. */
export function pickPrimaryBookmakerForCell(
  cellIndex: number,
  totalCells: number,
): BookmakerId {
  return buildPrimaryBookmakerSequence(totalCells)[cellIndex]
}
