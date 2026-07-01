import type {
  MainMarketSectionId,
  MainMarketSectionScore,
  MainMarketSectionStatus,
  MainMarketSettings,
  MarketKey,
  Player,
  TeamSide,
} from '../types/trading'
import {
  getMainMarketSection,
  updateMainMarketSectionStatus,
  updateMainMarketSectionStrength,
} from './mainMarkets'
import { clampStrength } from './pricing'
import { proposalKey, type ProposalMap } from './proposals'

/** Player prop columns linked to each main market section. */
export const MAIN_MARKET_SECTION_PLAYER_MARKETS: Record<
  MainMarketSectionId,
  readonly MarketKey[]
> = {
  goals: ['goals', 'headedGoal', 'goalOotB', 'assists'],
  corners: [],
  cards: ['yellowCards', 'redCards'],
  shotsOnTarget: ['sot'],
  shots: ['shots'],
}

/** Player markets summed for each section's home/away score chip. */
const SECTION_SCORE_PLAYER_MARKETS: Record<
  MainMarketSectionId,
  readonly MarketKey[]
> = {
  goals: ['goals'],
  corners: [],
  cards: ['yellowCards'],
  shotsOnTarget: ['sot'],
  shots: ['shots'],
}

function sumTeamMarketStats(
  players: Player[],
  marketKeys: readonly MarketKey[],
  team: TeamSide,
): number {
  return players
    .filter((player) => player.team === team)
    .reduce(
      (total, player) =>
        total +
        marketKeys.reduce(
          (sum, marketKey) => sum + player.markets[marketKey].statsCount,
          0,
        ),
      0,
    )
}

export function sectionScoresMatch(
  left: MainMarketSectionScore,
  right: MainMarketSectionScore,
): boolean {
  return left.home === right.home && left.away === right.away
}

export function hasSectionScoreDataIssue(
  sectionId: MainMarketSectionId,
  players: Player[],
  storedScores: Record<MainMarketSectionId, MainMarketSectionScore>,
  liveScores: Record<MainMarketSectionId, MainMarketSectionScore>,
): boolean {
  if (players.length === 0) return false

  const marketKeys = SECTION_SCORE_PLAYER_MARKETS[sectionId]
  if (marketKeys.length === 0) return false

  return !sectionScoresMatch(storedScores[sectionId], liveScores[sectionId])
}

export function hasRedCardScoreDataIssue(): boolean {
  return false
}

export function resolveSectionScores(
  players: Player[],
  fallback: Record<MainMarketSectionId, MainMarketSectionScore>,
): Record<MainMarketSectionId, MainMarketSectionScore> {
  if (players.length === 0) {
    return fallback
  }

  return (
    Object.keys(SECTION_SCORE_PLAYER_MARKETS) as MainMarketSectionId[]
  ).reduce(
    (scores, sectionId) => {
      const marketKeys = SECTION_SCORE_PLAYER_MARKETS[sectionId]
      if (marketKeys.length === 0) {
        scores[sectionId] = fallback[sectionId]
        return scores
      }

      scores[sectionId] = {
        home: sumTeamMarketStats(players, marketKeys, 'home'),
        away: sumTeamMarketStats(players, marketKeys, 'away'),
      }
      return scores
    },
    {} as Record<MainMarketSectionId, MainMarketSectionScore>,
  )
}

export function resolveRedCardScores(
  players: Player[],
  fallback: MainMarketSectionScore = { home: 0, away: 0 },
): MainMarketSectionScore {
  if (players.length === 0) {
    return fallback
  }

  return {
    home: sumTeamMarketStats(players, ['redCards'], 'home'),
    away: sumTeamMarketStats(players, ['redCards'], 'away'),
  }
}

const playerMarketSectionByKey = new Map<MarketKey, MainMarketSectionId>(
  (
    Object.entries(MAIN_MARKET_SECTION_PLAYER_MARKETS) as Array<
      [MainMarketSectionId, readonly MarketKey[]]
    >
  ).flatMap(([sectionId, marketKeys]) =>
    marketKeys.map((marketKey) => [marketKey, sectionId] as const),
  ),
)

export function getPlayerMarketsForMainSection(
  sectionId: MainMarketSectionId,
): MarketKey[] {
  return [...MAIN_MARKET_SECTION_PLAYER_MARKETS[sectionId]]
}

export function getMainSectionForPlayerMarket(
  marketKey: MarketKey,
): MainMarketSectionId | null {
  return playerMarketSectionByKey.get(marketKey) ?? null
}

