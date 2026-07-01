import type {
  BookmakerId,
  MainMarketKey,
  MainMarketSectionId,
  MainMarketSectionStatus,
  MainMarketSettings,
} from '../types/trading'
import {
  getMainMarketBm0Price,
  getMainMarketLabel,
  getMainMarketSection,
  MAIN_MARKET_SECTIONS,
} from './mainMarkets'
import { formatPrice, validateMainMarketPriceColumn } from './pricing'

export type MainMarketColumnStatus =
  | 'healthy'
  | 'suspended'
  | 'closed'
  | 'unpriced'
  | 'price'

export interface MainMarketColumnIssue {
  sectionId: MainMarketSectionId
  sectionLabel: string
  sectionStatus: MainMarketSectionStatus
  marketKey: MainMarketKey
  marketLabel: string
  columnLabel: string
  columnIndex: number
  strengthSlotIndex: number
  strengthLine: number
  strength: number
  bookmaker: BookmakerId
  status: MainMarketColumnStatus
  detail: string
  bm0: number | null
  primary: number | null
}

export interface MainMarketSectionHealth {
  sectionId: MainMarketSectionId
  sectionLabel: string
  sectionStatus: MainMarketSectionStatus
  totalColumns: number
  tradingColumns: number
  healthy: number
  suspended: number
  closed: number
  unpriced: number
  priceIssues: number
  issueColumns: number
}

export interface MainMarketHealthSnapshot {
  totalSections: number
  totalColumns: number
  tradingColumns: number
  healthyColumns: number
  suspendedColumns: number
  closedColumns: number
  unpricedColumns: number
  priceIssueColumns: number
  issueColumns: number
  suspendedSections: number
  closedSections: number
  tradingSections: number
  healthScore: number
  overallStatus: 'healthy' | 'attention' | 'critical'
  bySection: MainMarketSectionHealth[]
  issues: MainMarketColumnIssue[]
}

const ISSUE_PRIORITY: Record<MainMarketColumnStatus, number> = {
  unpriced: 0,
  price: 1,
  suspended: 2,
  closed: 3,
  healthy: 4,
}

function columnStatusDetail(status: MainMarketColumnStatus): string {
  switch (status) {
    case 'suspended':
      return 'Section suspended'
    case 'closed':
      return 'Section closed (read-only)'
    case 'unpriced':
      return 'Not priced'
    case 'price':
      return 'BM0 off primary (>2%)'
    default:
      return 'Healthy'
  }
}

function classifyMainMarketColumn(
  sectionStatus: MainMarketSectionStatus,
  bm0: number | null,
  primary: number | null,
): MainMarketColumnStatus {
  if (sectionStatus === 'closed') return 'closed'
  if (sectionStatus === 'suspended') return 'suspended'

  const validation = validateMainMarketPriceColumn(bm0, primary)
  if (validation.hasZeroStrength) return 'unpriced'
  if (validation.hasPriceIssue) return 'price'
  return 'healthy'
}

export const MAIN_MARKET_STATUS_DOT: Record<
  MainMarketColumnStatus,
  { color: string; label: string }
> = {
  healthy: { color: '#d1d5db', label: 'Healthy' },
  suspended: { color: '#fbbf24', label: 'Suspended' },
  closed: { color: '#9ca3af', label: 'Closed' },
  unpriced: { color: '#fca5a5', label: 'Unpriced' },
  price: { color: '#ef4444', label: 'Price drift' },
}

