import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectRef = process.env.SUPABASE_PROJECT_ID ?? 'tytvxtdaafbqakskwkdu';
const cliPath = path.join(projectRoot, 'node_modules', 'supabase', 'dist', 'supabase.js');
const migrationPath = path.join(
  projectRoot,
  'supabase',
  'migrations',
  '20261022191729_secure_discord_webhook_secret.sql',
);
const secret = randomBytes(32).toString('hex');
const tempRoot = 'C:/Users/paulg/AppData/Local/Temp/opencode';
const tempDirectory = mkdtempSync(path.join(tempRoot, 'fibers-discord-rotation-'));
const envFile = path.join(tempDirectory, 'edge-secrets.env');
const vaultSqlFile = path.join(tempDirectory, 'vault-secret.sql');

function runCli(args, label) {
  const result = spawnSync(process.execPath, [cliPath, ...args], {
    cwd: projectRoot,
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    const output = `${result.stderr ?? ''}\n${result.stdout ?? ''}`.replaceAll(secret, '[redacted]');
    console.error(`${label} failed (exit ${result.status ?? 'unknown'}).\n${output}`);
    throw new Error(`${label} failed.`);
  }
}

function readPublicEnv(name) {
  try {
    const envText = readFileSync(path.join(projectRoot, '.env'), 'utf8');
    const value = envText.match(new RegExp(`^${name}=(.*)$`, 'm'))?.[1]?.trim();
    return value?.replace(/^['"]|['"]$/g, '') || undefined;
  } catch {
    return undefined;
  }
}

try {
  const quote = String.fromCharCode(39);
  const vaultSql = [
    'do $rotate$',
    'declare',
    '  secret_id uuid;',
    `  new_secret text := ${quote}${secret}${quote};`,
    'begin',
    `  select id into secret_id from vault.decrypted_secrets where name = ${quote}discord_notify_webhook_secret${quote} limit 1;`,
    '  if secret_id is null then',
    `    perform vault.create_secret(new_secret, ${quote}discord_notify_webhook_secret${quote}, ${quote}Discord notification shared secret${quote});`,
    '  else',
    `    perform vault.update_secret(secret_id, new_secret, ${quote}discord_notify_webhook_secret${quote}, ${quote}Discord notification shared secret${quote});`,
    '  end if;',
    'end $rotate$;',
  ].join('\n');

  writeFileSync(envFile, `WEBHOOK_SECRET=${secret}\n`, { mode: 0o600 });
  writeFileSync(vaultSqlFile, `${vaultSql}\n`, { mode: 0o600 });

  runCli([
    'secrets', 'set', '--project-ref', projectRef, '--env-file', envFile,
  ], 'Rotate Edge Function secret');
  runCli([
    'db', 'query', '--linked', '--project-ref', projectRef, '--file', vaultSqlFile,
  ], 'Update Vault secret');
  runCli([
    'functions', 'deploy', 'discord-notify', '--project-ref', projectRef,
    '--use-api', '--no-verify-jwt',
  ], 'Deploy hardened Discord function');
  runCli([
    'db', 'query', '--linked', '--project-ref', projectRef, '--file', migrationPath,
  ], 'Apply webhook migration');
  runCli([
    'migration', 'repair', '--linked', '--project-ref', projectRef,
    '--status', 'applied', '20261022191729',
  ], 'Record webhook migration');

  const supabaseUrl = readPublicEnv('PUBLIC_SUPABASE_URL');
  const publishableKey = readPublicEnv('PUBLIC_SUPABASE_PUBLISHABLE_KEY');
  if (supabaseUrl && publishableKey) {
    const endpoint = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/discord-notify`;
    const request = async (headers, body) => fetch(endpoint, {
      method: 'POST',
      headers: { apikey: publishableKey, 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    });
    const unauthorized = await request({}, {});
    if (unauthorized.status !== 401) {
      throw new Error(`Webhook rejected missing-secret probe with unexpected status ${unauthorized.status}.`);
    }
    const authenticated = await request({ 'x-webhook-secret': secret }, { type: 'UPDATE', table: 'unsupported' });
    if (authenticated.status !== 400) {
      throw new Error(`Webhook rejected authenticated probe with unexpected status ${authenticated.status}.`);
    }
    console.log('Webhook probes passed: missing secret is rejected; authenticated non-insert event is rejected.');
  } else {
    console.log('Skipped HTTP probes because PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_PUBLISHABLE_KEY is absent from .env.');
  }

  console.log('Discord webhook secret rotated; the trigger now reads it from Vault. Secret values were not printed.');
} finally {
  rmSync(tempDirectory, { recursive: true, force: true });
}
