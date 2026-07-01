import { memo, type ReactNode } from 'react'
import type { PlayerMarket, StrengthMode } from '../types/trading'
import { formatLine, formatPrice } from '../lib/pricing'
import {
  TABLE_PRICE_PRIMARY_CLASS,
  TABLE_PRICE_SECONDARY_CLASS,
  TABLE_PRICE_STRIKE_CLASS,
  tableStatsClass,
  tableStrengthInputClass,
} from '../lib/tableTypography'
import { useMarketCellEditor } from '../hooks/useMarketCellEditor'
import { AveragePriceTooltip } from './AveragePriceTooltip'
import { BookmakerLogo } from './BookmakerLogo'
import { TruncatedText } from './TruncatedText'
import { LinePricesTooltip } from './LinePricesTooltip'

interface MarketCellProps {
  cellKey: string
  market: PlayerMarket
  proposedStrength: number | null
  strengthMode: StrengthMode
  maxStrengthInMatch: number
  mainSectionLocked?: boolean
  effectivelySuspended?: boolean
  onProposeStrength: (strength: number) => void
  onSubmitProposals: (strength: number) => void
  onNavigateToNextAttention: (pendingStrength?: number) => void
  onSuspendedChange: (suspended: boolean) => void
}

const secondaryRowClass =
  'mt-0.5 flex min-w-0 flex-wrap items-center gap-x-1 gap-y-0.5 leading-none tabular-nums text-gray-700'

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

interface MarketValueBlockProps {
  alert: boolean
  primary: ReactNode
  secondary: ReactNode
  className?: string
}

function MarketValueBlock({
  alert,
  primary,
  secondary,
  className = 'min-w-0 flex-1',
}: MarketValueBlockProps) {
  return (
    <div
      className={`relative min-w-0 rounded-sm px-1 py-0.5 ${
        alert ? 'bg-[#f3b4b4]' : ''
      } ${className}`}
    >
      {alert && <AlertCorner />}
      {typeof primary === 'string' || typeof primary === 'number' ? (
        <TruncatedText className={`block ${TABLE_PRICE_PRIMARY_CLASS}`}>{primary}</TruncatedText>
      ) : (
        <div className={`min-w-0 ${TABLE_PRICE_PRIMARY_CLASS}`}>{primary}</div>
      )}
      <div className={secondaryRowClass}>{secondary}</div>
    </div>
  )
}

export const MarketCell = memo(function MarketCell({
  cellKey,
  market,
  proposedStrength,
  strengthMode,
  maxStrengthInMatch,
  mainSectionLocked = false,
  effectivelySuspended = market.suspended,
  onProposeStrength,
  onSubmitProposals,
  onNavigateToNextAttention,
  onSuspendedChange,
}: MarketCellProps) {
  const editor = useMarketCellEditor({
    cellKey,
    market,
    proposedStrength,
    strengthMode,
    maxStrengthInMatch,
    effectivelySuspended,
    onProposeStrength,
    onSubmitProposals,
    onNavigateToNextAttention,
  })

  return (
    <div className={`h-full w-full min-w-0 ${editor.rowBg}`}>
      <div className="flex items-start gap-1 px-1.5 py-1">
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
          className={`min-w-0 flex-1 ${tableStrengthInputClass(editor.hasStrengthValue)}`}
          aria-label="Market strength"
        />

        <div className="flex w-5 shrink-0 flex-col items-center gap-0.5">
          <span className={tableStatsClass(market.statsCount > 0)}>
            {market.statsCount}
          </span>
          <label
            className={`flex items-center ${mainSectionLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
          >
            <input
              type="checkbox"
              checked={!market.suspended}
              disabled={mainSectionLocked}
              onChange={(e) => onSuspendedChange(!e.target.checked)}
              className="h-3 w-3 rounded-[2px] border-[#cbd5e1] text-[#2563eb] focus:ring-[#2563eb] focus:ring-offset-0 disabled:cursor-not-allowed"
              aria-label="Market active"
            />
          </label>
        </div>
      </div>

      <div className="flex min-w-0 items-stretch gap-0.5 px-1.5 pb-1">
        <MarketValueBlock
          alert={editor.priceAlert}
          primary={
            editor.showAsProposed && editor.committedPrice !== editor.ourPrice ? (
              <span className="flex min-w-0 items-baseline gap-1">
                <TruncatedText className={TABLE_PRICE_STRIKE_CLASS}>
                  {formatPrice(editor.committedPrice)}
                </TruncatedText>
                <TruncatedText className={TABLE_PRICE_PRIMARY_CLASS}>
                  {formatPrice(editor.ourPrice)}
                </TruncatedText>
              </span>
            ) : (
              formatPrice(editor.ourPrice)
            )
          }
          secondary={
            <>
              <TruncatedText className={TABLE_PRICE_SECONDARY_CLASS}>
                {formatPrice(market.primaryPrice)}
              </TruncatedText>
              <BookmakerLogo bookmaker={market.bookmaker} size="sm" />
              <span className={`${TABLE_PRICE_SECONDARY_CLASS} shrink-0 text-[#d1d5db]`}>
                |
              </span>
              <AveragePriceTooltip
                averagePrice={market.averagePrice}
                quotes={market.averageBookmakers}
                className={TABLE_PRICE_SECONDARY_CLASS}
              />
            </>
          }
        />

        <MarketValueBlock
          alert={editor.lineAlert}
          className="w-[26%] min-w-[1.75rem] max-w-[2.5rem] shrink-0"
          primary={
            <LinePricesTooltip
              activeLine={market.ourLine}
              linePrices={market.linePrices}
              className={TABLE_PRICE_PRIMARY_CLASS}
            >
              {formatLine(market.ourLine)}
            </LinePricesTooltip>
          }
          secondary={
            <LinePricesTooltip
              activeLine={market.primaryLine}
              linePrices={market.linePrices}
              className={TABLE_PRICE_SECONDARY_CLASS}
            >
              {formatLine(market.primaryLine)}
            </LinePricesTooltip>
          }
        />
      </div>
    </div>
  )
})
