import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Контент (content/*.md) вшивается в бандл при сборке (import.meta.glob
// в src/contentTree.ts): обновление контента = правка .md + пересборка
// только этого образа.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'build'
  },
  server: {
    host: true,
    port: 8080
  }
})
