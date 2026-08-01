import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages で公開するときだけ /kessai-optimizer/ 配下に置かれるので、
// そのときだけ base を切り替える（手元での開発中はルート "/" のまま）。
const base = process.env.GITHUB_PAGES === 'true' ? '/kessai-optimizer/' : '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      // 新しいバージョンを公開したら、次に開いたときに自動で入れ替える
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: '決済オプティマイザー',
        short_name: '決済最適化',
        description: '支払い方法をかしこく選ぶためのアプリ',
        lang: 'ja',
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#182038',
        theme_color: '#182038',
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
            src: 'maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // ページ内を移動しても、オフライン時に index.html を返す
        navigateFallback: `${base}index.html`,
        cleanupOutdatedCaches: true,
      },
      devOptions: {
        // npm run dev のときも PWA の動きを確認できるようにする
        enabled: true,
        type: 'module',
      },
    }),
  ],
})