export function shouldSuspendPlayerMarketsForSectionStatus(
  status: MainMarketSectionStatus,
): boolean {
  return status === 'suspended' || status === 'closed'
}

export function isMainSectionLocked(
  sectionStatus: MainMarketSectionStatus | null,
): boolean {
  if (sectionStatus === null) return false
  return shouldSuspendPlayerMarketsForSectionStatus(sectionStatus)
}

export function isPlayerMarketEffectivelySuspended(
  marketSuspended: boolean,
  sectionStatus: MainMarketSectionStatus | null,
): boolean {
  if (marketSuspended) return true
  return isMainSectionLocked(sectionStatus)
}

export function getMainSectionStatusForPlayerMarket(
  settings: MainMarketSettings,
  marketKey: MarketKey,
): MainMarketSectionStatus | null {
  const sectionId = getMainSectionForPlayerMarket(marketKey)
  if (!sectionId) return null
  return settings.sectionStatus[sectionId] ?? 'trading'
}

export function getStrengthSlotIndexForLine(
  sectionId: MainMarketSectionId,
  line: number,
): number | null {
  const section = getMainMarketSection(sectionId)
  const slotIndex = section.strengthLines.findIndex((entry) => entry === line)
  return slotIndex >= 0 ? slotIndex : null
}

export function deriveMainSectionSlotStrengthFromPlayers(
  players: Player[],
  sectionId: MainMarketSectionId,
  slotIndex: number,
): number | null {
  const section = getMainMarketSection(sectionId)
  const line = section.strengthLines[slotIndex]
  if (line === undefined) return null

  const marketKeys = getPlayerMarketsForMainSection(sectionId)
  if (marketKeys.length === 0) return null

  const strengths: number[] = []

  for (const player of players) {
    for (const marketKey of marketKeys) {
      const market = player.markets[marketKey]
      if (market.ourLine === line && market.strength > 0) {
        strengths.push(market.strength)
      }
    }
  }

  if (strengths.length === 0) return null

  const average =
    strengths.reduce((sum, value) => sum + value, 0) / strengths.length

  return clampStrength(average)
}

export function applyMainSectionStrengthToPlayers(
  players: Player[],
  sectionId: MainMarketSectionId,
  slotIndex: number,
  strength: number,
): Player[] {
  const section = getMainMarketSection(sectionId)
  const line = section.strengthLines[slotIndex]
  if (line === undefined) return players

  const marketKeys = getPlayerMarketsForMainSection(sectionId)
  if (marketKeys.length === 0) return players

  const nextStrength = clampStrength(strength)

  return players.map((player) => ({
    ...player,
    markets: marketKeys.reduce(
      (markets, marketKey) => {
        const market = markets[marketKey]
        if (market.ourLine !== line) return markets

        return {
          ...markets,
          [marketKey]: {
            ...market,
            strength: nextStrength,
          },
        }
      },
      { ...player.markets },
    ),
  }))
}

export function syncMainSectionStrengthsFromPlayerMarket(
  settings: MainMarketSettings,
  players: Player[],
  marketKey: MarketKey,
): MainMarketSettings {
  const sectionId = getMainSectionForPlayerMarket(marketKey)
  if (!sectionId) return settings

  const section = getMainMarketSection(sectionId)
  let next = settings

  for (let slotIndex = 0; slotIndex < section.strengthSlotCount; slotIndex += 1) {
    const derived = deriveMainSectionSlotStrengthFromPlayers(
      players,
      sectionId,
      slotIndex,
    )
    if (derived === null) continue
    next = updateMainMarketSectionStrength(next, sectionId, slotIndex, derived)
  }

  return next
}

export function syncMainSectionStrengthsFromPlayers(
  settings: MainMarketSettings,
  players: Player[],
  sectionId: MainMarketSectionId,
): MainMarketSettings {
  const section = getMainMarketSection(sectionId)
  let next = settings

  for (let slotIndex = 0; slotIndex < section.strengthSlotCount; slotIndex += 1) {
    const derived = deriveMainSectionSlotStrengthFromPlayers(
      players,
      sectionId,
      slotIndex,
    )
    if (derived === null) continue
    next = updateMainMarketSectionStrength(next, sectionId, slotIndex, derived)
  }

  return next
}

