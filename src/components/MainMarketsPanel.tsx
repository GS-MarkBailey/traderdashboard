import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import type {
  MainMarketKey,
  MainMarketSectionId,
  MainMarketSectionStatus,
  MainMarketSettings,
  MainMarketsLayout,
  BookmakerPriceQuote,
  MainMarketSectionConfig,
} from '../types/trading'
import {
  getMainMarketLabel,
  getMainMarketSection,
  getMainMarketSectionIdForMarket,
  getMainMarketBm0Price,
  MAIN_MARKET_SECTIONS,
} from '../lib/mainMarkets'
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
  TABLE_BODY_CLASS,
  TABLE_COLUMN_HEADER_CLASS,
  TABLE_HEADER_CLASS,
  TABLE_MICRO_LABEL_CLASS,
  TABLE_MICRO_META_CLASS,
  TABLE_PRICE_MUTED_CLASS,
  TABLE_PRICE_PRIMARY_CLASS,
  TABLE_PRICE_SECONDARY_CLASS,
  TABLE_ROW_LABEL_CLASS,
  TABLE_TITLE_CLASS,
  tableStrengthInputClass,
} from '../lib/tableTypography'
import { AveragePriceTooltip } from './AveragePriceTooltip'
import { BookmakerLogo } from './BookmakerLogo'
import { TruncatedText } from './TruncatedText'
import { CollapsibleSection } from './CollapsibleSection'

interface MainMarketsPanelProps {
  settings: MainMarketSettings
  layout: MainMarketsLayout
  tier: TradingTier
  onLayoutChange: (layout: MainMarketsLayout) => void
  onApplySectionStrength: (
    sectionId: MainMarketSectionId,
    slotIndex: number,
    strength: number,
  ) => void
  onSectionStatusChange: (
    sectionId: MainMarketSectionId,
    status: MainMarketSectionStatus,
  ) => void
}

const SECTION_STATUS_MODES = [
  { value: 'trading' as const, label: 'T', title: 'Trading' },
  { value: 'suspended' as const, label: 'S', title: 'Suspended' },
  { value: 'closed' as const, label: 'C', title: 'Closed' },
]

const SECTION_CONTAINER_STYLES: Record<
  MainMarketSectionStatus,
  {
    container: string
    sidebar: string
    header: string
    strengthBand: string
    marketArea: string
  }
> = {
  trading: {
    container: 'border-app-border bg-app-muted',
    sidebar: 'border-app-border bg-app-surface',
    header: 'border-app-border bg-app-surface',
    strengthBand: 'border-app-border bg-app-surface',
    marketArea: 'bg-app-muted',
  },
  suspended: {
    container: 'border-app-issue-amber-border bg-app-issue-amber-bg',
    sidebar: 'border-app-issue-amber-border bg-app-issue-amber-bg',
    header: 'border-app-issue-amber-border bg-app-issue-amber-bg',
    strengthBand: 'border-app-issue-amber-border bg-app-issue-amber-bg',
    marketArea: 'bg-app-issue-amber-bg',
  },
  closed: {
    container: 'border-app-issue-red-border bg-app-issue-red-bg',
    sidebar: 'border-app-issue-red-border bg-app-issue-red-bg',
    header: 'border-app-issue-red-border bg-app-issue-red-bg',
    strengthBand: 'border-app-issue-red-border bg-app-issue-red-bg',
    marketArea: 'bg-app-issue-red-bg',
  },
}

const MODE_BUTTON_STYLES: Record<
  MainMarketSectionStatus,
  { active: string; inactive: string }
> = {
  trading: {
    active: 'bg-gray-900 text-white',
    inactive: 'text-app-text-muted hover:bg-app-hover',
  },
  suspended: {
    active: 'bg-amber-400 text-amber-950',
    inactive: 'text-app-text-muted hover:bg-amber-50',
  },
  closed: {
    active: 'bg-red-600 text-white',
    inactive: 'text-app-text-muted hover:bg-red-50',
  },
}

function SectionModeButtons({
  status,
  onChange,
}: {
  status: MainMarketSectionStatus
  onChange: (status: MainMarketSectionStatus) => void
}) {
  return (
    <div className="flex shrink-0 rounded border border-app-border bg-app-surface p-0.5">
      {SECTION_STATUS_MODES.map((mode) => {
        const isActive = status === mode.value

        return (
          <button
            key={mode.value}
            type="button"
            title={mode.title}
            aria-label={mode.title}
            aria-pressed={isActive}
            onClick={() => onChange(mode.value)}
            className={`inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-semibold transition-colors ${
              isActive
                ? MODE_BUTTON_STYLES[mode.value].active
                : MODE_BUTTON_STYLES[mode.value].inactive
            }`}
          >
            {mode.label}
          </button>
        )
      })}
    </div>
  )
}

