import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import process from 'node:process'
export default defineConfig({
  base: process.env.VITE_BASE_PATH || './',
  plugins: [vue()],
  build: { target: ['es2020', 'safari14'], sourcemap: false },
})
