import assert from 'node:assert/strict';
import test from 'node:test';
import { canonicalPath, localizePath } from '../src/i18n/config.ts';

test('localizes translated routes and nested subject slugs', () => {
  assert.equal(localizePath('/sobre/', 'es'), '/es/acerca/');
  assert.equal(localizePath('/assignatures/ac-arquitectura/', 'es'), '/es/asignaturas/ac-arquitectura/');
});

test('canonicalizes localized routes back to Catalan paths', () => {
  assert.equal(canonicalPath('/es/acerca/', 'es'), '/sobre/');
  assert.equal(canonicalPath('/es/asignaturas/ac-arquitectura/', 'es'), '/assignatures/ac-arquitectura/');
});
