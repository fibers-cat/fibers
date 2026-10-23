import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectId = process.env.SUPABASE_PROJECT_ID?.trim();

if (!projectId) {
  console.error('Set SUPABASE_PROJECT_ID in .env or the environment before running test:rls.');
  process.exit(1);
}

const cliPath = path.join(projectRoot, 'node_modules', 'supabase', 'dist', 'supabase.js');
const result = spawnSync(
  process.execPath,
  [
    cliPath,
    'db',
    'query',
    '--linked',
    '--project-ref',
    projectId,
    '--file',
    path.join(projectRoot, 'tests', 'integration', 'rls-contract.sql'),
  ],
  { cwd: projectRoot, stdio: 'inherit' },
);

if (result.error) throw result.error;
process.exit(result.status ?? 1);
