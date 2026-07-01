import { TABLE_HEADER_CLASS } from '../lib/tableTypography'

export type AppScreen = 'manage' | 'monitor' | 'issues'

interface ScreenTabsProps {
  value: AppScreen
  onChange: (screen: AppScreen) => void
}

const SCREENS: { value: AppScreen; label: string }[] = [
  { value: 'manage', label: 'Manage' },
  { value: 'monitor', label: 'Monitor' },
  { value: 'issues', label: 'Issues' },
]

export function ScreenTabs({ value, onChange }: ScreenTabsProps) {
  return (
    <nav
      className="flex items-center gap-5 border-b border-app-border"
      aria-label="Fixture views"
    >
      {SCREENS.map((screen) => {
        const active = value === screen.value

        return (
          <button
            key={screen.value}
            type="button"
            onClick={() => onChange(screen.value)}
            aria-current={active ? 'page' : undefined}
            className={`-mb-px border-b-2 px-0.5 pb-2 pt-0.5 transition-colors ${TABLE_HEADER_CLASS} ${
              active
                ? 'border-app-border text-app-text'
                : 'border-transparent text-app-text-muted hover:border-app-input-border hover:text-app-text-secondary'
            }`}
          >
            {screen.label}
          </button>
        )
      })}
    </nav>
  )
}
