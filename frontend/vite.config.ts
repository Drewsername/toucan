import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173, // Development port
  },
  preview: {
    host: '0.0.0.0',
    port: Number(process.env.PORT) || 3000, // Production port
    strictPort: true,
  },
  // Ensure proper base URL for production
  base: '/',
})
