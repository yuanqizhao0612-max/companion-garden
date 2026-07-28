<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { PhFlowerLotus, PhGearSix, PhMoonStars, PhSun, PhX } from '@phosphor-icons/vue'
import HomeView from './components/HomeView.vue'
import GameView from './components/GameView.vue'
import GardenView from './components/GardenView.vue'
import type { Page } from './types'
import { resetTrialData } from './composables/useGarden'

const page = ref<Page>('home')
const settingsOpen = ref(false)
const softMode = ref(localStorage.getItem('companion-garden-soft-mode') === 'true')
const pageTitle = computed(() => ({ home: '陪伴花园', game: '花朵对对碰', garden: '我的家庭小院' })[page.value])
const pageSubtitle = computed(() => ({ home: 'COMPANION GARDEN', game: 'FLOWER MATCH', garden: 'MY GARDEN' })[page.value])

function navigate(next: Page) {
  page.value = next
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

watch(softMode, (value) => localStorage.setItem('companion-garden-soft-mode', String(value)))
if (import.meta.env.DEV) Object.assign(window, { resetCompanionGarden: resetTrialData })
</script>

<template>
  <div class="app-shell" :class="{ 'soft-mode': softMode }">
    <a class="skip-link" href="#main">跳到主要内容</a>
    <header class="topbar">
      <div class="brand-lockup">
        <img src="/assets/flowers/cherry.png" alt="" />
        <div><p>{{ pageSubtitle }}</p><h1>{{ pageTitle }}</h1></div>
      </div>
      <button class="settings-button" aria-label="打开设置" @click="settingsOpen = true">
        <PhGearSix weight="fill" />
      </button>
    </header>

    <main id="main">
      <Transition name="page" mode="out-in">
        <HomeView v-if="page === 'home'" key="home" @start="navigate('game')" @garden="navigate('garden')" />
        <GameView v-else-if="page === 'game'" key="game" @home="navigate('home')" @garden="navigate('garden')" />
        <GardenView v-else key="garden" @play="navigate('game')" @home="navigate('home')" />
      </Transition>
    </main>

    <footer class="soft-footer">
      <PhFlowerLotus weight="duotone" /><span>不计时 · 无广告 · 慢慢玩</span>
    </footer>

    <div v-if="settingsOpen" class="modal-backdrop" @click.self="settingsOpen = false">
      <section class="settings-sheet" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <button class="sheet-close" aria-label="关闭设置" @click="settingsOpen = false"><PhX /></button>
        <p class="section-kicker">显示偏好</p>
        <h2 id="settings-title">设置</h2>
        <button class="setting-row" :aria-pressed="softMode" @click="softMode = !softMode">
          <span><component :is="softMode ? PhSun : PhMoonStars" weight="fill" /></span>
          <div><strong>{{ softMode ? '恢复明亮日间' : '开启柔和夜色' }}</strong><small>只改变屏幕明暗，不影响进度</small></div>
        </button>
      </section>
    </div>
  </div>
</template>
