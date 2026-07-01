import { useMemo } from 'react'
import type { IssueTimelinePoint, MainMarketSettings, Player, StrengthMode } from '../types/trading'
import type { TradingTier } from '../lib/tradingTier'
import { shouldShowPlayerMarketsForTier } from '../lib/tradingTier'
import {
  buildMarketHealthSnapshot,
  getMaxStrengthInMatch,
  type CellHealthStatus,
} from '../lib/marketHealth'
import type { ProposalMap } from '../lib/proposals'
import { IssuesOverTimeChart } from './IssuesOverTimeChart'
import { MainMarketMonitor } from './MainMarketMonitor'
import { HealthSegmentBar, HealthSegmentLegend } from './HealthSegmentBar'
import { TruncatedText } from './TruncatedText'
import { MarketStatusMatrix } from './MarketStatusMatrix'

interface MarketMonitorProps {
  mainMarkets: MainMarketSettings
  players: Player[]
  proposals: ProposalMap
  strengthMode: StrengthMode
  matchMinute: number
  issueTimeline: IssueTimelinePoint[]
  tier: TradingTier
}

const STATUS_CONFIG = {
  healthy: {
    label: 'Healthy',
    description: 'All active markets are within tolerance.',
    banner: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    dot: 'bg-emerald-500',
    score: 'text-emerald-700',
  },
  attention: {
    label: 'Needs attention',
    description: 'Some markets have pricing or line drift.',
    banner: 'border-amber-200 bg-amber-50 text-amber-900',
    dot: 'bg-amber-500',
    score: 'text-amber-700',
  },
  critical: {
    label: 'Critical',
    description: 'Unpriced markets or widespread issues detected.',
    banner: 'border-red-200 bg-red-50 text-red-900',
    dot: 'bg-red-500',
    score: 'text-red-700',
  },
} as const

const ISSUE_BADGE: Record<
  Exclude<CellHealthStatus, 'healthy'>,
  { label: string; className: string }
> = {
  unpriced: { label: 'Unpriced', className: 'bg-[#fde8e8] text-red-800' },
  price: { label: 'Price', className: 'bg-[#f3b4b4] text-red-900' },
  line: { label: 'Line', className: 'bg-[#f3b4b4] text-red-900' },
  multiple: { label: 'Price + Line', className: 'bg-[#fdf0f0] text-red-900' },
  suspended: { label: 'Suspended', className: 'bg-[#fffbeb] text-amber-900' },
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

export function MarketMonitor({
  mainMarkets,
  players,
  proposals,
  strengthMode,
  matchMinute,
  issueTimeline,
  tier,
}: MarketMonitorProps) {
  const showPlayerMarkets = shouldShowPlayerMarketsForTier(tier)
  const maxStrengthInMatch = useMemo(
    () => getMaxStrengthInMatch(players, proposals),
    [players, proposals],
  )

  const snapshot = useMemo(() => {
    if (players.length === 0) return null

    return buildMarketHealthSnapshot(
      players,
      proposals,
      strengthMode,
      maxStrengthInMatch,
    )
  }, [players, proposals, strengthMode, maxStrengthInMatch, players.length])

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div>
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">
          Main markets
        </p>
        <MainMarketMonitor settings={mainMarkets} tier={tier} />
      </div>

      {!showPlayerMarkets ? null : players.length === 0 || !snapshot ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white text-sm text-gray-500">
          Import players to view player prop market health.
        </div>
      ) : (
        <PlayerMarketMonitorContent
          snapshot={snapshot}
          players={players}
          proposals={proposals}
          strengthMode={strengthMode}
          matchMinute={matchMinute}
          issueTimeline={issueTimeline}
        />
      )}
    </div>
  )
}