function LayoutToggle({
  layout,
  onChange,
}: {
  layout: MainMarketsLayout
  onChange: (layout: MainMarketsLayout) => void
}) {
  return (
    <div className="flex rounded-lg border border-app-border bg-app-surface p-0.5">
      <button
        type="button"
        onClick={() => onChange('stacked')}
        className={`rounded-md p-1.5 transition-colors ${
          layout === 'stacked'
            ? 'bg-app-subtle text-app-text'
            : 'text-app-text-muted hover:bg-app-hover'
        }`}
        aria-label="Stacked layout"
        title="Stacked layout"
      >
        <StackedLayoutIcon />
      </button>
      <button
        type="button"
        onClick={() => onChange('columns')}
        className={`rounded-md p-1.5 transition-colors ${
          layout === 'columns'
            ? 'bg-app-subtle text-app-text'
            : 'text-app-text-muted hover:bg-app-hover'
        }`}
        aria-label="Columns layout"
        title="Columns layout"
      >
        <ColumnsLayoutIcon />
      </button>
    </div>
  )
}

function StackedLayoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2" y="2" width="12" height="3" rx="0.75" stroke="currentColor" strokeWidth="1.25" />
      <rect x="2" y="6.5" width="12" height="3" rx="0.75" stroke="currentColor" strokeWidth="1.25" />
      <rect x="2" y="11" width="12" height="3" rx="0.75" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  )
}

function ColumnsLayoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2" y="2" width="3" height="12" rx="0.75" stroke="currentColor" strokeWidth="1.25" />
      <rect x="6.5" y="2" width="3" height="12" rx="0.75" stroke="currentColor" strokeWidth="1.25" />
      <rect x="11" y="2" width="3" height="12" rx="0.75" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  )
}

