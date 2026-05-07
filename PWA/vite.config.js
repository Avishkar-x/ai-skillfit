import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    watch: {
      // Exclude Python venv and backend from HMR watcher
      ignored: ['**/.venv/**', '**/backend/**', '**/node_modules/**'],
    },
    proxy: {
      // Proxy Google Translate TTS to avoid CORS blocking
      '/gtts': {
        target: 'https://translate.google.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/gtts/, '/translate_tts'),
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      },
    },
  },
})

