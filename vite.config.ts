import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages で公開するときだけ、置き場所（BASE_PATH）を差し替える
  base: process.env.BASE_PATH ?? '/',
  plugins: [
    react(),
    VitePWA({
      // 新しいバージョンを公開したら、次に開いたときに自動で最新版になる
      registerType: 'autoUpdate',
      // 開発中（npm run dev）でもホーム画面追加の動作を確認できるようにする
      devOptions: { enabled: true },
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Kessai Optimizer',
        short_name: 'Kessai',
        description: '決済を最適化するためのアプリ',
        lang: 'ja',
        // start_url と scope は上の base から自動で決まるので書きません
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#1f2937',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
})
