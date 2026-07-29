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
  peach: { symbol: '✿', name: '樱花', color: '#e98791', image: publicAsset('assets/flowers/cherry.png') },
  daisy: { symbol: '❀', name: '向日葵', color: '#e2a52f', image: publicAsset('assets/flowers/sunflower.png') },
  leaf: { symbol: '◆', name: '紫郁金香', color: '#a169bf', image: publicAsset('assets/flowers/purple-tulip.png') },
  berry: { symbol: '●', name: '玫瑰', color: '#d84b64', image: publicAsset('assets/flowers/rose.png') },
  bell: { symbol: '♢', name: '珊瑚郁金香', color: '#e97d70', image: publicAsset('assets/flowers/coral-tulip.png') },
}

export const TILE_KINDS = Object.keys(TILE_META) as TileKind[]
