import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  customWorkerSrc: "src/worker",
  workboxOptions: {
    skipWaiting: true,
    cleanupOutdatedCaches: true,
    runtimeCaching: [
      // API : NetworkFirst avec fallback offline — 5s timeout, 24h, 150 entrées
      {
        urlPattern: /^https:\/\/.*\/api\/.*$/,
        handler: "NetworkFirst",
        options: {
          cacheName: "api-cache",
          expiration: {
            maxEntries: 150,
            maxAgeSeconds: 60 * 60 * 24,
          },
          networkTimeoutSeconds: 5,
        },
      },
      // Chunks JS/CSS Next.js : CacheFirst — versionnés par hash, 365 jours
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
      // Images Next.js optimisées (/_next/image) : CacheFirst — 30 jours, 100 entrées
      {
        urlPattern: /^\/_next\/image.*/,
        handler: "CacheFirst",
        options: {
          cacheName: "images-cache",
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 30,
          },
        },
      },
      // Images directes (png, jpg, webp, avif, svg) : CacheFirst — 30 jours, 100 entrées
      {
        urlPattern: /\.(?:png|jpg|jpeg|webp|avif|svg|ico)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "images-cache",
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 30,
          },
        },
      },
      // Fichiers public/ statiques (logo, icons, favicon) : CacheFirst
      {
        urlPattern: /^\/(?:logo\.png|favicon.*|apple-touch-icon.*|icons\/.*)/,
        handler: "CacheFirst",
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
