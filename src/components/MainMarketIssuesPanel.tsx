import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import type {
  MainMarketSectionId,
  MainMarketSectionStatus,
  MainMarketSettings,
} from '../types/trading'
import type { TradingTier } from '../lib/tradingTier'
import { isMainSectionVisibleForTier } from '../lib/tradingTier'
import {
  adjustStrength,
  formatLine,
  formatPrice,
  formatStrength,
  parseStrengthInput,
  validateMainMarketPriceColumn,
} from '../lib/pricing'
import {
  getMainMarketSection,
  getMarketStrengthSlots,
} from '../lib/mainMarkets'
import {
  buildMainMarketHealthSnapshot,
  type MainMarketColumnIssue,
  type MainMarketColumnStatus,
} from '../lib/mainMarketHealth'
import {
  TABLE_BODY_CLASS,
  TABLE_CELL_CLASS,
  TABLE_HEAD_CELL_CLASS,
  TABLE_MICRO_META_CLASS,
  TABLE_PRICE_PRIMARY_CLASS,
  TABLE_PRICE_SECONDARY_CLASS,
  tableStrengthInputClass,
} from '../lib/tableTypography'
import { BookmakerLogo } from './BookmakerLogo'

interface MainMarketIssuesPanelProps {
  settings: MainMarketSettings
  tier: TradingTier
  onApplySectionStrength: (
    sectionId: MainMarketSectionId,
    slotIndex: number,
    strength: number,
  ) => void
}

const ISSUE_BADGE: Record<
  Exclude<MainMarketColumnStatus, 'healthy' | 'closed'>,
  { label: string; className: string }
> = {
  unpriced: { label: 'Unpriced', className: 'bg-[#fde8e8] text-red-800' },
  price: { label: 'Price drift', className: 'bg-[#f3b4b4] text-red-900' },
  suspended: { label: 'Suspended', className: 'bg-[#fffbeb] text-amber-900' },
}

function strengthGridColumns(slotCount: number): number {
  if (slotCount <= 3) return slotCount
  if (slotCount <= 6) return 3
  return 4
}

function IssueStrengthSlotInput({
  sectionId,
  slotIndex,
  line,
  outcomeLabel,
  strength,
  status,
  highlighted,
  onApply,
}: {
  sectionId: MainMarketSectionId
  slotIndex: number
  line: number
  outcomeLabel: string
  strength: number
  status: MainMarketSectionStatus
  highlighted: boolean
  onApply: MainMarketIssuesPanelProps['onApplySectionStrength']
}) {
  const [draft, setDraft] = useState(formatStrength(strength))
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const onApplyRef = useRef(onApply)
  onApplyRef.current = onApply
  const isEditable = status === 'trading'

  useEffect(() => {
    if (!focused) {
      setDraft(formatStrength(strength))
    }
  }, [strength, focused])

  useEffect(() => {
    const input = inputRef.current
    if (!input || !isEditable) return

    const onWheel = (event: WheelEvent) => {
      if (document.activeElement !== input) return

      event.preventDefault()
      event.stopPropagation()
      if (event.deltaY === 0) return

      const direction = event.deltaY < 0 ? 1 : -1
      const step = event.shiftKey ? 0.001 : 0.0001
      const next = adjustStrength(parseStrengthInput(input.value), direction * step)
      setDraft(formatStrength(next))
      onApplyRef.current(sectionId, slotIndex, next)
    }

    input.addEventListener('wheel', onWheel, { passive: false })
    return () => input.removeEventListener('wheel', onWheel)
  }, [sectionId, slotIndex, isEditable])

  const commit = () => {
    const next = parseStrengthInput(draft)
    setDraft(formatStrength(next))
    onApply(sectionId, slotIndex, next)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!isEditable) return

    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault()
      const direction = event.key === 'ArrowUp' ? 1 : -1
      const step = event.shiftKey ? 0.001 : 0.0001
      const next = adjustStrength(parseStrengthInput(draft), direction * step)
      setDraft(formatStrength(next))
      onApply(sectionId, slotIndex, next)
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      commit()
      event.currentTarget.blur()
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      setDraft(formatStrength(strength))
      event.currentTarget.blur()
    }
  }

  const hasValue = parseStrengthInput(draft) > 0

  return (
    <div
      className={`flex w-full min-w-0 flex-col items-center rounded-md border px-1 py-1 ${
        highlighted
          ? 'border-[#fca5a5] bg-[#fff5f5] ring-1 ring-inset ring-[#fecaca]'
          : 'border-[#e5e7eb] bg-[#f9fafb]'
      }`}
    >
      <span className="text-[9px] font-semibold leading-none text-gray-600">
        {outcomeLabel}
      </span>
      <span className="mt-0.5 text-[9px] leading-none tabular-nums text-gray-400">
        {formatLine(line)}
      </span>
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={draft}
        onChange={(event) => {
          if (!isEditable) return
          setDraft(event.target.value)
          if (event.target.value.trim() !== '') {
            onApply(sectionId, slotIndex, parseStrengthInput(event.target.value))
          }
        }}
        onFocus={() => {
          if (!isEditable) return
          setFocused(true)
        }}
        onBlur={() => {
          if (!isEditable) return
          setFocused(false)
          commit()
        }}
        onKeyDown={handleKeyDown}
        readOnly={status === 'closed'}
        disabled={status === 'suspended'}
        className={`mt-1 ${tableStrengthInputClass(hasValue)}`}
        aria-label={`${getMainMarketSection(sectionId).label} ${outcomeLabel} strength`}
      />
    </div>
  )
}

