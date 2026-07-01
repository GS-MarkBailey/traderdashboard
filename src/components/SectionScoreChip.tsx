import type { MainMarketSectionId, MainMarketSectionScore } from '../types/trading'
import { formatSectionScore } from '../lib/mainMarkets'

interface SectionScoreChipProps {
  sectionId: MainMarketSectionId
  score: MainMarketSectionScore
  label?: string
  hasDataIssue?: boolean
}

const CHIP_STYLES = {
  healthy:
    'border-emerald-200 bg-emerald-50 text-emerald-900',
  issue: 'border-red-200 bg-red-50 text-app-issue-price-text',
} as const

function chipClassName(hasDataIssue: boolean): string {
  return `inline-flex w-fit items-center gap-1 rounded-full border py-px pl-1 pr-1.5 text-[10px] font-semibold tabular-nums ${
    hasDataIssue ? CHIP_STYLES.issue : CHIP_STYLES.healthy
  }`
}

function SectionContextIcon({ sectionId }: { sectionId: MainMarketSectionId }) {
  const className = 'h-3 w-3'

  switch (sectionId) {
    case 'goals':
      return (
        <svg viewBox="0 0 16 16" fill="none" aria-hidden className={className}>
          <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.25" />
          <path
            d="M5.5 6.25c.75-.75 1.75-1 2.5-.75.9.3 1.5 1.15 1.5 2.1 0 1.38-1.12 2.5-2.5 2.5s-2.5-1.12-2.5-2.5c0-.7.28-1.33.75-1.85"
            stroke="currentColor"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
        </svg>
      )
    case 'corners':
      return (
        <svg viewBox="0 0 16 16" fill="none" aria-hidden className={className}>
          <path d="M3.5 12.5V4.5h8.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
          <path
            d="M10 4.5l2.5-1.5v4.5"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'cards':
      return (
        <svg viewBox="0 0 16 16" fill="none" aria-hidden className={className}>
          <rect x="4" y="3.5" width="7.5" height="9.5" rx="1" fill="#FDE68A" stroke="#D97706" strokeWidth="1" />
        </svg>
      )
    case 'shotsOnTarget':
      return (
        <svg viewBox="0 0 16 16" fill="none" aria-hidden className={className}>
          <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.25" />
          <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.25" />
          <circle cx="8" cy="8" r="0.75" fill="currentColor" />
        </svg>
      )
    case 'shots':
      return (
        <svg viewBox="0 0 16 16" fill="none" aria-hidden className={className}>
          <path d="M3.5 12.5l7-7" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
          <path
            d="M9 4.5h3.5V8"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="4.75" cy="11.25" r="1.1" fill="currentColor" />
        </svg>
      )
  }
}

export function RedCardScoreChip({
  score,
  hasDataIssue = false,
}: {
  score: MainMarketSectionScore
  hasDataIssue?: boolean
}) {
  return (
    <span className={chipClassName(hasDataIssue)} title="Red cards">
      <span className="inline-flex h-3 w-3 shrink-0 items-center justify-center">
        <svg viewBox="0 0 16 16" fill="none" aria-hidden className="h-3 w-3">
          <rect
            x="4"
            y="3.5"
            width="7.5"
            height="9.5"
            rx="1"
            fill="#FCA5A5"
            stroke="#DC2626"
            strokeWidth="1"
          />
        </svg>
      </span>
      {formatSectionScore(score)}
    </span>
  )
}

export function SectionScoreChip({
  sectionId,
  score,
  label,
  hasDataIssue = false,
}: SectionScoreChipProps) {
  return (
    <span className={chipClassName(hasDataIssue)} title={label}>
      <span
        className={`inline-flex h-3 w-3 shrink-0 items-center justify-center ${
          hasDataIssue ? 'text-red-700' : 'text-emerald-700'
        }`}
      >
        <SectionContextIcon sectionId={sectionId} />
      </span>
      {formatSectionScore(score)}
    </span>
  )
}
