import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

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
      filter: (page) => {
        if (page.includes('/404')) return false;
        // Noindex pages: contributor ranking (both locales) and admin area.
        if (/\/(col-laboradors|colaboradores)\/?$/.test(page)) return false;
        if (page.includes('/admin/')) return false;
        // Old guide and terms routes, now served via redirect.
        if (/\/(guia|condicions)\/?$/.test(page)) return false;
        if (/\/es\/(guia|condiciones)\/?$/.test(page)) return false;
        // Spanish fallback URLs whose slug differs from the localized one are
        // duplicates of the translated route (e.g. /es/sobre/ → /es/acerca/).
        if (/\/es\/(sobre|contacte|condicions-us|com-funciona)\/?$/.test(page)) return false;
        if (/\/es\/assignatures\//.test(page)) return false;
        return true;
      },
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
