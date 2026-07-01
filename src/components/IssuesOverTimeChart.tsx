import { useCallback, useMemo, useState } from 'react'
import type { IssueTimelinePoint } from '../types/trading'
import {
  MATCH_LENGTH,
  toCumulativeTimeline,
  type IssueTimelineView,
} from '../lib/issueTimeline'
import { useClearOnScroll } from '../hooks/useClearOnScroll'

interface IssuesOverTimeChartProps {
  timeline: IssueTimelinePoint[]
  matchMinute: number
}

const CHART_WIDTH = 640
const CHART_HEIGHT = 160
const PAD = { top: 12, right: 8, bottom: 28, left: 8 }
const PLOT_WIDTH = CHART_WIDTH - PAD.left - PAD.right
const PLOT_HEIGHT = CHART_HEIGHT - PAD.top - PAD.bottom

const VIEW_OPTIONS: { value: IssueTimelineView; label: string }[] = [
  { value: 'current', label: 'Current' },
  { value: 'cumulative', label: 'Cumulative' },
]

function formatMinuteLabel(minute: number): string {
  if (minute === 45) return 'HT'
  if (minute === 0) return '0′'
  if (minute === 90) return '90′'
  return `${minute}′`
}

function FilterPills({
  value,
  onChange,
}: {
  value: IssueTimelineView
  onChange: (value: IssueTimelineView) => void
}) {
  return (
    <div className="flex rounded-lg border border-app-border bg-app-subtle p-0.5">
      {VIEW_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
            value === option.value
              ? 'bg-app-surface text-app-text shadow-sm'
              : 'text-app-text-muted hover:text-app-text'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function IssuesOverTimeChart({
  timeline,
  matchMinute,
}: IssuesOverTimeChartProps) {
  const [view, setView] = useState<IssueTimelineView>('current')
  const [hoveredMinute, setHoveredMinute] = useState<number | null>(null)
  const clearHover = useCallback(() => setHoveredMinute(null), [])
  useClearOnScroll(clearHover, hoveredMinute !== null)

  const displayTimeline = useMemo(
    () => (view === 'cumulative' ? toCumulativeTimeline(timeline) : timeline),
    [timeline, view],
  )

  const chartData = useMemo(() => {
    const yMax = Math.max(4, ...displayTimeline.map((point) => point.issueCells), 1)

    const xScale = (minute: number) => PAD.left + (minute / MATCH_LENGTH) * PLOT_WIDTH
    const yScale = (value: number) =>
      PAD.top + PLOT_HEIGHT - (value / yMax) * PLOT_HEIGHT

    const points = displayTimeline.map((point) => ({
      ...point,
      x: xScale(point.minute),
      y: yScale(point.issueCells),
      yBase: yScale(0),
    }))

    const linePath = points
      .map((point, index) => {
        const command = index === 0 ? 'M' : 'L'
        return `${command} ${point.x} ${point.y}`
      })
      .join(' ')

    const areaPath =
      points.length === 0
        ? ''
        : `${linePath} L ${points[points.length - 1].x} ${points[0].yBase} L ${points[0].x} ${points[0].yBase} Z`

    const hovered =
      hoveredMinute === null
        ? null
        : points.find((point) => point.minute === hoveredMinute) ?? null

    return { yMax, points, linePath, areaPath, xScale, yScale, hovered }
  }, [displayTimeline, hoveredMinute])

  if (timeline.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-app-text-faint">
        No match timeline yet.
      </div>
    )
  }

  const currentX = chartData.xScale(Math.min(matchMinute, MATCH_LENGTH))
  const xTicks = [0, 45, 90]
  const displayMinute = chartData.hovered?.minute ?? matchMinute
  const displayIssues =
    chartData.hovered?.issueCells ?? chartData.points.at(-1)?.issueCells ?? 0
  const issueLabel =
    view === 'cumulative'
      ? `${displayIssues} cumulative issue${displayIssues === 1 ? '' : 's'}`
      : `${displayIssues} open issue${displayIssues === 1 ? '' : 's'}`

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <FilterPills value={view} onChange={setView} />
      </div>

      <div className="relative w-full">
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="block h-auto w-full"
          role="img"
          aria-label={
            view === 'cumulative'
              ? 'Cumulative issues over match time'
              : 'Current open issues over match time'
          }
        >
          <line
            x1={PAD.left}
            x2={CHART_WIDTH - PAD.right}
            y1={PAD.top + PLOT_HEIGHT}
            y2={PAD.top + PLOT_HEIGHT}
            stroke="var(--color-app-chart-grid)"
            strokeWidth={1}
          />

          <path d={chartData.areaPath} fill="var(--color-app-chart-fill)" />

          <path
            d={chartData.linePath}
            fill="none"
            stroke="var(--color-app-chart-line)"
            strokeWidth={1.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          <line
            x1={currentX}
            x2={currentX}
            y1={PAD.top}
            y2={PAD.top + PLOT_HEIGHT}
            stroke="var(--color-app-chart-marker)"
            strokeWidth={1}
          />

          {xTicks.map((tick) => (
            <text
              key={tick}
              x={chartData.xScale(tick)}
              y={CHART_HEIGHT - 8}
              textAnchor="middle"
              fill="var(--color-app-text-faint)"
              className="text-[10px]"
            >
              {formatMinuteLabel(tick)}
            </text>
          ))}

          {chartData.points.map((point) => (
            <rect
              key={point.minute}
              x={point.x - 6}
              y={PAD.top}
              width={12}
              height={PLOT_HEIGHT}
              fill="transparent"
              className="cursor-default"
              onMouseEnter={() => setHoveredMinute(point.minute)}
              onMouseLeave={clearHover}
            />
          ))}

          {chartData.hovered ? (
            <>
              <circle
                cx={chartData.hovered.x}
                cy={chartData.hovered.y}
                r={3}
                fill="var(--color-app-chart-line)"
              />
              <line
                x1={chartData.hovered.x}
                x2={chartData.hovered.x}
                y1={PAD.top}
                y2={PAD.top + PLOT_HEIGHT}
                stroke="var(--color-app-chart-grid)"
                strokeWidth={1}
              />
            </>
          ) : null}
        </svg>

        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-5 px-0.5 text-xs leading-5 tabular-nums text-app-text-faint"
          aria-live="polite"
        >
          <span className={chartData.hovered ? 'text-app-text-muted' : undefined}>
            <span className={chartData.hovered ? 'text-app-text' : undefined}>
              {formatMinuteLabel(displayMinute)}
            </span>
            {' · '}
            {issueLabel}
          </span>
        </div>
      </div>
    </div>
  )
}