export function syncPlayersStrengthsFromMainSection(
  players: Player[],
  settings: MainMarketSettings,
  sectionId: MainMarketSectionId,
): Player[] {
  const section = getMainMarketSection(sectionId)
  const strengths = settings.sectionStrengths[sectionId] ?? []

  return section.strengthLines.reduce((acc, _, slotIndex) => {
    const strength = strengths[slotIndex] ?? 0
    return applyMainSectionStrengthToPlayers(
      acc,
      sectionId,
      slotIndex,
      strength,
    )
  }, players)
}

export function syncAllPlayersStrengthsFromMainMarkets(
  players: Player[],
  settings: MainMarketSettings,
): Player[] {
  return (
    Object.keys(MAIN_MARKET_SECTION_PLAYER_MARKETS) as MainMarketSectionId[]
  ).reduce(
    (acc, sectionId) => syncPlayersStrengthsFromMainSection(acc, settings, sectionId),
    players,
  )
}

export function getLinkedProposalKeysForSectionSlot(
  players: Player[],
  sectionId: MainMarketSectionId,
  slotIndex: number,
): string[] {
  const section = getMainMarketSection(sectionId)
  const line = section.strengthLines[slotIndex]
  if (line === undefined) return []

  const marketKeys = getPlayerMarketsForMainSection(sectionId)
  const keys: string[] = []

  for (const player of players) {
    for (const marketKey of marketKeys) {
      if (player.markets[marketKey].ourLine === line) {
        keys.push(proposalKey(player.id, marketKey))
      }
    }
  }

  return keys
}

export function removeProposalKeys(
  proposals: ProposalMap,
  keys: string[],
): ProposalMap {
  if (keys.length === 0) return proposals

  const next = { ...proposals }
  for (const key of keys) {
    delete next[key]
  }
  return next
}

export function applySuspensionToPlayerMarkets(
  players: Player[],
  marketKeys: readonly MarketKey[],
  suspended: boolean,
): Player[] {
  if (marketKeys.length === 0) return players

  return players.map((player) => ({
    ...player,
    markets: marketKeys.reduce(
      (markets, marketKey) => ({
        ...markets,
        [marketKey]: {
          ...markets[marketKey],
          suspended,
        },
      }),
      { ...player.markets },
    ),
  }))
}

export function areAllLinkedPlayerMarketsSuspended(
  players: Player[],
  sectionId: MainMarketSectionId,
): boolean {
  const marketKeys = getPlayerMarketsForMainSection(sectionId)
  if (marketKeys.length === 0 || players.length === 0) return false

  return players.every((player) =>
    marketKeys.every((marketKey) => player.markets[marketKey].suspended),
  )
}

export function syncMainSectionStatusFromPlayers(
  settings: MainMarketSettings,
  players: Player[],
  sectionId: MainMarketSectionId,
): MainMarketSettings {
  const currentStatus = settings.sectionStatus[sectionId] ?? 'trading'
  if (currentStatus !== 'trading') return settings

  if (areAllLinkedPlayerMarketsSuspended(players, sectionId)) {
    return updateMainMarketSectionStatus(settings, sectionId, 'suspended')
  }

  return settings
}

export function syncAllMainSectionStrengthsFromPlayers(
  settings: MainMarketSettings,
  players: Player[],
): MainMarketSettings {
  return (
    Object.keys(MAIN_MARKET_SECTION_PLAYER_MARKETS) as MainMarketSectionId[]
  ).reduce(
    (acc, sectionId) => syncMainSectionStrengthsFromPlayers(acc, players, sectionId),
    settings,
  )
}

export function syncAllMainSectionsFromPlayers(
  settings: MainMarketSettings,
  players: Player[],
): MainMarketSettings {
  return (
    Object.keys(MAIN_MARKET_SECTION_PLAYER_MARKETS) as MainMarketSectionId[]
  ).reduce(
    (acc, sectionId) => syncMainSectionStatusFromPlayers(acc, players, sectionId),
    settings,
  )
}

export function syncPlayersFromMainMarkets(
  settings: MainMarketSettings,
  players: Player[],
): Player[] {
  return (
    Object.keys(MAIN_MARKET_SECTION_PLAYER_MARKETS) as MainMarketSectionId[]
  ).reduce((acc, sectionId) => {
    const marketKeys = getPlayerMarketsForMainSection(sectionId)
    if (marketKeys.length === 0) return acc

    const status = settings.sectionStatus[sectionId] ?? 'trading'
    return applySuspensionToPlayerMarkets(
      acc,
      marketKeys,
      shouldSuspendPlayerMarketsForSectionStatus(status),
    )
  }, players)
}
