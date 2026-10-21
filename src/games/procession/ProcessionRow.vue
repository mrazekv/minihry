<script setup lang="ts">
import { useId } from 'vue'
const serverId = useId()
defineProps<{ id: string }>()
</script>
<template>
  <svg viewBox="0 0 150 90" aria-hidden="true">
    <defs><g :id="serverId">
      <ellipse cx="0" cy="31" rx="13" ry="3" fill="#6b705733"/>
      <path d="m-6 23-2 8m14-8 2 8" stroke="#34352f" stroke-width="4" stroke-linecap="round"/>
      <path d="m-8-9-6 35h28L8-9Z" fill="#292b29" stroke="#5b5b50"/>
      <path d="m-8-7-11 7 5 15 8-4m14-18 11 7-5 15-8-4" fill="#fff8e8" stroke="#c7c3ad"/>
      <path d="m-8-8-3 24q11 6 22 0L8-8Z" fill="#fff8e8" stroke="#c7c3ad"/>
      <path d="m-8-8 8 8 8-8" fill="#292b29"/>
      <path d="m-13 12 6-3m20 3-6-3" stroke="#d5ad88" stroke-width="4" stroke-linecap="round"/>
      <ellipse cy="-17" rx="10" ry="12" fill="#e6bd95" stroke="#9e7b5e"/>
      <path d="M-10-18q-3-18 14-12 8 2 6 14l-7-8-13 6Z" fill="#745c43"/>
      <circle cx="-3" cy="-16" r=".9" fill="#514b40"/><circle cx="4" cy="-16" r=".9" fill="#514b40"/>
      <path d="M-2-10q3 2 5-1" fill="none" stroke="#a4795a"/>
    </g></defs>
    <g v-if="id==='priest'" transform="translate(75 46)">
      <use :href="`#${serverId}`"/>
      <path d="m-8 0-9 28q17 5 34 0L8 0Z" fill="#fff8e8" stroke="#c7c3ad"/>
      <path d="m-9-7-14 29q23 15 46 0L9-7 0-2Z" fill="#91aa7a" stroke="#5c7755"/>
      <path d="M-2-1v30h4V-1m-9 9H9" stroke="#e4cb8e" stroke-width="2"/>
    </g>
    <template v-else>
      <g v-for="x in id==='cross'?[30,75,120]:[50,100]" :key="x" :transform="`translate(${x} 46)`"><use :href="`#${serverId}`"/></g>
      <g v-if="id==='cross'" stroke-linecap="round">
        <path d="M75 10v62M64 22h22" stroke="#a5824f" stroke-width="4"/><path d="M75 11v59M65 22h20" stroke="#e6cc8e" stroke-width="1"/>
        <g v-for="x in [30,120]" :key="x"><path :d="`M${x} 28v41`" stroke="#ad8b57" stroke-width="3"/><path :d="`M${x-6} 68h12`" stroke="#ad8b57" stroke-width="2"/><rect :x="x-3" y="17" width="6" height="18" rx="1" fill="#fff3d2" stroke="#b7a783"/><path :d="`M${x} 7q-6 8 0 10 6-2 0-10Z`" fill="#deab54"/></g>
      </g>
      <g v-if="id==='incense'" fill="none" stroke="#9b804f" stroke-width="1.5"><path d="m43 55-7 18m10-18 2 18"/><path d="M32 73h20l-4 9H36Z" fill="#dec48c"/><path d="M35 69q7-9 14 0Z" fill="#c5a770"/><path d="M41 65q-7-5 0-9t0-9" stroke="#b6b7a4"/><path d="m91 59 22 1-5 8H96Z" fill="#dec48c"/><path d="m101 58 1-5 8 2"/></g>
    </template>
  </svg>
</template>
