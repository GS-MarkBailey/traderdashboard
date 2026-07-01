import { useMemo } from 'react'
import type { MainMarketSectionStatus, MainMarketSettings } from '../types/trading'
import type { TradingTier } from '../lib/tradingTier'
import { isMainSectionVisibleForTier } from '../lib/tradingTier'
import {
  buildMainMarketHealthSnapshot,
  getMainMarketSectionStatusLabel,
  MAIN_MARKET_STATUS_DOT,
  type MainMarketColumnStatus,
} from '../lib/mainMarketHealth'
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
    banner: 'border-amber-200 bg-amber-50 text-amber-900',
    dot: 'bg-amber-500',
    score: 'text-amber-700',
  },
  critical: {
    label: 'Main markets critical',
    description: 'Unpriced columns or widespread price drift detected.',
    banner: 'border-red-200 bg-red-50 text-red-900',
    dot: 'bg-red-500',
    score: 'text-red-700',
  },
} as const

const ISSUE_BADGE: Record<
  Exclude<MainMarketColumnStatus, 'healthy' | 'closed'>,
  { label: string; className: string }
> = {
  unpriced: { label: 'Unpriced', className: 'bg-[#fde8e8] text-red-800' },
  price: { label: 'Price', className: 'bg-[#f3b4b4] text-red-900' },
  suspended: { label: 'Suspended', className: 'bg-[#fffbeb] text-amber-900' },
}

const SECTION_STATUS_BADGE: Record<MainMarketSectionStatus, string> = {
  trading: 'bg-white text-gray-700 ring-1 ring-inset ring-gray-200',
  suspended: 'bg-[#fffbeb] text-amber-900 ring-1 ring-inset ring-[#fcd34d]',
  closed: 'bg-[#fde8e8] text-red-800 ring-1 ring-inset ring-[#fca5a5]',
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
    <div className="rounded-xl border border-[#e5e7eb] bg-white px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${accent ?? 'text-gray-900'}`}>
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-xs text-gray-500">{hint}</p> : null}
    </div>
  )
}


export function MainMarketMonitor({ settings, tier }: MainMarketMonitorProps) {
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
        <section className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white">
          <div className="border-b border-[#e5e7eb] px-4 py-3">
            <h3 className="font-heading text-sm font-semibold text-gray-900">
              Health by section
            </h3>
            <p className="mt-0.5 text-xs text-gray-500">
              Healthy, suspended, and attention share per main market group
            </p>
            <HealthSegmentLegend />
          </div>
          <div className="divide-y divide-[#e5e7eb]">
            {visibleSections.map((section) => (
              <div
                key={section.sectionId}
                className="grid grid-cols-[1fr] items-center gap-x-4 gap-y-1 px-4 py-2.5 sm:grid-cols-[10rem_1fr]"
              >
                <div className="min-w-0">
                  <TruncatedText as="p" className="text-sm font-medium text-gray-800">
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

        <section className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white">
          <div className="border-b border-[#e5e7eb] px-4 py-3">
            <h3 className="font-heading text-sm font-semibold text-gray-900">
              Section overview
            </h3>
            <p className="mt-0.5 text-xs text-gray-500">
              Trading state and column counts
            </p>
          </div>
          <div className="grid grid-cols-2 gap-px bg-[#e5e7eb]">
            <div className="bg-white px-4 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Trading
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-emerald-700">
                {snapshot.tradingSections}
              </p>
            </div>
            <div className="bg-white px-4 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Healthy columns
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-emerald-700">
                {snapshot.healthyColumns}
              </p>
            </div>
            <div className="bg-white px-4 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Paused columns
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-amber-700">
                {snapshot.suspendedColumns}
              </p>
            </div>
            <div className="bg-white px-4 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Closed columns
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-gray-600">
                {snapshot.closedColumns}
              </p>
            </div>
          </div>

          <div className="border-t border-[#e5e7eb] px-4 py-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
              Legend
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(MAIN_MARKET_STATUS_DOT).map(([key, config]) => (
                <span
                  key={key}
                  className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-medium text-gray-700 ring-1 ring-inset ring-gray-200"
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

      <section className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white">
        <div className="flex items-center justify-between border-b border-[#e5e7eb] px-4 py-3">
          <div>
            <h3 className="font-heading text-sm font-semibold text-gray-900">
              Main market issues
            </h3>
            <p className="mt-0.5 text-xs text-gray-500">
              BM0 / primary price columns requiring attention
            </p>
          </div>
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium tabular-nums text-gray-700">
            {visibleIssues.length}
          </span>
        </div>

        {visibleIssues.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-gray-500">
            No open main market issues — all trading columns are healthy.
          </div>
        ) : (
          <div className="max-h-[min(20rem,calc(100dvh-28rem))] overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-[#f9fafb] text-xs font-medium uppercase tracking-wide text-gray-500">
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
              <tbody className="divide-y divide-[#e5e7eb]">
                {visibleIssues.map((issue) => {
                  const badge =
                    ISSUE_BADGE[issue.status as Exclude<
                      MainMarketColumnStatus,
                      'healthy' | 'closed'
                    >]

                  return (
                    <tr
                      key={`${issue.marketKey}-${issue.columnIndex}`}
                      className="bg-white"
                    >
                      <td className="px-4 py-2.5 font-medium text-gray-900">
                        {issue.sectionLabel}
                      </td>
                      <td className="px-4 py-2.5 text-gray-700">{issue.marketLabel}</td>
                      <td className="px-4 py-2.5 text-gray-700">{issue.columnLabel}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="hidden px-4 py-2.5 text-gray-600 md:table-cell">
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
