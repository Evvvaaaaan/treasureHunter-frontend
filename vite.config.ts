import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  //  상대경로로 수정함. 
  base: './',
  define: {
    global: 'window',
  },
  // mobile view check
  // server: {
  //   host: true
  // }
  server: {
    port: 51845,
    strictPort: true,
  }
})


