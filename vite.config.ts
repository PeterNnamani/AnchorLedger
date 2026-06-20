import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative base so the production build loads assets correctly when served
  // from the file:// protocol inside the packaged Electron app.
  base: './',
  server: {
    port: 5173,
    strictPort: true,
  },
})
