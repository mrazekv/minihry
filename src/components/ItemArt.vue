<script setup lang="ts">
import sprite from '../assets/items.svg?url'
defineProps<{ id: string; label?: string }>()
</script>
<template><svg class="item-art" viewBox="0 0 160 160" :role="label ? 'img' : undefined" :aria-label="label" :aria-hidden="label ? undefined : true"><use :href="`${sprite}#${id}`" /></svg></template>
