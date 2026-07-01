/** Compact table typography aligned with Main Markets UI */

export const TABLE_HEADER_CLASS =
  'font-heading text-[11px] font-semibold leading-tight text-gray-900'

export const TABLE_TITLE_CLASS =
  'text-[10px] font-semibold leading-tight text-gray-900'

export const TABLE_COLUMN_HEADER_CLASS =
  'text-[10px] font-medium text-gray-400'

export const TABLE_ROW_LABEL_CLASS =
  'text-[10px] font-medium text-gray-500'

export const TABLE_PRICE_PRIMARY_CLASS =
  'text-[10px] font-semibold leading-none tabular-nums text-gray-900'

export const TABLE_PRICE_SECONDARY_CLASS =
  'text-[10px] leading-none tabular-nums text-gray-700'

export const TABLE_PRICE_MUTED_CLASS =
  'text-[10px] leading-none tabular-nums text-gray-500'

export const TABLE_PRICE_STRIKE_CLASS =
  'text-[10px] font-normal leading-none tabular-nums text-[#6b7280] line-through'

export const TABLE_PLAYER_NAME_CLASS =
  'text-[10px] font-semibold leading-tight text-gray-900'

export const TABLE_LABEL_CLASS = 'text-[10px] leading-tight text-gray-700'

export const TABLE_MICRO_LABEL_CLASS =
  'text-[10px] font-semibold uppercase tracking-wide text-gray-500'

export const TABLE_MICRO_META_CLASS = 'text-[10px] tabular-nums text-gray-400'

export const TABLE_BODY_CLASS = 'text-[10px] tabular-nums'

export const TABLE_CELL_CLASS = 'border border-[#e5e7eb] px-1.5 py-1 align-middle'

export const TABLE_HEAD_CELL_CLASS = `border border-[#e5e7eb] bg-[#f9fafb] px-1.5 py-1 text-left ${TABLE_HEADER_CLASS}`

export const TABLE_STRENGTH_INPUT_BASE_CLASS =
  'rounded border border-[#d1d5db] bg-white text-left text-[10px] font-normal tabular-nums outline-none focus:border-[#93c5fd] disabled:cursor-not-allowed disabled:opacity-80 read-only:cursor-default read-only:bg-[#f3f4f6]'

export function tableStrengthInputClass(hasValue: boolean): string {
  const colorClass = hasValue
    ? 'text-[#374151]'
    : 'text-[#9ca3af] focus:text-[#374151]'

  return `${TABLE_STRENGTH_INPUT_BASE_CLASS} h-5 w-full px-1 ${colorClass}`
}

export function tableTeamBadgeClass(team: 'home' | 'away'): string {
  return `inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide ${
    team === 'home' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
  }`
}

export function tableStatsClass(hasValue: boolean): string {
  return `text-[10px] font-semibold leading-none tabular-nums ${
    hasValue ? 'text-gray-900' : 'text-[#9ca3af]'
  }`
}
