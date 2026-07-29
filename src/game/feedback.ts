export type FeedbackTier = 'three' | 'four' | 'five' | 'combo'

export type MatchFeedback = {
  id: number
  chain: number
  matchSize: number
  tier: FeedbackTier
  text: string
}

export function classifyMatchFeedback(matchSize: number, chain: number): Omit<MatchFeedback, 'id'> {
  if (chain >= 2) {
    return {
      chain,
      matchSize,
      tier: 'combo',
      text: chain >= 4 ? '这一串真漂亮！' : `连开 ${chain} 次，好手气！`,
    }
  }
  if (matchSize >= 5) return { chain, matchSize, tier: 'five', text: '真棒！' }
  if (matchSize === 4) return { chain, matchSize, tier: 'four', text: '这一手真好！' }
  return { chain, matchSize, tier: 'three', text: '开花啦' }
}
