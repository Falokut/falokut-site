import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Контент (content/*.md, один файл = одна страница) вшивается в бандл
// при сборке (import.meta.glob в src/data.ts): обновление контента =
// правка .md + пересборка только этого образа.
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
