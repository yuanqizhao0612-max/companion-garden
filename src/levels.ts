import type { GardenMission, LevelConfig } from './types'

const level = (
  level: number,
  title: string,
  description: string,
  moves: number,
  goals: LevelConfig['goals'],
  mission: GardenMission,
  obstacles: number[] = [],
  covers: number[] = [],
  hint = '先看看棋盘，再决定第一步',
): LevelConfig => ({ level, title, description, moves, goals, mission, obstacles: [], covers: [], hint })

export const LEVELS: LevelConfig[] = [
  level(1, '装满第一壶水', '收集玫瑰与向日葵，为小院带回清晨的水', 24, { peach: 15, daisy: 12 }, { kind: 'water', label: '装满水壶', description: '完成 3 次有效消除', target: 3 }, [], [], '试着让三朵相同的花连成一线'),
  level(2, '唤醒小花苞', '在花苞旁边完成消除，帮它们慢慢打开', 26, { leaf: 16, bell: 14 }, { kind: 'bud', label: '打开花苞', description: '在花苞旁边消除', target: 2, positions: [14, 21] }, [], [], '花苞不用移动，在它旁边消除一次就会开放'),
  level(3, '寻找树的种子', '清除带种子标记的花，把树种带回小院', 26, { peach: 18, berry: 15 }, { kind: 'seed', label: '找到树种', description: '消除带树种标记的花', target: 2, positions: [8, 27] }, [], [], '先留意带小树标记的两朵花'),
  level(4, '松开门前藤蔓', '藤蔓需要附近的花朵帮助，先从周围布局', 28, { daisy: 21, leaf: 17 }, { kind: 'vine', label: '清理藤蔓', description: '在藤蔓旁边消除两次', target: 2, positions: [14, 15], hits: 2 }, [], [], '藤蔓会暂时固定花朵，在旁边消除两次即可松开'),
  level(5, '铺好花间小路', '组合四连或五连，留下能帮助小院的特别花', 29, { peach: 23, bell: 19 }, { kind: 'special', label: '培育特别花', description: '创造 1 朵特殊花', target: 1 }, [], [], '四连会留下方向花，五连会留下彩虹花'),
  level(6, '让花香接力', '为下一次掉落留出位置，完成一次连续消除', 30, { berry: 25, daisy: 21 }, { kind: 'combo', label: '完成花香接力', description: '触发 1 次连续消除', target: 1 }, [], [], '先看消除后的落点，给下一组花留好位置'),
  level(7, '晚风里的花苞', '同时照顾目标花和三枚等待开放的花苞', 31, { bell: 27, leaf: 23 }, { kind: 'bud', label: '打开晚风花苞', description: '在花苞旁边完成消除', target: 3, positions: [7, 10, 25] }, [], [], '先从花苞周围寻找可以连成一线的目标花'),
  level(8, '彩虹送来好消息', '主动规划四连与五连，让特别花彼此帮助', 32, { peach: 32, berry: 25 }, { kind: 'special', label: '培育特别花', description: '创造 2 朵特殊花', target: 2 }, [], [], '五连会生成彩虹花，可以清除同一种花'),
  level(9, '整理门前老藤', '老藤需要两次照顾，先安排周围的落花位置', 34, { daisy: 34, bell: 26 }, { kind: 'vine', label: '整理老藤', description: '逐步松开 3 处藤蔓', target: 3, positions: [8, 14, 20], hits: 2 }, [], [], '不要急着随机交换，先观察藤蔓两侧'),
  level(10, '为小院种下一棵树', '找到三颗树种，完成第一段花园旅程', 34, { peach: 30, leaf: 30, berry: 22 }, { kind: 'seed', label: '收集树种', description: '清除 3 朵带树种的花', target: 3, positions: [7, 16, 28] }, [], [], '先找到树种，再用特别花帮助完成收集'),
]

for (let n = 11; n <= 30; n += 1) {
  const kinds = ['peach', 'daisy', 'leaf', 'berry', 'bell'] as const
  const a = kinds[(n - 1) % kinds.length]
  const b = kinds[(n + 1) % kinds.length]
  const missionCycle: GardenMission[] = [
    { kind: 'water', label: '为小院蓄水', description: '完成 5 次有效消除', target: 5 },
    { kind: 'bud', label: '打开花苞', description: '在花苞旁边完成消除', target: 3, positions: [8, 20, 27] },
    { kind: 'seed', label: '寻找树种', description: '消除带树种标记的花', target: 3, positions: [7, 16, 28] },
    { kind: 'vine', label: '清理藤蔓', description: '逐步松开藤蔓', target: 3, positions: [8, 14, 21], hits: 2 },
    { kind: 'special', label: '培育特别花', description: '创造 2 朵特殊花', target: 2 },
    { kind: 'combo', label: '完成花香接力', description: '触发 2 次连续消除', target: 2 },
  ]
  LEVELS.push(level(
    n,
    `花园日记 · ${n}`,
    '组合目标与特别花，稳稳走好每一步',
    33 + Math.floor((n - 10) / 4),
    { [a]: 34 + n, [b]: 25 + n },
    missionCycle[(n - 11) % missionCycle.length],
    [],
    [],
    '先观察目标花最集中的区域',
  ))
}

export function getLevelConfig(levelNumber: number) {
  return LEVELS.find(({ level }) => level === levelNumber) ?? LEVELS[LEVELS.length - 1]
}
