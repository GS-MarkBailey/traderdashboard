import { useCallback, useState, type MouseEvent } from 'react'
import { BOOKMAKER_CONFIG, type BookmakerId } from '../lib/bookmakers'
import { useClearOnScroll } from '../hooks/useClearOnScroll'

interface BookmakerLogoProps {
  bookmaker: BookmakerId
  size?: 'xs' | 'sm' | 'md'
}

interface TooltipAnchor {
  x: number
  y: number
}

export function BookmakerMark({
  bookmaker,
  size,
  preferFallback,
  onImageError,
}: {
  bookmaker: BookmakerId
  size: 'xs' | 'sm' | 'md' | 'lg'
  preferFallback?: boolean
  onImageError?: () => void
}) {
  const config = BOOKMAKER_CONFIG[bookmaker]
  const dimension =
    size === 'xs'
      ? 'h-[11px] w-[11px]'
      : size === 'sm'
        ? 'h-[14px] w-[14px]'
        : size === 'md'
          ? 'h-[24px] w-[24px]'
          : 'h-[32px] w-[32px]'
  const textSize =
    size === 'xs'
      ? 'text-[7px]'
      : size === 'sm'
        ? 'text-[8px]'
        : size === 'md'
          ? 'text-[10px]'
          : 'text-sm'
  const radius = size === 'xs' || size === 'sm' ? 'rounded-[2px]' : 'rounded-[4px]'
  const showImage = !preferFallback && config.icon

  if (showImage) {
    return (
      <img
        src={config.icon}
        alt={config.label}
        className={`${dimension} shrink-0 ${radius} object-contain`}
        onError={onImageError}
      />
    )
  }

  return (
    <span
      className={`inline-flex ${dimension} shrink-0 items-center justify-center ${radius} font-bold leading-none text-white ${textSize}`}
      style={{ backgroundColor: config.fallbackColor }}
    >
      {config.fallbackLabel}
    </span>
  )
}

function BookmakerLogoPopover({
  bookmaker,
  anchor,
  preferFallback,
  onImageError,
}: {
  bookmaker: BookmakerId
  anchor: TooltipAnchor
  preferFallback: boolean
  onImageError: () => void
}) {
  const config = BOOKMAKER_CONFIG[bookmaker]
  const offset = 6

  return (
    <div
      className="pointer-events-none fixed z-[100] -translate-x-1/2 whitespace-nowrap"
      style={{
        left: anchor.x,
        top: anchor.y + offset,
        transform: 'translateX(-50%)',
      }}
    >
      <span className="flex items-center gap-2 rounded-lg border border-app-border bg-app-surface px-2.5 py-2 shadow-lg">
        <BookmakerMark
          bookmaker={bookmaker}
          size="lg"
          preferFallback={preferFallback}
          onImageError={onImageError}
        />
        <span className="text-[11px] font-medium whitespace-nowrap text-app-text-secondary">
          {config.label}
        </span>
      </span>
    </div>
  )
}

export function BookmakerLogo({ bookmaker, size = 'sm' }: BookmakerLogoProps) {
  const [useFallback, setUseFallback] = useState(false)
  const [anchor, setAnchor] = useState<TooltipAnchor | null>(null)
  const markSize = size === 'md' ? 'md' : size === 'xs' ? 'xs' : 'sm'

  const clearAnchor = useCallback(() => {
    setAnchor(null)
  }, [])

  useClearOnScroll(clearAnchor, anchor !== null)

  const showTooltip = (event: MouseEvent<HTMLSpanElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    setAnchor({
      x: rect.left + rect.width / 2,
      y: rect.bottom,
    })
  }

  return (
    <>
      <span
        className="relative inline-flex shrink-0 align-middle"
        onMouseEnter={showTooltip}
        onMouseLeave={clearAnchor}
      >
        <span className="inline-flex cursor-default">
          <BookmakerMark
            bookmaker={bookmaker}
            size={markSize}
            preferFallback={useFallback}
            onImageError={() => setUseFallback(true)}
          />
        </span>
      </span>

      {anchor ? (
        <BookmakerLogoPopover
          bookmaker={bookmaker}
          anchor={anchor}
          preferFallback={useFallback}
          onImageError={() => setUseFallback(true)}
        />
      ) : null}
    </>
  )
}
