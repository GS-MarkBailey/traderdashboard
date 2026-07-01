import { THEME_OPTIONS, useTheme, type Theme } from '../lib/theme'

import { FORM_LABEL_CLASS, FORM_SELECT_CLASS } from '../lib/tableTypography'

export function ThemeSelect() {
  const { theme, setTheme } = useTheme()

  return (
    <label className="flex items-center gap-2">
      <span className={FORM_LABEL_CLASS}>Theme</span>
      <select
        value={theme}
        onChange={(event) => setTheme(event.target.value as Theme)}
        className={FORM_SELECT_CLASS}
        aria-label="Color theme"
      >
        {THEME_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
