<script setup lang="ts">
import { computed, ref } from 'vue'
import { items } from '../content/items'
import ItemArt from '../components/ItemArt.vue'
const query = ref('')
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('cs')
const filtered = computed(() => items.filter(item => normalize(item.name).includes(normalize(query.value.trim()))))
</script>
<template><div><RouterLink class="back-link" to="/">← Ke hrám</RouterLink><header class="page-heading"><p class="eyebrow">Obrázkový slovníček</p><h1>Věci ze sakristie</h1><p>Prohlédni si je v klidu. Stejné obrázky potkáš i ve hrách.</p></header><div class="search-row"><label for="item-search">Najít předmět</label><input id="item-search" v-model="query" type="search" placeholder="Třeba kalich…" autocomplete="off"><span role="status">{{ filtered.length }} z {{ items.length }} předmětů</span></div><div class="specimens"><article v-for="item in filtered" :key="item.id" class="specimen"><div class="specimen-art"><ItemArt :id="item.id" /></div><h2>{{ item.name }}</h2><p>{{ item.description }}</p><p v-if="item.note"><strong>Věděl jsi?</strong> {{ item.note }}</p></article></div><p v-if="!filtered.length" class="empty-state">Takový předmět tu zatím není. Zkus kratší název.</p></div></template>
