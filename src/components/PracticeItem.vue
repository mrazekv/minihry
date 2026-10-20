<script setup lang="ts">
import ItemArt from './ItemArt.vue'
defineProps<{ id: string; name: string; selected?: boolean; disabled?: boolean; transferable?: boolean; hideName?: boolean }>()
defineEmits<{ choose: []; drag: [event: PointerEvent]; handle: [] }>()
</script>
<template>
  <div class="practice-item" :class="{ selected }" :data-item-id="id">
    <button type="button" class="practice-item-choice" :disabled="disabled" :aria-label="hideName ? name : undefined" :aria-pressed="selected" @click="$emit('choose')">
      <ItemArt :id="id" /><span v-if="!hideName">{{ name }}</span><span v-if="selected" class="practice-tick" aria-hidden="true">✓</span>
    </button>
    <button v-if="transferable" type="button" class="transfer-handle" :disabled="disabled" :aria-label="`Přetáhnout nebo vybrat: ${name}`" @pointerdown="$emit('drag', $event)" @click="$emit('handle')"><span aria-hidden="true">⠿</span></button>
  </div>
</template>
