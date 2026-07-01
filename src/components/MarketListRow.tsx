import type { MarketKey, Player, StrengthMode } from '../types/trading'
import { formatLine, formatPrice } from '../lib/pricing'
import {
  TABLE_CELL_CLASS,
  TABLE_LABEL_CLASS,
  TABLE_PLAYER_NAME_CLASS,
  TABLE_PRICE_PRIMARY_CLASS,
  TABLE_PRICE_SECONDARY_CLASS,
  TABLE_PRICE_STRIKE_CLASS,
  tableStatsClass,
  tableStrengthInputClass,
  tableTeamBadgeClass,
} from '../lib/tableTypography'
import { useMarketCellEditor } from '../hooks/useMarketCellEditor'
import { AveragePriceTooltip } from './AveragePriceTooltip'
import { BookmakerLogo } from './BookmakerLogo'
import { LinePricesTooltip } from './LinePricesTooltip'
import { TruncatedText } from './TruncatedText'

interface CellHandlers {
  onProposeStrength: (strength: number) => void
  onSubmitProposals: (strength: number) => void
  onNavigateToNextAttention: (pendingStrength?: number) => void
  onSuspendedChange: (suspended: boolean) => void
}

interface MarketListRowProps {
  player: Player
  marketKey: MarketKey
  marketLabel: string
  cellKey: string
  proposedStrength: number | null
  strengthMode: StrengthMode
  maxStrengthInMatch: number
  mainSectionLocked?: boolean
  effectivelySuspended?: boolean
  handlers: CellHandlers
}

const cellClass = TABLE_CELL_CLASS

function AlertCorner() {
  return (
    <span
      className="pointer-events-none absolute top-0 right-0 h-0 w-0"
      style={{
        borderStyle: 'solid',
        borderWidth: '0 9px 9px 0',
        borderColor: 'transparent #dc2626 transparent transparent',
      }}
      aria-hidden
    />
  )
}

export function MarketListRow({
  player,
  marketKey,
  marketLabel,
  cellKey,
  proposedStrength,
  strengthMode,
  maxStrengthInMatch,
  mainSectionLocked = false,
  effectivelySuspended,
  handlers,
}: MarketListRowProps) {
  const market = player.markets[marketKey]
  const editor = useMarketCellEditor({
    cellKey,
    market,
    proposedStrength,
    strengthMode,
    maxStrengthInMatch,
    effectivelySuspended: effectivelySuspended ?? market.suspended,
    onProposeStrength: handlers.onProposeStrength,
    onSubmitProposals: handlers.onSubmitProposals,
    onNavigateToNextAttention: handlers.onNavigateToNextAttention,
  })

  const alertCellClass = (alert: boolean) =>
    `${cellClass} ${editor.rowBg} ${alert ? 'relative bg-app-issue-price-bg' : ''}`

  return (
    <tr className={editor.rowBg}>
      <td className={`${cellClass} text-center ${editor.rowBg}`}>
        <label
          className={`inline-flex items-center justify-center ${mainSectionLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
        >
          <input
            type="checkbox"
            checked={!market.suspended}
            disabled={mainSectionLocked}
            onChange={(e) => handlers.onSuspendedChange(!e.target.checked)}
            className="h-3 w-3 rounded-[2px] border-[#cbd5e1] text-[#2563eb] focus:ring-[#2563eb] focus:ring-offset-0 disabled:cursor-not-allowed"
            aria-label="Market active"
          />
        </label>
      </td>
      <td className={`${cellClass} ${editor.rowBg}`}>
        <TruncatedText className={`block ${TABLE_PLAYER_NAME_CLASS}`}>{player.name}</TruncatedText>
      </td>
      <td className={`${cellClass} ${editor.rowBg}`}>
        <span className={tableTeamBadgeClass(player.team)}>
          {player.teamBadge}
        </span>
      </td>
      <td className={`${cellClass} ${editor.rowBg}`}>
        <TruncatedText className={`block ${TABLE_LABEL_CLASS}`}>{marketLabel}</TruncatedText>
      </td>
      <td className={`${cellClass} ${editor.rowBg}`}>
        <input
          ref={editor.strengthInputRef}
          type="text"
          inputMode="decimal"
          data-strength-input
          data-cell-key={cellKey}
          value={editor.strengthDraft}
          onChange={(e) => editor.handleStrengthChange(e.target.value)}
          onFocus={editor.handleStrengthFocus}
          onBlur={editor.handleStrengthBlur}
          onKeyDown={editor.handleStrengthKeyDown}
          onKeyUp={editor.handleStrengthKeyUp}
          className={tableStrengthInputClass(editor.hasStrengthValue)}
          aria-label="Strength"
        />
      </td>
      <td className={`${cellClass} text-center ${editor.rowBg}`}>
        <span className={tableStatsClass(market.statsCount > 0)}>
          {market.statsCount}
        </span>
      </td>
      <td className={alertCellClass(editor.priceAlert)}>
        {editor.priceAlert && <AlertCorner />}
        {editor.showAsProposed && editor.committedPrice !== editor.ourPrice ? (
          <span className="flex min-w-0 items-baseline gap-1">
            <TruncatedText className={TABLE_PRICE_STRIKE_CLASS}>
              {formatPrice(editor.committedPrice)}
            </TruncatedText>
            <TruncatedText className={TABLE_PRICE_PRIMARY_CLASS}>
              {formatPrice(editor.ourPrice)}
            </TruncatedText>
          </span>
        ) : (
          <span className={TABLE_PRICE_PRIMARY_CLASS}>{formatPrice(editor.ourPrice)}</span>
        )}
      </td>
      <td className={`${cellClass} ${editor.rowBg}`}>
        <span className={TABLE_PRICE_SECONDARY_CLASS}>{formatPrice(market.primaryPrice)}</span>
      </td>
      <td className={`${cellClass} ${editor.rowBg}`}>
        <BookmakerLogo bookmaker={market.bookmaker} size="sm" />
      </td>
      <td className={`${cellClass} ${editor.rowBg}`}>
        <AveragePriceTooltip
          averagePrice={market.averagePrice}
          quotes={market.averageBookmakers}
          className={TABLE_PRICE_SECONDARY_CLASS}
          placement="above"
        />
      </td>
      <td className={alertCellClass(editor.lineAlert)}>
        {editor.lineAlert && <AlertCorner />}
        <LinePricesTooltip
          activeLine={market.ourLine}
          linePrices={market.linePrices}
          className={TABLE_PRICE_PRIMARY_CLASS}
          placement="above"
        >
          {formatLine(market.ourLine)}
        </LinePricesTooltip>
      </td>
      <td className={`${cellClass} ${editor.rowBg}`}>
        <LinePricesTooltip
          activeLine={market.primaryLine}
          linePrices={market.linePrices}
          className={TABLE_PRICE_SECONDARY_CLASS}
          placement="above"
        >
          {formatLine(market.primaryLine)}
        </LinePricesTooltip>
      </td>
    </tr>
  )
}
