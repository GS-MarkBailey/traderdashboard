import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  MainMarketSectionId,
  MainMarketSectionStatus,
  MainMarketsLayout,
  MarketKey,
  StrengthMode,
} from '../types/trading'
import { MARKET_COLUMNS } from '../types/trading'
import {
  filterTradingCellRows,
  type TradingFixtureBundle,
  type TradingTableFilters,
} from '../lib/cellFilters'
import { formatKickoffDateTime } from '../lib/fixture'
import {
  updateMainMarketSectionStatus,
  updateMainMarketSectionStrength,
} from '../lib/mainMarkets'
import {
  calculatePriceFromStrength,
  formatPrice,
  getEffectiveStrength,
  strengthChangesPrice,
} from '../lib/pricing'
import {
  applyProposalsToPlayers,
  mergePendingProposal,
  parseProposalKey,
  proposalKey,
  type ProposalMap,
  type ProposalSummary,
} from '../lib/proposals'
import type { TradingTier } from '../lib/tradingTier'
import {
  buildTradingFixtureBundles,
  getTradingCompetitions,
} from '../lib/tradingAggregate'
import { MainMarketsPanel } from './MainMarketsPanel'
import { PlayerListTable } from './PlayerListTable'
import { Toolbar } from './Toolbar'
import { TradingTabs, type TradingTab } from './TradingTabs'
import { FORM_SELECT_CLASS } from '../lib/tableTypography'

const DEFAULT_FILTERS: TradingTableFilters = {
  search: '',
  team: 'all',
  pricing: 'all',
  status: 'all',
  issues: 'all',
  competition: 'all',
}

const PAGE_SIZE = 75

function maxStrengthAcrossPlayers(
  players: TradingFixtureBundle['players'],
  getStrengthForCell: (playerId: string, marketKey: MarketKey, committed: number) => number,
): number {
  let max = 0

  for (const player of players) {
    for (const column of MARKET_COLUMNS) {
      const strength = getStrengthForCell(
        player.id,
        column.key,
        player.markets[column.key].strength,
      )
      if (strength > max) max = strength
    }
  }

  return max
}

function filterBundlesByCompetition(
  bundles: TradingFixtureBundle[],
  competition: string,
): TradingFixtureBundle[] {
  if (competition === 'all') return bundles
  return bundles.filter((bundle) => bundle.competition === competition)
}

interface TradingViewProps {
  tier: TradingTier
}

