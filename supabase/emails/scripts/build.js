const fs = require('node:fs');
const path = require('node:path');
const mjml2html = require('mjml');

const srcDir = path.resolve(__dirname, '../src');
const outDir = path.resolve(__dirname, '../out');
const layoutFile = path.join(srcDir, '_layout.mjml');
const layoutMjml = fs.readFileSync(layoutFile, 'utf8');

// Extract the inner body content of a template (everything inside <mj-body>...</mj-body>)
function extractBody(mjml) {
  const m = mjml.match(/<mj-body[^>]*>([\s\S]*?)<\/mj-body>/i);
  return m ? m[1].trim() : mjml;
}

function compileFile(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const body = extractBody(raw);
  const combined = layoutMjml.replace('<!--CONTENT-->', body);
  return mjml2html(combined, { validationLevel: 'soft' }).then(({ html, errors }) => {
    if (errors && errors.length) {
      console.warn(`[${path.basename(file)}] MJML warnings:`, errors.map(e => e.message).join('; '));
    }
    const outName = path.basename(file, '.mjml') + '.html';
    fs.writeFileSync(path.join(outDir, outName), html, 'utf8');
    console.log(`built ${outName}`);
  });
}

function build() {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const files = fs.readdirSync(srcDir)
    .filter(f => f.endsWith('.mjml') && !f.startsWith('_'))
    .sort();
  return Promise.all(files.map(f => compileFile(path.join(srcDir, f)))).then(() => {}).catch(e => { console.error(e); process.exit(1); });
}

const watch = process.argv.includes('--watch');
build();

if (watch) {
  const chokidar = require('chokidar');
  chokidar.watch(srcDir, { ignoreInitial: true }).on('all', () => {
    try { build(); } catch (e) { console.error(e); }
  });
  console.log('watching', srcDir);
}
