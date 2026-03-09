import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'))

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/verses\.quran\.foundation\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'quran-api-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\/quran-data\/.*\.json$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'quran-data-cache',
              expiration: { maxEntries: 700, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        name: 'Nuruna',
        short_name: 'Nuruna',
        description: 'Koran lesen, Lese-Gruppen, Hatim und mehr',
        start_url: '/',
        display: 'standalone',
        background_color: '#0f766e',
        theme_color: '#0f766e',
        orientation: 'portrait-primary',
        icons: [
          {
            src: '/nuruna-favicon.svg',
            type: 'image/svg+xml',
            sizes: 'any',
            purpose: 'any',
          },
        ],
      },
    }),
    {
      name: 'version-json',
      buildStart() {
        writeFileSync(resolve(__dirname, 'public/version.json'), JSON.stringify({ version: pkg.version }))
      },
    },
  ],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
})
