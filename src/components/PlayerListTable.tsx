import type { MarketKey, StrengthMode } from '../types/trading'
import type { FilteredCellRow } from '../lib/cellFilters'
import type { ProposalMap } from '../lib/proposals'
import { TABLE_BODY_CLASS, TABLE_HEAD_CELL_CLASS } from '../lib/tableTypography'
import { MarketListRow } from './MarketListRow'
import { TruncatedText } from './TruncatedText'

interface CellHandlers {
  onProposeStrength: (strength: number) => void
  onSubmitProposals: (strength: number) => void
  onNavigateToNextAttention: (pendingStrength?: number) => void
  onSuspendedChange: (suspended: boolean) => void
}

interface PlayerListTableProps {
  rows: FilteredCellRow[]
  proposals: ProposalMap
  strengthMode: StrengthMode
  maxStrengthInMatch: number
  showFixtureColumns?: boolean
  getCellHandlers: (
    playerId: string,
    marketKey: MarketKey,
    cellKey: string,
  ) => CellHandlers
  getMarketSuspensionProps: (
    marketKey: MarketKey,
    marketSuspended: boolean,
  ) => {
    mainSectionLocked: boolean
    effectivelySuspended: boolean
  }
}

const BASE_LIST_COLUMNS = [
  { key: 'active', label: '', width: '3.5%' },
  { key: 'player', label: 'Player', width: '10%' },
  { key: 'team', label: 'Team', width: '5%' },
  { key: 'market', label: 'Market', width: '9%' },
  { key: 'strength', label: 'Strength', width: '8%' },
  { key: 'stats', label: 'Stats', width: '5%' },
  { key: 'ourPrice', label: 'Our Price', width: '8%' },
  { key: 'primaryPrice', label: 'Primary', width: '7%' },
  { key: 'bookmaker', label: 'Book', width: '6%' },
  { key: 'avgPrice', label: 'Average', width: '7%' },
  { key: 'ourLine', label: 'Our Line', width: '8%' },
  { key: 'primaryLine', label: 'Primary Line', width: '9%' },
] as const

const FIXTURE_LIST_COLUMNS = [
  { key: 'fixtureId', label: 'Fixture ID', width: '9%' },
  { key: 'competition', label: 'Competition', width: '10%' },
] as const

export function PlayerListTable({
  rows,
  proposals,
  strengthMode,
  maxStrengthInMatch,
  showFixtureColumns = false,
  getCellHandlers,
  getMarketSuspensionProps,
}: PlayerListTableProps) {
  const listColumns = showFixtureColumns
    ? [
        FIXTURE_LIST_COLUMNS[0],
        FIXTURE_LIST_COLUMNS[1],
        ...BASE_LIST_COLUMNS,
      ]
    : BASE_LIST_COLUMNS
  return (
    <div className="w-full max-w-full overflow-x-auto rounded-xl border border-app-border bg-app-surface">
      <table
        className={`w-full table-fixed border-collapse text-left ${TABLE_BODY_CLASS} ${
          showFixtureColumns ? 'min-w-[72rem]' : ''
        }`}
      >
          <colgroup>
            {listColumns.map((column) => (
              <col key={column.key} style={{ width: column.width }} />
            ))}
          </colgroup>
          <thead>
            <tr className="bg-app-muted">
              {listColumns.map((column) => (
                <th
                  key={column.key}
                  className={`sticky top-0 z-10 ${TABLE_HEAD_CELL_CLASS}`}
                >
                {column.label ? (
                  <TruncatedText className="block">{column.label}</TruncatedText>
                ) : (
                  <span className="sr-only">Active</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={listColumns.length}
                className="border border-app-border px-4 py-12 text-center text-sm text-app-text-muted"
              >
                No cells match the current filters.
              </td>
            </tr>
          ) : (
            rows.map(({ player, marketKey, marketLabel, cellKey, fixtureId, competition }) => {
              const market = player.markets[marketKey]
              const suspensionProps = getMarketSuspensionProps(
                marketKey,
                market.suspended,
              )

              return (
                <MarketListRow
                  key={cellKey}
                  player={player}
                  marketKey={marketKey}
                  marketLabel={marketLabel}
                  cellKey={cellKey}
                  fixtureId={fixtureId}
                  competition={competition}
                  showFixtureColumns={showFixtureColumns}
                  proposedStrength={proposals[cellKey]?.strength ?? null}
                  strengthMode={strengthMode}
                  maxStrengthInMatch={maxStrengthInMatch}
                  mainSectionLocked={suspensionProps.mainSectionLocked}
                  effectivelySuspended={suspensionProps.effectivelySuspended}
                  handlers={getCellHandlers(player.id, marketKey, cellKey)}
                />
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
