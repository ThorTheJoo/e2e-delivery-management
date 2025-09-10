import { SpecSyncItem, SpecSyncState, TMFFunction } from '@/types';
import { supabase } from '@/lib/supabase';
import { getActiveDataSource } from '@/lib/data-source';
import { TMFReferenceService } from '@/lib/tmf-reference-service-new';

// Map SpecSync items to existing TMF functions
export function mapSpecSyncToTMFunctions(
  items: SpecSyncItem[],
  tmfFunctions: TMFFunction[],
): {
  countsByFunction: Record<string, number>;
  assignments: Array<{ requirementId: string; functionId: string }>;
  unmapped: number;
} {
  const countsByFunction: Record<string, number> = {};
  const assignments: Array<{ requirementId: string; functionId: string }> = [];
  let unmapped = 0;
  const seenLocal = new Set();

  // Build a label-to-id map from TMF functions
  const labelToId = new Map<string, string>();
  tmfFunctions.forEach((func) => {
    const normalizedName = func.function_name.toLowerCase().trim();
    labelToId.set(normalizedName, func.id);
  });

  const normalize = (s: string) =>
    String(s || '')
      .trim()
      .toLowerCase();

  items.forEach((item) => {
    const rephrasedFunctionName = normalize(item['Rephrased Function Name'] || item.capability);
    const af2Name = normalize(item.afLevel2);
    const funcName = normalize(item.functionName);
    const domain = normalize(item.domain);

    let functionId: string | null = null;

    // Try to find exact matches first - prioritize Rephrased Function Name
    if (rephrasedFunctionName && labelToId.has(rephrasedFunctionName)) {
      functionId = labelToId.get(rephrasedFunctionName)!;
    } else if (af2Name && labelToId.has(af2Name)) {
      functionId = labelToId.get(af2Name)!;
    } else if (funcName && labelToId.has(funcName)) {
      functionId = labelToId.get(funcName)!;
    }

    // Try fuzzy matching if exact match not found
    if (!functionId) {
      for (const [normalizedName, id] of Array.from(labelToId.entries())) {
        if (rephrasedFunctionName && (
          normalizedName.includes(rephrasedFunctionName) ||
          rephrasedFunctionName.includes(normalizedName)
        )) {
          functionId = id;
          break;
        }
      }
    }

    if (functionId) {
      const rid = String(item.rephrasedRequirementId || item.requirementId || Math.random());
      const key = `${functionId}||${rid}`;

      if (!seenLocal.has(key)) {
        seenLocal.add(key);
        countsByFunction[functionId] = (countsByFunction[functionId] || 0) + 1;
        assignments.push({ requirementId: rid, functionId: functionId });
      }
    } else {
      unmapped++;
    }
  });

  return { countsByFunction, assignments, unmapped };
}

// Calculate use case counts per function from SpecSync data
export function calculateUseCaseCountsByFunction(
  items: SpecSyncItem[],
  tmfFunctions: TMFFunction[],
): Record<string, number> {
  const useCaseCountsByFunction: Record<string, number> = {};
  const functionUseCases: Record<string, Set<string>> = {};

  // Build a label-to-id map from TMF functions
  const labelToId = new Map<string, string>();
  tmfFunctions.forEach((func) => {
    const normalizedName = func.function_name.toLowerCase().trim();
    labelToId.set(normalizedName, func.id);
  });

  const normalize = (s: string) =>
    String(s || '')
      .trim()
      .toLowerCase();

  items.forEach((item) => {
    const rephrasedFunctionName = normalize(item['Rephrased Function Name'] || item.capability);
    const af2Name = normalize(item.afLevel2);
    const funcName = normalize(item.functionName);
    const domain = normalize(item.domain);
    const useCase = item.usecase1?.trim();

    if (!useCase) return; // Skip items without use case

    let functionId: string | null = null;

    // Try to find exact matches first - prioritize Rephrased Function Name
    if (rephrasedFunctionName && labelToId.has(rephrasedFunctionName)) {
      functionId = labelToId.get(rephrasedFunctionName)!;
    } else if (af2Name && labelToId.has(af2Name)) {
      functionId = labelToId.get(af2Name)!;
    } else if (funcName && labelToId.has(funcName)) {
      functionId = labelToId.get(funcName)!;
    }

    // Try fuzzy matching if exact match not found
    if (!functionId) {
      for (const [normalizedName, id] of Array.from(labelToId.entries())) {
        if (rephrasedFunctionName && (
          normalizedName.includes(rephrasedFunctionName) ||
          rephrasedFunctionName.includes(normalizedName)
        )) {
          functionId = id;
          break;
        }
      }
    }

    if (functionId) {
      if (!functionUseCases[functionId]) {
        functionUseCases[functionId] = new Set();
      }
      functionUseCases[functionId].add(useCase);
    }
  });

  // Convert sets to counts
  Object.entries(functionUseCases).forEach(([functionId, useCases]) => {
    useCaseCountsByFunction[functionId] = useCases.size;
  });

  return useCaseCountsByFunction;
}

// Generate dynamic function IDs for unmapped items
export function generateDynamicFunctionId(basis: string): string {
  const normalized = String(basis || 'function')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `imported-${normalized}`;
}

