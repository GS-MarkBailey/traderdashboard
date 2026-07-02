import { type ReactElement } from 'react'
import { THEME_OPTIONS, useTheme, type Theme } from '../lib/theme'

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 1.5v1.75M8 12.75V14.5M14.5 8h-1.75M3.25 8H1.5M12.4 3.6l-1.24 1.24M4.84 11.16l-1.24 1.24M12.4 12.4l-1.24-1.24M4.84 4.84 3.6 3.6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M12.8 10.2A5.5 5.5 0 0 1 5.8 3.2 5.5 5.5 0 1 0 12.8 10.2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SystemIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect
        x="2.25"
        y="3.25"
        width="11.5"
        height="7.5"
        rx="1.25"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M6 12.25h4M8 10.75V12.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

const THEME_ICONS: Record<Theme, () => ReactElement> = {
  light: SunIcon,
  dark: MoonIcon,
  system: SystemIcon,
}

export function ThemeSelect() {
  const { theme, setTheme } = useTheme()
  const activeIndex = Math.max(
    0,
    THEME_OPTIONS.findIndex((option) => option.value === theme),
  )

  return (
    <div
      role="radiogroup"
      aria-label="Color theme"
      className="relative inline-grid grid-cols-3 rounded-full border border-app-border bg-app-subtle p-0.5 shadow-inner"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute top-0.5 bottom-0.5 left-0.5 w-[calc((100%-0.25rem)/3)] rounded-full bg-app-surface shadow-sm ring-1 ring-app-border/50 transition-transform duration-200 ease-out"
        style={{ transform: `translateX(${activeIndex * 100}%)` }}
      />

      {THEME_OPTIONS.map((option) => {
        const active = theme === option.value
        const Icon = THEME_ICONS[option.value]

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={option.label}
            title={option.label}
            onClick={() => setTheme(option.value)}
            className={`relative z-10 flex h-7 w-8 items-center justify-center rounded-full transition-colors ${
              active
                ? 'text-app-text'
                : 'text-app-text-faint hover:text-app-text-muted'
            }`}
          >
            <Icon />
          </button>
        )
      })}
    </div>
  )
}
