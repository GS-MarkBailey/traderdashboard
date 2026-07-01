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
      className="flex items-center gap-5 border-b border-[#e5e7eb]"
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
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            {screen.label}
          </button>
        )
      })}
    </nav>
  )
}
