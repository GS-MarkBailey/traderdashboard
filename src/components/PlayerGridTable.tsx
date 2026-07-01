import { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import type { MarketKey, MainMarketSectionId, MainMarketSectionStatus, MainMarketSettings, MainMarketsLayout, Player, StrengthMode, TableFilters } from '../types/trading'
import { MARKET_COLUMNS } from '../types/trading'
import {
  updateMainMarketSectionStatus,
} from '../lib/mainMarkets'
import {
  getMainSectionForPlayerMarket,
  getMainSectionStatusForPlayerMarket,
  isMainSectionLocked,
  isPlayerMarketEffectivelySuspended,
  syncMainSectionStatusFromPlayers,
  syncMainSectionStrengthsFromPlayerMarket,
} from '../lib/mainMarketPlayerSync'
import {
  calculatePriceFromStrength,
  formatPrice,
  getEffectiveStrength,
  strengthChangesPrice,
} from '../lib/pricing'
import {
  filterCellRowsForList,
  filterPlayersForGrid,
} from '../lib/cellFilters'
import {
  parseProposalKey,
  proposalKey,
  applyProposalsToPlayers,
  mergePendingProposal,
  type ProposalMap,
  type ProposalSummary,
} from '../lib/proposals'
import {
  buildAttentionCellKeys,
  buildOrderedCellKeys,
  findNextAttentionCellKey,
  focusStrengthInput,
} from '../lib/cellNavigation'
import type { TradingTier } from '../lib/tradingTier'
import { shouldShowPlayerMarketsForTier } from '../lib/tradingTier'
import { CollapsibleSection } from './CollapsibleSection'
import { MarketCell } from './MarketCell'
import { MainMarketsPanel } from './MainMarketsPanel'
import { PlayerListTable } from './PlayerListTable'
import { Toolbar } from './Toolbar'
import { TruncatedText } from './TruncatedText'
import {
  TABLE_BODY_CLASS,
  TABLE_HEAD_CELL_CLASS,
  TABLE_PLAYER_NAME_CLASS,
  tableTeamBadgeClass,
} from '../lib/tableTypography'

type ViewMode = 'grid' | 'list'

const DEFAULT_FILTERS: TableFilters = {
  search: '',
  team: 'all',
  pricing: 'all',
  status: 'all',
  issues: 'all',
}

interface PlayerGridTableProps {
  players: Player[]
  setPlayers: Dispatch<SetStateAction<Player[]>>
  proposals: ProposalMap
  setProposals: Dispatch<SetStateAction<ProposalMap>>
  strengthMode: StrengthMode
  setStrengthMode: Dispatch<SetStateAction<StrengthMode>>
  mainMarkets: MainMarketSettings
  setMainMarkets: Dispatch<SetStateAction<MainMarketSettings>>
  tier: TradingTier
  onImport: () => void
  onApplyMainMarketSectionStrength: (
    sectionId: MainMarketSectionId,
    slotIndex: number,
    strength: number,
  ) => void
}

export function PlayerGridTable({
  players,
  setPlayers,
  proposals,
  setProposals,
  strengthMode,
  setStrengthMode,
  mainMarkets,
  setMainMarkets,
  tier,
  onImport,
  onApplyMainMarketSectionStrength,
}: PlayerGridTableProps) {
  const [filters, setFilters] = useState<TableFilters>(DEFAULT_FILTERS)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [mainMarketsLayout, setMainMarketsLayout] = useState<MainMarketsLayout>('stacked')

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

    return summaries.sort((a, b) => a.playerName.localeCompare(b.playerName))
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

  const rejectProposalByKey = useCallback((key: string) => {
    setProposals((current) => {
      if (!(key in current)) return current
      const { [key]: _, ...rest } = current
      return rest
    })
  }, [])

  const submitAllProposals = useCallback(
    (pending?: { playerId: string; marketKey: MarketKey; strength: number }) => {
      setProposals((currentProposals) => {
        setPlayers((currentPlayers) => {
          const toApply = mergePendingProposal(
            currentProposals,
            pending,
            currentPlayers,
            strengthMode,
            maxStrengthInMatch,
          )

          if (Object.keys(toApply).length === 0) {
            return currentPlayers
          }

          const nextPlayers = applyProposalsToPlayers(currentPlayers, toApply)

          setMainMarkets((currentMain) => {
            let nextMain = currentMain
            for (const key of Object.keys(toApply)) {
              const { marketKey } = parseProposalKey(key)
              nextMain = syncMainSectionStrengthsFromPlayerMarket(
                nextMain,
                nextPlayers,
                marketKey,
              )
            }
            return nextMain
          })

          return nextPlayers
        })

        return {}
      })
    },
    [strengthMode, maxStrengthInMatch, setMainMarkets],
  )

  const confirmAllProposals = useCallback(() => {
    submitAllProposals()
  }, [submitAllProposals])

  const rejectAllProposals = useCallback(() => {
    setProposals({})
  }, [])

  const filteredPlayers = useMemo(
    () => filterPlayersForGrid(players, filters, strengthMode, maxStrengthInMatch),
    [players, filters, strengthMode, maxStrengthInMatch],
  )

  const filteredCellRows = useMemo(
    () => filterCellRowsForList(players, filters, strengthMode, maxStrengthInMatch),
    [players, filters, strengthMode, maxStrengthInMatch],
  )

  const orderedCellKeys = useMemo(() => {
    if (viewMode === 'list') {
      return filteredCellRows.map((row) => row.cellKey)
    }
    return buildOrderedCellKeys(filteredPlayers)
  }, [viewMode, filteredCellRows, filteredPlayers])

  const navigateToNextAttention = useCallback(
    (
      currentKey: string,
      pending?: { playerId: string; marketKey: MarketKey; strength: number },
      afterSubmit = false,
    ) => {
      const visiblePlayers =
        viewMode === 'list'
          ? [
              ...new Map(
                filteredCellRows.map((row) => [row.player.id, row.player]),
              ).values(),
            ]
          : filteredPlayers

      const attentionKeys = afterSubmit
        ? buildAttentionCellKeys(
            applyProposalsToPlayers(
              visiblePlayers,
              mergePendingProposal(
                proposals,
                pending,
                visiblePlayers,
                strengthMode,
                maxStrengthInMatch,
              ),
            ),
            new Set(),
            strengthMode,
            maxStrengthInMatch,
          )
        : buildAttentionCellKeys(
            visiblePlayers,
            new Set(
              Object.keys(
                mergePendingProposal(
                  proposals,
                  pending,
                  visiblePlayers,
                  strengthMode,
                  maxStrengthInMatch,
                ),
              ),
            ),
            strengthMode,
            maxStrengthInMatch,
          )

      const visibleAttentionKeys =
        viewMode === 'list'
          ? new Set(
              [...attentionKeys].filter((key) => orderedCellKeys.includes(key)),
            )
          : attentionKeys

      const nextKey = findNextAttentionCellKey(
        orderedCellKeys,
        visibleAttentionKeys,
        currentKey,
      )
      if (nextKey) {
        requestAnimationFrame(() => focusStrengthInput(nextKey))
      }
    },
    [
      viewMode,
      filteredCellRows,
      filteredPlayers,
      orderedCellKeys,
      proposals,
      strengthMode,
      maxStrengthInMatch,
    ],
  )

  const updateFilter = <K extends keyof TableFilters>(
    key: K,
    value: TableFilters[K],
  ) => {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  const applyMainMarketSectionStatus = useCallback(
    (sectionId: MainMarketSectionId, status: MainMarketSectionStatus) => {
      setMainMarkets((current) =>
        updateMainMarketSectionStatus(current, sectionId, status),
      )
    },
    [setMainMarkets],
  )

  const getMarketSuspensionProps = useCallback(
    (marketKey: MarketKey, marketSuspended: boolean) => {
      const sectionStatus = getMainSectionStatusForPlayerMarket(mainMarkets, marketKey)
      return {
        mainSectionLocked: isMainSectionLocked(sectionStatus),
        effectivelySuspended: isPlayerMarketEffectivelySuspended(
          marketSuspended,
          sectionStatus,
        ),
      }
    },
    [mainMarkets],
  )

  const handlePlayerMarketSuspendedChange = useCallback(
    (playerId: string, marketKey: MarketKey, suspended: boolean) => {
      const sectionId = getMainSectionForPlayerMarket(marketKey)

      if (sectionId) {
        const sectionStatus = mainMarkets.sectionStatus[sectionId] ?? 'trading'
        if (isMainSectionLocked(sectionStatus)) {
          return
        }
      }

      setPlayers((currentPlayers) => {
        const nextPlayers = currentPlayers.map((player) => {
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
        })

        if (sectionId) {
          setMainMarkets((currentMain) =>
            syncMainSectionStatusFromPlayers(currentMain, nextPlayers, sectionId),
          )
        }

        return nextPlayers
      })
    },
    [mainMarkets.sectionStatus, setMainMarkets, setPlayers],
  )

  const toolbarProps = {
    hasPlayers: players.length > 0,
    strengthMode,
    search: filters.search,
    teamFilter: filters.team,
    pricingFilter: filters.pricing,
    statusFilter: filters.status,
    issueFilter: filters.issues,
    viewMode,
    proposals: proposalSummaries,
    onImport,
    onConfirmAllProposals: confirmAllProposals,
    onRejectAllProposals: rejectAllProposals,
    onRejectProposal: rejectProposalByKey,
    onStrengthModeChange: setStrengthMode,
    onSearchChange: (value: string) => updateFilter('search', value),
    onTeamFilterChange: (value: TableFilters['team']) => updateFilter('team', value),
    onPricingFilterChange: (value: TableFilters['pricing']) =>
      updateFilter('pricing', value),
    onStatusFilterChange: (value: TableFilters['status']) =>
      updateFilter('status', value),
    onIssueFilterChange: (value: TableFilters['issues']) =>
      updateFilter('issues', value),
    onViewModeChange: setViewMode,
  }

  const renderMarketCellHandlers = (
    playerId: string,
    marketKey: MarketKey,
    cellKey: string,
  ) => ({
    onProposeStrength: (strength: number) =>
      proposeStrength(playerId, marketKey, strength),
    onSubmitProposals: (strength: number) => {
      const pending = { playerId, marketKey, strength }
      submitAllProposals(pending)
      navigateToNextAttention(cellKey, pending, true)
    },
    onNavigateToNextAttention: (pendingStrength?: number) =>
      navigateToNextAttention(
        cellKey,
        pendingStrength === undefined
          ? undefined
          : { playerId, marketKey, strength: pendingStrength },
      ),
    onSuspendedChange: (suspended: boolean) =>
      handlePlayerMarketSuspendedChange(playerId, marketKey, suspended),
  })

  const showPlayerMarkets = shouldShowPlayerMarketsForTier(tier)

  return (
    <div className="flex min-w-0 w-full flex-col">
      <MainMarketsPanel
        settings={mainMarkets}
        layout={mainMarketsLayout}
        tier={tier}
        onLayoutChange={setMainMarketsLayout}
        onApplySectionStrength={onApplyMainMarketSectionStrength}
        onSectionStatusChange={applyMainMarketSectionStatus}
      />

      {showPlayerMarkets ? (
      <CollapsibleSection
        title="Player Markets"
        className="border-b border-[#e5e7eb] bg-white px-2 py-2 sm:px-4 sm:py-3"
        bodyClassName="pt-2 sm:pt-3"
      >
        <section className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">
          <Toolbar {...toolbarProps} />

          <div className="p-4">
            {players.length === 0 ? (
              <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-[#f9fafb] text-sm text-gray-500">
                Import players using the button in the toolbar above.
              </div>
            ) : viewMode === 'list' ? (
              <PlayerListTable
                rows={filteredCellRows}
                proposals={proposals}
                strengthMode={strengthMode}
                maxStrengthInMatch={maxStrengthInMatch}
                getCellHandlers={renderMarketCellHandlers}
                getMarketSuspensionProps={getMarketSuspensionProps}
              />
            ) : (
              <div className="w-full max-w-full overflow-x-auto">
                <table className={`w-full table-fixed border-collapse text-left ${TABLE_BODY_CLASS}`}>
                  <colgroup>
                    <col className="w-40" />
                    {MARKET_COLUMNS.map((column) => (
                      <col key={column.key} />
                    ))}
                  </colgroup>
                  <thead>
                    <tr className="bg-[#f9fafb]">
                      <th className={`sticky left-0 z-20 ${TABLE_HEAD_CELL_CLASS}`}>
                        Players
                      </th>
                      {MARKET_COLUMNS.map((column) => (
                        <th
                          key={column.key}
                          className={TABLE_HEAD_CELL_CLASS}
                        >
                          <TruncatedText className="block">{column.label}</TruncatedText>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPlayers.length === 0 ? (
                      <tr>
                        <td
                          colSpan={MARKET_COLUMNS.length + 1}
                          className="border border-[#e5e7eb] px-4 py-12 text-center text-sm text-gray-500"
                        >
                          No players match the current filters.
                        </td>
                      </tr>
                    ) : (
                      filteredPlayers.map((player) => (
                        <tr key={player.id}>
                          <td className="sticky left-0 z-10 border border-[#e5e7eb] bg-white px-1.5 py-1 align-top">
                            <div className="flex min-w-0 flex-col gap-1">
                              <TruncatedText className={TABLE_PLAYER_NAME_CLASS}>
                                {player.name}
                              </TruncatedText>
                              <span className={`inline-flex w-fit ${tableTeamBadgeClass(player.team)}`}>
                                {player.teamBadge}
                              </span>
                            </div>
                          </td>
                          {MARKET_COLUMNS.map((column) => {
                            const key = proposalKey(player.id, column.key)
                            const proposal = proposals[key]
                            const market = player.markets[column.key]
                            const suspensionProps = getMarketSuspensionProps(
                              column.key,
                              market.suspended,
                            )

                            return (
                              <td
                                key={column.key}
                                className="w-[1%] border border-[#e5e7eb] p-0 align-top"
                              >
                                <MarketCell
                                  cellKey={key}
                                  market={market}
                                  proposedStrength={proposal?.strength ?? null}
                                  strengthMode={strengthMode}
                                  maxStrengthInMatch={maxStrengthInMatch}
                                  mainSectionLocked={suspensionProps.mainSectionLocked}
                                  effectivelySuspended={
                                    suspensionProps.effectivelySuspended
                                  }
                                  {...renderMarketCellHandlers(
                                    player.id,
                                    column.key,
                                    key,
                                  )}
                                />
                              </td>
                            )
                          })}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </CollapsibleSection>
      ) : null}
    </div>
  )
}
