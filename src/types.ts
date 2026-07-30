export type Page = 'home' | 'game' | 'garden'

export type GardenState = {
  currentLevel: number
  highestLevel: number
  completedRounds: number
  attemptedRounds: number
  flowerCount: number
  streakDays: number
  lastPlayedDate: string | null
  gardenLevel: number
  houseStage: number
  treeStages: Record<string, number>
  flowerItems: Array<{ id: string; type: TileKind; earnedAt: string }>
  sunlight: number
  waterDrops: number
  pendingCare: number
  activePlantStage: 0 | 1 | 2 | 3
  pathStage: number
  playerAvatar: { styleId: string; position: string }
  familyMembers: Array<{ id: string; relation: string; styleId: string }>
}

export type TileKind = 'peach' | 'daisy' | 'leaf' | 'berry' | 'bell'

export type Tile = {
  id: number
  kind: TileKind
  removing?: boolean
  special?: 'stripe-row' | 'stripe-column' | 'rainbow' | 'bouquet'
  obstacle?: 'stone'
  obstacleHits?: number
  cover?: number
}

export type LevelConfig = {
  level: number
  title: string
  description: string
  moves: number
  goals: Partial<Record<TileKind, number>>
  obstacles: number[]
  covers: number[]
  hint: string
}
