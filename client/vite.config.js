import { readFileSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const { version } = JSON.parse(readFileSync('./package.json', 'utf8'))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(version),
    // Injected at build time (CI sets it from a repository secret) so the
    // key never lives in the source tree.
    __DEFAULT_AI_KEY__: JSON.stringify(process.env.GEMINI_KEY || ''),
  },
})