// Create dynamic functions for unmapped items
export function createDynamicFunctions(
  items: SpecSyncItem[],
): Record<string, { id: string; name: string; description: string; requirementCount: number }> {
  const dynamicGroups: Record<
    string,
    { id: string; name: string; description: string; requirementCount: number }
  > = {};

  items.forEach((item) => {
    // For now, we'll create dynamic functions for all items
    // In a real implementation, you might want to track which items are mapped
    const domain = item.domain || 'Imported';
    const functionName = item['Rephrased Function Name'] || item.afLevel2 || item.functionName || 'Unknown';

    if (!dynamicGroups[domain]) {
      dynamicGroups[domain] = {
        id: generateDynamicFunctionId(functionName),
        name: functionName,
        description: item.referenceCapability || '',
        requirementCount: 1,
      };
    } else {
      dynamicGroups[domain].requirementCount++;
    }
  });

  return dynamicGroups;
}

// Calculate effort overlay for SpecSync requirements
export function computeSpecSyncEffortOverlay(
  state: SpecSyncState,
  tmfFunctions: TMFFunction[],
): { total: number; breakdown: Record<string, number> } {
  if (!state.includeInEstimates || !state.items.length) {
    return { total: 0, breakdown: {} };
  }

  const mapping = mapSpecSyncToTMFunctions(state.items, tmfFunctions);
  const breakdown: Record<string, number> = {};
  let total = 0;

  Object.entries(mapping.countsByFunction).forEach(([functionId, count]) => {
    const tmfFunction = tmfFunctions.find((func) => func.id === functionId);
    if (tmfFunction) {
      // For now, use a default effort calculation since TMF functions don't have baseEffort
      // In a real implementation, you might want to add effort data to TMF functions
      const effort = 10; // Default effort per function
      breakdown[functionId] = effort * count;
      total += effort * count;
    }
  });

  return { total, breakdown };
}


// Save SpecSync data to localStorage
export function saveSpecSyncData(state: SpecSyncState): void {
  try {
    localStorage.setItem('specsync-data', JSON.stringify(state));
  } catch (err) {
    console.warn('Failed saving SpecSync data', err);
  }
}

// Load SpecSync data from localStorage
export function loadSpecSyncData(): SpecSyncState | null {
  // Hybrid: prefer Supabase if enabled; otherwise use localStorage as before
  try {
    if (typeof window !== 'undefined' && getActiveDataSource() === 'supabase') {
      // NOTE: This synchronous wrapper returns null immediately; the caller already
      // handles default data when null is returned. For incremental adoption without
      // refactors, we perform an async fetch-and-cache pattern below.
      void (async () => {
        try {
          const { data, error } = await supabase
            .from('specsync_items')
            .select('*')
            .limit(1000);
          if (error) throw error;

          const items: SpecSyncItem[] = (data || []).map((row: any) => ({
            id: String(row.id || row.requirement_id || cryptoRandomId()),
            requirementId: String(row.requirement_id || row.id || ''),
            rephrasedRequirementId: String(row.rephrased_requirement_id || row.requirement_id || ''),
            domain: String(row.metadata?.domain ?? ''),
            vertical: String(row.metadata?.vertical ?? ''),
            functionName: String(row.function_name ?? ''),
            afLevel2: String(row.metadata?.af_level2 ?? row.function_name ?? ''),
            capability: String(row.capability ?? ''),
            referenceCapability: String(row.metadata?.reference_capability ?? row.capability ?? ''),
            usecase1: String(row.usecase1 ?? ''),
            description: row.description ?? '',
            priority: row.priority ?? 'Medium',
            status: row.status ?? 'Identified',
          }));

          // Compute counts
          const domainsCount: Record<string, number> = {};
          let useCases = 0;
          for (const it of items) {
            if (it.domain) domainsCount[it.domain] = (domainsCount[it.domain] || 0) + 1;
            if (it.usecase1 && it.usecase1.trim().length > 0) useCases++;
          }

          const state: SpecSyncState = {
            fileName: 'supabase',
            importedAt: Date.now(),
            includeInEstimates: true,
            counts: {
              totalRequirements: items.length,
              domains: domainsCount,
              useCases,
            },
            items,
            selectedCapabilityIds: [],
          };

          // Cache to localStorage so existing flows remain synchronous/read-only friendly
          try {
            localStorage.setItem('specsync-data', JSON.stringify(state));
          } catch {}
        } catch (err) {
          console.warn('Supabase SpecSync fetch failed; staying on local cache.', err);
        }
      })();
    }

    // Always return the current local cache (may be filled by the async task above)
    const raw = typeof window !== 'undefined' ? localStorage.getItem('specsync-data') : null;
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn('Failed loading SpecSync data', err);
    return null;
  }
}

// Clear SpecSync data from localStorage
export function clearSpecSyncData(): void {
  try {
    localStorage.removeItem('specsync-data');
  } catch (err) {
    console.warn('Failed clearing SpecSync data', err);
  }
}

function cryptoRandomId(): string {
  try {
    // Browser crypto API
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    return Math.random().toString(36).slice(2);
  }
}
