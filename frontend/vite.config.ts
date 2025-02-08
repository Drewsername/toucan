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
    // Allow Railway healthcheck host
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    // Allow all hosts in production
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'healthcheck.railway.app',
      '.railway.app',
      '.up.railway.app',
      'www.get-toucan.com',
      'get-toucan.com'
    ]
  },
  // Ensure proper base URL for production
  base: '/',
  css: {
    postcss: './postcss.config.mjs'
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    minify: 'esbuild',
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui': ['@heroui/react', '@heroui/theme', 'framer-motion'],
        }
      }
    }
  }
})