export function TradingView({ tier }: TradingViewProps) {
  const [bundles, setBundles] = useState<TradingFixtureBundle[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TradingTab>('main-markets')
  const [mainMarketsLayout, setMainMarketsLayout] = useState<MainMarketsLayout>('stacked')
  const [page, setPage] = useState(0)
  const [proposals, setProposals] = useState<ProposalMap>({})
  const [filters, setFilters] = useState<TradingTableFilters>(DEFAULT_FILTERS)
  const [strengthMode, setStrengthMode] = useState<StrengthMode>('absolute')

  useEffect(() => {
    setIsLoading(true)
    const timeoutId = window.setTimeout(() => {
      setBundles(buildTradingFixtureBundles())
      setIsLoading(false)
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [])

  const competitions = useMemo(
    () => (bundles ? getTradingCompetitions(bundles) : []),
    [bundles],
  )

  const visibleBundles = useMemo(
    () => (bundles ? filterBundlesByCompetition(bundles, filters.competition) : []),
    [bundles, filters.competition],
  )

  const players = useMemo(
    () => bundles?.flatMap((bundle) => bundle.players) ?? [],
    [bundles],
  )

  const getStrengthForCell = useCallback(
    (playerId: string, marketKey: MarketKey, committedStrength: number) => {
      const proposal = proposals[proposalKey(playerId, marketKey)]
      return proposal?.strength ?? committedStrength
    },
    [proposals],
  )

  const maxStrengthInMatch = useMemo(() => {
    if (players.length === 0) return 0
    return maxStrengthAcrossPlayers(players, getStrengthForCell)
  }, [players, getStrengthForCell])

  const filteredCellRows = useMemo(() => {
    if (!bundles) return []
    return filterTradingCellRows(bundles, filters, strengthMode, maxStrengthInMatch)
  }, [bundles, filters, strengthMode, maxStrengthInMatch])

  const pageCount = Math.max(1, Math.ceil(filteredCellRows.length / PAGE_SIZE))

  useEffect(() => {
    setPage(0)
  }, [filters.competition, filters.search, filters.team, filters.pricing, filters.status, filters.issues])

  useEffect(() => {
    if (page > pageCount - 1) {
      setPage(Math.max(0, pageCount - 1))
    }
  }, [page, pageCount])

  const pagedCellRows = useMemo(() => {
    const start = page * PAGE_SIZE
    return filteredCellRows.slice(start, start + PAGE_SIZE)
  }, [filteredCellRows, page])

  const proposalSummaries = useMemo((): ProposalSummary[] => {
    const playerById = new Map(players.map((player) => [player.id, player]))
    const marketLabelByKey = new Map(
      MARKET_COLUMNS.map((column) => [column.key, column.label]),
    )
    const summaries: ProposalSummary[] = []

    for (const [key, proposal] of Object.entries(proposals)) {
      const { playerId, marketKey } = parseProposalKey(key)
      const player = playerById.get(playerId)
      if (!player) continue

      const market = player.markets[marketKey]
      const committedEffectiveStrength = getEffectiveStrength(
        market.strength,
        strengthMode,
        maxStrengthInMatch,
      )
      const proposedEffectiveStrength = getEffectiveStrength(
        proposal.strength,
        strengthMode,
        maxStrengthInMatch,
      )

      summaries.push({
        key,
        playerId,
        playerName: player.name,
        teamBadge: player.teamBadge,
        marketKey,
        marketLabel: marketLabelByKey.get(marketKey) ?? marketKey,
        committedStrength: market.strength,
        proposedStrength: proposal.strength,
        committedPrice: formatPrice(
          calculatePriceFromStrength(committedEffectiveStrength),
        ),
        proposedPrice: formatPrice(
          calculatePriceFromStrength(proposedEffectiveStrength),
        ),
      })
    }

    return summaries.sort((left, right) => left.playerName.localeCompare(right.playerName))
  }, [players, proposals, strengthMode, maxStrengthInMatch])

  const proposeStrength = useCallback(
    (playerId: string, marketKey: MarketKey, strength: number) => {
      const player = players.find((entry) => entry.id === playerId)
      const committedStrength = player?.markets[marketKey].strength ?? 0
      const key = proposalKey(playerId, marketKey)

      setProposals((current) => {
        const hasPriceChange = strengthChangesPrice(
          committedStrength,
          strength,
          strengthMode,
          maxStrengthInMatch,
        )

        if (!hasPriceChange) {
          if (!(key in current)) return current
          const { [key]: _, ...rest } = current
          return rest
        }

        return { ...current, [key]: { strength } }
      })
    },
    [players, strengthMode, maxStrengthInMatch],
  )

  const submitAllProposals = useCallback(
    (pending?: { playerId: string; marketKey: MarketKey; strength: number }) => {
      setProposals((currentProposals) => {
        setBundles((currentBundles) => {
          if (!currentBundles) return currentBundles

          const currentPlayers = currentBundles.flatMap((bundle) => bundle.players)
          const toApply = mergePendingProposal(
            currentProposals,
            pending,
            currentPlayers,
            strengthMode,
            maxStrengthInMatch,
          )

          if (Object.keys(toApply).length === 0) {
            return currentBundles
          }

          const nextPlayers = applyProposalsToPlayers(currentPlayers, toApply)
          const nextById = new Map(nextPlayers.map((player) => [player.id, player]))

          return currentBundles.map((bundle) => ({
            ...bundle,
            players: bundle.players.map(
              (player: (typeof bundle.players)[number]) =>
                nextById.get(player.id) ?? player,
            ),
          }))
        })

        return {}
      })
    },
    [strengthMode, maxStrengthInMatch],
  )

  const updateFilter = <K extends keyof TradingTableFilters>(
    key: K,
    value: TradingTableFilters[K],
  ) => {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  const updateBundleMainMarkets = useCallback(
    (
      fixtureId: string,
      updater: (settings: TradingFixtureBundle['mainMarkets']) => TradingFixtureBundle['mainMarkets'],
    ) => {
      setBundles((currentBundles) => {
        if (!currentBundles) return currentBundles

        return currentBundles.map((bundle) =>
          bundle.fixtureId === fixtureId
            ? { ...bundle, mainMarkets: updater(bundle.mainMarkets) }
            : bundle,
        )
      })
    },
    [],
  )

  const handleApplyMainMarketSectionStrength = useCallback(
    (fixtureId: string, sectionId: MainMarketSectionId, slotIndex: number, strength: number) => {
      updateBundleMainMarkets(fixtureId, (settings) =>
        updateMainMarketSectionStrength(settings, sectionId, slotIndex, strength),
      )
    },
    [updateBundleMainMarkets],
  )

  const handleMainMarketSectionStatusChange = useCallback(
    (fixtureId: string, sectionId: MainMarketSectionId, status: MainMarketSectionStatus) => {
      updateBundleMainMarkets(fixtureId, (settings) =>
        updateMainMarketSectionStatus(settings, sectionId, status),
      )
    },
    [updateBundleMainMarkets],
  )

  const handlePlayerMarketSuspendedChange = useCallback(
    (playerId: string, marketKey: MarketKey, suspended: boolean) => {
      setBundles((currentBundles) => {
        if (!currentBundles) return currentBundles

        return currentBundles.map((bundle) => ({
          ...bundle,
          players: bundle.players.map((player) => {
            if (player.id !== playerId) return player

            return {
              ...player,
              markets: {
                ...player.markets,
                [marketKey]: {
                  ...player.markets[marketKey],
                  suspended,
                },
              },
            }
          }),
        }))
      })
    },
    [],
  )

  const renderMarketCellHandlers = (
    playerId: string,
    marketKey: MarketKey,
    _cellKey: string,
  ) => ({
    onProposeStrength: (strength: number) =>
      proposeStrength(playerId, marketKey, strength),
    onSubmitProposals: (strength: number) => {
      submitAllProposals({ playerId, marketKey, strength })
    },
    onNavigateToNextAttention: () => {},
    onSuspendedChange: (suspended: boolean) =>
      handlePlayerMarketSuspendedChange(playerId, marketKey, suspended),
  })

  const fixtureCount = bundles?.length ?? 0
  const marketCount = filteredCellRows.length
  const pageStart = filteredCellRows.length === 0 ? 0 : page * PAGE_SIZE + 1
  const pageEnd = Math.min(filteredCellRows.length, (page + 1) * PAGE_SIZE)

  if (isLoading || !bundles) {
    return (
      <div className="flex min-h-[16rem] flex-1 items-center justify-center p-6">
        <p className="text-sm text-app-text-muted">Loading trading markets…</p>
      </div>
    )
  }

  return (
    <div className="flex min-w-0 w-full flex-col">
      <div className="border-b border-app-border bg-app-surface px-4 py-3 sm:px-6">
        <h2 className="font-heading text-[13px] font-semibold text-app-text">Trading</h2>
        <p className="mt-1 text-[10px] text-app-text-muted">
          {fixtureCount} fixtures · {competitions.length} competitions
          {activeTab === 'player-props'
            ? ` · ${marketCount.toLocaleString()} player prop rows`
            : ` · ${visibleBundles.length} main market panels`}
        </p>
      </div>

      <div className="bg-app-surface px-4 pt-2 sm:px-6 sm:pt-3">
        <TradingTabs value={activeTab} onChange={setActiveTab} />
      </div>

      {activeTab === 'main-markets' ? (
        <>
          <div className="flex flex-wrap items-center gap-3 border-b border-app-border bg-app-muted px-4 py-3 sm:px-6">
            <label className="flex items-center gap-2">
              <span className="text-xs font-medium text-app-text-muted">Competition</span>
              <select
                value={filters.competition}
                onChange={(event) => updateFilter('competition', event.target.value)}
                className={FORM_SELECT_CLASS}
                aria-label="Filter by competition"
              >
                <option value="all">All competitions</option>
                {competitions.map((competition) => (
                  <option key={competition} value={competition}>
                    {competition}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex min-w-0 flex-col gap-4 p-4 sm:px-6 sm:pb-6">
            {visibleBundles.length === 0 ? (
              <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-app-input-border bg-app-muted text-sm text-app-text-muted">
                No fixtures match the selected competition.
              </div>
            ) : (
              visibleBundles.map((bundle, index) => (
                <article
                  key={bundle.fixtureId}
                  className="overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-sm"
                >
                  <header className="border-b border-app-border bg-app-muted px-4 py-3">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-app-text-muted">
                      {bundle.competition} · {bundle.fixtureId}
                    </p>
                    <h3 className="mt-1 font-heading text-sm font-semibold text-app-text">
                      {bundle.fixture.homeTeam} vs {bundle.fixture.awayTeam}
                    </h3>
                    <p className="mt-0.5 text-[10px] text-app-text-muted">
                      {formatKickoffDateTime(bundle.fixture.kickoffAt)}
                    </p>
                  </header>

                  <MainMarketsPanel
                    settings={bundle.mainMarkets}
                    layout={mainMarketsLayout}
                    tier={tier}
                    sectionTitle="Main Markets"
                    defaultExpanded={index < 2}
                    onLayoutChange={setMainMarketsLayout}
                    onApplySectionStrength={(sectionId, slotIndex, strength) =>
                      handleApplyMainMarketSectionStrength(
                        bundle.fixtureId,
                        sectionId,
                        slotIndex,
                        strength,
                      )
                    }
                    onSectionStatusChange={(sectionId, status) =>
                      handleMainMarketSectionStatusChange(bundle.fixtureId, sectionId, status)
                    }
                  />
                </article>
              ))
            )}
          </div>
        </>
      ) : (
        <>
          <Toolbar
            hasPlayers
            strengthMode={strengthMode}
            search={filters.search}
            teamFilter={filters.team}
            pricingFilter={filters.pricing}
            statusFilter={filters.status}
            issueFilter={filters.issues}
            viewMode="list"
            proposals={proposalSummaries}
            onImport={() => {}}
            onConfirmAllProposals={() => submitAllProposals()}
            onRejectAllProposals={() => setProposals({})}
            onRejectProposal={(key) =>
              setProposals((current) => {
                if (!(key in current)) return current
                const { [key]: _, ...rest } = current
                return rest
              })
            }
            onStrengthModeChange={setStrengthMode}
            onSearchChange={(value) => updateFilter('search', value)}
            onTeamFilterChange={(value) => updateFilter('team', value)}
            onPricingFilterChange={(value) => updateFilter('pricing', value)}
            onStatusFilterChange={(value) => updateFilter('status', value)}
            onIssueFilterChange={(value) => updateFilter('issues', value)}
            onViewModeChange={() => {}}
            showViewMode={false}
            competitions={competitions}
            competitionFilter={filters.competition}
            onCompetitionFilterChange={(value) => updateFilter('competition', value)}
          />

          <div className="p-4 sm:px-6 sm:pb-6">
            <PlayerListTable
              rows={pagedCellRows}
              proposals={proposals}
              strengthMode={strengthMode}
              maxStrengthInMatch={maxStrengthInMatch}
              showFixtureColumns
              getCellHandlers={renderMarketCellHandlers}
              getMarketSuspensionProps={(_, marketSuspended) => ({
                mainSectionLocked: false,
                effectivelySuspended: marketSuspended,
              })}
            />

            {filteredCellRows.length > PAGE_SIZE ? (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-app-text-muted">
                <p>
                  Showing {pageStart.toLocaleString()}–{pageEnd.toLocaleString()} of{' '}
                  {filteredCellRows.length.toLocaleString()} rows
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.max(0, current - 1))}
                    disabled={page === 0}
                    className="rounded-md border border-app-border bg-app-surface px-2.5 py-1 font-medium text-app-text-secondary transition-colors hover:bg-app-hover disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="tabular-nums">
                    Page {page + 1} of {pageCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
                    disabled={page >= pageCount - 1}
                    className="rounded-md border border-app-border bg-app-surface px-2.5 py-1 font-medium text-app-text-secondary transition-colors hover:bg-app-hover disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  )
}
