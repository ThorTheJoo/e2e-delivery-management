import { SpecSyncItem, SpecSyncState, TMFFunction, TMFMapping } from '@/types';
import { TMFReferenceService } from './tmf-reference-service-new';

// Map SpecSync items to TMF functions
export async function mapSpecSyncToTMFunctions(
  items: SpecSyncItem[],
): Promise<{
  countsByFunction: Record<string, number>;
  assignments: Array<{ requirementId: string; functionId: string; confidence: number }>;
  unmapped: number;
  mappings: TMFMapping[];
}> {
  const countsByFunction: Record<string, number> = {};
  const assignments: Array<{ requirementId: string; functionId: string; confidence: number }> = [];
  const mappings: TMFMapping[] = [];
  let unmapped = 0;
  const seenLocal = new Set();

  for (const item of items) {
    const requirementId = String(item.rephrasedRequirementId || item.requirementId || Math.random());
    
    // Try to find the best matching TMF function
    const match = await TMFReferenceService.findBestMatch(
      item.functionName,
      item.domain
    );

    if (match) {
      const key = `${match.function.id}||${requirementId}`;

      if (!seenLocal.has(key)) {
        seenLocal.add(key);
        countsByFunction[match.function.id] = (countsByFunction[match.function.id] || 0) + 1;
        assignments.push({ 
          requirementId, 
          functionId: match.function.id, 
          confidence: match.confidence 
        });

        // Create mapping in database
        const mapping = await TMFReferenceService.createMapping(
          requirementId,
          match.function.id,
          match.confidence
        );

        if (mapping) {
          mappings.push(mapping);
        }
      }
    } else {
      unmapped++;
    }
  }

  return { countsByFunction, assignments, unmapped, mappings };
}

// Calculate use case counts per TMF function from SpecSync data
export async function calculateUseCaseCountsByTMFunction(
  items: SpecSyncItem[],
): Promise<Record<string, number>> {
  const useCaseCountsByFunction: Record<string, number> = {};
  const functionUseCases: Record<string, Set<string>> = {};

  for (const item of items) {
    const useCase = item.usecase1?.trim();
    if (!useCase) continue; // Skip items without use case

    // Try to find the best matching TMF function
    const match = await TMFReferenceService.findBestMatch(
      item.functionName,
      item.domain
    );

    if (match) {
      if (!functionUseCases[match.function.id]) {
        functionUseCases[match.function.id] = new Set();
      }
      functionUseCases[match.function.id].add(useCase);
    }
  }

  // Convert sets to counts
  Object.entries(functionUseCases).forEach(([functionId, useCases]) => {
    useCaseCountsByFunction[functionId] = useCases.size;
  });

  return useCaseCountsByFunction;
}

// Get mapped TMF functions from SpecSync data
export async function getMappedTMFunctions(
  items: SpecSyncItem[],
): Promise<{ function: TMFFunction; count: number; confidence: number }[]> {
  const functionCounts: Record<string, { count: number; confidence: number }> = {};
  const functionMap: Record<string, TMFFunction> = {};

  for (const item of items) {
    const match = await TMFReferenceService.findBestMatch(
      item.functionName,
      item.domain
    );

    if (match) {
      const functionId = match.function.id;
      
      if (!functionCounts[functionId]) {
        functionCounts[functionId] = { count: 0, confidence: 0 };
        functionMap[functionId] = match.function;
      }
      
      functionCounts[functionId].count++;
      functionCounts[functionId].confidence = Math.max(
        functionCounts[functionId].confidence,
        match.confidence
      );
    }
  }

  return Object.entries(functionCounts).map(([functionId, data]) => ({
    function: functionMap[functionId],
    count: data.count,
    confidence: data.confidence
  }));
}

// Get unmapped SpecSync items
export async function getUnmappedSpecSyncItems(
  items: SpecSyncItem[],
): Promise<SpecSyncItem[]> {
  const unmappedItems: SpecSyncItem[] = [];

  for (const item of items) {
    const match = await TMFReferenceService.findBestMatch(
      item.functionName,
      item.domain
    );

    if (!match) {
      unmappedItems.push(item);
    }
  }

  return unmappedItems;
}

