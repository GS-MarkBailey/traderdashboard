import { useCallback, useMemo, useState, type MouseEvent } from 'react'
import type { MarketKey, Player, StrengthMode } from '../types/trading'
import { MARKET_COLUMNS } from '../types/trading'
import {
  getCellStatusDot,
  getCellHealthStatus,
  getCellStatusDetail,
  getMaxStrengthInMatch,
  type CellHealthStatus,
} from '../lib/marketHealth'
import { useTheme } from '../lib/theme'
import {
  calculatePriceFromStrength,
  getEffectiveStrength,
} from '../lib/pricing'
import { proposalKey, type ProposalMap } from '../lib/proposals'
import { sortPlayersDefaultOrder } from '../lib/playerSort'
import { useClearOnScroll } from '../hooks/useClearOnScroll'
import { TruncatedText } from './TruncatedText'

const MARKET_ABBREV: Record<MarketKey, string> = {
  goals: 'Gls',
  headedGoal: 'Hdr',
  goalOotB: 'OotB',
  assists: 'Ast',
  yellowCards: 'YC',
  redCards: 'RC',
  shots: 'Sht',
  sot: 'SOT',
  foulsCommitted: 'FC',
  foulsWon: 'FW',
}

interface MatrixStatusTooltipState {
  kind: 'status'
  x: number
  y: number
  status: CellHealthStatus
  detail: string
  playerName?: string
  marketLabel?: string
}

interface MatrixMarketTooltipState {
  kind: 'market'
  x: number
  y: number
  marketLabel: string
  abbrev: string
}

type MatrixTooltipState = MatrixStatusTooltipState | MatrixMarketTooltipState

interface MarketStatusMatrixProps {
  players: Player[]
  proposals: ProposalMap
  strengthMode: StrengthMode
}

function showStatusTooltip(
  event: MouseEvent<HTMLElement>,
  payload: Omit<MatrixStatusTooltipState, 'x' | 'y' | 'kind'>,
  onShow: (state: MatrixTooltipState) => void,
) {
  const rect = event.currentTarget.getBoundingClientRect()
  onShow({
    kind: 'status',
    x: rect.left + rect.width / 2,
    y: rect.top,
    ...payload,
  })
}

function showMarketTooltip(
  event: MouseEvent<HTMLElement>,
  payload: Omit<MatrixMarketTooltipState, 'x' | 'y' | 'kind'>,
  onShow: (state: MatrixTooltipState) => void,
) {
  const rect = event.currentTarget.getBoundingClientRect()
  onShow({
    kind: 'market',
    x: rect.left + rect.width / 2,
    y: rect.bottom,
    ...payload,
  })
}

function StatusMatrixTooltip({
  tooltip,
  statusDot,
}: {
  tooltip: MatrixTooltipState
  statusDot: ReturnType<typeof getCellStatusDot>
}) {
  if (tooltip.kind === 'market') {
    return (
      <div
        className="pointer-events-none fixed z-[100] -translate-x-1/2 rounded-lg border border-app-border bg-app-surface px-2.5 py-2 shadow-lg"
        style={{ left: tooltip.x, top: tooltip.y + 8 }}
      >
        <p className="text-[11px] font-semibold whitespace-nowrap text-app-text">
          {tooltip.marketLabel}
        </p>
        <p className="mt-0.5 text-[10px] whitespace-nowrap text-app-text-muted">
          {tooltip.abbrev}
        </p>
      </div>
    )
  }

  const dot = statusDot[tooltip.status]

  return (
    <div
      className="pointer-events-none fixed z-[100] -translate-x-1/2 -translate-y-[calc(100%+8px)] rounded-lg border border-app-border bg-app-surface px-2.5 py-2 shadow-lg"
      style={{ left: tooltip.x, top: tooltip.y }}
    >
      <span className="flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: dot.color }}
        />
        <span className="text-[11px] font-semibold whitespace-nowrap text-app-text">
          {dot.label}
        </span>
      </span>
      {tooltip.playerName && tooltip.marketLabel ? (
        <p className="mt-1 text-[11px] whitespace-nowrap text-app-text-secondary">
          {tooltip.playerName} · {tooltip.marketLabel}
        </p>
      ) : null}
      <p className="mt-0.5 text-[10px] whitespace-nowrap text-app-text-muted">
        {tooltip.detail}
      </p>
    </div>
  )
}

