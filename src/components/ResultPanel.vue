<script setup lang="ts">
defineProps<{ title?: string; message: string }>()
defineEmits<{ again: []; settings: [] }>()
</script>
<template><section class="result-panel" data-testid="result" aria-labelledby="result-title"><span class="result-sun" aria-hidden="true">✦</span><p class="eyebrow">Kolo dokončeno</p><h2 id="result-title" tabindex="-1">{{ title || 'Pěkná práce!' }}</h2><p>{{ message }}</p><div class="button-row"><button class="primary" @click="$emit('again')">Hrát znovu <span aria-hidden="true">↻</span></button><button class="secondary" @click="$emit('settings')">Změnit nastavení</button></div><RouterLink class="text-link" to="/">Vybrat jinou hru →</RouterLink></section></template>
