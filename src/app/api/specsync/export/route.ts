import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabaseClient, getConfiguredSupabaseClient } from '@/lib/supabase';

// POST /api/specsync/export
// Safely exports local SpecSync cache to Supabase when service role is available.
// - No-op if Supabase is not enabled
// - No-op without SUPABASE_SERVICE_ROLE_KEY
// - Idempotent upsert by requirement_id

export async function POST(_req: NextRequest) {
  try {
    console.log('SpecSync export API called');

    // Read local cache from request (client sends current cache)
    const body = await _req.json().catch((error) => {
      console.error('Failed to parse request body:', error);
      return {};
    });

    console.log('Request body received:', {
      hasItems: Array.isArray(body?.items),
      itemsCount: body?.items?.length || 0,
      hasServiceKey: !!body?.serviceRoleKey,
      hasUrl: !!body?.supabaseUrl
    });

    const items = Array.isArray(body?.items) ? body.items : [];
    const projectId: string | undefined = body?.projectId;
    const devServiceKey: string | undefined = body?.serviceRoleKey;
    const devUrl: string | undefined = body?.supabaseUrl;

    if (!items.length) {
      console.log('No items to export');
      return NextResponse.json({
        success: false,
        message: 'No items to export',
        details: 'Please ensure you have SpecSync data loaded before exporting'
      }, { status: 400 });
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

    // Try to get a Supabase client using the provided credentials
    let sb = null;

    // First try with provided credentials from UI
    if (devServiceKey && devUrl) {
      sb = getConfiguredSupabaseClient(devServiceKey, devUrl);
    }

    // Fallback to environment variables
    if (!sb) {
      sb = getServerSupabaseClient();
    }

    // Final fallback for development
    if (!sb && process.env.NODE_ENV !== 'production') {
      console.warn('No Supabase configuration found. Please configure credentials in the UI.');
    }

    if (!sb) {
      console.log('No Supabase client available');
      return NextResponse.json({
        success: false,
        message: 'Service role client not available. Please configure Supabase credentials in the UI or set environment variables.',
        details: 'Try: 1) Configure in Supabase Configuration UI, or 2) Set .env.local file with SUPABASE_SERVICE_ROLE_KEY'
      }, { status: 400 });
    }

    console.log(`Attempting to export ${rows.length} items to Supabase`);

    // Use upsert with the composite unique constraint columns
    const { error } = await sb.from('specsync_items').upsert(rows, {
      onConflict: 'project_id,requirement_id'
    });

    if (error) {
      console.error('Supabase upsert error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    console.log(`Successfully exported ${rows.length} items to Supabase`);
    return NextResponse.json({
      success: true,
      exported: rows.length,
      message: `Successfully exported ${rows.length} items to Supabase`
    });

  } catch (err) {
    console.error('SpecSync export failed:', err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        success: false,
        message: 'Export failed',
        error: errorMessage,
        details: 'Check the server logs for more information'
      },
      { status: 500 },
    );
  }
}


