import type { TileKind } from './types'
export { LEVELS, getLevelConfig } from './levels'

export const publicAsset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`

export const getBloomStage = (level: number) => Math.min(5, Math.max(1, Math.ceil(level / 6)))

export const getBloomFlower = (level: number) =>
  publicAsset(`assets/growth/bloom-${getBloomStage(level)}-v4.png`)

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
  peach: { symbol: '✿', name: '玫瑰', color: '#f23573', image: publicAsset('assets/flowers/rose-jelly-v3.png') },
  daisy: { symbol: '☀', name: '向日葵', color: '#f2b632', image: publicAsset('assets/flowers/sunflower.png') },
  leaf: { symbol: '♠', name: '郁金香', color: '#a449d0', image: publicAsset('assets/flowers/tulip-jelly-v3.png') },
  berry: { symbol: '✣', name: '樱花', color: '#f09db2', image: publicAsset('assets/flowers/cherry.png') },
  bell: { symbol: '●', name: '雏菊', color: '#f3d568', image: publicAsset('assets/flowers/daisy.png') },
}

export const TILE_KINDS = Object.keys(TILE_META) as TileKind[]
