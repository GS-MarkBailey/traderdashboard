import { TABLE_HEADER_CLASS } from '../lib/tableTypography'

export type TradingTab = 'main-markets' | 'player-props'

interface TradingTabsProps {
  value: TradingTab
  onChange: (tab: TradingTab) => void
}

const TABS: { value: TradingTab; label: string }[] = [
  { value: 'main-markets', label: 'Main Markets' },
  { value: 'player-props', label: 'Player Props' },
]

export function TradingTabs({ value, onChange }: TradingTabsProps) {
  return (
    <nav
      className="flex items-center gap-5 border-b border-app-border"
      aria-label="Trading views"
    >
      {TABS.map((tab) => {
        const active = value === tab.value

        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            aria-current={active ? 'page' : undefined}
            className={`-mb-px border-b-2 px-0.5 pb-2 pt-0.5 transition-colors ${TABLE_HEADER_CLASS} ${
              active
                ? 'border-app-border text-app-text'
                : 'border-transparent text-app-text-muted hover:border-app-input-border hover:text-app-text-secondary'
            }`}
          >
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}
