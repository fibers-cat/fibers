import assert from 'node:assert/strict';
import test from 'node:test';
import { createClient } from '@supabase/supabase-js';

const url = process.env.PUBLIC_SUPABASE_URL;
const key = process.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const client = url && key
  ? createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })
  : null;
const skipWithoutConfig = !client && 'Set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_PUBLISHABLE_KEY to run these read-only checks.';

test('anonymous client can read the public subjects catalog', { skip: skipWithoutConfig }, async () => {
  const { error } = await client.from('subjects').select('id').limit(1);
  assert.equal(error, null);
});

test('anonymous client cannot see pending contributions', { skip: skipWithoutConfig }, async () => {
  const { data, error } = await client
    .from('contributions')
    .select('id')
    .eq('status', 'pending')
    .limit(10);

  assert.equal(error, null);
  assert.deepEqual(data, []);
});

test('anonymous client cannot call the admin user-directory RPC', { skip: skipWithoutConfig }, async () => {
  const { error } = await client.rpc('admin_list_users');
  assert.ok(error);
});

test('Discord webhook rejects requests without the shared secret', { skip: skipWithoutConfig }, async () => {
  const endpoint = `${url.replace(/\/$/, '')}/functions/v1/discord-notify`;
  const request = (headers = {}) => fetch(endpoint, {
    method: 'POST',
    headers: { apikey: key, 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({ type: 'UPDATE', table: 'unsupported' }),
  });

  const [missingSecret, wrongSecret] = await Promise.all([
    request(),
    request({ 'x-webhook-secret': 'not-the-secret' }),
  ]);

  assert.equal(missingSecret.status, 401);
  assert.equal(wrongSecret.status, 401);
});
