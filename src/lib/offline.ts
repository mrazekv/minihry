import { ref } from 'vue'
export const offlineReady = ref(false)
export const updateReady = ref(false)
let waiting: ServiceWorker | null = null
let requestedUpdate = false
export async function registerOffline() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  try {
    const registration = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { updateViaCache: 'none' })
    function checkWaiting() {
      // První instalace může na okamžik projít stavem waiting; aktualizaci
      // nabízíme jen pokud stránku již ovládá starší aktivní verze.
      if (registration.waiting && navigator.serviceWorker.controller) {
        waiting = registration.waiting; updateReady.value = true
      } else if (!registration.waiting) {
        waiting = null; updateReady.value = false
      }
    }
    checkWaiting()
    registration.addEventListener('updatefound', () => {
      const installing = registration.installing
      installing?.addEventListener('statechange', () => {
        if (installing.state === 'installed') { offlineReady.value = true; checkWaiting() }
      })
    })
    navigator.serviceWorker.ready.then(() => { offlineReady.value = true; checkWaiting() })
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (requestedUpdate) window.location.reload() })
  } catch { /* Offline podpora je doplněk: její selhání nesmí blokovat hry. */ }
}
export function applyUpdate() {
  if (!waiting) return
  requestedUpdate = true
  waiting.postMessage({ type: 'SKIP_WAITING' })
}
