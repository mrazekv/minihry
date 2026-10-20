import { ref, watch } from 'vue'
const key = 'minihry.preferences.v1'
export interface Preferences { difficulty: number; reducedMotion: boolean }
function load(): Preferences {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '{}')
    return { difficulty: [1, 2, 3].includes(saved.difficulty) ? saved.difficulty : 1, reducedMotion: saved.reducedMotion === true }
  } catch { return { difficulty: 1, reducedMotion: false } }
}
export const preferences = ref<Preferences>(load())
watch(preferences, value => {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* Hry fungují i bez přístupu k úložišti. */ }
}, { deep: true })
export function resetPreferences() { preferences.value = { difficulty: 1, reducedMotion: false } }
