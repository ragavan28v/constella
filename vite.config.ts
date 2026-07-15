import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: 'firebase/analytics', replacement: path.resolve(__dirname, 'src/shims/firebase-noop-analytics.ts') },
      { find: 'firebase/analytics-compat', replacement: path.resolve(__dirname, 'src/shims/firebase-noop-analytics.ts') },
      { find: '@firebase/analytics', replacement: path.resolve(__dirname, 'src/shims/firebase-noop-analytics.ts') },
      { find: '@firebase/analytics-compat', replacement: path.resolve(__dirname, 'src/shims/firebase-noop-analytics.ts') },
      { find: '@firebase/analytics-types', replacement: path.resolve(__dirname, 'src/shims/firebase-noop-analytics.ts') }
    ]
  }
})
