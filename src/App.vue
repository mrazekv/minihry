<script setup lang="ts">
import { computed, nextTick, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { games } from './content-catalog'
import { preferences } from './storage/preferences'
import { applyUpdate, offlineReady, registerOffline, updateReady } from './lib/offline'
const route = useRoute()
const logo = `${import.meta.env.BASE_URL}ministranti-brno.jpg`
const isGame = computed(() => games.some(game => game.path === route.path))
watch(() => preferences.value.largeText, value => {
  document.documentElement.classList.toggle('large-text', value)
}, { immediate: true })
watch(() => route.fullPath, async () => {
  const title = games.find(game => game.path === route.path)?.title || (route.path === '/slovnicek' ? 'Slovníček' : route.path === '/o-aplikaci' ? 'O aplikaci' : '')
  document.title = title ? `${title} · miniHry` : 'miniHry — Malé hry pro ministranty'
  await nextTick()
  const heading = document.querySelector<HTMLElement>('main h1')
  if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }) }
})
function skipToContent() {
  const main = document.getElementById('main-content')
  main?.focus(); main?.scrollIntoView({ block: 'start' })
}
onMounted(registerOffline)
</script>
<template><div class="app-shell" :class="{ 'reduce-motion': preferences.reducedMotion }"><a class="skip-link" href="#main-content" @click.prevent="skipToContent">Přejít na obsah</a><header class="app-header"><RouterLink class="brand" to="/" aria-label="miniHry — úvod"><span class="diocese-logo"><img :src="logo" alt="Ministranti brněnské diecéze" width="537" height="372"></span><span class="brand-title"><span class="brand-name">miniHry</span><span class="brand-subtitle">Malé hry pro ministranty</span></span></RouterLink><nav class="app-nav" aria-label="Hlavní navigace"><RouterLink to="/" :class="{ active: route.path === '/' }">Hry</RouterLink><RouterLink class="book-link" to="/slovnicek"><svg viewBox="0 0 24 24" class="icon" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M12 6C9 3 5 3 2 4v15c4-1 7-1 10 2 3-3 6-3 10-2V4c-3-1-7-1-10 2v15"/><path d="M5 8h3m-3 3h3m8-3h3m-3 3h3"/></svg><span>Slovníček</span></RouterLink></nav></header><main id="main-content" class="main" tabindex="-1"><RouterView :key="route.path" /></main><aside v-if="updateReady" class="update-banner" aria-label="Aktualizace aplikace"><p>Je připravená nová verze.{{ isGame ? ' Aktualizovat můžeš po návratu k nabídce her.' : '' }}</p><button v-if="!isGame" class="secondary" @click="applyUpdate">Aktualizovat</button></aside><footer class="app-footer"><RouterLink to="/o-aplikaci">O aplikaci a nastavení</RouterLink><span class="footer-detail"><i class="footer-dot" aria-hidden="true"></i>{{ offlineReady ? 'Připraveno na hraní offline' : 'Bez reklam · Bez účtu' }}</span></footer></div></template>
