import type { LevelConfig } from './types'

const level = (
  level: number,
  title: string,
  description: string,
  moves: number,
  goals: LevelConfig['goals'],
  obstacles: number[] = [],
  covers: number[] = [],
  hint = '先看看棋盘，再决定第一步',
): LevelConfig => ({ level, title, description, moves, goals, obstacles, covers: [], hint })

export const LEVELS: LevelConfig[] = [
  level(1, '认识花朵', '收集桃花与雏菊，完成第一束花', 24, { peach: 15, daisy: 12 }, [], [], '试着让三朵相同的花连成一线'),
  level(2, '两种心意', '同时照顾两种花，留意下一步', 25, { leaf: 18, bell: 15 }, [], [14, 21], '先从数量最多的花开始'),
  level(3, '清晨花圃', '观察花朵分布，再收集目标花', 25, { peach: 20, berry: 16 }, [], [8, 9, 14, 15], '先找容易连成一线的目标花'),
  level(4, '石径初现', '绕开石块，规划一到两步', 27, { daisy: 23, leaf: 18 }, [14, 15], [], '在石块旁消除，就能松动石块'),
  level(5, '花间小路', '清理石块，为花朵让出空间', 28, { peach: 25, bell: 21 }, [8, 14, 20, 26], [], '四连会留下能清整行或整列的条纹花'),
  level(6, '双树之间', '兼顾目标与障碍清理顺序', 29, { berry: 27, daisy: 23 }, [13, 16, 19, 22], [8, 27], '先打开中央通路，再制造连锁'),
  level(7, '晚风花束', '寻找花束，清理局部拥挤', 30, { bell: 30, leaf: 25 }, [7, 10, 25, 28], [14, 15, 20, 21], 'T 形或 L 形会生成范围花束'),
  level(8, '彩虹来信', '主动规划五连，收集大量桃花', 31, { peach: 36, berry: 28 }, [14, 21], [8, 9, 26, 27], '五连会生成彩虹花，可清除一种花'),
  level(9, '门前花径', '在受限空间中寻找关键移动', 32, { daisy: 40, bell: 30 }, [8, 9, 14, 15, 20, 21], [], '先处理中央石块，再寻找连锁'),
  level(10, '小院庆典', '组合特殊花，完成第一段旅程', 33, { peach: 32, leaf: 32, berry: 24 }, [7, 10, 25, 28], [14, 15, 20, 21], '组合特殊花，比随机尝试更有效'),
]

for (let n = 11; n <= 30; n += 1) {
  const kinds = ['peach', 'daisy', 'leaf', 'berry', 'bell'] as const
  const a = kinds[(n - 1) % kinds.length]
  const b = kinds[(n + 1) % kinds.length]
  LEVELS.push(level(
    n,
    `花园日记 · ${n}`,
    '组合目标、障碍与特殊花，稳稳走好每一步',
    33 + Math.floor((n - 10) / 4),
    { [a]: 34 + n, [b]: 25 + n },
    n % 2 ? [8, 14, 21, 27] : [7, 10, 25, 28],
    n % 3 === 0 ? [14, 15, 20, 21] : [],
    '先观察目标花最集中的区域',
  ))
}

export function getLevelConfig(levelNumber: number) {
  return LEVELS.find(({ level }) => level === levelNumber) ?? LEVELS[LEVELS.length - 1]
}