// Get available TMF functions for custom domain addition
export async function getAvailableTMFunctionsForCustomDomain(
  mappedFunctionIds: string[],
  domainId?: string,
): Promise<TMFFunction[]> {
  if (mappedFunctionIds.length === 0) {
    // If no functions are mapped, return all functions or functions from specific domain
    if (domainId) {
      return await TMFReferenceService.getFunctionsByDomain(domainId);
    } else {
      return await TMFReferenceService.getAllFunctions();
    }
  }

  // Get unmapped functions
  return await TMFReferenceService.getUnmappedFunctions(mappedFunctionIds);
}

// Get TMF functions grouped by domain
export async function getTMFunctionsGroupedByDomain(): Promise<Record<string, TMFFunction[]>> {
  const allFunctions = await TMFReferenceService.getAllFunctions();
  const grouped: Record<string, TMFFunction[]> = {};

  allFunctions.forEach(func => {
    const domainName = func.domain_name || 'Unknown';
    if (!grouped[domainName]) {
      grouped[domainName] = [];
    }
    grouped[domainName].push(func);
  });

  return grouped;
}

// Search TMF functions with domain context
export async function searchTMFunctionsWithDomain(
  query: string,
  domainName?: string,
): Promise<TMFFunction[]> {
  if (domainName) {
    // First get the domain ID
    const domains = await TMFReferenceService.getDomains();
    const domain = domains.find(d => d.name === domainName);
    
    if (domain) {
      return await TMFReferenceService.searchFunctions(query, domain.id);
    }
  }

  return await TMFReferenceService.searchFunctions(query);
}

// Calculate effort overlay for SpecSync requirements (placeholder - would need effort data)
export async function computeSpecSyncEffortOverlayForTMFunctions(
  state: SpecSyncState,
): Promise<{ total: number; breakdown: Record<string, number> }> {
  if (!state.includeInEstimates || !state.items.length) {
    return { total: 0, breakdown: {} };
  }

  const mapping = await mapSpecSyncToTMFunctions(state.items);
  const breakdown: Record<string, number> = {};
  let total = 0;

  // For now, use a simple effort calculation
  // In a real implementation, you would have effort data for each TMF function
  const baseEffortPerFunction = 10; // Placeholder effort value

  Object.entries(mapping.countsByFunction).forEach(([functionId, count]) => {
    const effort = baseEffortPerFunction * count;
    breakdown[functionId] = effort;
    total += effort;
  });

  return { total, breakdown };
}

// Save SpecSync data with TMF function mappings
export async function saveSpecSyncDataWithTMFMappings(state: SpecSyncState): Promise<void> {
  try {
    // Save to localStorage as before
    if (typeof window !== 'undefined') {
      localStorage.setItem('specsync-data', JSON.stringify(state));
    }

    // Also create TMF function mappings
    await mapSpecSyncToTMFunctions(state.items);
  } catch (err) {
    console.warn('Failed saving SpecSync data with TMF mappings', err);
  }
}

// Load SpecSync data and enrich with TMF function mappings
export async function loadSpecSyncDataWithTMFMappings(): Promise<{
  state: SpecSyncState | null;
  mappings: TMFMapping[];
  mappedFunctions: { function: TMFFunction; count: number; confidence: number }[];
}> {
  try {
    // Load basic SpecSync data
    const raw = typeof window !== 'undefined' ? localStorage.getItem('specsync-data') : null;
    const state = raw ? JSON.parse(raw) : null;

    if (!state || !state.items) {
      return { state: null, mappings: [], mappedFunctions: [] };
    }

    // Get TMF function mappings
    const mappings = await TMFReferenceService.getAllMappings();
    const mappedFunctions = await getMappedTMFunctions(state.items);

    return { state, mappings, mappedFunctions };
  } catch (err) {
    console.warn('Failed loading SpecSync data with TMF mappings', err);
    return { state: null, mappings: [], mappedFunctions: [] };
  }
}

// Clear SpecSync data and TMF function mappings
export async function clearSpecSyncDataWithTMFMappings(): Promise<void> {
  try {
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('specsync-data');
    }

    // Clear TMF function mappings
    const mappings = await TMFReferenceService.getAllMappings();
    for (const mapping of mappings) {
      await TMFReferenceService.deleteMapping(mapping.id);
    }
  } catch (err) {
    console.warn('Failed clearing SpecSync data with TMF mappings', err);
  }
}
