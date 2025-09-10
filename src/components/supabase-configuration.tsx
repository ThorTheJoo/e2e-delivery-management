'use client';

import { useEffect, useMemo, useState } from 'react';
import { getDataSourceStatus, getModuleMode, setModuleMode } from '@/lib/data-source';
import { getBrowserSupabaseClient, TABLES } from '@/lib/supabase';

interface EnvPreview {
  supabaseUrl: string;
  supabaseAnonKey: string;
  dataSource: string;
}

export function SupabaseConfiguration() {
  const [status, setStatus] = useState(getDataSourceStatus());
  const [mode, setMode] = useState<'local' | 'supabase'>(status.selected);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [serviceRole, setServiceRole] = useState('');
  const [moduleModes, setModuleModes] = useState<Record<string, 'local' | 'supabase'>>({
    tmf: getModuleMode('tmf'),
    specs: getModuleMode('specsync'),
    bd: getModuleMode('bluedolphin'),
    set: getModuleMode('set'),
    cet: getModuleMode('cet'),
  } as any);

  const [preview, setPreview] = useState<{
    tmfDomains: number;
    tmfCapabilities: number;
    userDomains: number;
    userCapabilities: number;
    specsyncItems: number;
    cetv22Count: number;
  }>({ tmfDomains: 0, tmfCapabilities: 0, userDomains: 0, userCapabilities: 0, specsyncItems: 0, cetv22Count: 0 });

  useEffect(() => {
    setStatus(getDataSourceStatus());
    setMode(getDataSourceStatus().selected);
    // Load UI-saved config
    try {
      const raw = localStorage.getItem('supabaseConfig');
      if (raw) {
        const cfg = JSON.parse(raw);
        setUrl(cfg?.url || '');
        setAnonKey(cfg?.anonKey || '');
      }
      const sr = localStorage.getItem('supabase.serviceRole.hint');
      if (sr) setServiceRole(sr);
    } catch {}
  }, []);

  const envPreview: EnvPreview = useMemo(
    () => ({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'missing',
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set' : 'missing',
      dataSource: process.env.NEXT_PUBLIC_DATA_SOURCE || 'local',
    }),
    [],
  );

  const handleSwitch = async (next: 'local' | 'supabase') => {
    setMode(next);
    setMessage(
      next === 'supabase'
        ? 'To enable Supabase, ensure .env.local has NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then restart dev server.'
        : 'Switched to local mode. If you had Supabase enabled, it will fall back automatically.',
    );
    try {
      localStorage.setItem('supabase.ui.mode', next);
      setStatus(getDataSourceStatus());
    } catch {}
  };

  const handleExportSpecSync = async () => {
    setSaving(true);
    try {
      const cache = typeof window !== 'undefined' ? localStorage.getItem('specsync-data') : null;
      const parsed = cache ? JSON.parse(cache) : { items: [] };
      const res = await fetch('/api/specsync/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: parsed.items || [] }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Export failed');
      setMessage(`Exported ${json.exported} items to Supabase.`);
    } catch (e: any) {
      setMessage(e?.message || 'Export failed. Ensure Supabase is enabled and service role key is configured on server.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveConfig = () => {
    try {
      localStorage.setItem('supabaseConfig', JSON.stringify({ url, anonKey }));
      if (serviceRole) localStorage.setItem('supabase.serviceRole.hint', serviceRole);
      setStatus(getDataSourceStatus());
      setMessage('Supabase configuration saved locally for UI use. For full runtime enablement in builds, also set .env.local and restart.');
    } catch (e: any) {
      setMessage(e?.message || 'Failed saving configuration');
    }
  };

  const handleModuleModeChange = (k: keyof typeof moduleModes, value: 'local' | 'supabase') => {
    const updated = { ...moduleModes, [k]: value } as any;
    setModuleModes(updated);
    // Persist per-module selection
    const keyMap: Record<string, 'tmf' | 'specsync' | 'bluedolphin' | 'set' | 'cet'> = {
      tmf: 'tmf',
      specs: 'specsync',
      bd: 'bluedolphin',
      set: 'set',
      cet: 'cet',
    };
    setModuleMode(keyMap[k], value);
  };

  const handleRefreshPreview = async () => {
    try {
      const sb = getBrowserSupabaseClient();
      const [d, c, ud, uc, s, cet] = await Promise.all([
        sb.from(TABLES.TMF_REFERENCE_DOMAINS).select('*', { count: 'exact', head: true }),
        sb.from(TABLES.TMF_REFERENCE_CAPABILITIES).select('*', { count: 'exact', head: true }),
        sb.from(TABLES.USER_DOMAINS).select('*', { count: 'exact', head: true }),
        sb.from(TABLES.USER_CAPABILITIES).select('*', { count: 'exact', head: true }),
        sb.from(TABLES.SPECSYNC_ITEMS).select('*', { count: 'exact', head: true }),
        sb.from(TABLES.CETV22_DATA).select('*', { count: 'exact', head: true }),
      ]);
      setPreview({
        tmfDomains: (d.count as any) || 0,
        tmfCapabilities: (c.count as any) || 0,
        userDomains: (ud.count as any) || 0,
        userCapabilities: (uc.count as any) || 0,
        specsyncItems: (s.count as any) || 0,
        cetv22Count: (cet.count as any) || 0,
      });
      setMessage('Preview refreshed from Supabase.');
    } catch (e: any) {
      setMessage(e?.message || 'Failed to refresh preview');
    }
  };

  return (
    <section className="space-y-4">
      <div className="rounded-md border p-4">
        <h3 className="mb-2 text-base font-semibold">Supabase Configuration</h3>
        <p className="text-sm text-muted-foreground">
          Configure Supabase and switch between Offline (Local Storage) and Database modes.
          The application will automatically fall back to Local when Supabase is not configured.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-md border p-4">
          <h4 className="mb-2 font-medium">Current Status</h4>
          <ul className="text-sm">
            <li>Selected data source: <span className="font-semibold">{status.selected}</span></li>
            <li>Env configured: <span className="font-semibold">{status.envConfigured ? 'yes' : 'no'}</span></li>
            {status.reasons.length > 0 && (
              <li className="mt-1 text-muted-foreground">{status.reasons.join(' ')}</li>
            )}
          </ul>
        </div>
        <div className="rounded-md border p-4">
          <h4 className="mb-2 font-medium">.env.local Preview</h4>
          <ul className="text-sm">
            <li>NEXT_PUBLIC_SUPABASE_URL: <span className="font-semibold">{envPreview.supabaseUrl}</span></li>
            <li>NEXT_PUBLIC_SUPABASE_ANON_KEY: <span className="font-semibold">{envPreview.supabaseAnonKey}</span></li>
            <li>NEXT_PUBLIC_DATA_SOURCE: <span className="font-semibold">{envPreview.dataSource}</span></li>
          </ul>
        </div>
      </div>

      <div className="rounded-md border p-4">
        <h4 className="mb-2 font-medium">Capture Configuration (UI-local)</h4>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">NEXT_PUBLIC_SUPABASE_URL</label>
            <input
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://<project>.supabase.co"
              aria-label="Supabase URL"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">NEXT_PUBLIC_SUPABASE_ANON_KEY</label>
            <input
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="anon key"
              aria-label="Supabase anon key"
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs text-muted-foreground">SUPABASE_SERVICE_ROLE_KEY (server-only hint)</label>
            <input
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={serviceRole}
              onChange={(e) => setServiceRole(e.target.value)}
              placeholder="service role key (do not expose to browser in production)"
              aria-label="Supabase service role key"
            />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button
            className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
            onClick={handleSaveConfig}
            aria-label="Save configuration"
          >
            Save Configuration (UI)
          </button>
          <span className="text-xs text-muted-foreground">This stores values locally so the UI can run in Supabase mode without editing files. For builds, also set .env.local.</span>
        </div>
      </div>

      <div className="rounded-md border p-4">
        <h4 className="mb-2 font-medium">Switch Data Source</h4>
        <div className="flex items-center gap-3">
          <button
            className={`rounded-md px-3 py-2 text-sm ${mode === 'local' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
            onClick={() => handleSwitch('local')}
            aria-label="Switch to Local Storage"
          >
            Offline (Local)
          </button>
          <button
            className={`rounded-md px-3 py-2 text-sm ${mode === 'supabase' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
            onClick={() => handleSwitch('supabase')}
            aria-label="Switch to Supabase"
          >
            Database (Supabase)
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Note: Switching here updates the intended mode in the UI. To fully enable Supabase,
          set env variables and restart the dev server. The runtime selection is ultimately
          controlled by env; the app will fall back to local when Supabase is not ready.
        </p>
      </div>

      <div className="rounded-md border p-4">
        <h4 className="mb-2 font-medium">What are you testing? (Per-module mode)</h4>
        <div className="grid gap-3 md:grid-cols-2">
          {[
            { key: 'tmf', label: 'TMF (reference & user selections)' },
            { key: 'specs', label: 'SpecSync import' },
            { key: 'bd', label: 'Blue Dolphin solution model' },
            { key: 'set', label: 'SET estimation' },
            { key: 'cet', label: 'CET service design' },
          ].map((m) => (
            <div key={m.key} className="flex items-center justify-between rounded-md border px-3 py-2">
              <span className="text-sm">{m.label}</span>
              <div className="flex items-center gap-2">
                <button
                  className={`rounded-md px-2 py-1 text-xs ${moduleModes[m.key as any] === 'local' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                  onClick={() => handleModuleModeChange(m.key as any, 'local')}
                >
                  Local
                </button>
                <button
                  className={`rounded-md px-2 py-1 text-xs ${moduleModes[m.key as any] === 'supabase' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                  onClick={() => handleModuleModeChange(m.key as any, 'supabase')}
                >
                  Supabase
                </button>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">These switches let you test modules independently: only selected modules will target Supabase for persistence/reads when possible; others continue to use local storage.</p>
      </div>

      <div className="rounded-md border p-4">
        <h4 className="mb-2 font-medium">Preview (Supabase read-only)</h4>
        <div className="grid gap-3 md:grid-cols-3 text-sm">
          <div className="rounded-md border p-3"><div className="font-medium">TMF Reference Domains</div><div>{preview.tmfDomains}</div></div>
          <div className="rounded-md border p-3"><div className="font-medium">TMF Reference Capabilities</div><div>{preview.tmfCapabilities}</div></div>
          <div className="rounded-md border p-3"><div className="font-medium">User Domains</div><div>{preview.userDomains}</div></div>
          <div className="rounded-md border p-3"><div className="font-medium">User Capabilities</div><div>{preview.userCapabilities}</div></div>
          <div className="rounded-md border p-3"><div className="font-medium">SpecSync Items</div><div>{preview.specsyncItems}</div></div>
          <div className="rounded-md border p-3"><div className="font-medium">CETv22 Data</div><div>{preview.cetv22Count}</div></div>
        </div>
        <button
          className="mt-3 rounded-md bg-muted px-3 py-2 text-xs"
          onClick={handleRefreshPreview}
          aria-label="Refresh preview"
        >
          Refresh Preview
        </button>
      </div>

      <div className="rounded-md border p-4">
        <h4 className="mb-2 font-medium">Export SpecSync Cache to Supabase</h4>
        <p className="text-sm text-muted-foreground">
          One-click export of the current local SpecSync cache to Supabase. Requires
          server-side service role configuration. Safe and idempotent.
        </p>
        <button
          className="mt-2 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50"
          onClick={handleExportSpecSync}
          disabled={saving}
          aria-label="Export SpecSync Cache"
        >
          {saving ? 'Exporting…' : 'Export SpecSync Now'}
        </button>
        {message && <p className="mt-2 text-xs text-muted-foreground">{message}</p>}
      </div>

      <div className="rounded-md border p-4">
        <h4 className="mb-2 font-medium">Required .env.local</h4>
        <pre className="overflow-x-auto rounded bg-muted p-3 text-xs">
{`NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_DATA_SOURCE=supabase
# Server-only (for export):
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key`}
        </pre>
      </div>
    </section>
  );
}


