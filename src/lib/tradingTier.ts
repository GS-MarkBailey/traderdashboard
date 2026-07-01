import type { MainMarketSectionId } from '../types/trading'

export type TradingTier = 'tier1' | 'tier2' | 'tier3'

export const TRADING_TIER_OPTIONS: { value: TradingTier; label: string }[] = [
  { value: 'tier1', label: 'Tier 1' },
  { value: 'tier2', label: 'Tier 2' },
  { value: 'tier3', label: 'Tier 3 & 4' },
]

const TIER_MAIN_SECTIONS: Record<TradingTier, MainMarketSectionId[]> = {
  tier1: ['goals', 'corners', 'cards', 'shotsOnTarget', 'shots'],
  tier2: ['goals', 'corners', 'cards'],
  tier3: ['goals'],
}

export function getMainSectionsForTier(tier: TradingTier): MainMarketSectionId[] {
  return TIER_MAIN_SECTIONS[tier]
}

export function isMainSectionVisibleForTier(
  tier: TradingTier,
  sectionId: MainMarketSectionId,
): boolean {
  return TIER_MAIN_SECTIONS[tier].includes(sectionId)
}

export function shouldShowPlayerMarketsForTier(tier: TradingTier): boolean {
  return tier === 'tier1'
}
