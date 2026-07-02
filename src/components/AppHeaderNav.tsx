export type AppNavSection = 'fixtures' | 'trading'

interface AppHeaderNavProps {
  value: AppNavSection
  onChange: (section: AppNavSection) => void
}

const NAV_SECTIONS: { value: AppNavSection; label: string }[] = [
  { value: 'fixtures', label: 'Fixtures' },
  { value: 'trading', label: 'Trading' },
]

export function AppHeaderNav({ value, onChange }: AppHeaderNavProps) {
  return (
    <nav className="flex items-center gap-1 border-l border-app-border pl-4" aria-label="Main navigation">
      {NAV_SECTIONS.map((section) => {
        const active = value === section.value

        return (
          <button
            key={section.value}
            type="button"
            onClick={() => onChange(section.value)}
            aria-current={active ? 'page' : undefined}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
              active
                ? 'font-semibold text-app-text hover:bg-app-subtle'
                : 'font-medium text-app-text-muted hover:bg-app-subtle hover:text-app-text'
            }`}
          >
            {section.label}
          </button>
        )
      })}
    </nav>
  )
}
