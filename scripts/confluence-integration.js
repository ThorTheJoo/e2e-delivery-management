/*
 Minimal Confluence REST integration test harness.
 Usage:
   node scripts/confluence-integration.js --probe
   node scripts/confluence-integration.js --get <PAGE_ID> [--format storage|view]

 Env vars:
   CONFLUENCE_BASE_URL (e.g., https://confluence.csgicorp.com)
   CONFLUENCE_PAT       (Bearer PAT)
   ATLASSIAN_EMAIL      (for Basic auth alternative)
   ATLASSIAN_API_TOKEN  (for Basic auth alternative)
*/

'use strict';

const { Buffer } = require('node:buffer');

const baseUrl = (process.env.CONFLUENCE_BASE_URL || '').replace(/\/$/, '');
const pat = process.env.CONFLUENCE_PAT || '';
const email = process.env.ATLASSIAN_EMAIL || '';
const apiToken = process.env.ATLASSIAN_API_TOKEN || '';

function toBasic(emailValue, tokenValue) {
  return Buffer.from(`${emailValue}:${tokenValue}`).toString('base64');
}

async function tryFetch(url, headers) {
  const res = await fetch(url, { headers });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch (_) {}
  return { ok: res.ok, status: res.status, headers: res.headers, text, json };
}

async function probeAuth() {
  if (!baseUrl) {
    throw new Error('Missing CONFLUENCE_BASE_URL');
  }

  const paths = ['/rest/api', '/wiki/rest/api'];
  const headerVariants = [];

  if (pat) {
    headerVariants.push({ name: 'bearer', headers: { Authorization: `Bearer ${pat}`, Accept: 'application/json' } });
  }
  if (email && apiToken) {
    headerVariants.push({ name: 'basic', headers: { Authorization: `Basic ${toBasic(email, apiToken)}`, Accept: 'application/json' } });
  }

  if (headerVariants.length === 0) {
    throw new Error('No credentials found. Set CONFLUENCE_PAT or ATLASSIAN_EMAIL + ATLASSIAN_API_TOKEN');
  }

  for (const p of paths) {
    const url = `${baseUrl}${p}`;
    for (const variant of headerVariants) {
      const { ok, status, json, text } = await tryFetch(url, variant.headers);
      if (ok) {
        return { apiBase: p, auth: variant.name, info: json || text };
      }
      // 401/403 may indicate wrong auth type or insufficient permission; continue trying other variants/paths
    }
  }

  throw new Error('Failed to authenticate against Confluence using provided credentials and paths (/rest/api, /wiki/rest/api).');
}

async function getPageById(pageId, format, resolved) {
  const fmt = format === 'view' ? 'view' : 'storage';
  const url = `${baseUrl}${resolved.apiBase}/content/${encodeURIComponent(pageId)}?expand=body.${fmt}`;
  const headers = resolved.auth === 'bearer'
    ? { Authorization: `Bearer ${pat}`, Accept: 'application/json' }
    : { Authorization: `Basic ${toBasic(email, apiToken)}`, Accept: 'application/json' };

  const { ok, status, json, text } = await tryFetch(url, headers);
  if (!ok) {
    throw new Error(`Failed to get page ${pageId}. Status ${status}. Body: ${text}`);
  }
  const value = json && json.body && json.body[fmt] && json.body[fmt].value;
  if (!value) {
    throw new Error(`No body.${fmt}.value in response for page ${pageId}`);
  }
  return { format: fmt, value, title: json.title, id: json.id, version: json.version };
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--probe') args.probe = true;
    else if (a === '--get') { args.get = argv[++i]; }
    else if (a === '--format') { args.format = argv[++i]; }
    else args._.push(a);
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.probe && !args.get) {
    console.log('Usage:');
    console.log('  node scripts/confluence-integration.js --probe');
    console.log('  node scripts/confluence-integration.js --get <PAGE_ID> [--format storage|view]');
    process.exit(0);
  }

  const resolved = await probeAuth();
  console.log(JSON.stringify({ ok: true, resolved }, null, 2));

  if (args.get) {
    const result = await getPageById(args.get, args.format, resolved);
    // Print only a snippet to avoid huge output
    const snippet = result.value.length > 2000 ? result.value.slice(0, 2000) + '... [truncated]' : result.value;
    console.log(JSON.stringify({ ok: true, page: { id: result.id, title: result.title, format: result.format, snippet } }, null, 2));
  }
}

main().catch((err) => {
  console.error(JSON.stringify({ ok: false, error: err.message }, null, 2));
  process.exit(1);
});


