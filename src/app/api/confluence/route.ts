import { NextRequest, NextResponse } from 'next/server';

interface ConfluenceConfig {
  baseUrl: string;
  apiBase: '/rest/api' | '/wiki/rest/api' | 'auto';
  defaultFormat: 'storage' | 'view';
}

function resolveApiBase(config: ConfluenceConfig) {
  if (config.apiBase !== 'auto') return config.apiBase;
  return '/rest/api';
}

function normalizeConfig(config: ConfluenceConfig): { baseUrl: string; apiBase: '/rest/api' | '/wiki/rest/api' } {
  let baseUrl = config.baseUrl.replace(/\/+$/, '');
  let apiBase: '/rest/api' | '/wiki/rest/api' | 'auto' = config.apiBase;

  if (baseUrl.endsWith('/rest/api')) {
    baseUrl = baseUrl.slice(0, -('/rest/api'.length));
    if (apiBase === 'auto') apiBase = '/rest/api';
  } else if (baseUrl.endsWith('/wiki/rest/api')) {
    baseUrl = baseUrl.slice(0, -('/wiki/rest/api'.length));
    if (apiBase === 'auto') apiBase = '/wiki/rest/api';
  }

  if (apiBase === 'auto') apiBase = '/rest/api';
  return { baseUrl, apiBase };
}

function extractPageId(input: string): string | null {
  const raw = (input || '').trim();
  if (!raw) return null;
  if (/^\d+$/.test(raw)) return raw;
  try {
    const u = new URL(raw);
    const qp = u.searchParams.get('pageId');
    if (qp && /^\d+$/.test(qp)) return qp;
    const parts = u.pathname.split('/').filter(Boolean);
    for (let i = parts.length - 1; i >= 0; i--) {
      if (/^\d+$/.test(parts[i])) return parts[i];
    }
  } catch {}
  const m = raw.match(/pageId=(\d+)/);
  if (m) return m[1];
  const anyDigits = raw.match(/(\d{5,})/); // fall back to first long integer-like sequence
  return anyDigits ? anyDigits[1] : null;
}

async function fetchJson(url: string, headers: Record<string, string>) {
  const res = await fetch(url, { headers });
  const text = await res.text();
  try {
    return { ok: res.ok, status: res.status, json: JSON.parse(text) };
  } catch {
    return { ok: res.ok, status: res.status, json: null };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, config, credentials, data } = body as {
      action: 'test' | 'get-page';
      config: ConfluenceConfig;
      credentials?: { pat?: string };
      data?: { pageId?: string; format?: 'storage' | 'view' };
    };

    if (!config || !config.baseUrl) {
      return NextResponse.json({ ok: false, error: 'Missing configuration.baseUrl' }, { status: 400 });
    }

    const { baseUrl, apiBase } = normalizeConfig(config);
    const headers: Record<string, string> = { Accept: 'application/json' };

    if (!credentials?.pat) {
      return NextResponse.json({ ok: false, error: 'Missing Personal Access Token' }, { status: 400 });
    }

    headers.Authorization = `Bearer ${credentials.pat}`;

    if (action === 'test') {
      // Try primary apiBase; if fails and apiBase was auto-resolved to /rest/api, try /wiki/rest/api as fallback
      let probeUrl = `${baseUrl}${apiBase}`;
      let result = await fetchJson(probeUrl, headers);
      if (!result.ok) {
        const altBase = apiBase === '/rest/api' ? '/wiki/rest/api' : '/rest/api';
        const altUrl = `${baseUrl}${altBase}`;
        const altResult = await fetchJson(altUrl, headers);
        if (altResult.ok) {
          return NextResponse.json({ ok: true, resolved: { apiBase: altBase } });
        }
        return NextResponse.json({ ok: false, error: `Probe failed (status ${result.status}) and fallback failed (status ${altResult.status})` }, { status: 502 });
      }
      return NextResponse.json({ ok: true, resolved: { apiBase } });
    }

    if (action === 'get-page') {
      if (!data?.pageId) {
        return NextResponse.json({ ok: false, error: 'Missing pageId' }, { status: 400 });
      }
      const cleanedId = extractPageId(String(data.pageId));
      if (!cleanedId) {
        return NextResponse.json({ ok: false, error: 'Could not parse a numeric pageId from input' }, { status: 400 });
      }
      const format = data.format === 'view' ? 'view' : 'storage';
      const url = `${baseUrl}${apiBase}/content/${encodeURIComponent(cleanedId)}?expand=body.storage,body.view,space,version`;
      const result = await fetchJson(url, headers);
      if (!result.ok) {
        return NextResponse.json({ ok: false, error: `Status ${result.status}` }, { status: result.status || 500 });
      }
      const storageValue = result.json?.body?.storage?.value as string | undefined;
      const viewValue = result.json?.body?.view?.value as string | undefined;
      const title = result.json?.title as string | undefined;
      if (!title || (!storageValue && !viewValue)) {
        return NextResponse.json({ ok: false, error: 'Unexpected response: missing body or title' }, { status: 500 });
      }
      const chosen = format === 'view' ? (viewValue || storageValue || '') : (storageValue || viewValue || '');
      const snippet = chosen.length > 2000 ? chosen.slice(0, 2000) + '... [truncated]' : chosen;
      const absoluteWebUi = (() => {
        const rel = result.json?._links?.webui as string | undefined;
        if (!rel) return undefined;
        return rel.startsWith('http') ? rel : `${baseUrl}${rel}`;
      })();
      const space = {
        key: result.json?.space?.key as string | undefined,
        name: result.json?.space?.name as string | undefined,
      };
      const version = {
        number: result.json?.version?.number as number | undefined,
        when: result.json?.version?.when as string | undefined,
      };
      return NextResponse.json({
        ok: true,
        page: {
          id: cleanedId,
          title,
          format,
          snippet,
          contentStorage: storageValue,
          contentViewHtml: viewValue,
          space,
          version,
          links: { webui: absoluteWebUi },
        },
      });
    }

    return NextResponse.json({ ok: false, error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error('Confluence API error:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}


