import type { Player } from '../types/trading'

function playerGroupRank(player: Player): number {
  if (player.team === 'home' && player.active) return 0
  if (player.team === 'away' && player.active) return 1
  if (player.team === 'home') return 2
  return 3
}

function squadIndex(player: Player): number {
  const indexPart = player.id.split('-')[1]
  return Number.parseInt(indexPart ?? '0', 10)
}

export function comparePlayersDefaultOrder(a: Player, b: Player): number {
  const rankDiff = playerGroupRank(a) - playerGroupRank(b)
  if (rankDiff !== 0) return rankDiff
  return squadIndex(a) - squadIndex(b)
}

export function sortPlayersDefaultOrder(players: Player[]): Player[] {
  return [...players].sort(comparePlayersDefaultOrder)
}
