import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  assetsInclude: ['**/*.svg', '**/*.csv'],

  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    clearMocks: true,
  },
})