function IssueSectionStrengthInputs({
  issue,
  strengths,
  onApply,
}: {
  issue: MainMarketColumnIssue
  strengths: number[]
  onApply: MainMarketIssuesPanelProps['onApplySectionStrength']
}) {
  const marketSlots = getMarketStrengthSlots(issue.marketKey, issue.sectionId)
  const columns = strengthGridColumns(marketSlots.length)

  return (
    <div
      className="grid w-full gap-1.5"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {marketSlots.map((slot) => (
        <IssueStrengthSlotInput
          key={`${issue.marketKey}-${slot.slotIndex}`}
          sectionId={issue.sectionId}
          slotIndex={slot.slotIndex}
          line={slot.line}
          outcomeLabel={slot.outcomeLabel}
          strength={strengths[slot.slotIndex] ?? 0}
          status={issue.sectionStatus}
          highlighted={slot.slotIndex === issue.strengthSlotIndex}
          onApply={onApply}
        />
      ))}
    </div>
  )
}

function priceCellClass(
  kind: 'bm0' | 'primary',
  validation: ReturnType<typeof validateMainMarketPriceColumn>,
): string {
  if (kind === 'bm0' && validation.hasZeroStrength) {
    return 'rounded bg-[#fde8e8]'
  }

  if (validation.hasPriceIssue) {
    return 'rounded bg-[#f3b4b4]'
  }

  return ''
}

export function MainMarketIssuesPanel({
  settings,
  tier,
  onApplySectionStrength,
}: MainMarketIssuesPanelProps) {
  const snapshot = useMemo(
    () => buildMainMarketHealthSnapshot(settings),
    [settings],
  )

  const visibleIssues = useMemo(
    () =>
      snapshot.issues.filter((issue) =>
        isMainSectionVisibleForTier(tier, issue.sectionId),
      ),
    [snapshot.issues, tier],
  )

  return (
    <div className="min-w-0 w-full bg-white">
      <div className="border-b border-[#e5e7eb] px-4 py-3 sm:px-6">
        <h2 className="text-[13px] font-semibold text-gray-900">Main market issues</h2>
        <p className={`mt-1 ${TABLE_MICRO_META_CLASS}`}>
          {visibleIssues.length === 0
            ? 'No open issues for this fixture.'
            : `${visibleIssues.length} active issue${visibleIssues.length === 1 ? '' : 's'} requiring attention`}
        </p>
      </div>

      {visibleIssues.length === 0 ? (
        <div className="px-4 py-12 text-center text-sm text-gray-500 sm:px-6">
          All main market columns are healthy.
        </div>
      ) : (
        <div className="p-4 sm:px-6 sm:pb-6">
          <div className="w-full max-w-full overflow-x-auto rounded-xl border border-[#e5e7eb] bg-white">
            <table className={`w-full min-w-[52rem] border-collapse text-left ${TABLE_BODY_CLASS}`}>
              <thead>
                <tr className="bg-[#f9fafb]">
                  <th className={TABLE_HEAD_CELL_CLASS}>Section</th>
                  <th className={TABLE_HEAD_CELL_CLASS}>Market</th>
                  <th className={TABLE_HEAD_CELL_CLASS}>Outcome</th>
                  <th className={`${TABLE_HEAD_CELL_CLASS} min-w-[10rem]`}>Strength</th>
                  <th className={TABLE_HEAD_CELL_CLASS}>Our price</th>
                  <th className={TABLE_HEAD_CELL_CLASS}>Bookmaker</th>
                  <th className={TABLE_HEAD_CELL_CLASS}>Issue</th>
                </tr>
              </thead>
              <tbody>
                {visibleIssues.map((issue) => {
                  const validation = validateMainMarketPriceColumn(issue.bm0, issue.primary)
                  const badge =
                    ISSUE_BADGE[
                      issue.status as Exclude<MainMarketColumnStatus, 'healthy' | 'closed'>
                    ]

                  return (
                    <tr
                      key={`${issue.marketKey}-${issue.columnIndex}`}
                      className="border-t border-[#e5e7eb] hover:bg-[#f9fafb]"
                    >
                      <td className={`${TABLE_CELL_CLASS} font-medium text-gray-900`}>
                        {issue.sectionLabel}
                      </td>
                      <td className={`${TABLE_CELL_CLASS} text-gray-700`}>
                        {issue.marketLabel}
                      </td>
                      <td className={`${TABLE_CELL_CLASS} text-gray-700`}>
                        {issue.columnLabel}
                      </td>
                      <td className={`${TABLE_CELL_CLASS} min-w-[10rem]`}>
                        <IssueSectionStrengthInputs
                          issue={issue}
                          strengths={settings.sectionStrengths[issue.sectionId] ?? []}
                          onApply={onApplySectionStrength}
                        />
                      </td>
                      <td className={TABLE_CELL_CLASS}>
                        <span
                          className={`inline-block px-1 py-0.5 tabular-nums ${TABLE_PRICE_PRIMARY_CLASS} ${priceCellClass('bm0', validation)}`}
                        >
                          {formatPrice(issue.bm0)}
                        </span>
                      </td>
                      <td className={TABLE_CELL_CLASS}>
                        <div className="flex min-w-0 items-center gap-1.5">
                          <BookmakerLogo bookmaker={issue.bookmaker} size="xs" />
                          <span
                            className={`tabular-nums ${TABLE_PRICE_SECONDARY_CLASS} ${priceCellClass('primary', validation)} px-1 py-0.5`}
                          >
                            {formatPrice(issue.primary)}
                          </span>
                        </div>
                      </td>
                      <td className={TABLE_CELL_CLASS}>
                        <span
                          className={`inline-flex rounded px-2 py-0.5 text-[10px] font-medium ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
