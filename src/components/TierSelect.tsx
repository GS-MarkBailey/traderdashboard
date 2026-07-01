import {
  TRADING_TIER_OPTIONS,
  type TradingTier,
} from '../lib/tradingTier'
import { FORM_LABEL_CLASS, FORM_SELECT_CLASS } from '../lib/tableTypography'

interface TierSelectProps {
  value: TradingTier
  onChange: (tier: TradingTier) => void
}

export function TierSelect({ value, onChange }: TierSelectProps) {
  return (
    <label className="flex items-center gap-2">
      <span className={FORM_LABEL_CLASS}>Tier</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as TradingTier)}
        className={FORM_SELECT_CLASS}
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
