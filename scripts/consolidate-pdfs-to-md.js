/*
  Consolidate multiple PDFs into a single Markdown file.
  - Non-destructive. Generates docs/CONSOLIDATED-PDFS.md
  - Uses pdf-parse to extract text
  - Light normalization (hyphenation joins, trim, spacing)
*/

const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const pdf = require('pdf-parse');

const PDF_FILES = [
  { label: 'SV Solution Description Generator', file: 'SV Solution Description Generator.pdf' },
  { label: 'Encompass 12 Product Description Jan 2025 (1)', file: 'Encompass 12 Product Description Jan 2025 (1).pdf' },
  { label: 'E2E Use Case', file: 'E2E Use Case.pdf' },
  { label: 'Freedom Modernization Solution Description v1.0 - Final', file: 'Freedom Modernization Solution Description v1.0 - Final.pdf' },
];

function normalizeText(raw) {
  if (!raw) return '';
  return String(raw)
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/-\n/g, '') // join hyphenated line breaks
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function extractPdfText(fullPath) {
  const buf = await fsp.readFile(fullPath);
  const data = await pdf(buf);
  return normalizeText(data.text || '');
}

async function ensureDir(dir) {
  await fsp.mkdir(dir, { recursive: true }).catch(() => {});
}

function slugify(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

async function main() {
  const cwd = process.cwd();
  const outDir = path.join(cwd, 'docs');
  await ensureDir(outDir);

  const sections = [];
  const missing = [];

  for (const entry of PDF_FILES) {
    const full = path.join(cwd, entry.file);
    if (!fs.existsSync(full)) {
      missing.push(entry.file);
      continue;
    }
    process.stdout.write(`Extracting: ${entry.file}... `);
    try {
      const text = await extractPdfText(full);
      sections.push({ ...entry, text, chars: text.length });
      console.log(`ok (${text.length.toLocaleString()} chars)`);
    } catch (e) {
      console.log('failed');
      sections.push({ ...entry, text: `\n[Extraction failed: ${e?.message || 'Unknown error'}]\n`, chars: 0 });
    }
  }

  const ts = new Date().toISOString();
  const toc = sections
    .map((s, i) => `- [${i + 1}. ${s.label}](#${slugify(`${i + 1} ${s.label}`)})`)
    .join('\n');

  const header = `# Consolidated PDF Source Content\n\n` +
    `Generated: ${ts}\n\n` +
    `Included files (in order):\n\n${toc}\n\n` +
    (missing.length ? `Missing files (not found): ${missing.join(', ')}\n\n` : '');

  const body = sections
    .map((s, i) => `## ${i + 1}. ${s.label}\n\n_Source: ${s.file}_\n\n${s.text}\n`)
    .join('\n\n---\n\n');

  const md = `${header}${body}`;
  const outPath = path.join(outDir, 'CONSOLIDATED-PDFS.md');
  await fsp.writeFile(outPath, md, 'utf8');

  console.log(`\n✅ Consolidated Markdown created: ${path.relative(cwd, outPath)}`);
}

main().catch((err) => {
  console.error('❌ Consolidation failed:', err);
  process.exit(1);
});


