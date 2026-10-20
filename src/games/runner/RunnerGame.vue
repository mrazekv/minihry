<script setup lang="ts">
import ChoiceButtons from '../../components/ChoiceButtons.vue'
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import { useRoundFocus } from '../../lib/focus'
import { collides, GROUND, JUMP_SPEED, PLAYER_HEIGHT, PLAYER_X, tickJump } from './physics'
import type { Obstacle } from './physics'
import GameHeader from '../../components/GameHeader.vue'
import ResultPanel from '../../components/ResultPanel.vue'
const phase = ref<'setup' | 'play' | 'done'>('setup')
const difficulty = ref(1)
const canvas = ref<HTMLCanvasElement | null>(null)
const paused = ref(false)
const lives = ref(3)
const progress = ref(0)
const jumps = ref(0)
const won = ref(false)
const message = ref('Klepni na Skok nebo stiskni mezerník.')
let y = GROUND - PLAYER_HEIGHT
let velocity = 0
let distance = 0
let spawnDistance = 550
let obstacles: Obstacle[] = []
let invincible = 0
let last = 0
let frame = 0
const finishDistance = 5800
const speed = computed(() => difficulty.value === 1 ? 170 : 230)
function jump() {
  if (phase.value !== 'play' || paused.value) return
  if (y >= GROUND - PLAYER_HEIGHT - 1) { velocity = JUMP_SPEED; jumps.value++ }
}
function key(event: KeyboardEvent) {
  if (phase.value !== 'play' || event.repeat) return
  const target = event.target as HTMLElement
  if (['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) return
  if (event.code === 'Space' || event.code === 'ArrowUp') {
    // Tlačítka už mají vlastní klávesovou aktivaci; nepřebíráme jim mezerník.
    if (event.code === 'Space' && target.closest('button, a')) return
    event.preventDefault(); jump()
  } else if (event.code === 'KeyP' || event.code === 'Escape') { event.preventDefault(); togglePause() }
}
function visibility() { if (document.hidden && phase.value === 'play') { paused.value = true; message.value = 'Hra je pozastavená.' } }
function togglePause() {
  paused.value = !paused.value; last = 0
  message.value = paused.value ? 'Hra je pozastavená. Pokračuj, až budeš chtít.' : 'Hop přes další kaluž!'
}
async function start() {
  cancelAnimationFrame(frame)
  lives.value = 3; progress.value = 0; jumps.value = 0; won.value = false; paused.value = false
  y = GROUND - PLAYER_HEIGHT; velocity = 0; distance = 0; spawnDistance = 550; obstacles = []; invincible = 0; last = 0
  message.value = 'Klepni na Skok nebo stiskni mezerník.'; phase.value = 'play'
  await nextTick(); frame = requestAnimationFrame(loop)
}
function finish(success: boolean) {
  won.value = success; phase.value = 'done'; cancelAnimationFrame(frame)
}
function loop(time: number) {
  if (phase.value !== 'play') return
  const dt = last ? Math.min((time - last) / 1000, .033) : 0
  last = time
  if (!paused.value) {
    const step = tickJump(y, velocity, dt); y = step.y; velocity = step.velocity
    distance += speed.value * dt; invincible = Math.max(0, invincible - dt)
    progress.value = Math.min(100, Math.floor(distance / finishDistance * 100))
    if (distance >= spawnDistance) { obstacles.push({ x: 750, width: difficulty.value === 1 ? 44 : 57, hit: false, passed: false }); spawnDistance += difficulty.value === 1 ? 410 : 390 }
    for (const obstacle of obstacles) {
      obstacle.x -= speed.value * dt
      if (!obstacle.hit && !invincible && collides(y, obstacle)) {
        obstacle.hit = true; lives.value--; invincible = 1.6
        message.value = lives.value ? `Šplouch! Zbývají ${lives.value} suché boty.` : 'Tentokrát byly kaluže rychlejší.'
        if (!lives.value) { finish(false); return }
      }
      if (!obstacle.passed && obstacle.x + obstacle.width < PLAYER_X) { obstacle.passed = true; if (!obstacle.hit) message.value = 'Pěkný skok! Pokračuj dál.' }
    }
    obstacles = obstacles.filter(obstacle => obstacle.x > -80)
    if (distance >= finishDistance) { finish(true); return }
  }
  draw()
  frame = requestAnimationFrame(loop)
}
function draw() {
  const ctx = canvas.value?.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, 720, 300)
  ctx.fillStyle = '#e3eddf'; ctx.fillRect(0, 0, 720, 300)
  ctx.fillStyle = '#ead396'; ctx.beginPath(); ctx.arc(601, 51, 24, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#c8d7ba'; ctx.beginPath(); ctx.moveTo(0, 210); ctx.quadraticCurveTo(170, 110, 355, 205); ctx.quadraticCurveTo(550, 125, 720, 196); ctx.lineTo(720, 250); ctx.lineTo(0, 250); ctx.fill()
  for (let i = 0; i < 5; i++) {
    const treeX = ((i * 203 - distance * .18) % 920 + 920) % 920 - 100
    ctx.fillStyle = '#8d9976'; ctx.fillRect(treeX - 3, 172, 6, 67)
    ctx.fillStyle = i % 2 ? '#9bb284' : '#a8bb90'; ctx.beginPath(); ctx.ellipse(treeX, 153, 25, 39, 0, 0, Math.PI * 2); ctx.fill()
  }
  ctx.fillStyle = '#ddc6a0'; ctx.fillRect(0, GROUND, 720, 58)
  ctx.strokeStyle = '#baa982'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, GROUND); ctx.lineTo(720, GROUND); ctx.stroke()
  ctx.fillStyle = '#c8b28c'
  for (let i = 0; i < 18; i++) { const stoneX = ((i * 47 - distance) % 810 + 810) % 810 - 35; ctx.fillRect(stoneX, GROUND + 19 + (i % 3) * 8, 11, 2) }
  for (const obstacle of obstacles) {
    ctx.fillStyle = '#7eafb4'; ctx.beginPath(); ctx.ellipse(obstacle.x + obstacle.width / 2, GROUND + 2, obstacle.width / 2, 6, 0, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = '#d4eef0'; ctx.beginPath(); ctx.moveTo(obstacle.x + 8, GROUND + 1); ctx.lineTo(obstacle.x + obstacle.width - 8, GROUND + 1); ctx.stroke()
  }
  if (progress.value > 80) {
    const churchX = 650 - (progress.value - 80) * 28
    ctx.fillStyle = '#f7e5c4'; ctx.fillRect(churchX, 138, 70, 103)
    ctx.fillStyle = '#ae6248'; ctx.beginPath(); ctx.moveTo(churchX - 7, 140); ctx.lineTo(churchX + 35, 101); ctx.lineTo(churchX + 77, 140); ctx.fill()
    ctx.strokeStyle = '#766648'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(churchX + 35, 85); ctx.lineTo(churchX + 35, 107); ctx.moveTo(churchX + 28, 92); ctx.lineTo(churchX + 42, 92); ctx.stroke()
    ctx.fillStyle = '#9a7654'; ctx.fillRect(churchX + 25, 205, 20, 36)
  }
  ctx.save(); if (invincible) ctx.globalAlpha = .55
  const px = PLAYER_X + 14
  ctx.strokeStyle = '#424339'; ctx.lineWidth = 4; ctx.lineCap = 'round'
  ctx.beginPath(); ctx.moveTo(px - 6, y + 45); ctx.lineTo(px - 9, y + 51); ctx.moveTo(px + 6, y + 45); ctx.lineTo(px + 9, y + 51); ctx.stroke()
  ctx.fillStyle = '#252525'; ctx.beginPath(); ctx.moveTo(px - 9, y + 20); ctx.lineTo(px - 17, y + 46); ctx.lineTo(px + 17, y + 46); ctx.lineTo(px + 9, y + 20); ctx.fill()
  ctx.strokeStyle = '#c89e79'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(px - 9, y + 23); ctx.lineTo(px - 24, y + 36); ctx.moveTo(px + 9, y + 23); ctx.lineTo(px + 23, y + 31); ctx.stroke()
  // Široké bílé rukávy překrývají paže; ven vyčnívají jen ruce.
  ctx.fillStyle = '#fffaed'
  ctx.beginPath(); ctx.moveTo(px - 9, y + 19); ctx.lineTo(px - 16, y + 23); ctx.lineTo(px - 21, y + 30); ctx.lineTo(px - 14, y + 35); ctx.lineTo(px - 7, y + 27); ctx.closePath(); ctx.fill()
  ctx.beginPath(); ctx.moveTo(px + 9, y + 19); ctx.lineTo(px + 16, y + 22); ctx.lineTo(px + 20, y + 27); ctx.lineTo(px + 15, y + 33); ctx.lineTo(px + 7, y + 27); ctx.closePath(); ctx.fill()
  ctx.strokeStyle = '#c5bdab'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(px - 20, y + 30); ctx.lineTo(px - 14, y + 34); ctx.moveTo(px + 19, y + 27); ctx.lineTo(px + 15, y + 32); ctx.stroke()
  ctx.fillStyle = '#fffaed'; ctx.beginPath(); ctx.moveTo(px - 10, y + 19); ctx.lineTo(px - 13, y + 35); ctx.quadraticCurveTo(px, y + 39, px + 13, y + 35); ctx.lineTo(px + 10, y + 19); ctx.fill()
  ctx.fillStyle = '#252525'; ctx.beginPath(); ctx.ellipse(px, y + 20, 9, 4, 0, 0, Math.PI); ctx.fill()
  ctx.fillStyle = '#e6bd95'; ctx.beginPath(); ctx.ellipse(px, y + 9, 10, 12, 0, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#785b43'; ctx.beginPath(); ctx.arc(px, y + 5, 11, Math.PI, Math.PI * 2); ctx.lineTo(px + 10, y + 7); ctx.lineTo(px + 4, y + 2); ctx.lineTo(px - 3, y + 5); ctx.lineTo(px - 10, y + 4); ctx.fill(); ctx.restore()
  if (paused.value) { ctx.fillStyle = '#f8f5eee8'; ctx.fillRect(0, 0, 720, 300); ctx.fillStyle = '#315f4e'; ctx.font = '26px system-ui'; ctx.textAlign = 'center'; ctx.fillText('Chvilka na oddech', 360, 158) }
}
document.addEventListener('keydown', key)
document.addEventListener('visibilitychange', visibility)
onBeforeUnmount(() => { cancelAnimationFrame(frame); document.removeEventListener('keydown', key); document.removeEventListener('visibilitychange', visibility) })
useRoundFocus(phase)
</script>
<template><div class="game-page runner-page"><GameHeader title="Cesta ke kostelu" description="Přeskoč kaluže a dojdi se suchýma botama až ke kostelu." /><form v-if="phase === 'setup'" class="setup-panel" @submit.prevent="start"><div class="setup-symbol blue" aria-hidden="true">↗</div><h2>Hurá na cestu!</h2><ChoiceButtons id="difficulty" v-model="difficulty" label="Rychlost" :options="[{ value: 1, label: 'Klidná procházka' }, { value: 2, label: 'Svižnější cesta' }]" /><p class="muted">Skákej klepnutím na tlačítko, mezerníkem nebo šipkou nahoru. Máš 3 pokusy. Tlačítkem nebo klávesou P hru pozastavíš.</p><button class="primary" type="submit">Začít hrát <span aria-hidden="true">→</span></button></form><template v-else-if="phase === 'play'"><div class="round-stats"><span>Cesta <strong>{{ progress }} %</strong></span><span :aria-label="`Zbývající pokusy: ${lives}`">Suché boty <strong>{{ lives }} / 3</strong></span><button class="secondary pause-button" @click="togglePause">{{ paused ? 'Pokračovat' : 'Pozastavit' }}</button></div><p class="runner-instruction instruction">Přeskoč kaluž, než k ní doběhneš.</p><canvas ref="canvas" class="runner-canvas" width="720" height="300" role="img" aria-label="Ministrant běží zleva doprava. Skákej před modrými kalužemi; cestu a pokusy najdeš nad hrou." @pointerdown.prevent="jump">Skákací hra potřebuje prohlížeč s podporou Canvas.</canvas><div class="runner-controls"><button class="primary jump-button" :disabled="paused" @click="jump">Skok <span aria-hidden="true">↑</span></button><span>Mezerník / ↑ / klepnutí</span></div><p class="game-message" role="status">{{ message }}</p></template><ResultPanel v-else :title="won ? 'Jsi u kostela!' : 'Každý skok je trénink.'" :message="won ? `Zvládl jsi celou cestu a ${jumps} skoků. Pěkná práce!` : `Došel jsi ${progress} % cesty. Zkus to znovu, nebo si vyber jinou hru.`" @again="start" @settings="phase = 'setup'" /></div></template>
