<script setup lang="ts">
defineProps<{ id: string }>()
</script>
<template>
  <svg viewBox="0 0 80 80" aria-hidden="true">
    <g stroke="#75694f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <g v-if="id==='advent' || id==='advent-sunday'">
        <ellipse cx="40" cy="59" rx="30" ry="12" fill="#8ba275" />
        <path d="M18 52V30h7v22m6 4V23h7v33m19-3V34h7v19" fill="#af8cb8" />
        <path d="M44 55V28h7v27" fill="#d9a1ac" />
        <path d="M22 25q-5-4 1-10 5 7-1 10Zm13-7q-5-4 1-10 5 7-1 10Zm13 5q-5-4 1-10 5 7-1 10Zm13 6q-5-4 1-10 5 7-1 10Z" fill="#e7bb63" stroke="#ba924d" />
      </g>
      <path v-else-if="id==='christmas' || id==='christmas-day' || id==='epiphany'" d="m40 8 8 22 23 2-18 15 6 24-19-14-19 14 6-24L9 32l23-2Z" fill="#e4c783" />
      <g v-else-if="id.startsWith('ordinary')"><path d="M38 70V16" fill="none" stroke="#789467" stroke-width="4"/><path d="M38 49Q9 50 13 27q24 0 25 22Zm1-13q0-25 25-24 2 22-25 24Zm0 25q3-23 29-18-3 22-29 18Z" fill="#93ad7d" /></g>
      <g v-else-if="id==='easter' || id==='easter-sunday'"><circle cx="40" cy="39" r="23" fill="#eed49a"/><path d="M40 7V2m24 13 4-4M8 39H2m70 0h6M15 15l-4-4" stroke="#c9a55f"/><path d="M40 21v37m-11-25h22" stroke="#aa8851" stroke-width="4"/><path d="M11 69q29-17 58 0" fill="#a1b58a"/></g>
      <g v-else><path d="M34 10h12v20h20v12H46v29H34V42H14V30h20Z" :fill="id==='triduum' || id==='good-friday' ? '#b77c6b' : '#aa8db4'" /></g>
    </g>
  </svg>
</template>
