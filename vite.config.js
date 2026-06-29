import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "icons/*.png"],
      manifest: false,

      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
        globIgnores: ["**/arcgis-*.js"],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,

        runtimeCaching: [
          {
            urlPattern: /\/assets\/arcgis-.*\.js$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "arcgis-sdk-bundle",
              expiration: {
                maxEntries: 5,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.arcgis\.com\/.*tile.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "arcgis-basemap-tiles",
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.arcgis\.com\/.*FeatureServer.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "arcgis-feature-data",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24,
              },
              networkTimeoutSeconds: 5,
            },
          },
          {
            urlPattern: /^https:\/\/api\.openrouteservice\.org\/.*/i,
            handler: "NetworkOnly",
            options: {
              cacheName: "ors-routing",
            },
          },
        ],
      },

      devOptions: {
        enabled: false,
      },
    }),
  ],

  build: {
    chunkSizeWarningLimit: 2600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/@arcgis")) {
            return "arcgis";
          }
        },
      },
    },
  },
});