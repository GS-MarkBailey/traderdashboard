/** Compact table typography aligned with Main Markets UI */

export const TABLE_HEADER_CLASS =
  'font-heading text-[11px] font-semibold leading-tight text-app-text'

export const TABLE_TITLE_CLASS =
  'text-[10px] font-semibold leading-tight text-app-text'

export const TABLE_COLUMN_HEADER_CLASS =
  'text-[10px] font-medium text-app-text-faint'

export const TABLE_ROW_LABEL_CLASS =
  'text-[10px] font-medium text-app-text-muted'

export const TABLE_PRICE_PRIMARY_CLASS =
  'text-[10px] font-semibold leading-none tabular-nums text-app-text'

export const TABLE_PRICE_SECONDARY_CLASS =
  'text-[10px] leading-none tabular-nums text-app-text-secondary'

export const TABLE_PRICE_MUTED_CLASS =
  'text-[10px] leading-none tabular-nums text-app-text-muted'

export const TABLE_PRICE_STRIKE_CLASS =
  'text-[10px] font-normal leading-none tabular-nums text-app-text-muted line-through'

export const TABLE_PLAYER_NAME_CLASS =
  'text-[10px] font-semibold leading-tight text-app-text'

export const TABLE_LABEL_CLASS = 'text-[10px] leading-tight text-app-text-secondary'

export const TABLE_MICRO_LABEL_CLASS =
  'text-[10px] font-semibold uppercase tracking-wide text-app-text-muted'

export const TABLE_MICRO_META_CLASS = 'text-[10px] tabular-nums text-app-text-faint'

export const TABLE_BODY_CLASS = 'text-[10px] tabular-nums'

export const TABLE_CELL_CLASS = 'border border-app-border px-1.5 py-1 align-middle'

export const TABLE_HEAD_CELL_CLASS = `border border-app-border bg-app-muted px-1.5 py-1 text-left ${TABLE_HEADER_CLASS}`

export const TABLE_STRENGTH_INPUT_BASE_CLASS =
  'rounded border border-app-input-border bg-app-input-bg text-left text-[10px] font-normal tabular-nums outline-none focus:border-app-focus disabled:cursor-not-allowed disabled:opacity-80 read-only:cursor-default read-only:bg-app-input-readonly'

export function tableStrengthInputClass(hasValue: boolean): string {
  const colorClass = hasValue
    ? 'text-app-text-secondary'
    : 'text-app-text-faint focus:text-app-text-secondary'

  return `${TABLE_STRENGTH_INPUT_BASE_CLASS} h-5 w-full px-1 ${colorClass}`
}

export function tableTeamBadgeClass(team: 'home' | 'away'): string {
  return `inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide ${
    team === 'home'
      ? 'bg-red-100 text-app-issue-red-text dark:bg-red-950/60 dark:text-red-300'
      : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
  }`
}

export function tableStatsClass(hasValue: boolean): string {
  return `text-[10px] font-semibold leading-none tabular-nums ${
    hasValue ? 'text-app-text' : 'text-app-text-faint'
  }`
}

export const FORM_SELECT_CLASS =
  'rounded-lg border border-app-border bg-app-surface px-3 py-1.5 text-sm font-medium text-app-text outline-none focus:border-app-focus focus:ring-2 focus:ring-app-selected-bg'

export const FORM_LABEL_CLASS = 'text-sm font-medium text-app-text-muted'