export function MarketStatusMatrix({
  players,
  proposals,
  strengthMode,
}: MarketStatusMatrixProps) {
  const { resolvedTheme } = useTheme()
  const statusDot = getCellStatusDot(resolvedTheme)
  const [tooltip, setTooltip] = useState<MatrixTooltipState | null>(null)
  const clearTooltip = useCallback(() => setTooltip(null), [])
  useClearOnScroll(clearTooltip, tooltip !== null)

  const matrix = useMemo(() => {
    const sortedPlayers = sortPlayersDefaultOrder(players)
    const maxStrength = getMaxStrengthInMatch(players, proposals)

    const rows = sortedPlayers.map((player) => ({
      player,
      cells: MARKET_COLUMNS.map((column) => {
        const market = player.markets[column.key]
        const proposal = proposals[proposalKey(player.id, column.key)]
        const strength = proposal?.strength ?? market.strength
        const effectiveStrength = getEffectiveStrength(
          strength,
          strengthMode,
          maxStrength,
        )
        const ourPrice = calculatePriceFromStrength(effectiveStrength)
        const status = getCellHealthStatus(market, ourPrice)

        return {
          marketKey: column.key,
          marketLabel: column.label,
          status,
          detail: getCellStatusDetail(status),
        }
      }),
    }))

    return rows
  }, [players, proposals, strengthMode])

  if (players.length === 0) return null

  const legendStatuses = [
    'healthy',
    'suspended',
    'unpriced',
    'price',
    'line',
    'multiple',
  ] as const

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-app-border bg-app-surface">
        <div className="border-b border-app-border px-4 py-3">
          <h3 className="font-heading text-sm font-semibold text-app-text">
            Status matrix
          </h3>
        </div>

        <div className="max-h-[min(28rem,calc(100dvh-16rem))] overflow-auto">
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 z-20 bg-app-muted">
              <tr>
                <th className="sticky left-0 z-30 min-w-[9rem] border-b border-app-border bg-app-muted px-3 py-2 text-xs font-medium text-app-text-muted">
                  Player
                </th>
                {MARKET_COLUMNS.map((column) => (
                  <th
                    key={column.key}
                    className="border-b border-app-border px-1 py-2 text-center text-[10px] font-medium text-app-text-muted"
                  >
                    <span
                      className="inline-flex min-w-[2rem] cursor-default justify-center px-1"
                      onMouseEnter={(event) =>
                        showMarketTooltip(
                          event,
                          {
                            marketLabel: column.label,
                            abbrev: MARKET_ABBREV[column.key],
                          },
                          setTooltip,
                        )
                      }
                      onMouseLeave={clearTooltip}
                    >
                      {MARKET_ABBREV[column.key]}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map(({ player, cells }) => (
                <tr key={player.id} className="border-b border-app-subtle last:border-0">
                  <td className="sticky left-0 z-10 bg-app-surface px-3 py-1.5">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span
                        className={`inline-flex shrink-0 rounded px-1 py-0.5 text-[9px] font-bold tracking-wide ${
                          player.team === 'home'
                            ? 'bg-red-100 text-app-issue-red-text'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {player.teamBadge}
                      </span>
                      <TruncatedText className="text-xs text-app-text-secondary">
                        {player.name}
                      </TruncatedText>
                    </div>
                  </td>
                  {cells.map((cell) => {
                    const dot = statusDot[cell.status]

                    return (
                      <td key={cell.marketKey} className="px-1 py-1.5 text-center">
                        <span
                          className="inline-flex cursor-default p-1"
                          onMouseEnter={(event) =>
                            showStatusTooltip(
                              event,
                              {
                                status: cell.status,
                                detail: cell.detail,
                                playerName: player.name,
                                marketLabel: cell.marketLabel,
                              },
                              setTooltip,
                            )
                          }
                          onMouseLeave={clearTooltip}
                        >
                          <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ backgroundColor: dot.color }}
                            aria-label={`${player.name}, ${cell.marketLabel}: ${dot.label}`}
                          />
                        </span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-app-border px-4 py-2.5">
          {legendStatuses.map((status) => (
            <span
              key={status}
              className="inline-flex cursor-default items-center gap-1.5 text-[11px] text-app-text-muted"
              onMouseEnter={(event) =>
                showStatusTooltip(
                  event,
                  {
                    status,
                    detail: getCellStatusDetail(status),
                  },
                  setTooltip,
                )
              }
              onMouseLeave={clearTooltip}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: statusDot[status].color }}
              />
              {statusDot[status].label}
            </span>
          ))}
        </div>
      </section>

      {tooltip ? <StatusMatrixTooltip tooltip={tooltip} statusDot={statusDot} /> : null}
    </>
  )
}
