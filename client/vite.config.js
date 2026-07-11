import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'pwa-icon.svg'],
      manifest: {
        name: 'CampusMind AI - Official Platform',
        short_name: 'CampusMind',
        description: 'The Official Intelligent Academic Copilot for College Students.',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'logo2.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'logo2.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        screenshots: [
          {
            src: 'platform.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'wide',
            label: 'CampusMind AI Dashboard'
          },
          {
            src: 'platform.png',
            sizes: '1280x720',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'CampusMind AI Mobile'
          }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['lucide-react', 'framer-motion', 'react-hot-toast'],
          map: ['leaflet', 'react-leaflet'],
          pdf: ['pdfjs-dist']
        }
      }
    }
  }
})
