import { useCallback, useRef, useState, type MouseEvent } from 'react'
import type { BookmakerPriceQuote } from '../types/trading'
import { BOOKMAKER_CONFIG } from '../lib/bookmakers'
import { formatPrice } from '../lib/pricing'
import { TABLE_PRICE_SECONDARY_CLASS } from '../lib/tableTypography'
import { useClearOnScroll } from '../hooks/useClearOnScroll'
import { BookmakerMark } from './BookmakerLogo'
import { TruncatedText } from './TruncatedText'

interface AveragePriceTooltipProps {
  averagePrice: number
  quotes: BookmakerPriceQuote[]
  className?: string
  placement?: 'above' | 'below'
}

interface TooltipAnchor {
  x: number
  y: number
}

function AveragePricePopover({
  quotes,
  anchor,
  placement,
  fallbackBookmakers,
  onImageError,
  truncatedPriceLabel,
}: {
  quotes: BookmakerPriceQuote[]
  anchor: TooltipAnchor
  placement: 'above' | 'below'
  fallbackBookmakers: Set<BookmakerPriceQuote['bookmaker']>
  onImageError: (bookmaker: BookmakerPriceQuote['bookmaker']) => void
  truncatedPriceLabel?: string | null
}) {
  const offset = 8

  return (
    <div
      className="pointer-events-none fixed z-[100] min-w-[10.5rem] -translate-x-1/2 rounded-lg border border-app-border bg-app-surface px-2.5 py-2 shadow-lg"
      style={
        placement === 'above'
          ? { left: anchor.x, top: anchor.y - offset, transform: 'translate(-50%, -100%)' }
          : { left: anchor.x, top: anchor.y + offset, transform: 'translateX(-50%)' }
      }
    >
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-app-text-muted">
        Average price
      </span>
      {truncatedPriceLabel ? (
        <span className="mb-1.5 block text-[11px] font-semibold tabular-nums text-app-text">
          {truncatedPriceLabel}
        </span>
      ) : null}
      <span className="flex flex-col gap-1">
        {quotes.map(({ bookmaker, price }) => {
          const config = BOOKMAKER_CONFIG[bookmaker]
          const preferFallback = fallbackBookmakers.has(bookmaker)

          return (
            <span key={bookmaker} className="flex min-w-0 items-center gap-2">
              <BookmakerMark
                bookmaker={bookmaker}
                size="sm"
                preferFallback={preferFallback}
                onImageError={() => onImageError(bookmaker)}
              />
              <TruncatedText className="flex-1 text-[11px] font-medium text-app-text-secondary">
                {config.label}
              </TruncatedText>
              <span className="shrink-0 text-[11px] font-medium tabular-nums text-app-text">
                {formatPrice(price)}
              </span>
            </span>
          )
        })}
      </span>
    </div>
  )
}

export function AveragePriceTooltip({
  averagePrice,
  quotes,
  className = TABLE_PRICE_SECONDARY_CLASS,
  placement = 'below',
}: AveragePriceTooltipProps) {
  const formattedPrice = formatPrice(averagePrice)
  const priceRef = useRef<HTMLSpanElement>(null)
  const [anchor, setAnchor] = useState<TooltipAnchor | null>(null)
  const [truncatedPriceLabel, setTruncatedPriceLabel] = useState<string | null>(null)
  const [fallbackBookmakers, setFallbackBookmakers] = useState<
    Set<BookmakerPriceQuote['bookmaker']>
  >(() => new Set())

  const clearAnchor = useCallback(() => {
    setAnchor(null)
    setTruncatedPriceLabel(null)
  }, [])
  useClearOnScroll(clearAnchor, anchor !== null)

  const showTooltip = (event: MouseEvent<HTMLSpanElement>) => {
    const priceElement = priceRef.current
    const isTruncated =
      priceElement !== null &&
      (priceElement.scrollWidth > priceElement.clientWidth + 1 ||
        priceElement.scrollHeight > priceElement.clientHeight + 1)

    const rect = event.currentTarget.getBoundingClientRect()
    setTruncatedPriceLabel(isTruncated ? formattedPrice : null)
    setAnchor({
      x: rect.left + rect.width / 2,
      y: placement === 'above' ? rect.top : rect.bottom,
    })
  }

  return (
    <>
      <span
        className="inline-flex min-w-0 cursor-default align-middle"
        onMouseEnter={showTooltip}
        onMouseLeave={clearAnchor}
      >
        <span ref={priceRef} className={className}>
          {formattedPrice}
        </span>
      </span>

      {anchor ? (
        <AveragePricePopover
          quotes={quotes}
          anchor={anchor}
          placement={placement}
          fallbackBookmakers={fallbackBookmakers}
          truncatedPriceLabel={truncatedPriceLabel}
          onImageError={(bookmaker) =>
            setFallbackBookmakers((current) => {
              const next = new Set(current)
              next.add(bookmaker)
              return next
            })
          }
        />
      ) : null}
    </>
  )
}
