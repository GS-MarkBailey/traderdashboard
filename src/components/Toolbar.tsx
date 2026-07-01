import { useEffect, useRef, useState, type ReactNode } from 'react'
import type {
  IssueFilter,
  PricingFilter,
  StatusFilter,
  StrengthMode,
  TeamFilter,
} from '../types/trading'
import type { ProposalSummary } from '../lib/proposals'
import { ProposalsPopover } from './ProposalsPopover'

type ViewMode = 'grid' | 'list'

interface FilterPillGroupProps<T extends string> {
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}

function FilterPillGroup<T extends string>({
  options,
  value,
  onChange,
}: FilterPillGroupProps<T>) {
  return (
    <div className="flex rounded-lg border border-gray-200 bg-white p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
            value === option.value
              ? 'bg-gray-900 text-white'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

function countActiveFilters(
  strengthMode: StrengthMode,
  teamFilter: TeamFilter,
  pricingFilter: PricingFilter,
  statusFilter: StatusFilter,
  issueFilter: IssueFilter,
): number {
  let count = 0
  if (strengthMode !== 'absolute') count += 1
  if (teamFilter !== 'all') count += 1
  if (pricingFilter !== 'all') count += 1
  if (statusFilter !== 'all') count += 1
  if (issueFilter !== 'all') count += 1
  return count
}

interface PlayerFiltersDropdownProps {
  disabled?: boolean
  strengthMode: StrengthMode
  teamFilter: TeamFilter
  pricingFilter: PricingFilter
  statusFilter: StatusFilter
  issueFilter: IssueFilter
  onStrengthModeChange: (mode: StrengthMode) => void
  onTeamFilterChange: (value: TeamFilter) => void
  onPricingFilterChange: (value: PricingFilter) => void
  onStatusFilterChange: (value: StatusFilter) => void
  onIssueFilterChange: (value: IssueFilter) => void
}

function PlayerFiltersDropdown({
  disabled = false,
  strengthMode,
  teamFilter,
  pricingFilter,
  statusFilter,
  issueFilter,
  onStrengthModeChange,
  onTeamFilterChange,
  onPricingFilterChange,
  onStatusFilterChange,
  onIssueFilterChange,
}: PlayerFiltersDropdownProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const activeCount = countActiveFilters(
    strengthMode,
    teamFilter,
    pricingFilter,
    statusFilter,
    issueFilter,
  )

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={`relative inline-flex items-center rounded-lg border px-3 py-2 text-sm font-medium shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          activeCount > 0
            ? 'border-[#93c5fd] bg-[#eff6ff] text-[#1d4ed8] hover:bg-[#dbeafe]'
            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
        }`}
      >
        Filters
        {activeCount > 0 ? (
          <span className="ml-1.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-[#2563eb] px-1.5 py-0.5 text-[11px] font-bold text-white">
            {activeCount}
          </span>
        ) : null}
        <span className="ml-2 text-gray-500" aria-hidden>
          <ChevronDownIcon />
        </span>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Player filters"
          className="absolute top-[calc(100%+0.5rem)] right-0 z-40 w-[min(100vw-2rem,20rem)] rounded-xl border border-[#e5e7eb] bg-white p-3 shadow-lg"
        >
          <div className="flex flex-col gap-3">
            <FilterSection label="Strength">
              <FilterPillGroup
                options={[
                  { value: 'absolute', label: 'Absolute' },
                  { value: 'relative', label: 'Relative' },
                ]}
                value={strengthMode}
                onChange={onStrengthModeChange}
              />
            </FilterSection>

            <FilterSection label="Team">
              <FilterPillGroup
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'home', label: 'Home' },
                  { value: 'away', label: 'Away' },
                ]}
                value={teamFilter}
                onChange={onTeamFilterChange}
              />
            </FilterSection>

            <FilterSection label="Pricing">
              <FilterPillGroup
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'priced', label: 'Priced' },
                  { value: 'unpriced', label: 'Unpriced' },
                ]}
                value={pricingFilter}
                onChange={onPricingFilterChange}
              />
            </FilterSection>

            <FilterSection label="Status">
              <FilterPillGroup
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                ]}
                value={statusFilter}
                onChange={onStatusFilterChange}
              />
            </FilterSection>

            <FilterSection label="Issues">
              <FilterPillGroup
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'highlighted', label: 'Highlighted' },
                ]}
                value={issueFilter}
                onChange={onIssueFilterChange}
              />
            </FilterSection>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function FilterSection({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </p>
      {children}
    </div>
  )
}

