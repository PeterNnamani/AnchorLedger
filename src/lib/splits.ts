import type { AccountId, SplitOption } from '../types'

export const SPLIT_OPTIONS: SplitOption[] = [
  {
    id: 'growth-first',
    name: 'Growth-First',
    description: 'Prioritise long-term savings and a strong emergency buffer.',
    percentages: { growth: 55, safety: 25, daily: 20 },
  },
  {
    id: 'balanced-life',
    name: 'Balanced Life',
    description: 'Comfortable daily spending while still building reserves.',
    percentages: { growth: 40, safety: 15, daily: 45 },
  },
]

export function calculateAllocations(
  amount: number,
  percentages: Record<AccountId, number>,
): Record<AccountId, number> {
  const growth = Math.round((amount * percentages.growth) / 100)
  const safety = Math.round((amount * percentages.safety) / 100)
  const daily = amount - growth - safety
  return { growth, safety, daily }
}
