import { useMemo } from 'react'
import type { MainMarketSectionStatus, MainMarketSettings } from '../types/trading'
import type { TradingTier } from '../lib/tradingTier'
import { isMainSectionVisibleForTier } from '../lib/tradingTier'
import {
  buildMainMarketHealthSnapshot,
  getMainMarketSectionStatusLabel,
  getMainMarketStatusDot,
  type MainMarketColumnStatus,
} from '../lib/mainMarketHealth'
import { useTheme } from '../lib/theme'
import { HealthSegmentBar, HealthSegmentLegend } from './HealthSegmentBar'
import { TruncatedText } from './TruncatedText'

interface MainMarketMonitorProps {
  settings: MainMarketSettings
  tier: TradingTier
}

const STATUS_CONFIG = {
  healthy: {
    label: 'Main markets healthy',
    description: 'All trading columns are within tolerance.',
    banner: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    dot: 'bg-emerald-500',
    score: 'text-emerald-700',
  },
  attention: {
    label: 'Main markets need attention',
    description: 'Some BM0 prices have drifted from primary.',
    banner: 'border-amber-200 bg-amber-50 text-app-issue-amber-text',
    dot: 'bg-amber-500',
    score: 'text-amber-700',
  },
  critical: {
    label: 'Main markets critical',
    description: 'Unpriced columns or widespread price drift detected.',
    banner: 'border-red-200 bg-red-50 text-app-issue-price-text',
    dot: 'bg-red-500',
    score: 'text-red-700',
  },
} as const

const ISSUE_BADGE: Record<
  Exclude<MainMarketColumnStatus, 'healthy' | 'closed'>,
  { label: string; className: string }
> = {
  unpriced: { label: 'Unpriced', className: 'bg-app-issue-red-bg text-app-issue-red-text' },
  price: { label: 'Price', className: 'bg-app-issue-price-bg text-app-issue-price-text' },
  suspended: { label: 'Suspended', className: 'bg-app-issue-amber-bg text-app-issue-amber-text' },
}

const SECTION_STATUS_BADGE: Record<MainMarketSectionStatus, string> = {
  trading: 'bg-app-surface text-app-text-secondary ring-1 ring-inset ring-app-border',
  suspended: 'bg-app-issue-amber-bg text-app-issue-amber-text ring-1 ring-inset ring-app-issue-amber-border',
  closed: 'bg-app-issue-red-bg text-app-issue-red-text ring-1 ring-inset ring-app-issue-red-border',
}

