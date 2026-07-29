import { describe, expect, it } from 'vitest'
import { classifyMatchFeedback } from './feedback'

describe('game feel feedback tiers', () => {
  it('keeps a three-match gentle', () => {
    expect(classifyMatchFeedback(3, 1)).toMatchObject({ tier: 'three', text: '开花啦' })
  })

  it('makes four and five matches progressively stronger', () => {
    expect(classifyMatchFeedback(4, 1).tier).toBe('four')
    expect(classifyMatchFeedback(5, 1)).toMatchObject({ tier: 'five', text: '真棒！' })
  })

  it('prioritizes combo rhythm after the first cascade', () => {
    expect(classifyMatchFeedback(3, 3)).toMatchObject({ tier: 'combo', chain: 3 })
  })
})