function PlayerMarketMonitorContent({
  snapshot,
  players,
  proposals,
  strengthMode,
  matchMinute,
  issueTimeline,
}: {
  snapshot: NonNullable<ReturnType<typeof buildMarketHealthSnapshot>>
  players: Player[]
  proposals: ProposalMap
  strengthMode: StrengthMode
  matchMinute: number
  issueTimeline: IssueTimelinePoint[]
}) {
  const status = STATUS_CONFIG[snapshot.overallStatus]

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        Player props
      </p>

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
          <p className="text-xs opacity-75">of active markets healthy</p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Active markets"
          value={snapshot.activeCells}
          hint={`${snapshot.totalCells} total`}
        />
        <StatCard
          label="Issues"
          value={snapshot.issueCells}
          hint="price, line, or unpriced"
          accent={snapshot.issueCells > 0 ? 'text-red-700' : 'text-emerald-700'}
        />
        <StatCard
          label="Unpriced"
          value={snapshot.unpricedCells}
          accent={snapshot.unpricedCells > 0 ? 'text-red-700' : undefined}
        />
        <StatCard
          label="Price drift"
          value={snapshot.priceIssueCells}
          hint="&gt;2% off primary"
          accent={snapshot.priceIssueCells > 0 ? 'text-red-700' : undefined}
        />
        <StatCard
          label="Line mismatch"
          value={snapshot.lineIssueCells}
          accent={snapshot.lineIssueCells > 0 ? 'text-red-700' : undefined}
        />
        <StatCard
          label="Pending proposals"
          value={snapshot.pendingProposals}
          accent={snapshot.pendingProposals > 0 ? 'text-amber-700' : undefined}
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white">
        <div className="border-b border-[#e5e7eb] px-4 py-3">
          <h3 className="font-heading text-sm font-semibold text-gray-900">
            Issues over match time
          </h3>
        </div>
        <div className="px-4 py-5">
          <IssuesOverTimeChart timeline={issueTimeline} matchMinute={matchMinute} />
        </div>
      </section>

      <MarketStatusMatrix
        players={players}
        proposals={proposals}
        strengthMode={strengthMode}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white">
          <div className="border-b border-[#e5e7eb] px-4 py-3">
            <h3 className="font-heading text-sm font-semibold text-gray-900">
              Health by market
            </h3>
            <p className="mt-0.5 text-xs text-gray-500">
              Healthy, suspended, and attention share per prop type
            </p>
            <HealthSegmentLegend />
          </div>
          <div className="divide-y divide-[#e5e7eb]">
            {snapshot.byMarket.map((market) => (
                <div
                  key={market.marketKey}
                  className="grid grid-cols-[1fr] items-center gap-x-4 gap-y-1 px-4 py-2.5 sm:grid-cols-[8rem_1fr]"
                >
                  <TruncatedText className="text-sm font-medium text-gray-800">
                    {market.marketLabel}
                  </TruncatedText>
                  <HealthSegmentBar
                    healthy={market.healthy}
                    suspended={market.suspended}
                    attention={market.issueCells}
                    total={market.total}
                  />
                </div>
              ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white">
          <div className="border-b border-[#e5e7eb] px-4 py-3">
            <h3 className="font-heading text-sm font-semibold text-gray-900">
              Squad overview
            </h3>
            <p className="mt-0.5 text-xs text-gray-500">
              Player and suspension counts
            </p>
          </div>
          <div className="grid grid-cols-2 gap-px bg-[#e5e7eb]">
            <div className="bg-white px-4 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Active players
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-gray-900">
                {snapshot.activePlayers}
              </p>
            </div>
            <div className="bg-white px-4 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Inactive players
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-gray-900">
                {snapshot.inactivePlayers}
              </p>
            </div>
            <div className="bg-white px-4 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Suspended markets
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-amber-700">
                {snapshot.suspendedCells}
              </p>
            </div>
            <div className="bg-white px-4 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Healthy markets
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-emerald-700">
                {snapshot.healthyCells}
              </p>
            </div>
          </div>

          <div className="border-t border-[#e5e7eb] px-4 py-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
              Legend
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(ISSUE_BADGE).map(([key, config]) => (
                <span
                  key={key}
                  className={`rounded px-2 py-0.5 text-[11px] font-medium ${config.className}`}
                >
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
              Open issues
            </h3>
            <p className="mt-0.5 text-xs text-gray-500">
              Markets requiring trader attention (read-only)
            </p>
          </div>
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium tabular-nums text-gray-700">
            {snapshot.issues.length}
          </span>
        </div>

        {snapshot.issues.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-gray-500">
            No open issues — all active markets are healthy.
          </div>
        ) : (
          <div className="max-h-[min(24rem,calc(100dvh-28rem))] overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-[#f9fafb] text-xs font-medium uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Player</th>
                  <th className="px-4 py-2 font-medium">Market</th>
                  <th className="px-4 py-2 font-medium">Issue</th>
                  <th className="hidden px-4 py-2 font-medium sm:table-cell">
                    Detail
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                {snapshot.issues.map((issue) => {
                  const badge =
                    ISSUE_BADGE[issue.status as Exclude<CellHealthStatus, 'healthy'>]

                  return (
                    <tr key={`${issue.playerId}-${issue.marketKey}`} className="bg-white">
                      <td className="px-4 py-2.5">
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className={`inline-flex shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide ${
                              issue.team === 'home'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {issue.teamBadge}
                          </span>
                          <TruncatedText className="font-medium text-gray-900">
                            {issue.playerName}
                          </TruncatedText>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-gray-700">{issue.marketLabel}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="hidden px-4 py-2.5 text-gray-600 sm:table-cell">
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
