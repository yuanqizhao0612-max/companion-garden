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
  treeSeeds: number
  keepsakes: number
  dailyChallenge: {
    date: string | null
    progress: number
    target: number
    rewarded: boolean
  }
  pathStage: number
  playerAvatar: { styleId: string; position: string }
  familyMembers: Array<{ id: string; relation: string; styleId: string }>
}

export type TileKind = 'peach' | 'daisy' | 'leaf' | 'berry' | 'bell'

export type MissionKind = 'water' | 'bud' | 'vine' | 'seed' | 'special' | 'combo'

export type GardenMission = {
  kind: MissionKind
  label: string
  description: string
  target: number
  positions?: number[]
  hits?: number
}

export type Tile = {
  id: number
  kind: TileKind
  removing?: boolean
  special?: 'stripe-row' | 'stripe-column' | 'rainbow' | 'bouquet'
  obstacle?: 'stone'
  obstacleHits?: number
  cover?: number
  feature?: 'bud' | 'vine' | 'seed'
  featureHits?: number
}

export type LevelConfig = {
  level: number
  title: string
  description: string
  moves: number
  goals: Partial<Record<TileKind, number>>
  mission: GardenMission
  obstacles: number[]
  covers: number[]
  hint: string
}
