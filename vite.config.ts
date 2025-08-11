import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        // Configuración de cache más simple
        navigateFallback: undefined
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Observatorio de I+D de Canarias',
        short_name: 'I+D Canarias',
        description: 'Análisis comparativo e histórico de indicadores de investigación, desarrollo e innovación',
        theme_color: '#006480',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  base: './',
  publicDir: 'public',
  server: {
    port: 5173,
    host: true,
    cors: true,
    open: true, // Abre el navegador automáticamente
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'public, max-age=3600',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin'
    }
  },
  preview: {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'public, max-age=3600',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin'
    }
  },
  // Incluye una configuración específica para que Vite sirva correctamente los archivos CSV
  assetsInclude: ['**/*.csv'],
  // Define alias para facilitar las referencias a archivos
  resolve: {
    alias: {
      '@': '/src',
      '@data': '/src/data',
      '@components': '/src/components',
    },
  },
  // Modo de desarrollo con más mensajes de depuración
  logLevel: 'info',
  // Salida compatible con navegadores modernos y algunos más antiguos
  build: {
    target: 'es2015',
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  esbuild: {
    target: 'es2015'
  }
})
