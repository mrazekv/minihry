<script setup lang="ts">
defineProps<{ title: string; description: string }>()
</script>
<template><div class="game-top"><RouterLink class="back-link" to="/">← Ke hrám</RouterLink><span class="calm-label">Vlastním tempem</span></div><header class="game-heading"><h1>{{ title }}</h1><p>{{ description }}</p></header></template>
