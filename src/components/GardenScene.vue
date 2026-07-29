<script setup lang="ts">
import { computed } from 'vue'
import { publicAsset } from '../data'
import type { GardenState } from '../types'

const props = defineProps<{ state: GardenState; compact?: boolean; previewStage?: number }>()
const stage = computed(() => props.previewStage ?? props.state.gardenLevel)
const scene = publicAsset('assets/scenes/garden-stage-hero-v4.webp')
</script>

<template>
  <figure class="story-garden" :class="{ compact }" :data-stage="stage" aria-label="正在成长的家庭小院">
    <img :src="scene" alt="有房屋、树木、花朵、小路和人物的家庭小院" />
  </figure>
</template>

<style scoped>
.story-garden { position: relative; width: 100%; aspect-ratio: 4 / 5; margin: 0; overflow: hidden; border-radius: 24px; background: #eef0e1; }
.story-garden img { display: block; width: 100%; height: 100%; object-fit: cover; }
.story-garden.compact { aspect-ratio: 355 / 265; }
.story-garden.compact img { object-position: center 56%; }
</style>
