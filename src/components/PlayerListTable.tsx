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

const LIST_COLUMNS = [
  { key: 'active', label: '', width: '4%' },
  { key: 'player', label: 'Player', width: '12%' },
  { key: 'team', label: 'Team', width: '6%' },
  { key: 'market', label: 'Market', width: '11%' },
  { key: 'strength', label: 'Strength', width: '9%' },
  { key: 'stats', label: 'Stats', width: '6%' },
  { key: 'ourPrice', label: 'Our Price', width: '9%' },
  { key: 'primaryPrice', label: 'Primary', width: '8%' },
  { key: 'bookmaker', label: 'Book', width: '7%' },
  { key: 'avgPrice', label: 'Average', width: '8%' },
  { key: 'ourLine', label: 'Our Line', width: '9%' },
  { key: 'primaryLine', label: 'Primary Line', width: '11%' },
] as const

export function PlayerListTable({
  rows,
  proposals,
  strengthMode,
  maxStrengthInMatch,
  getCellHandlers,
  getMarketSuspensionProps,
}: PlayerListTableProps) {
  return (
    <div className="w-full max-w-full overflow-x-auto rounded-xl border border-[#e5e7eb] bg-white">
      <table className={`w-full table-fixed border-collapse text-left ${TABLE_BODY_CLASS}`}>
          <colgroup>
            {LIST_COLUMNS.map((column) => (
              <col key={column.key} style={{ width: column.width }} />
            ))}
          </colgroup>
          <thead>
            <tr className="bg-[#f9fafb]">
              {LIST_COLUMNS.map((column) => (
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
                colSpan={LIST_COLUMNS.length}
                className="border border-[#e5e7eb] px-4 py-12 text-center text-sm text-gray-500"
              >
                No cells match the current filters.
              </td>
            </tr>
          ) : (
            rows.map(({ player, marketKey, marketLabel, cellKey }) => {
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
