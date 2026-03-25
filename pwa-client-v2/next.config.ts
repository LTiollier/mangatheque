import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  workboxOptions: {
    skipWaiting: true,
    // Logo et icônes dépassent la limite précache de 2 MB — gérés en runtime
    maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, // 4 MB
    runtimeCaching: [
      // API : NetworkFirst avec fallback offline
      {
        urlPattern: /^https:\/\/.*\/api\/.*$/,
        handler: "NetworkFirst",
        options: {
          cacheName: "api-cache",
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 7,
          },
          networkTimeoutSeconds: 10,
        },
      },
      // Assets statiques locaux (logo, icons) : CacheFirst — immutables entre déploiements
      {
        urlPattern: /^\/_next\/static\/.*/,
        handler: "CacheFirst",
        options: {
          cacheName: "next-static",
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 60 * 60 * 24 * 365,
          },
        },
      },
      // Fichiers public/ (logo.png, icons/, favicon) : StaleWhileRevalidate
      {
        urlPattern: /^\/(?:logo\.png|favicon.*|apple-touch-icon.*|icons\/.*)/,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "static-assets",
          expiration: {
            maxEntries: 20,
            maxAgeSeconds: 60 * 60 * 24 * 30,
          },
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  turbopack: {},
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "via.placeholder.com" },
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "api.mangacollec.com" },
      { protocol: "https", hostname: "m.media-amazon.com" },
      { protocol: "https", hostname: "images-eu.ssl-images-amazon.com" },
      { protocol: "https", hostname: "www.bdfugue.com" },
    ],
  },
};

export default withPWA(nextConfig);