interface ToolbarProps {
  hasPlayers: boolean
  strengthMode: StrengthMode
  search: string
  teamFilter: TeamFilter
  pricingFilter: PricingFilter
  statusFilter: StatusFilter
  issueFilter: IssueFilter
  viewMode: ViewMode
  proposals: ProposalSummary[]
  onImport: () => void
  onConfirmAllProposals: () => void
  onRejectAllProposals: () => void
  onRejectProposal: (key: string) => void
  onStrengthModeChange: (mode: StrengthMode) => void
  onSearchChange: (value: string) => void
  onTeamFilterChange: (value: TeamFilter) => void
  onPricingFilterChange: (value: PricingFilter) => void
  onStatusFilterChange: (value: StatusFilter) => void
  onIssueFilterChange: (value: IssueFilter) => void
  onViewModeChange: (mode: ViewMode) => void
}

export function Toolbar({
  hasPlayers,
  strengthMode,
  search,
  teamFilter,
  pricingFilter,
  statusFilter,
  issueFilter,
  viewMode,
  proposals,
  onImport,
  onConfirmAllProposals,
  onRejectAllProposals,
  onRejectProposal,
  onStrengthModeChange,
  onSearchChange,
  onTeamFilterChange,
  onPricingFilterChange,
  onStatusFilterChange,
  onIssueFilterChange,
  onViewModeChange,
}: ToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-[#e5e7eb] bg-[#f9fafb] px-4 py-3">
      <ProposalsPopover
        proposals={proposals}
        disabled={!hasPlayers}
        visible={proposals.length > 0}
        onConfirmAll={onConfirmAllProposals}
        onRejectAll={onRejectAllProposals}
        onRejectOne={onRejectProposal}
      />

      {!hasPlayers ? (
        <button
          type="button"
          onClick={onImport}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          Import Players
        </button>
      ) : null}

      <input
        type="search"
        placeholder="Search players…"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        disabled={!hasPlayers}
        className="w-44 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
      />

      <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
        <PlayerFiltersDropdown
          disabled={!hasPlayers}
          strengthMode={strengthMode}
          teamFilter={teamFilter}
          pricingFilter={pricingFilter}
          statusFilter={statusFilter}
          issueFilter={issueFilter}
          onStrengthModeChange={onStrengthModeChange}
          onTeamFilterChange={onTeamFilterChange}
          onPricingFilterChange={onPricingFilterChange}
          onStatusFilterChange={onStatusFilterChange}
          onIssueFilterChange={onIssueFilterChange}
        />

        <div className="flex rounded-lg border border-gray-200 bg-white p-0.5">
          <button
            type="button"
            onClick={() => onViewModeChange('grid')}
            className={`rounded-md p-1.5 transition-colors ${
              viewMode === 'grid'
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
            aria-label="Grid view"
            title="Grid view"
          >
            <GridIcon />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('list')}
            className={`rounded-md p-1.5 transition-colors ${
              viewMode === 'list'
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
            aria-label="List view"
            title="List view"
          >
            <ListIcon />
          </button>
        </div>
      </div>
    </div>
  )
}

function GridIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2" y="11" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="11" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function ListIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <rect x="2" y="3" width="14" height="2.5" rx="0.5" fill="currentColor" />
      <rect x="2" y="8" width="14" height="2.5" rx="0.5" fill="currentColor" />
      <rect x="2" y="13" width="14" height="2.5" rx="0.5" fill="currentColor" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M4 6l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
