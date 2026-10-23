import assert from 'node:assert/strict';
import test from 'node:test';
import { toSafeLocalPath } from '../src/services/safeRedirect.ts';

const origin = 'https://fibers.cat';

test('preserves a same-origin path, query, and hash', () => {
  assert.equal(
    toSafeLocalPath('https://fibers.cat/aporta/?assignatura=AC#form', origin),
    '/aporta/?assignatura=AC#form',
  );
});

test('accepts local paths', () => {
  assert.equal(toSafeLocalPath('/perfil/?tab=account', origin), '/perfil/?tab=account');
});

test('rejects external, protocol-relative, and executable return targets', () => {
  assert.equal(toSafeLocalPath('https://evil.example/steal', origin), '');
  assert.equal(toSafeLocalPath('//evil.example/steal', origin), '');
  assert.equal(toSafeLocalPath('javascript:alert(1)', origin), '');
});
