import assert from 'node:assert/strict';
import test from 'node:test';
import { shouldIncludeSitemapPage } from '../src/seo/sitemap-filter.js';

const page = (pathname) => `https://fibers.cat${pathname}`;

test('includes the public Catalan and Spanish assignment routes', () => {
  assert.equal(shouldIncludeSitemapPage(page('/assignatures/')), true);
  assert.equal(shouldIncludeSitemapPage(page('/assignatures/ac-arquitectura/')), true);
  assert.equal(shouldIncludeSitemapPage(page('/es/asignaturas/')), true);
  assert.equal(shouldIncludeSitemapPage(page('/es/asignaturas/ac-arquitectura/')), true);
});

test('excludes only non-indexable, redirect, and duplicate fallback routes', () => {
  for (const pathname of [
    '/404.html',
    '/es/404/',
    '/admin/usuaris/',
    '/es/admin/usuarios/',
    '/perfil/',
    '/es/perfil/',
    '/col-laboradors/',
    '/es/colaboradores/',
    '/es/col-laboradors/',
    '/guia/',
    '/es/sobre/',
    '/es/assignatures/',
  ]) {
    assert.equal(shouldIncludeSitemapPage(page(pathname)), false, pathname);
  }
});
