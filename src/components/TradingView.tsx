import { useCallback, useMemo, useState } from 'react'
import type { MarketKey, StrengthMode, TableFilters } from '../types/trading'
import { MARKET_COLUMNS } from '../types/trading'
import {
  filterTradingCellRows,
  type TradingFixtureBundle,
  type TradingTableFilters,
} from '../lib/cellFilters'
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
import {
  buildTradingFixtureBundles,
  getTradingCompetitions,
} from '../lib/tradingAggregate'
import { ProposalsPopover } from './ProposalsPopover'
import { PlayerListTable } from './PlayerListTable'
import { FORM_SELECT_CLASS } from '../lib/tableTypography'

const DEFAULT_FILTERS: TradingTableFilters = {
  search: '',
  team: 'all',
  pricing: 'all',
  status: 'all',
  issues: 'all',
  competition: 'all',
}

export function TradingView() {
  const [bundles, setBundles] = useState<TradingFixtureBundle[]>(() =>
    buildTradingFixtureBundles(),
  )
  const [proposals, setProposals] = useState<ProposalMap>({})
  const [filters, setFilters] = useState<TradingTableFilters>(DEFAULT_FILTERS)
  const [strengthMode, setStrengthMode] = useState<StrengthMode>('absolute')

  const competitions = useMemo(() => getTradingCompetitions(bundles), [bundles])

  const players = useMemo(
    () => bundles.flatMap((bundle) => bundle.players),
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
    return Math.max(
      ...players.flatMap((player) =>
        MARKET_COLUMNS.map((column) =>
          getStrengthForCell(player.id, column.key, player.markets[column.key].strength),
        ),
      ),
    )
  }, [players, getStrengthForCell])

  const filteredCellRows = useMemo(
    () => filterTradingCellRows(bundles, filters, strengthMode, maxStrengthInMatch),
    [bundles, filters, strengthMode, maxStrengthInMatch],
  )

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

  const handlePlayerMarketSuspendedChange = useCallback(
    (playerId: string, marketKey: MarketKey, suspended: boolean) => {
      setBundles((currentBundles) =>
        currentBundles.map((bundle) => ({
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
        })),
      )
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

  const fixtureCount = bundles.length
  const marketCount = filteredCellRows.length

  return (
    <div className="flex min-w-0 w-full flex-col">
      <div className="border-b border-app-border bg-app-surface px-4 py-3 sm:px-6">
        <h2 className="font-heading text-[13px] font-semibold text-app-text">
          Trading — player props
        </h2>
        <p className="mt-1 text-[10px] text-app-text-muted">
          {fixtureCount} fixtures · {marketCount.toLocaleString()} market rows ·{' '}
          {competitions.length} competitions
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-b border-app-border bg-app-muted px-4 py-3 sm:px-6">
        <ProposalsPopover
          proposals={proposalSummaries}
          visible={proposalSummaries.length > 0}
          onConfirmAll={() => submitAllProposals()}
          onRejectAll={() => setProposals({})}
          onRejectOne={(key) =>
            setProposals((current) => {
              if (!(key in current)) return current
              const { [key]: _, ...rest } = current
              return rest
            })
          }
        />

        <input
          type="search"
          placeholder="Search players…"
          value={filters.search}
          onChange={(event) => updateFilter('search', event.target.value)}
          className="w-44 rounded-lg border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text-secondary outline-none placeholder:text-app-text-faint focus:border-app-focus"
        />

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

        <label className="flex items-center gap-2">
          <span className="text-xs font-medium text-app-text-muted">Strength</span>
          <select
            value={strengthMode}
            onChange={(event) =>
              setStrengthMode(event.target.value as StrengthMode)
            }
            className={FORM_SELECT_CLASS}
            aria-label="Strength mode"
          >
            <option value="absolute">Absolute</option>
            <option value="relative">Relative</option>
          </select>
        </label>

        <label className="flex items-center gap-2">
          <span className="text-xs font-medium text-app-text-muted">Issues</span>
          <select
            value={filters.issues}
            onChange={(event) =>
              updateFilter('issues', event.target.value as TableFilters['issues'])
            }
            className={FORM_SELECT_CLASS}
            aria-label="Issue filter"
          >
            <option value="all">All rows</option>
            <option value="highlighted">Issues only</option>
          </select>
        </label>
      </div>

      <div className="p-4 sm:px-6 sm:pb-6">
        <PlayerListTable
          rows={filteredCellRows}
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
      </div>
    </div>
  )
}
