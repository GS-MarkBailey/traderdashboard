import type { IssueTimelinePoint } from '../types/trading'
import type { MarketHealthSnapshot } from './marketHealth'

const MATCH_LENGTH = 90

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43_758.5453
  return x - Math.floor(x)
}

export function snapshotToTimelinePoint(
  minute: number,
  snapshot: Pick<
    MarketHealthSnapshot,
    'issueCells' | 'unpricedCells' | 'priceIssueCells' | 'lineIssueCells'
  >,
): IssueTimelinePoint {
  return {
    minute,
    issueCells: snapshot.issueCells,
    unpricedCells: snapshot.unpricedCells,
    priceIssueCells: snapshot.priceIssueCells,
    lineIssueCells: snapshot.lineIssueCells,
  }
}

/** Build a plausible pre-match → current minute issue history ending at live counts. */
export function generateIssueTimeline(
  endMinute: number,
  end: IssueTimelinePoint,
): IssueTimelinePoint[] {
  const cappedMinute = Math.min(MATCH_LENGTH, Math.max(0, endMinute))

  if (cappedMinute === 0) {
    return [{ ...end, minute: 0 }]
  }

  const points: IssueTimelinePoint[] = []

  for (let minute = 0; minute <= cappedMinute; minute += 1) {
    const earlyRamp = Math.pow(Math.max(0, (minute - 4) / 38), 1.35)
    const halfTimeDip =
      minute >= 44 && minute <= 48 ? 0.72 + (minute - 44) * 0.06 : 1
    const secondHalfBoost = minute > 48 ? 1 + (minute - 48) / 70 : 1
    const noise = 0.82 + pseudoRandom(minute * 17 + end.issueCells) * 0.28
    let scale = Math.min(1, earlyRamp * halfTimeDip * secondHalfBoost * noise)

    if (minute <= 2) {
      scale = minute * 0.04
    }

    points.push({
      minute,
      issueCells: Math.max(0, Math.round(end.issueCells * scale)),
      unpricedCells: Math.max(
        0,
        Math.round(
          end.unpricedCells * scale * (0.55 + pseudoRandom(minute + 3) * 0.45),
        ),
      ),
      priceIssueCells: Math.max(0, Math.round(end.priceIssueCells * scale)),
      lineIssueCells: Math.max(0, Math.round(end.lineIssueCells * scale)),
    })
  }

  points[points.length - 1] = { ...end, minute: cappedMinute }
  return points
}

export function upsertTimelinePoint(
  timeline: IssueTimelinePoint[],
  point: IssueTimelinePoint,
): IssueTimelinePoint[] {
  if (timeline.length === 0) {
    return [point]
  }

  const last = timeline[timeline.length - 1]

  if (last.minute === point.minute) {
    if (
      last.issueCells === point.issueCells &&
      last.unpricedCells === point.unpricedCells &&
      last.priceIssueCells === point.priceIssueCells &&
      last.lineIssueCells === point.lineIssueCells
    ) {
      return timeline
    }

    return [...timeline.slice(0, -1), point]
  }

  if (point.minute < last.minute) {
    return timeline
  }

  return [...timeline, point]
}

export function pickKickoffMinute(): number {
  return 48 + Math.floor(Math.random() * 19)
}

export type IssueTimelineView = 'current' | 'cumulative'

/** Running total of new issues detected minute-on-minute (never decreases). */
export function toCumulativeTimeline(
  timeline: IssueTimelinePoint[],
): IssueTimelinePoint[] {
  if (timeline.length === 0) return []

  let running = timeline[0].issueCells

  return timeline.map((point, index) => {
    if (index > 0) {
      running += Math.max(0, point.issueCells - timeline[index - 1].issueCells)
    }

    return {
      ...point,
      issueCells: running,
    }
  })
}

export { MATCH_LENGTH }