export function buildMainMarketHealthSnapshot(
  settings: MainMarketSettings,
): MainMarketHealthSnapshot {
  const bySection: MainMarketSectionHealth[] = []
  const issues: MainMarketColumnIssue[] = []

  let totalColumns = 0
  let tradingColumns = 0
  let healthyColumns = 0
  let suspendedColumns = 0
  let closedColumns = 0
  let unpricedColumns = 0
  let priceIssueColumns = 0
  let issueColumns = 0
  let suspendedSections = 0
  let closedSections = 0
  let tradingSections = 0

  for (const section of MAIN_MARKET_SECTIONS) {
    const sectionStatus = settings.sectionStatus[section.id] ?? 'trading'
    const sectionStrengths = settings.sectionStrengths[section.id] ?? []
    const sectionConfig = getMainMarketSection(section.id)

    if (sectionStatus === 'trading') tradingSections += 1
    if (sectionStatus === 'suspended') suspendedSections += 1
    if (sectionStatus === 'closed') closedSections += 1

    const sectionHealth: MainMarketSectionHealth = {
      sectionId: section.id,
      sectionLabel: section.label,
      sectionStatus,
      totalColumns: 0,
      tradingColumns: 0,
      healthy: 0,
      suspended: 0,
      closed: 0,
      unpriced: 0,
      priceIssues: 0,
      issueColumns: 0,
    }

    for (const market of sectionConfig.markets) {
      const snapshot = settings.markets[market.key]
      if (!snapshot) continue

      snapshot.columns.forEach((columnDef, columnIndex) => {
        if (columnDef.kind === 'line') return

        const bm0 = getMainMarketBm0Price(
          sectionStrengths,
          columnDef.strengthSlotIndex,
        )
        const primary = snapshot.primaryPrices[columnIndex] ?? null
        const status = classifyMainMarketColumn(sectionStatus, bm0, primary)

        totalColumns += 1
        sectionHealth.totalColumns += 1

        switch (status) {
          case 'healthy':
            healthyColumns += 1
            sectionHealth.healthy += 1
            if (sectionStatus === 'trading') {
              tradingColumns += 1
              sectionHealth.tradingColumns += 1
            }
            break
          case 'suspended':
            suspendedColumns += 1
            sectionHealth.suspended += 1
            break
          case 'closed':
            closedColumns += 1
            sectionHealth.closed += 1
            break
          case 'unpriced':
            unpricedColumns += 1
            issueColumns += 1
            sectionHealth.unpriced += 1
            sectionHealth.issueColumns += 1
            if (sectionStatus === 'trading') {
              tradingColumns += 1
              sectionHealth.tradingColumns += 1
            }
            break
          case 'price':
            priceIssueColumns += 1
            issueColumns += 1
            sectionHealth.priceIssues += 1
            sectionHealth.issueColumns += 1
            if (sectionStatus === 'trading') {
              tradingColumns += 1
              sectionHealth.tradingColumns += 1
            }
            break
        }

        if (status === 'unpriced' || status === 'price') {
          const strengthSlotIndex = columnDef.strengthSlotIndex
          issues.push({
            sectionId: section.id,
            sectionLabel: section.label,
            sectionStatus,
            marketKey: market.key,
            marketLabel: getMainMarketLabel(market.key),
            columnLabel: columnDef.label,
            columnIndex,
            strengthSlotIndex,
            strengthLine: section.strengthLines[strengthSlotIndex] ?? 0.5,
            strength: sectionStrengths[strengthSlotIndex] ?? 0,
            bookmaker: snapshot.bookmaker,
            status,
            detail: `${columnStatusDetail(status)} · BM0 ${formatPrice(bm0)} · Pri ${formatPrice(primary)}`,
            bm0,
            primary,
          })
        }
      })
    }

    bySection.push(sectionHealth)
  }

  issues.sort(
    (a, b) =>
      ISSUE_PRIORITY[a.status] - ISSUE_PRIORITY[b.status] ||
      a.sectionLabel.localeCompare(b.sectionLabel) ||
      a.marketLabel.localeCompare(b.marketLabel) ||
      a.columnIndex - b.columnIndex,
  )

  const healthScore =
    tradingColumns > 0 ? Math.round((healthyColumns / tradingColumns) * 100) : 100

  let overallStatus: MainMarketHealthSnapshot['overallStatus'] = 'healthy'
  if (healthScore < 90 || unpricedColumns > 0) {
    overallStatus = 'critical'
  } else if (healthScore < 98 || issueColumns > 0) {
    overallStatus = 'attention'
  }

  return {
    totalSections: MAIN_MARKET_SECTIONS.length,
    totalColumns,
    tradingColumns,
    healthyColumns,
    suspendedColumns,
    closedColumns,
    unpricedColumns,
    priceIssueColumns,
    issueColumns,
    suspendedSections,
    closedSections,
    tradingSections,
    healthScore,
    overallStatus,
    bySection,
    issues,
  }
}

export function getMainMarketSectionStatusLabel(
  status: MainMarketSectionStatus,
): string {
  switch (status) {
    case 'trading':
      return 'Trading'
    case 'suspended':
      return 'Suspended'
    case 'closed':
      return 'Closed'
  }
}
