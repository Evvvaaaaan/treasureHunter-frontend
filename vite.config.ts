import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'window',
  },
  // mobile view check
  // server: {
  //   host: true
  // }
  server: {
    port: 51845w,
    strictPort: true,
  }
})
