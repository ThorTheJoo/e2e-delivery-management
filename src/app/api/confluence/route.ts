import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

interface ConfluenceConfig {
  baseUrl: string;
  apiBase: '/rest/api' | '/wiki/rest/api' | 'auto';
  defaultFormat: 'storage' | 'view';
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
  try {
    console.log('Confluence API: Fetching URL:', url);
    const res = await fetch(url, { 
      headers,
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    const text = await res.text();
    console.log('Confluence API: Response status:', res.status);
    console.log('Confluence API: Response text length:', text.length);
    
    try {
      const json = JSON.parse(text);
      return { ok: res.ok, status: res.status, json };
    } catch (parseError) {
      console.log('Confluence API: JSON parse error:', parseError);
      return { ok: res.ok, status: res.status, json: null, text };
    }
  } catch (fetchError) {
    console.error('Confluence API: Fetch error:', fetchError);
    
    // Provide more specific error messages based on the error type
    let errorMessage = 'Unknown fetch error';
    if (fetchError instanceof Error) {
      if (fetchError.name === 'AbortError') {
        errorMessage = 'Request timeout - the server may be unreachable or slow to respond';
      } else if (fetchError.message.includes('ENOTFOUND')) {
        errorMessage = 'DNS resolution failed - the hostname cannot be resolved. Please check if you need to connect to a VPN or if the URL is correct';
      } else if (fetchError.message.includes('ECONNREFUSED')) {
        errorMessage = 'Connection refused - the server is not accepting connections on this port';
      } else if (fetchError.message.includes('ETIMEDOUT')) {
        errorMessage = 'Connection timeout - the server is not responding';
      } else if (fetchError.message.includes('fetch failed')) {
        errorMessage = 'Network error - please check your internet connection and VPN status';
      } else {
        errorMessage = fetchError.message;
      }
    }
    
    return { ok: false, status: 0, json: null, error: errorMessage };
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Confluence API: Received request');
    const body = await request.json();
    console.log('Confluence API: Parsed body:', JSON.stringify(body, null, 2));
    
    const { action, config, credentials, data } = body as {
      action: 'test' | 'get-page';
      config: ConfluenceConfig;
      credentials?: { pat?: string };
      data?: { pageId?: string; format?: 'storage' | 'view' };
    };

    if (!config || !config.baseUrl) {
      console.log('Confluence API: Missing baseUrl');
      return NextResponse.json({ ok: false, error: 'Missing configuration.baseUrl' }, { status: 400 });
    }

    if (!credentials?.pat) {
      console.log('Confluence API: Missing PAT');
      return NextResponse.json({ ok: false, error: 'Missing Personal Access Token' }, { status: 400 });
    }

    // Test mode handling
    if (credentials.pat === 'test-token') {
      console.log('Confluence API: Test mode enabled');
      if (action === 'test') {
        return NextResponse.json({ ok: true, resolved: { apiBase: '/rest/api' } });
      }
      if (action === 'get-page') {
        return NextResponse.json({
          ok: true,
          page: {
            id: data?.pageId || '1388483969',
            title: 'Test Page - Customer Information Management',
            format: data?.format || 'storage',
            snippet: '<p>This is a test page content for development purposes.</p><p>In production, this would contain the actual Confluence page content.</p>',
            contentStorage: '<p>This is a test page content for development purposes.</p><p>In production, this would contain the actual Confluence page content.</p>',
            contentViewHtml: '<p>This is a test page content for development purposes.</p><p>In production, this would contain the actual Confluence page content.</p>',
            space: { key: 'TEST', name: 'Test Space' },
            version: { number: 1, when: new Date().toISOString() },
            links: { webui: `${config.baseUrl}/pages/viewpage.action?pageId=${data?.pageId || '1388483969'}` }
          }
        });
      }
    }

    console.log('Confluence API: About to normalize config');
    const { baseUrl, apiBase } = normalizeConfig(config);
    console.log('Confluence API: Normalized config:', { baseUrl, apiBase });
    console.log('Confluence API: Basic validation passed');
    
    if (action === 'test') {
      console.log('Confluence API: Test action');
      const headers: Record<string, string> = { Accept: 'application/json' };
      headers.Authorization = `Bearer ${credentials.pat}`;
      
      // Try primary apiBase; if fails and apiBase was auto-resolved to /rest/api, try /wiki/rest/api as fallback
      const probeUrl = `${baseUrl}${apiBase}`;
      console.log('Confluence API: Testing URL:', probeUrl);
      const result = await fetchJson(probeUrl, headers);
      console.log('Confluence API: Test result:', result);
      
      if (!result.ok) {
        const altBase = apiBase === '/rest/api' ? '/wiki/rest/api' : '/rest/api';
        const altUrl = `${baseUrl}${altBase}`;
        console.log('Confluence API: Trying fallback URL:', altUrl);
        const altResult = await fetchJson(altUrl, headers);
        console.log('Confluence API: Fallback result:', altResult);
        
        if (altResult.ok) {
          return NextResponse.json({ ok: true, resolved: { apiBase: altBase } });
        }
        
        // Provide more detailed error information
        const primaryError = result.error || `Primary URL failed (status ${result.status})`;
        const fallbackError = altResult.error || `Fallback URL failed (status ${altResult.status})`;
        const errorMsg = `${primaryError}. ${fallbackError}. Please verify the Base URL is correct and that you have network access to the Confluence server.`;
        return NextResponse.json({ ok: false, error: errorMsg }, { status: 502 });
      }
      return NextResponse.json({ ok: true, resolved: { apiBase } });
    }

    if (action === 'get-page') {
      console.log('Confluence API: Get page action');
      if (!data?.pageId) {
        return NextResponse.json({ ok: false, error: 'Missing pageId' }, { status: 400 });
      }
      
      const cleanedId = extractPageId(String(data.pageId));
      if (!cleanedId) {
        return NextResponse.json({ ok: false, error: 'Could not parse a numeric pageId from input' }, { status: 400 });
      }
      
      const format = data.format === 'view' ? 'view' : 'storage';
      const headers: Record<string, string> = { Accept: 'application/json' };
      headers.Authorization = `Bearer ${credentials.pat}`;
      
      const url = `${baseUrl}${apiBase}/content/${encodeURIComponent(cleanedId)}?expand=body.storage,body.view,space,version`;
      console.log('Confluence API: Fetching page URL:', url);
      
      const result = await fetchJson(url, headers);
      console.log('Confluence API: Page fetch result:', result);
      
      if (!result.ok) {
        return NextResponse.json({ ok: false, error: `Status ${result.status}: ${result.error || 'Failed to fetch page'}` }, { status: result.status || 500 });
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
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({ 
      ok: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}