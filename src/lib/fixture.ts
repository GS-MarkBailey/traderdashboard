import type { Fixture } from '../types/trading'
import { getDefaultFixtureId, findFixtureById } from './fixtureTaxonomy'

export function createDefaultFixture(): Fixture {
  return findFixtureById(getDefaultFixtureId())!
}

export function formatKickoffDate(kickoffAt: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(kickoffAt))
}

export function formatKickoffTime(kickoffAt: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(kickoffAt))
}

export function formatKickoffDateTime(kickoffAt: string): string {
  return `${formatKickoffDate(kickoffAt)} · ${formatKickoffTime(kickoffAt)}`
}
