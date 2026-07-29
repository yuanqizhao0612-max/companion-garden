import { describe, expect, it } from 'vitest'
import { getBloomStage } from './data'

describe('陪伴花成长阶段', () => {
  it('每六关进入下一个阶段，并在第五阶段封顶', () => {
    expect(getBloomStage(1)).toBe(1)
    expect(getBloomStage(6)).toBe(1)
    expect(getBloomStage(7)).toBe(2)
    expect(getBloomStage(24)).toBe(4)
    expect(getBloomStage(25)).toBe(5)
    expect(getBloomStage(99)).toBe(5)
  })
})
