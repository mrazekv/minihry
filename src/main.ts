import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'
import HomeView from './views/HomeView.vue'
import AtlasView from './views/AtlasView.vue'
import AboutView from './views/AboutView.vue'
import MemoryGame from './games/memory/MemoryGame.vue'
import RecognitionGame from './games/recognition/RecognitionGame.vue'
import OrderingGame from './games/ordering/OrderingGame.vue'
import MatchingGame from './games/matching/MatchingGame.vue'
import RunnerGame from './games/runner/RunnerGame.vue'
import './styles/main.css'
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/slovnicek', component: AtlasView },
    { path: '/o-aplikaci', component: AboutView },
    { path: '/pexeso', component: MemoryGame },
    { path: '/poznavacka', component: RecognitionGame },
    { path: '/mse', component: OrderingGame, props: { kind: 'mass' } },
    { path: '/rok', component: OrderingGame, props: { kind: 'year' } },
    { path: '/latina', component: MatchingGame },
    { path: '/cesta', component: RunnerGame },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})
createApp(App).use(router).mount('#app')