function StrengthSlotInput({
  sectionId,
  slotIndex,
  line,
  strength,
  status,
  layout,
  onApply,
}: {
  sectionId: MainMarketSectionId
  slotIndex: number
  line: number
  strength: number
  status: MainMarketSectionStatus
  layout: MainMarketsLayout
  onApply: MainMarketsPanelProps['onApplySectionStrength']
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

  const hasValue = parseStrengthInput(draft) > 0

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

  return (
    <div className={layout === 'columns' ? 'min-w-0 w-full' : 'min-w-0'}>
      <p className={TABLE_MICRO_LABEL_CLASS}>T.G</p>
      <TruncatedText
        as="p"
        className={`mt-px ${TABLE_MICRO_META_CLASS}`}
        title={`DS: TA: ${formatLine(line)}`}
      >
        DS: TA: {formatLine(line)}
      </TruncatedText>
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
        className={tableStrengthInputClass(hasValue)}
        aria-label={`${getMainMarketSection(sectionId).label} slot ${slotIndex + 1} strength`}
      />
    </div>
  )
}

function strengthGridDimensions(
  slotCount: number,
  layout: MainMarketsLayout,
): { columns: number; rows: number } {
  if (layout === 'columns') {
    if (slotCount <= 2) {
      return { columns: 1, rows: 2 }
    }

    return { columns: 3, rows: 2 }
  }

  const columns = slotCount <= 2 ? slotCount : 3
  return { columns, rows: Math.ceil(slotCount / columns) }
}

function SectionStrengthGrid({
  section,
  strengths,
  status,
  layout,
  onApply,
}: {
  section: MainMarketSectionConfig
  strengths: number[]
  status: MainMarketSectionStatus
  layout: MainMarketsLayout
  onApply: MainMarketsPanelProps['onApplySectionStrength']
}) {
  const { columns, rows } = strengthGridDimensions(section.strengthSlotCount, layout)

  return (
    <div
      className="grid gap-1"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${rows}, minmax(0, auto))`,
      }}
    >
      {section.strengthLines.map((line, slotIndex) => (
        <StrengthSlotInput
          key={`${section.id}-${slotIndex}`}
          sectionId={section.id}
          slotIndex={slotIndex}
          line={line}
          strength={strengths[slotIndex] ?? 0}
          status={status}
          layout={layout}
          onApply={onApply}
        />
      ))}
    </div>
  )
}

type MainMarketPriceRowId = 'bm0' | 'primary' | 'avg'

function isMainMarketCellAlerted(
  rowId: MainMarketPriceRowId,
  validation: ReturnType<typeof validateMainMarketPriceColumn>,
): boolean {
  if (rowId === 'bm0' && validation.hasZeroStrength) {
    return true
  }

  return (
    validation.hasPriceIssue && (rowId === 'bm0' || rowId === 'primary')
  )
}

function getMainMarketCellAlertClass(
  rowId: MainMarketPriceRowId,
  validation: ReturnType<typeof validateMainMarketPriceColumn>,
): string {
  if (rowId === 'bm0' && validation.hasZeroStrength) {
    return 'bg-app-issue-red-bg'
  }

  if (validation.hasPriceIssue && (rowId === 'bm0' || rowId === 'primary')) {
    return 'bg-app-issue-price-bg'
  }

  return ''
}

function getMainMarketPriceCellClass(
  rowId: MainMarketPriceRowId,
  validation: ReturnType<typeof validateMainMarketPriceColumn>,
): string {
  const alertClass = getMainMarketCellAlertClass(rowId, validation)
  const isAlerted = alertClass !== ''
  const bm0Alerted = isMainMarketCellAlerted('bm0', validation)
  const primaryAlerted = isMainMarketCellAlerted('primary', validation)
  const connectedAlert = bm0Alerted && primaryAlerted

  let radiusClass = 'rounded'
  let paddingClass = 'px-1 py-0.5'

  if (isAlerted && connectedAlert) {
    if (rowId === 'bm0') {
      radiusClass = 'rounded-t'
      paddingClass = 'px-1 pt-0.5 pb-0'
    } else if (rowId === 'primary') {
      radiusClass = 'rounded-b'
      paddingClass = 'px-1 pt-0 pb-0.5'
    }
  }

  return `relative ${paddingClass} ${radiusClass} ${alertClass}`.trim()
}

type MainMarketPriceColumn = {
  kind: 'price' | 'line'
  line?: number
  bm0: number | null
  primary: number | null
  average: number | null
  averageBookmakers: BookmakerPriceQuote[]
  validation: ReturnType<typeof validateMainMarketPriceColumn>
}

function MainMarketPriceCellContent({
  rowId,
  column,
}: {
  rowId: MainMarketPriceRowId
  column: MainMarketPriceColumn
}) {
  if (column.kind === 'line') {
    const lineLabel = column.line === undefined ? '—' : formatLine(column.line)
    return (
      <TruncatedText className={TABLE_PRICE_MUTED_CLASS}>{lineLabel}</TruncatedText>
    )
  }

  if (rowId === 'primary') {
    return (
      <TruncatedText className={TABLE_PRICE_SECONDARY_CLASS}>
        {formatPrice(column.primary)}
      </TruncatedText>
    )
  }

  if (rowId === 'avg') {
    if (column.average === null || column.averageBookmakers.length === 0) {
      return formatPrice(column.average)
    }

    return (
      <AveragePriceTooltip
        averagePrice={column.average}
        quotes={column.averageBookmakers}
        className={TABLE_PRICE_SECONDARY_CLASS}
        placement="below"
      />
    )
  }

  return (
    <TruncatedText className={TABLE_PRICE_PRIMARY_CLASS}>
      {formatPrice(column.bm0)}
    </TruncatedText>
  )
}

function MainMarketPriceCell({
  rowId,
  column,
}: {
  rowId: MainMarketPriceRowId
  column: MainMarketPriceColumn
}) {
  return (
    <td className={getMainMarketPriceCellClass(rowId, column.validation)}>
      <MainMarketPriceCellContent rowId={rowId} column={column} />
    </td>
  )
}

const compactMarketCardClass =
  'h-fit min-w-0 self-start overflow-hidden rounded border border-app-border bg-app-surface px-1.5 py-1 @min-[64rem]:min-w-[175px]'

function columnsSectionMarketGridClass(isWide: boolean): string {
  return isWide
    ? 'grid auto-rows-min grid-cols-1 content-start items-start gap-1 @min-[25rem]:grid-cols-2'
    : 'grid auto-rows-min grid-cols-1 content-start items-start gap-1'
}

const stackedSectionMarketGridClass =
  'grid w-full min-w-0 auto-rows-min grid-cols-1 content-start items-start gap-1.5 @min-[28rem]:grid-cols-2 @min-[38rem]:grid-cols-3 @min-[48rem]:grid-cols-4 @min-[54rem]:grid-cols-5 @min-[64rem]:grid-cols-6'

function columnsSectionClass(sectionLayout: MainMarketSectionConfig['layout']) {
  if (sectionLayout === 'wide') {
    return 'min-w-0 @min-[36rem]/main-markets:col-span-2 @min-[56rem]/main-markets:col-span-3 @min-[68rem]/main-markets:col-span-2'
  }

  return 'min-w-0'
}

function MarketPriceTable({
  marketKey,
  settings,
  compact,
}: {
  marketKey: MainMarketKey
  settings: MainMarketSettings
  compact?: boolean
}) {
  const snapshot = settings.markets[marketKey]
  if (!snapshot) return null

  const sectionId = getMainMarketSectionIdForMarket(marketKey)
  const sectionStrengths = settings.sectionStrengths[sectionId] ?? []

  const columns = snapshot.columns.map((columnDef, columnIndex) => {
    const bm0 =
      columnDef.kind === 'line'
        ? null
        : getMainMarketBm0Price(sectionStrengths, columnDef.strengthSlotIndex)
    const primary = snapshot.primaryPrices[columnIndex] ?? null
    const average = snapshot.averagePrices[columnIndex] ?? null
    const averageBookmakers = snapshot.averageBookmakersByColumn[columnIndex] ?? []
    const validation =
      columnDef.kind === 'line'
        ? { hasZeroStrength: false, hasPriceIssue: false }
        : validateMainMarketPriceColumn(bm0, primary)

    return {
      ...columnDef,
      bm0,
      primary,
      average,
      averageBookmakers,
      validation,
    }
  })

  const bookmaker = snapshot.bookmaker

  const rows: Array<{
    id: MainMarketPriceRowId
    label: string
  }> = [
    { id: 'bm0', label: 'BM0' },
    { id: 'primary', label: '' },
    { id: 'avg', label: 'AVG' },
  ]

  return (
    <div className="min-w-0 w-full overflow-hidden">
      <table
        className={`w-full table-fixed ${TABLE_BODY_CLASS} ${compact ? 'mt-1' : 'mt-2 border-t border-app-border pt-2'}`}
      >
        <colgroup>
          <col style={{ width: compact ? '1.75rem' : '2rem' }} />
          {columns.map((column, index) => (
            <col key={`${column.label}-${index}`} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th className="px-1 pb-0.5 text-left" />
            {columns.map((column, index) => (
              <th
                key={`${column.label}-${index}`}
                className={`px-1 pb-0.5 text-left ${TABLE_COLUMN_HEADER_CLASS}`}
              >
                <TruncatedText className="block">{column.label}</TruncatedText>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td className={`px-1 py-0.5 ${TABLE_ROW_LABEL_CLASS}`}>
                {row.id === 'primary' ? (
                  <BookmakerLogo bookmaker={bookmaker} size="sm" />
                ) : row.label ? (
                  <TruncatedText className="block">{row.label}</TruncatedText>
                ) : null}
              </td>
              {columns.map((column, index) => (
                <MainMarketPriceCell
                  key={`${row.id}-${index}`}
                  rowId={row.id}
                  column={column}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MainMarketCard({
  marketKey,
  settings,
  compact,
}: {
  marketKey: MainMarketKey
  settings: MainMarketSettings
  compact?: boolean
}) {
  return (
    <article className={`${compactMarketCardClass} w-full`}>
      <TruncatedText as="h4" className={TABLE_TITLE_CLASS}>
        {getMainMarketLabel(marketKey)}
      </TruncatedText>
      <MarketPriceTable marketKey={marketKey} settings={settings} compact={compact} />
    </article>
  )
}

interface SectionProps {
  section: (typeof MAIN_MARKET_SECTIONS)[number]
  settings: MainMarketSettings
  onApplySectionStrength: MainMarketsPanelProps['onApplySectionStrength']
  onSectionStatusChange: MainMarketsPanelProps['onSectionStatusChange']
}

function MainMarketSectionStacked({
  section,
  settings,
  onApplySectionStrength,
  onSectionStatusChange,
}: SectionProps) {
  const strengths = settings.sectionStrengths[section.id] ?? []
  const status = settings.sectionStatus[section.id] ?? 'trading'
  const styles = SECTION_CONTAINER_STYLES[status]

  return (
    <section className={`@container/section min-w-0 overflow-hidden rounded-xl border pl-0 pr-1 ${styles.container}`}>
      <div className="grid min-w-0 grid-cols-1 @min-[33rem]/section:grid-cols-[10.5rem_minmax(0,1fr)]">
        <aside
          className={`flex min-h-full w-full min-w-0 flex-col border-b px-2.5 py-2 @min-[33rem]/section:border-r @min-[33rem]/section:border-b-0 ${styles.sidebar}`}
        >
          <div className="flex min-w-0 items-center justify-between gap-1.5">
            <TruncatedText as="h3" className={`h-full min-w-0 ${TABLE_HEADER_CLASS}`}>
              {section.label}
            </TruncatedText>
            <SectionModeButtons
              status={status}
              onChange={(nextStatus) => onSectionStatusChange(section.id, nextStatus)}
            />
          </div>

          <div className="mt-2">
            <SectionStrengthGrid
              section={section}
              strengths={strengths}
              status={status}
              layout="stacked"
              onApply={onApplySectionStrength}
            />
          </div>
        </aside>

        <div
          className={`@container min-h-0 min-w-0 w-full p-1.5 ${styles.marketArea}`}
        >
          <div className={stackedSectionMarketGridClass}>
            {section.markets.map((market) => (
              <MainMarketCard
                key={market.key}
                marketKey={market.key}
                settings={settings}
                compact
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function MainMarketSectionColumns({
  section,
  settings,
  onApplySectionStrength,
  onSectionStatusChange,
}: SectionProps) {
  const isWide = section.layout === 'wide'
  const strengths = settings.sectionStrengths[section.id] ?? []
  const status = settings.sectionStatus[section.id] ?? 'trading'
  const styles = SECTION_CONTAINER_STYLES[status]

  return (
    <section
      className={`flex h-full min-w-0 flex-col overflow-hidden rounded-lg border ${styles.container} ${columnsSectionClass(section.layout)}`}
    >
      <header
        className={`flex min-w-0 flex-col gap-1 border-b px-1.5 py-1 ${styles.header}`}
      >
        <div className="flex min-w-0 items-center justify-between gap-1">
          <TruncatedText as="h3" className={`min-w-0 ${TABLE_HEADER_CLASS}`}>
            {section.label}
          </TruncatedText>
          <SectionModeButtons
            status={status}
            onChange={(nextStatus) => onSectionStatusChange(section.id, nextStatus)}
          />
        </div>
      </header>

      <div className={`border-b px-1.5 py-1 ${styles.strengthBand}`}>
        <SectionStrengthGrid
          section={section}
          strengths={strengths}
          status={status}
          layout="columns"
          onApply={onApplySectionStrength}
        />
      </div>

      <div
        className={`@container min-w-0 flex-1 rounded-b-lg p-1 ${styles.marketArea} ${columnsSectionMarketGridClass(isWide)}`}
      >
        {section.markets.map((market) => (
          <MainMarketCard
            key={market.key}
            marketKey={market.key}
            settings={settings}
            compact
          />
        ))}
      </div>
    </section>
  )
}

export function MainMarketsPanel({
  settings,
  layout,
  tier,
  onLayoutChange,
  onApplySectionStrength,
  onSectionStatusChange,
}: MainMarketsPanelProps) {
  const SectionComponent =
    layout === 'stacked' ? MainMarketSectionStacked : MainMarketSectionColumns

  const visibleSections = useMemo(
    () => MAIN_MARKET_SECTIONS.filter((section) => isMainSectionVisibleForTier(tier, section.id)),
    [tier],
  )

  return (
    <div className="@container/main-markets min-w-0 w-full overflow-hidden border-b border-app-border bg-app-surface px-2 py-2 sm:px-4 sm:py-3">
      <CollapsibleSection
        title="Main Markets"
        headerActions={<LayoutToggle layout={layout} onChange={onLayoutChange} />}
        bodyClassName="mt-2 sm:mt-3"
      >
      {layout === 'stacked' ? (
        <div className="flex min-w-0 flex-col gap-2 sm:gap-3">
          {visibleSections.map((section) => (
            <SectionComponent
              key={section.id}
              section={section}
              settings={settings}
              onApplySectionStrength={onApplySectionStrength}
              onSectionStatusChange={onSectionStatusChange}
            />
          ))}
        </div>
      ) : (
        <div className="grid w-full min-w-0 grid-cols-1 gap-1.5 @min-[28rem]/main-markets:grid-cols-2 @min-[48rem]/main-markets:grid-cols-3 @min-[68rem]/main-markets:grid-cols-6">
          {visibleSections.map((section) => (
            <SectionComponent
              key={section.id}
              section={section}
              settings={settings}
              onApplySectionStrength={onApplySectionStrength}
              onSectionStatusChange={onSectionStatusChange}
            />
          ))}
        </div>
      )}
      </CollapsibleSection>
    </div>
  )
}
