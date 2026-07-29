import type { TileKind } from './types'
export { LEVELS, getLevelConfig } from './levels'

export const publicAsset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`

export const WARM_WORDS = [
  '今天也辛苦啦',
  '慢慢来，就很好',
  '看到你来，真开心',
  '愿今天有个好心情',
  '休息一下，喝口水吧',
  '你认真玩的样子真好',
  '花园又热闹了一点',
  '别着急，一步一步来',
]

export const TILE_META: Record<TileKind, { symbol: string; name: string; color: string; image: string }> = {
  peach: { symbol: '✿', name: '玫瑰', color: '#e54f6d', image: publicAsset('assets/flowers/rose-v2.svg') },
  daisy: { symbol: '☀', name: '向日葵', color: '#e8a91f', image: publicAsset('assets/flowers/sunflower-v2.svg') },
  leaf: { symbol: '♠', name: '郁金香', color: '#9a55bd', image: publicAsset('assets/flowers/tulip-v2.svg') },
  berry: { symbol: '✣', name: '雏菊', color: '#d7d4c8', image: publicAsset('assets/flowers/daisy-v2.svg') },
  bell: { symbol: '●', name: '绣球', color: '#4b9fc7', image: publicAsset('assets/flowers/hydrangea-v2.svg') },
}

export const TILE_KINDS = Object.keys(TILE_META) as TileKind[]
