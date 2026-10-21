const fs = require('node:fs');
const path = require('node:path');

const projectRef = process.env.SUPABASE_PROJECT_REF || 'tytvxtdaafbqakskwkdu';
const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token) {
  console.error('Falta SUPABASE_ACCESS_TOKEN. Genera uno en https://supabase.com/dashboard/account/tokens');
  process.exit(1);
}

// Mapeo: slug -> { subjectKey, contentKey, subject (catalán) }
const MAPPING = {
  'confirm-signup': {
    subjectKey: 'mailer_subjects_confirmation',
    contentKey: 'mailer_templates_confirmation_content',
    subject: "Confirma la teva adreça electrònica",
  },
  'invite': {
    subjectKey: 'mailer_subjects_invite',
    contentKey: 'mailer_templates_invite_content',
    subject: "T'han convidat",
  },
  'magic-link': {
    subjectKey: 'mailer_subjects_magic_link',
    contentKey: 'mailer_templates_magic_link_content',
    subject: "El teu enllaç d'accés",
  },
  'change-email': {
    subjectKey: 'mailer_subjects_email_change',
    contentKey: 'mailer_templates_email_change_content',
    subject: "Confirma la teva nova adreça electrònica",
  },
  'reset-password': {
    subjectKey: 'mailer_subjects_recovery',
    contentKey: 'mailer_templates_recovery_content',
    subject: "Restableix la teva contrasenya",
  },
  'reauthentication': {
    subjectKey: 'mailer_subjects_reauthentication',
    contentKey: 'mailer_templates_reauthentication_content',
    subject: "{{ .Token }} és el teu codi de verificació",
  },
  'signin-linked': {
    subjectKey: 'mailer_subjects_identity_linked',
    contentKey: 'mailer_templates_identity_linked_content',
    subject: "S'ha vinculat un nou mètode d'accés",
  },
  'signin-removed': {
    subjectKey: 'mailer_subjects_identity_unlinked',
    contentKey: 'mailer_templates_identity_unlinked_content',
    subject: "S'ha eliminat un mètode d'accés",
  },
};

const outDir = path.resolve(__dirname, '../out');
const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null;
const dryRun = process.argv.includes('--dry-run');

async function patch(slug) {
  const info = MAPPING[slug];
  if (!info) throw new Error(`slug desconocido: ${slug}`);
  const htmlPath = path.join(outDir, `${slug}.html`);
  if (!fs.existsSync(htmlPath)) throw new Error(`falta ${htmlPath} (ejecuta npm run build primero)`);
  const html = fs.readFileSync(htmlPath, 'utf8');

  const body = {
    [info.subjectKey]: info.subject,
    [info.contentKey]: html,
  };

  if (dryRun) {
    console.log(`[dry-run] ${slug}: PATCH con ${Object.keys(body).join(', ')} (${html.length} chars HTML)`);
    return;
  }

  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error(`[${slug}] ERROR ${res.status}: ${text}`);
    process.exitCode = 1;
    return;
  }
  console.log(`[${slug}] OK (${res.status})`);
}

(async () => {
  const slugs = only ? [only] : Object.keys(MAPPING);
  for (const slug of slugs) {
    try { await patch(slug); }
    catch (e) { console.error(`[${slug}] ${e.message}`); process.exitCode = 1; }
  }
  if (process.exitCode) process.exit(process.exitCode);
})();
