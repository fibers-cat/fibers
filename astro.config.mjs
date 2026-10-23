import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { shouldIncludeSitemapPage } from './src/seo/sitemap-filter.js';

export default defineConfig({
  site: 'https://fibers.cat',
  i18n: {
    defaultLocale: 'ca',
    locales: ['ca', 'es'],
    routing: {
      prefixDefaultLocale: false,
      fallbackType: 'rewrite',
    },
    fallback: {
      es: 'ca',
    },
  },
  redirects: {
    '/guia/': '/com-funciona/',
    '/es/guia/': '/es/como-funciona/',
    '/condicions/': '/condicions-us/',
    '/es/condiciones/': '/es/condiciones-uso/',
  },
  integrations: [
    react(),
    sitemap({
      filter: shouldIncludeSitemapPage,
      i18n: {
        defaultLocale: 'ca',
        locales: {
          ca: 'ca',
          es: 'es',
        },
      },
    }),
  ],
});
