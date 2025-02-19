import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import alpinejs from '@astrojs/alpinejs';
import node from '@astrojs/node';

export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  site: 'https://your-domain.com',
  integrations: [
    tailwind(),
    mdx(),
    sitemap(),
    alpinejs(),
  ],
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp'
    },
    domains: [],
    remotePatterns: [],
    format: ['avif', 'webp'],
    fallbackFormat: 'png',
    quality: 80
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover'
  },
  devToolbar: {
    enabled: true
  },
  typescript: {
    strict: true
  }
}); 