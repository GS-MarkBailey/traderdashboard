import { useCallback, useState, type MouseEvent, type ReactNode } from 'react'
import type { LinePriceQuote } from '../types/trading'
import { formatLine, formatPrice } from '../lib/pricing'
import { useClearOnScroll } from '../hooks/useClearOnScroll'

interface LinePricesTooltipProps {
  activeLine: number
  linePrices: LinePriceQuote[]
  className?: string
  placement?: 'above' | 'below'
  children: ReactNode
}

interface TooltipAnchor {
  x: number
  y: number
}

function LinePricesPopover({
  activeLine,
  linePrices,
  anchor,
  placement,
}: {
  activeLine: number
  linePrices: LinePriceQuote[]
  anchor: TooltipAnchor
  placement: 'above' | 'below'
}) {
  const offset = 8

  return (
    <div
      className="pointer-events-none fixed z-[100] min-w-[7.5rem] -translate-x-1/2 rounded-lg border border-app-border bg-app-surface px-2.5 py-2 shadow-lg"
      style={
        placement === 'above'
          ? { left: anchor.x, top: anchor.y - offset, transform: 'translate(-50%, -100%)' }
          : { left: anchor.x, top: anchor.y + offset, transform: 'translateX(-50%)' }
      }
    >
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-app-text-muted">
        Line prices
      </span>
      <span className="flex flex-col gap-0.5">
        {linePrices.map(({ line, price }) => {
          const isActive = line === activeLine

          return (
            <span
              key={line}
              className={`flex items-center justify-between gap-3 rounded px-1 py-0.5 tabular-nums ${
                isActive ? 'bg-app-subtle' : ''
              }`}
            >
              <span
                className={`text-[11px] ${
                  isActive ? 'font-semibold text-app-text' : 'font-medium text-app-text-secondary'
                }`}
              >
                {formatLine(line)}
              </span>
              <span
                className={`text-[11px] ${
                  isActive ? 'font-semibold text-app-text' : 'font-medium text-app-text'
                }`}
              >
                {formatPrice(price)}
              </span>
            </span>
          )
        })}
      </span>
    </div>
  )
}

export function LinePricesTooltip({
  activeLine,
  linePrices,
  className,
  placement = 'below',
  children,
}: LinePricesTooltipProps) {
  const [anchor, setAnchor] = useState<TooltipAnchor | null>(null)
  const clearAnchor = useCallback(() => setAnchor(null), [])
  useClearOnScroll(clearAnchor, anchor !== null)

  const showTooltip = (event: MouseEvent<HTMLSpanElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
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
        <span className={className}>{children}</span>
      </span>

      {anchor ? (
        <LinePricesPopover
          activeLine={activeLine}
          linePrices={linePrices}
          anchor={anchor}
          placement={placement}
        />
      ) : null}
    </>
  )
}
