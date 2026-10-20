<script setup lang="ts">
import { games } from '../content-catalog'
import gameArt from '../assets/game-art.svg?url'
</script>
<template><div class="home"><h1 class="home-motto">Co patří na oltář? A co následuje po adventu? Zahrej si o tom s námi hry</h1><div class="games-grid"><RouterLink v-for="game in games" :key="game.path" class="game-card" :to="game.path"><div class="card-art" :class="game.color"><svg viewBox="0 0 220 130" aria-hidden="true"><use :href="`${gameArt}#${game.art}`" /></svg></div><div class="card-body"><h2>{{ game.title }}</h2><p>{{ game.description }}</p><div class="card-bottom"><span>{{ game.note }}</span><span class="arrow" aria-hidden="true">↗</span></div></div></RouterLink></div><RouterLink class="learn-strip" to="/slovnicek"><span class="book-mark" aria-hidden="true">▤</span><strong>Obrázkový slovníček</strong><span class="learn-link">Prohlédnout předměty ↗</span></RouterLink></div></template>
