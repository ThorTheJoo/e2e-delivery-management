'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { Server, Save, RefreshCw, TestTube, Eye, Shield, AlertTriangle } from 'lucide-react';

interface ConfluenceConfig {
  baseUrl: string;
  apiBase: '/rest/api' | '/wiki/rest/api' | 'auto';
  defaultFormat: 'storage' | 'view';
}

interface TestResult {
  ok: boolean;
  resolved?: { apiBase: string };
  error?: string;
}

interface PageResult {
  ok: boolean;
  page?: {
    id: string;
    title: string;
    format: string;
    snippet: string;
    contentStorage?: string;
    contentViewHtml?: string;
    space?: { key?: string; name?: string };
    version?: { number?: number; when?: string };
    links?: { webui?: string };
  };
  error?: string;
}

export function ConfluenceConfiguration() {
  const [config, setConfig] = useState<ConfluenceConfig>({
    baseUrl: 'https://confluence.csgicorp.com',
    apiBase: 'auto',
    defaultFormat: 'storage',
  });
  const [isConfigured, setIsConfigured] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const [pat, setPat] = useState(''); // Not persisted
  const [pageId, setPageId] = useState('');
  const [preview, setPreview] = useState<PageResult | null>(null);
  const [lastAction, setLastAction] = useState<{ type: 'save' | 'test' | 'fetch' | null; ok?: boolean; message?: string }>({ type: null });

  const toast = useToast();

  useEffect(() => {
    try {
      const saved = localStorage.getItem('confluenceConfig');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.baseUrl) {
          setConfig(parsed);
          setIsConfigured(true);
        }
      }
    } catch {}
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (!config.baseUrl.trim()) throw new Error('Base URL is required');
      const normalized: ConfluenceConfig = {
        baseUrl: config.baseUrl.replace(/\/$/, ''),
        apiBase: config.apiBase,
        defaultFormat: config.defaultFormat,
      };
      localStorage.setItem('confluenceConfig', JSON.stringify(normalized));
      setConfig(normalized);
      setIsConfigured(true);
      toast.showSuccess('Confluence configuration saved (token not persisted)');
      setLastAction({ type: 'save', ok: true, message: 'Saved' });
    } catch (error) {
      const msg = `Save failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      toast.showError(msg);
      setLastAction({ type: 'save', ok: false, message: msg });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setPreview(null);
    try {
      if (!pat.trim()) throw new Error('Please enter your Personal Access Token');
      if (!config.baseUrl.trim()) throw new Error('Please enter the Base URL');
      const normalizedBase = config.baseUrl.replace(/\/+$/, '');
      const payload = {
        action: 'test',
        config: { ...config, baseUrl: normalizedBase },
        credentials: { pat },
      };
      const response = await fetch('/api/confluence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result: TestResult = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.error || 'Test failed');
      }
      const msg = `Connection OK (resolved: ${result.resolved?.apiBase || 'auto'})`;
      toast.showSuccess(msg);
      setLastAction({ type: 'test', ok: true, message: msg });
    } catch (error) {
      const msg = `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      toast.showError(msg);
      setLastAction({ type: 'test', ok: false, message: msg });
    } finally {
      setIsTesting(false);
    }
  };

  const handleFetchPage = async () => {
    setIsFetching(true);
    setPreview(null);
    try {
      if (!pat.trim()) throw new Error('Please enter your Personal Access Token');
      if (!pageId.trim()) throw new Error('Please enter a Page ID');
      const normalizedBase = config.baseUrl.replace(/\/+$/, '');
      const response = await fetch('/api/confluence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get-page',
          config: { ...config, baseUrl: normalizedBase },
          credentials: { pat },
          data: { pageId, format: config.defaultFormat },
        }),
      });
      const result: PageResult = await response.json();
      if (!response.ok || !result.ok || !result.page) {
        throw new Error(result.error || 'Failed to fetch page');
      }
      setPreview(result);
      const msg = `Fetched page ${result.page.title}`;
      toast.showSuccess(msg);
      setLastAction({ type: 'fetch', ok: true, message: msg });
    } catch (error) {
      const msg = `Fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      toast.showError(msg);
      setLastAction({ type: 'fetch', ok: false, message: msg });
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="mb-2 text-2xl font-bold text-gray-900">Confluence Configuration</h2>
        <p className="text-gray-600">
          Configure Confluence settings and test retrieval of a page by ID. The Personal Access Token is never persisted.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-blue-200 bg-blue-100">
                <Server className="h-5 w-5 text-blue-700" />
              </div>
              <div>
                <CardTitle className="text-base">Confluence Configuration</CardTitle>
                <CardDescription>Base URL, API base, and default format</CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={isConfigured ? 'default' : 'secondary'}>
                {isConfigured ? 'Configured' : 'Not Configured'}
              </Badge>
              {lastAction.type && (
                <Badge variant={lastAction.ok ? 'default' : 'secondary'}>
                  {lastAction.type === 'save' && (lastAction.ok ? 'Saved' : 'Save Failed')}
                  {lastAction.type === 'test' && (lastAction.ok ? 'Test OK' : 'Test Failed')}
                  {lastAction.type === 'fetch' && (lastAction.ok ? 'Fetched' : 'Fetch Failed')}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <Label htmlFor="baseUrl">Base URL</Label>
                <Input
                  id="baseUrl"
                  value={config.baseUrl}
                  onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
                  placeholder="https://confluence.example.com"
                />
                <p className="mt-1 text-xs text-muted-foreground">Do not include a trailing slash.</p>
              </div>
              <div>
                <Label htmlFor="apiBase">API Base</Label>
                <Input
                  id="apiBase"
                  value={config.apiBase}
                  onChange={(e) => {
                    const v = e.target.value as ConfluenceConfig['apiBase'];
                    setConfig({ ...config, apiBase: (v === '/rest/api' || v === '/wiki/rest/api' ? v : 'auto') });
                  }}
                  placeholder="auto | /rest/api | /wiki/rest/api"
                />
                <p className="mt-1 text-xs text-muted-foreground">Use "auto" to detect. This tenant typically uses /rest/api.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="defaultFormat">Default Format</Label>
                <Input
                  id="defaultFormat"
                  value={config.defaultFormat}
                  onChange={(e) => {
                    const v = e.target.value as ConfluenceConfig['defaultFormat'];
                    setConfig({ ...config, defaultFormat: v === 'view' ? 'view' : 'storage' });
                  }}
                  placeholder="storage | view"
                />
                <p className="mt-1 text-xs text-muted-foreground">Choose Confluence Storage (XHTML) or View (HTML).</p>
              </div>
              <div>
                <Label htmlFor="pat">Personal Access Token (not persisted)</Label>
                <Input
                  id="pat"
                  type="password"
                  value={pat}
                  onChange={(e) => setPat(e.target.value)}
                  placeholder="Enter PAT for testing"
                />
                <div className="mt-1 flex items-center space-x-2 text-xs text-muted-foreground">
                  <Shield className="h-3 w-3" />
                  <span>Token is used only for this session and not saved.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Test and Save */}
          <div className="flex items-center justify-end space-x-4 border-t pt-4">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center space-x-2"
            >
              {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={isTesting}
              className="flex items-center space-x-2"
            >
              {isTesting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <TestTube className="h-4 w-4" />}
              <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Page Retrieval */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-green-200 bg-green-100">
              <Eye className="h-5 w-5 text-green-700" />
            </div>
            <div>
              <CardTitle className="text-base">Preview Page Content</CardTitle>
              <CardDescription>Enter a Page ID to fetch and preview content</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="pageId">Page ID</Label>
              <Input
                id="pageId"
                value={pageId}
                onChange={(e) => setPageId(e.target.value)}
                placeholder="e.g. 1388483969 or paste a full Confluence URL"
              />
              <div className="mt-3">
                <Button onClick={handleFetchPage} disabled={isFetching} className="flex items-center space-x-2">
                  {isFetching ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                  <span>{isFetching ? 'Fetching...' : 'Fetch Page'}</span>
                </Button>
              </div>
            </div>
            <div>
              <div className="rounded-lg border bg-gray-50 p-3">
                <div className="mb-2 text-sm text-muted-foreground">Preview</div>
                {preview?.ok && preview.page ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-medium">{preview.page.title}</span>
                      {preview.page.space?.key && (
                        <span className="rounded bg-white px-2 py-0.5 text-xs">Space: {preview.page.space.key}</span>
                      )}
                      {typeof preview.page.version?.number === 'number' && (
                        <span className="rounded bg-white px-2 py-0.5 text-xs">v{preview.page.version.number}</span>
                      )}
                      {preview.page.links?.webui && (
                        <a href={preview.page.links.webui} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline">Open in Confluence</a>
                      )}
                    </div>

                    {/* Render HTML view if present; otherwise fallback to Storage XHTML preview */}
                    {preview.page.contentViewHtml ? (
                      <div className="prose max-h-96 overflow-auto rounded bg-white p-4 text-sm" dangerouslySetInnerHTML={{ __html: preview.page.contentViewHtml }} />
                    ) : (
                      <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded bg-white p-3 text-xs">{preview.page.contentStorage || preview.page.snippet}</pre>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No content fetched yet.</div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Network connectivity help section - shown when there are DNS/network errors */}
      {lastAction.type === 'test' && !lastAction.ok && lastAction.message?.includes('DNS resolution failed') && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </div>
              <CardTitle className="text-sm text-amber-800">Network Connectivity Issue</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-amber-700">
              The Confluence server cannot be reached. This is likely due to one of the following reasons:
            </p>
            <ul className="ml-4 list-disc space-y-1 text-sm text-amber-700">
              <li><strong>VPN Required:</strong> You may need to connect to your corporate VPN to access the Confluence server</li>
              <li><strong>Incorrect URL:</strong> Verify that the Base URL is correct (e.g., https://confluence.yourcompany.com)</li>
              <li><strong>Network Restrictions:</strong> Your network may be blocking access to the Confluence server</li>
              <li><strong>Server Unavailable:</strong> The Confluence server may be temporarily down</li>
            </ul>
            <div className="rounded bg-amber-100 p-3">
              <p className="text-xs text-amber-800">
                <strong>Quick Fix:</strong> Try connecting to your corporate VPN and test the connection again. 
                If you're unsure about the correct URL, contact your IT administrator.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