function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string
  value: string | number
  hint?: string
  accent?: string
}) {
  return (
    <div className="rounded-xl border border-app-border bg-app-surface px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-app-text-muted">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${accent ?? 'text-app-text'}`}>
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-xs text-app-text-muted">{hint}</p> : null}
    </div>
  )
}


export function MainMarketMonitor({ settings, tier }: MainMarketMonitorProps) {
  const { resolvedTheme } = useTheme()
  const statusDot = getMainMarketStatusDot(resolvedTheme)
  const snapshot = useMemo(
    () => buildMainMarketHealthSnapshot(settings),
    [settings],
  )

  const visibleSections = useMemo(
    () =>
      snapshot.bySection.filter((section) =>
        isMainSectionVisibleForTier(tier, section.sectionId),
      ),
    [snapshot.bySection, tier],
  )

  const visibleIssues = useMemo(
    () =>
      snapshot.issues.filter((issue) =>
        isMainSectionVisibleForTier(tier, issue.sectionId),
      ),
    [snapshot.issues, tier],
  )

  const status = STATUS_CONFIG[snapshot.overallStatus]

  return (
    <div className="flex flex-col gap-4">
      <section
        className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl border px-5 py-4 ${status.banner}`}
      >
        <div className="flex min-w-0 items-start gap-3">
          <span className={`mt-1.5 h-3 w-3 shrink-0 rounded-full ${status.dot}`} />
          <div>
            <h2 className="font-heading text-lg font-semibold">{status.label}</h2>
            <p className="mt-0.5 text-sm opacity-90">{status.description}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium uppercase tracking-wide opacity-75">
            Health score
          </p>
          <p className={`text-3xl font-bold tabular-nums ${status.score}`}>
            {snapshot.healthScore}%
          </p>
          <p className="text-xs opacity-75">of trading columns healthy</p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Sections" value={snapshot.totalSections} hint="main market groups" />
        <StatCard
          label="Price columns"
          value={snapshot.totalColumns}
          hint={`${snapshot.tradingColumns} trading`}
        />
        <StatCard
          label="Issues"
          value={snapshot.issueColumns}
          hint="unpriced or price drift"
          accent={snapshot.issueColumns > 0 ? 'text-red-700' : 'text-emerald-700'}
        />
        <StatCard
          label="Unpriced"
          value={snapshot.unpricedColumns}
          accent={snapshot.unpricedColumns > 0 ? 'text-red-700' : undefined}
        />
        <StatCard
          label="Price drift"
          value={snapshot.priceIssueColumns}
          hint="BM0 &gt;2% off Pri"
          accent={snapshot.priceIssueColumns > 0 ? 'text-red-700' : undefined}
        />
        <StatCard
          label="Suspended"
          value={snapshot.suspendedSections}
          hint={`${snapshot.closedSections} closed`}
          accent={
            snapshot.suspendedSections > 0 || snapshot.closedSections > 0
              ? 'text-amber-700'
              : undefined
          }
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border border-app-border bg-app-surface">
          <div className="border-b border-app-border px-4 py-3">
            <h3 className="font-heading text-sm font-semibold text-app-text">
              Health by section
            </h3>
            <p className="mt-0.5 text-xs text-app-text-muted">
              Healthy, suspended, and attention share per main market group
            </p>
            <HealthSegmentLegend />
          </div>
          <div className="divide-y divide-app-border">
            {visibleSections.map((section) => (
              <div
                key={section.sectionId}
                className="grid grid-cols-[1fr] items-center gap-x-4 gap-y-1 px-4 py-2.5 sm:grid-cols-[10rem_1fr]"
              >
                <div className="min-w-0">
                  <TruncatedText as="p" className="text-sm font-medium text-app-text-secondary">
                    {section.sectionLabel}
                  </TruncatedText>
                  <span
                    className={`mt-1 inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium ${SECTION_STATUS_BADGE[section.sectionStatus]}`}
                  >
                    {getMainMarketSectionStatusLabel(section.sectionStatus)}
                  </span>
                </div>
                <HealthSegmentBar
                  healthy={section.healthy}
                  suspended={section.suspended + section.closed}
                  attention={section.issueColumns}
                  total={section.totalColumns}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-app-border bg-app-surface">
          <div className="border-b border-app-border px-4 py-3">
            <h3 className="font-heading text-sm font-semibold text-app-text">
              Section overview
            </h3>
            <p className="mt-0.5 text-xs text-app-text-muted">
              Trading state and column counts
            </p>
          </div>
          <div className="grid grid-cols-2 gap-px bg-app-border">
            <div className="bg-app-surface px-4 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-app-text-muted">
                Trading
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-emerald-700">
                {snapshot.tradingSections}
              </p>
            </div>
            <div className="bg-app-surface px-4 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-app-text-muted">
                Healthy columns
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-emerald-700">
                {snapshot.healthyColumns}
              </p>
            </div>
            <div className="bg-app-surface px-4 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-app-text-muted">
                Paused columns
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-amber-700">
                {snapshot.suspendedColumns}
              </p>
            </div>
            <div className="bg-app-surface px-4 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-app-text-muted">
                Closed columns
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-app-text-muted">
                {snapshot.closedColumns}
              </p>
            </div>
          </div>

          <div className="border-t border-app-border px-4 py-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-app-text-muted">
              Legend
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(statusDot).map(([key, config]) => (
                <span
                  key={key}
                  className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-medium text-app-text-secondary ring-1 ring-inset ring-app-border"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: config.color }}
                  />
                  {config.label}
                </span>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-2xl border border-app-border bg-app-surface">
        <div className="flex items-center justify-between border-b border-app-border px-4 py-3">
          <div>
            <h3 className="font-heading text-sm font-semibold text-app-text">
              Main market issues
            </h3>
            <p className="mt-0.5 text-xs text-app-text-muted">
              BM0 / primary price columns requiring attention
            </p>
          </div>
          <span className="rounded-full bg-app-subtle px-2.5 py-0.5 text-xs font-medium tabular-nums text-app-text-secondary">
            {visibleIssues.length}
          </span>
        </div>

        {visibleIssues.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-app-text-muted">
            No open main market issues — all trading columns are healthy.
          </div>
        ) : (
          <div className="max-h-[min(20rem,calc(100dvh-28rem))] overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-app-muted text-xs font-medium uppercase tracking-wide text-app-text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">Section</th>
                  <th className="px-4 py-2 font-medium">Market</th>
                  <th className="px-4 py-2 font-medium">Column</th>
                  <th className="px-4 py-2 font-medium">Issue</th>
                  <th className="hidden px-4 py-2 font-medium md:table-cell">
                    Detail
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {visibleIssues.map((issue) => {
                  const badge =
                    ISSUE_BADGE[issue.status as Exclude<
                      MainMarketColumnStatus,
                      'healthy' | 'closed'
                    >]

                  return (
                    <tr
                      key={`${issue.marketKey}-${issue.columnIndex}`}
                      className="bg-app-surface"
                    >
                      <td className="px-4 py-2.5 font-medium text-app-text">
                        {issue.sectionLabel}
                      </td>
                      <td className="px-4 py-2.5 text-app-text-secondary">{issue.marketLabel}</td>
                      <td className="px-4 py-2.5 text-app-text-secondary">{issue.columnLabel}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="hidden px-4 py-2.5 text-app-text-muted md:table-cell">
                        {issue.detail}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
