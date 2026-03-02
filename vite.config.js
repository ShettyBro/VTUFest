import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// NOTE: Manual chunk splitting (manualChunks) is disabled because Rollup has
// a known bug with project directory paths containing '#' characters.
// See: https://github.com/rollup/rollup/issues (path encoding issue)
// The build works correctly without it — Vite's default chunking still applies.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false
  }
})
