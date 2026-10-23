import { spawnSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectId = process.env.SUPABASE_PROJECT_ID ?? 'tytvxtdaafbqakskwkdu';
const cliPath = path.join(projectRoot, 'node_modules', 'supabase', 'dist', 'supabase.js');
const result = spawnSync(
  process.execPath,
  [cliPath, 'gen', 'types', 'typescript', '--project-id', projectId, '--schema', 'public'],
  { cwd: projectRoot, encoding: 'utf8' },
);

if (result.error) throw result.error;
if (result.status !== 0) {
  process.stderr.write(result.stderr || 'Supabase type generation failed.\n');
  process.exit(result.status ?? 1);
}

if (!result.stdout.includes('export type Database')) {
  throw new Error('Supabase CLI output did not contain a Database type; leaving the current snapshot untouched.');
}

const outputPath = path.join(projectRoot, 'src', 'services', 'database.types.ts');
await writeFile(
  outputPath,
  `// Generated from Supabase project ${projectId}. Do not edit by hand.\n${result.stdout}`,
  'utf8',
);
console.log(`Updated ${path.relative(projectRoot, outputPath)} from Supabase.`);
