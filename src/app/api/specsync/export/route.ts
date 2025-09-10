import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabaseClient } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

// POST /api/specsync/export
// Safely exports local SpecSync cache to Supabase when service role is available.
// - No-op if Supabase is not enabled
// - No-op without SUPABASE_SERVICE_ROLE_KEY
// - Idempotent upsert by requirement_id

export async function POST(_req: NextRequest) {
  try {
    // Read local cache from request (client sends current cache)
    const body = await _req.json().catch(() => ({}));
    const items = Array.isArray(body?.items) ? body.items : [];
    const projectId: string | undefined = body?.projectId;
    const devServiceKey: string | undefined = body?.serviceRoleKey;
    const devUrl: string | undefined = body?.supabaseUrl;

    if (!items.length) {
      return NextResponse.json({ success: false, message: 'No items to export' }, { status: 400 });
    }

    // Upsert each item to specsync_items
    const rows = items.map((it: any) => ({
      project_id: projectId || null,
      requirement_id: String(it.requirementId || it.id || ''),
      rephrased_requirement_id: String(it.rephrasedRequirementId || it.requirementId || ''),
      function_name: String(it.functionName || ''),
      capability: String(it.capability || ''),
      usecase1: String(it.usecase1 || ''),
      description: it.description || '',
      priority: it.priority || 'Medium',
      status: it.status || 'Identified',
      metadata: {
        domain: it.domain || '',
        vertical: it.vertical || '',
        af_level2: it.afLevel2 || '',
        reference_capability: it.referenceCapability || '',
      },
      updated_at: new Date().toISOString(),
    }));

    let sb = getServerSupabaseClient();
    // Dev override: allow UI-provided service key + URL in non-production only
    if (!sb && process.env.NODE_ENV !== 'production' && devServiceKey && devUrl) {
      try {
        sb = createClient(devUrl, devServiceKey);
      } catch {}
    }
    if (!sb) return NextResponse.json({ success: false, message: 'Service role client not available' }, { status: 400 });
    // Use upsert on (project_id, requirement_id) if you add a unique constraint later
    const { error } = await sb.from('specsync_items').upsert(rows, { onConflict: 'requirement_id' });
    if (error) throw error;

    return NextResponse.json({ success: true, exported: rows.length });
  } catch (err) {
    console.error('SpecSync export failed:', err);
    return NextResponse.json(
      { success: false, message: 'Export failed', error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}


