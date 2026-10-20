<script setup lang="ts" generic="T extends string | number">
const model = defineModel<T>({ required: true })
defineProps<{ id: string; label: string; options: readonly { value: T; label: string; description?: string }[] }>()
</script>
<template>
  <fieldset :id="id" class="choice-field">
    <legend>{{ label }}</legend>
    <div class="choice-buttons">
      <button v-for="option in options" :key="option.value" type="button" class="choice-button" :class="{ selected: model === option.value }" :data-value="option.value" :aria-pressed="model === option.value" @click="model = option.value">
        <span><strong>{{ option.label }}</strong><small v-if="option.description">{{ option.description }}</small></span>
        <span class="choice-check" aria-hidden="true">{{ model === option.value ? '✓' : '' }}</span>
      </button>
    </div>
  </fieldset>
</template>
