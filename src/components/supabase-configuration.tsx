'use client';

import { useEffect, useMemo, useState } from 'react';
import { getDataSourceStatus, getModuleMode, setModuleMode, getActiveDataSource } from '@/lib/data-source';
import { getBrowserSupabaseClient, TABLES, getStoredSupabaseConfig } from '@/lib/supabase';

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
  const [showAdvanced, setShowAdvanced] = useState(false);
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
  const [connectStatus, setConnectStatus] = useState<'unknown' | 'ok' | 'fail'>('unknown');
  const [selectedTable, setSelectedTable] = useState<string>('projects');
  const [tableData, setTableData] = useState<any[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [tableError, setTableError] = useState<string | null>(null);

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

    // Load initial table data
    if (getActiveDataSource() === 'supabase') {
      loadTableData(selectedTable);
    }
  }, [selectedTable]);

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

      // Get stored credentials
      const storedConfig = getStoredSupabaseConfig();
      const serviceKey = storedConfig?.serviceKey || serviceRole;
      const supabaseUrl = storedConfig?.url || url;

      console.log('Exporting SpecSync data:', {
        itemsCount: parsed.items?.length || 0,
        hasStoredConfig: !!storedConfig,
        hasServiceKey: !!serviceKey,
        hasUrl: !!supabaseUrl
      });

      const res = await fetch('/api/specsync/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: parsed.items || [],
          serviceRoleKey: serviceKey || undefined,
          supabaseUrl: supabaseUrl || undefined,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('API Error:', res.status, errorText);
        let errorMessage = `API Error ${res.status}`;

        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch (e) {
          // If it's not JSON, use the raw text
          errorMessage = errorText || errorMessage;
        }

        throw new Error(errorMessage);
      }

      const json = await res.json();
      if (!json.success) {
        const errorMsg = json.details || json.message || json.error || 'Export failed';
        throw new Error(errorMsg);
      }

      setMessage(`✅ Successfully exported ${json.exported} items to Supabase!`);
    } catch (e: any) {
      console.error('Export error:', e);
      setMessage(`❌ Export failed: ${e?.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      localStorage.setItem('supabaseConfig', JSON.stringify({ url, anonKey }));
      if (serviceRole) localStorage.setItem('supabase.serviceRole.hint', serviceRole);
      setStatus(getDataSourceStatus());

      // Test the configuration immediately
      const testMessage = await testConfiguration();
      setMessage(`✅ Configuration saved! ${testMessage}`);
    } catch (e: any) {
      setMessage(`❌ Failed saving configuration: ${e?.message || 'Unknown error'}`);
    }
  };

  const testConfiguration = async (): Promise<string> => {
    try {
      const response = await fetch('/api/specsync/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [],
          serviceRoleKey: serviceRole || undefined,
          supabaseUrl: url || undefined,
        }),
      });

      if (response.ok) {
        return 'Configuration is working correctly.';
      } else {
        const error = await response.json();
        return `Configuration test failed: ${error.message}`;
      }
    } catch (error: any) {
      return `Configuration test failed: ${error.message}`;
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
      // Simple connectivity probe (select 1 from projects or any small table)
      const probe = await sb.from(TABLES.PROJECTS).select('*', { head: true, count: 'exact' }).limit(1);
      setConnectStatus(!probe.error ? 'ok' : 'fail');
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

  const handleTableSelect = async (tableName: string) => {
    setSelectedTable(tableName);
    await loadTableData(tableName);
  };

  const loadTableData = async (tableName: string) => {
    setTableLoading(true);
    setTableError(null);
    setTableData([]);

    try {
      const sb = getBrowserSupabaseClient();

      // Try to load data ordered by created_at, but fall back to just selecting all if the column doesn't exist
      const query = sb.from(tableName).select('*').limit(10);

      // First try with ordering by created_at
      try {
        const result = await query.order('created_at', { ascending: false });
        if (result.error) throw result.error;
        setTableData(result.data || []);
      } catch (orderError) {
        // If ordering by created_at fails, try without ordering
        console.warn(`Could not order by created_at for table ${tableName}, loading without ordering`);
        try {
          const result = await sb.from(tableName).select('*').limit(10);
          if (result.error) throw result.error;
          setTableData(result.data || []);
        } catch (selectError) {
          throw selectError;
        }
      }
    } catch (e: any) {
      console.error(`Failed to load data from table ${tableName}:`, e);
      if (e.message && e.message.includes('does not exist')) {
        setTableError(`Table '${tableName}' does not exist yet. You may need to create it first.`);
      } else {
        setTableError(e?.message || 'Failed to load table data');
      }
    } finally {
      setTableLoading(false);
    }
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    if (value instanceof Date) return value.toISOString();
    return String(value);
  };

  const truncateValue = (value: string, maxLength: number = 50): string => {
    if (value.length <= maxLength) return value;
    return value.substring(0, maxLength) + '...';
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
        <h4 className="mb-2 font-medium">Database Preview & Explorer</h4>

        {/* Connection Status */}
        <div className="mb-4 text-sm">
          Connection: {connectStatus === 'ok' ? (
            <span className="rounded bg-green-100 px-2 py-0.5 text-green-700">✅ Connected</span>
          ) : connectStatus === 'fail' ? (
            <span className="rounded bg-red-100 px-2 py-0.5 text-red-700">❌ Failed</span>
          ) : (
            <span className="rounded bg-muted px-2 py-0.5">⏳ Checking...</span>
          )}
        </div>

        {/* Table Counts Overview */}
        <div className="mb-4">
          <h5 className="text-sm font-medium mb-2">Table Counts</h5>
          <div className="grid gap-2 md:grid-cols-3 text-sm">
            <div className="rounded-md border p-2">
              <div className="font-medium text-xs">TMF Reference Domains</div>
              <div className="text-lg font-bold">{preview.tmfDomains}</div>
            </div>
            <div className="rounded-md border p-2">
              <div className="font-medium text-xs">TMF Reference Capabilities</div>
              <div className="text-lg font-bold">{preview.tmfCapabilities}</div>
            </div>
            <div className="rounded-md border p-2">
              <div className="font-medium text-xs">User Domains</div>
              <div className="text-lg font-bold">{preview.userDomains}</div>
            </div>
            <div className="rounded-md border p-2">
              <div className="font-medium text-xs">User Capabilities</div>
              <div className="text-lg font-bold">{preview.userCapabilities}</div>
            </div>
            <div className="rounded-md border p-2">
              <div className="font-medium text-xs">SpecSync Items</div>
              <div className="text-lg font-bold">{preview.specsyncItems}</div>
            </div>
            <div className="rounded-md border p-2">
              <div className="font-medium text-xs">CETv22 Data</div>
              <div className="text-lg font-bold">{preview.cetv22Count}</div>
            </div>
          </div>
        </div>

        {/* Table Selector and Data Viewer */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-4">
            <h5 className="text-sm font-medium">Table Data Explorer</h5>
            <button
              className="rounded-md bg-muted px-3 py-1 text-xs"
              onClick={handleRefreshPreview}
              aria-label="Refresh preview"
            >
              Refresh Counts
            </button>
          </div>

          {/* Table Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Select Table:</label>
            <select
              value={selectedTable}
              onChange={(e) => handleTableSelect(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="projects">Projects</option>
              <option value="tmf_reference_domains">TMF Reference Domains</option>
              <option value="tmf_reference_capabilities">TMF Reference Capabilities</option>
              <option value="user_domains">User Domains</option>
              <option value="user_capabilities">User Capabilities</option>
              <option value="specsync_items">SpecSync Items</option>
              <option value="blue_dolphin_objects">Blue Dolphin Objects</option>
              <option value="cetv22_data">CETv22 Data</option>
              <option value="work_packages">Work Packages</option>
              <option value="bill_of_materials">Bill of Materials</option>
              <option value="integration_configs">Integration Configs</option>
              <option value="user_preferences">User Preferences</option>
              <option value="filter_categories">Filter Categories</option>
              <option value="filter_options">Filter Options</option>
            </select>
          </div>

          {/* Table Data Display */}
          <div className="border rounded-md">
            <div className="bg-gray-50 px-4 py-2 border-b">
              <h6 className="text-sm font-medium">{selectedTable} Records (Last 10)</h6>
              {tableLoading && <span className="text-xs text-gray-500 ml-2">Loading...</span>}
            </div>

            {tableError ? (
              <div className="p-4 text-red-600 text-sm">
                Error: {tableError}
              </div>
            ) : tableData.length === 0 ? (
              <div className="p-4 text-gray-500 text-sm">
                {tableLoading ? 'Loading records...' : 'No records found'}
              </div>
            ) : (
              <div className="max-h-96 overflow-auto">
                {tableData.map((record, index) => (
                  <div key={record.id || index} className="border-b last:border-b-0 p-4">
                    <div className="grid gap-2 text-sm">
                      {Object.entries(record).map(([key, value]) => (
                        <div key={key} className="flex">
                          <span className="font-medium text-gray-600 w-1/3 truncate">{key}:</span>
                          <span className="text-gray-900 w-2/3 font-mono text-xs">
                            {truncateValue(formatValue(value), 100)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-2 text-xs text-gray-500">
            Showing up to 10 records ordered by creation date (newest first). All data is read-only.
          </div>
        </div>
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
        <h4 className="mb-2 font-medium">🚀 Quick Setup (No .env.local needed!)</h4>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <span className="text-green-600 font-bold">1.</span>
            <div>
              <p className="font-medium">Fill in your Supabase credentials above</p>
              <p className="text-muted-foreground">URL, Anon Key, and Service Role Key from your Supabase dashboard</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600 font-bold">2.</span>
            <div>
              <p className="font-medium">Click "Save Configuration (UI)"</p>
              <p className="text-muted-foreground">This stores everything in your browser - no files needed!</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600 font-bold">3.</span>
            <div>
              <p className="font-medium">Switch to "Database (Supabase)" mode</p>
              <p className="text-muted-foreground">Enable Supabase for all your data operations</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600 font-bold">4.</span>
            <div>
              <p className="font-medium">Test with "Export SpecSync Now"</p>
              <p className="text-muted-foreground">Verify everything works without touching any files!</p>
            </div>
          </div>
        </div>
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-800">
            <strong>💡 Pro tip:</strong> This UI-based approach works immediately and doesn't require file system access or server restarts. Perfect for development and testing!
          </p>
        </div>
      </div>

      <div className="rounded-md border p-4">
        <h4 className="mb-2 font-medium">Advanced: .env.local Setup (Optional)</h4>
        <details className="text-sm">
          <summary className="cursor-pointer font-medium mb-2">For production deployments or permanent setup</summary>
          <pre className="overflow-x-auto rounded bg-muted p-3 text-xs">
{`NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_DATA_SOURCE=supabase
# Server-only (for export):
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key`}
          </pre>
          <p className="mt-2 text-xs text-muted-foreground">
            Create this file in your project root for permanent configuration. The UI method above works without this file.
          </p>
        </details>
      </div>
    </section>
  );
}


