import {
  TRADING_TIER_OPTIONS,
  type TradingTier,
} from '../lib/tradingTier'

interface TierSelectProps {
  value: TradingTier
  onChange: (tier: TradingTier) => void
}

export function TierSelect({ value, onChange }: TierSelectProps) {
  return (
    <label className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-600">Tier</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as TradingTier)}
        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        aria-label="Trading tier"
      >
        {TRADING_TIER_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
