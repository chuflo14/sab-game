import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  reloadOnOnline: false,
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      // Cache Supabase/Storage Media Files (Aggressive)
      {
        urlPattern: /^https:\/\/.*\/storage\/v1\/object\/public\/.*$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'supabase-media-cache',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 Days
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      // Cache Local Media API
      {
        urlPattern: /\/api\/ad-image/,
        handler: 'NetworkFirst', // Check for updates, fall back to cache
        options: {
          cacheName: 'local-media-api',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24, // 24 Hours
          },
        },
      },
      // Cache Static Assets (Images, etc)
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|mp4)$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'static-asset-cache',
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 Days
          },
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
    },
  },
};

export default withPWA(nextConfig);

