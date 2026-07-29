import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { VitePWA } from "vite-plugin-pwa"

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "gymiquest-mark.svg",
        "gymiquest-icon-192.png",
        "gymiquest-icon-512.png",
        "gymiquest-maskable-512.png",
        "apple-touch-icon.png",
        "music/the-golden-dragon.mid"
      ],
      manifest: {
        id: "/",
        name: "GymiQuest",
        short_name: "GymiQuest",
        description: "Adaptive mathematics and German lessons, reviews, and assessments.",
        lang: "en",
        dir: "ltr",
        categories: ["education"],
        theme_color: "#173b57",
        background_color: "#f6f3ea",
        display: "standalone",
        orientation: "any",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "/gymiquest-icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/gymiquest-icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/gymiquest-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ]
      },
      workbox: {
        navigateFallback: "/index.html",
        globPatterns: ["**/*.{js,mjs,css,html,ico,png,svg,mid,webmanifest}"],
        maximumFileSizeToCacheInBytes: 2 * 1024 * 1024
      }
    })
  ]
})
