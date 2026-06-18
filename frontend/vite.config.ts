import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  root,
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
      '~': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
})
