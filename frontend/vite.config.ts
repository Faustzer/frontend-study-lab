import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

const PATH = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [vue()],
  root: PATH,
  resolve: {
    alias: {
      '@': PATH,
      '~': PATH,
    },
  },
})
