<script setup lang="ts">
import ItemArt from './ItemArt.vue'
defineProps<{ id: string; name: string; selected?: boolean; disabled?: boolean; transferable?: boolean; hideName?: boolean }>()
defineEmits<{ choose: [event: MouseEvent]; drag: [event: PointerEvent] }>()
</script>
<template>
  <div class="practice-item" :class="{ selected }" :data-item-id="id">
    <button type="button" class="practice-item-choice" :class="{ 'direct-transfer': transferable }" :disabled="disabled" :aria-label="hideName ? name : undefined" :aria-pressed="selected" @pointerdown="transferable && $emit('drag', $event)" @click="$emit('choose', $event)">
      <ItemArt :id="id" /><span v-if="!hideName">{{ name }}</span><span v-if="selected" class="practice-tick" aria-hidden="true">✓</span>
    </button>
  </div>
</template>
