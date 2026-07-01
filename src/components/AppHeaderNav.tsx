export type AppNavSection = 'fixtures'

interface AppHeaderNavProps {
  value: AppNavSection
  onChange: (section: AppNavSection) => void
}

const NAV_SECTIONS: { value: AppNavSection; label: string }[] = [
  { value: 'fixtures', label: 'Fixtures' },
]

export function AppHeaderNav({ value, onChange }: AppHeaderNavProps) {
  return (
    <nav className="flex items-center gap-1 border-l border-gray-200 pl-4" aria-label="Main navigation">
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
                ? 'font-semibold text-gray-900 hover:bg-gray-100'
                : 'font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            {section.label}
          </button>
        )
      })}
    </nav>
  )
}
