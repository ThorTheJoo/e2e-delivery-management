import { SpecSyncItem, SpecSyncState, TMFFunction, TMFMapping } from '@/types';
import { TMFReferenceServiceClient as TMFReferenceService, TMFDomain } from './tmf-reference-service-client';

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

// Get missing domains from SpecSync data that aren't in current overview
export async function getMissingDomainsFromSpecSync(
  specSyncItems: SpecSyncItem[],
  currentDomains: any[]
): Promise<{ domain: string; functionCount: number; functions: string[] }[]> {
  const missingDomains: { domain: string; functionCount: number; functions: string[] }[] = [];
  
  // Extract unique domains from SpecSync data
  const specSyncDomains = new Set<string>();
  const domainFunctions: Record<string, Set<string>> = {};
  
  specSyncItems.forEach((item) => {
    if (item.domain) {
      const domain = item.domain.trim();
      specSyncDomains.add(domain);
      
      if (!domainFunctions[domain]) {
        domainFunctions[domain] = new Set();
      }
      
      // Add function names from various fields
      if (item['Rephrased Function Name']) {
        domainFunctions[domain].add(item['Rephrased Function Name'].trim());
      }
      if (item.capability) {
        domainFunctions[domain].add(item.capability.trim());
      }
      if (item.afLevel2) {
        domainFunctions[domain].add(item.afLevel2.trim());
      }
    }
  });
  
  // Check which SpecSync domains are missing from current overview
  const currentDomainNames = currentDomains.map(d => d.name.toLowerCase());
  
  for (const domain of Array.from(specSyncDomains)) {
    const isMissing = !currentDomainNames.some(currentName => 
      currentName === domain.toLowerCase() || 
      currentName.includes(domain.toLowerCase()) ||
      domain.toLowerCase().includes(currentName)
    );
    
    if (isMissing) {
      missingDomains.push({
        domain,
        functionCount: domainFunctions[domain].size,
        functions: Array.from(domainFunctions[domain])
      });
    }
  }
  
  return missingDomains;
}

// Get missing TMF functions from SpecSync data that aren't mapped
export async function getMissingTMFunctionsFromSpecSync(
  specSyncItems: SpecSyncItem[],
  currentDomains: any[]
): Promise<{ function: TMFFunction; specSyncCount: number; domain: string; confidence: number }[]> {
  const missingFunctions: { function: TMFFunction; specSyncCount: number; domain: string; confidence: number }[] = [];
  
  // Get all currently mapped function IDs
  const mappedFunctionIds = new Set<string>();
  currentDomains.forEach(domain => {
    domain.capabilities?.forEach((cap: any) => {
      if (cap.referenceFunctionId) {
        mappedFunctionIds.add(cap.referenceFunctionId);
      }
    });
  });
  
  // Get all TMF functions
  const allTMFunctions = await TMFReferenceService.getAllFunctions();
  
  // Group SpecSync items by function name for counting
  const specSyncFunctionCounts: Record<string, number> = {};
  const specSyncFunctionDomains: Record<string, string> = {};
  
  specSyncItems.forEach((item) => {
    const functionName = item['Rephrased Function Name'] || item.capability || item.afLevel2;
    if (functionName) {
      const normalizedName = functionName.trim().toLowerCase();
      specSyncFunctionCounts[normalizedName] = (specSyncFunctionCounts[normalizedName] || 0) + 1;
      specSyncFunctionDomains[normalizedName] = item.domain || 'Unknown';
    }
  });
  
  // Find TMF functions that match SpecSync function names but aren't mapped
  for (const tmfFunction of allTMFunctions) {
    if (mappedFunctionIds.has(tmfFunction.id)) {
      continue; // Already mapped
    }
    
    const normalizedTMFName = tmfFunction.function_name.toLowerCase();
    
    // Check if this TMF function matches any SpecSync function name
    for (const [specSyncName, count] of Object.entries(specSyncFunctionCounts)) {
      if (normalizedTMFName === specSyncName || 
          normalizedTMFName.includes(specSyncName) || 
          specSyncName.includes(normalizedTMFName)) {
        
        missingFunctions.push({
          function: tmfFunction,
          specSyncCount: count,
          domain: specSyncFunctionDomains[specSyncName],
          confidence: normalizedTMFName === specSyncName ? 1.0 : 0.8
        });
        break; // Found a match, move to next TMF function
      }
    }
  }
  
  return missingFunctions;
}

// Analyze gaps between SpecSync data and current overview
export async function analyzeSpecSyncGaps(
  specSyncItems: SpecSyncItem[],
  currentDomains: any[]
): Promise<{
  missingDomains: { domain: string; functionCount: number; functions: string[] }[];
  missingFunctions: { function: TMFFunction; specSyncCount: number; domain: string; confidence: number }[];
  totalMissingItems: number;
}> {
  const [missingDomains, missingFunctions] = await Promise.all([
    getMissingDomainsFromSpecSync(specSyncItems, currentDomains),
    getMissingTMFunctionsFromSpecSync(specSyncItems, currentDomains)
  ]);
  
  return {
    missingDomains,
    missingFunctions,
    totalMissingItems: missingDomains.length + missingFunctions.length
  };
}

// Get missing TMF domains from reference data that aren't in current overview
export async function getMissingTMFDomainsFromReference(
  currentDomains: any[],
  allTMFDomains: TMFDomain[]
): Promise<{ domain: TMFDomain; functionCount: number; functions: TMFFunction[] }[]> {
  const missingDomains: { domain: TMFDomain; functionCount: number; functions: TMFFunction[] }[] = [];
  
  // Get current domain names (normalized for comparison)
  const currentDomainNames = currentDomains.map(d => d.name.toLowerCase().trim());
  
  // Get all TMF functions grouped by domain
  const allTMFFunctions = await TMFReferenceService.getAllFunctions();
  const functionsByDomain: Record<string, TMFFunction[]> = {};
  
  allTMFFunctions.forEach(func => {
    const domainName = func.domain_name || 'Unknown';
    if (!functionsByDomain[domainName]) {
      functionsByDomain[domainName] = [];
    }
    functionsByDomain[domainName].push(func);
  });
  
  // Check which TMF domains are missing from current overview
  for (const tmfDomain of allTMFDomains) {
    const domainName = tmfDomain.name.toLowerCase().trim();
    
    const isMissing = !currentDomainNames.some(currentName => 
      currentName === domainName || 
      currentName.includes(domainName) ||
      domainName.includes(currentName)
    );
    
    
    if (isMissing) {
      const domainFunctions = functionsByDomain[tmfDomain.name] || [];
      missingDomains.push({
        domain: tmfDomain,
        functionCount: domainFunctions.length,
        functions: domainFunctions
      });
    }
  }
  
  return missingDomains;
}

// Get missing TMF functions from reference data that aren't in current overview
export async function getMissingTMFFunctionsFromReference(
  currentDomains: any[],
  allTMFFunctions: TMFFunction[]
): Promise<{ function: TMFFunction; domain: string }[]> {
  const missingFunctions: { function: TMFFunction; domain: string }[] = [];
  
  // Get all currently mapped function IDs from overview
  const mappedFunctionIds = new Set<string>();
  currentDomains.forEach(domain => {
    domain.capabilities?.forEach((cap: any) => {
      if (cap.referenceFunctionId) {
        mappedFunctionIds.add(cap.referenceFunctionId);
      }
    });
  });
  
  // Find TMF functions that aren't mapped in current overview
  for (const tmfFunction of allTMFFunctions) {
    if (!mappedFunctionIds.has(tmfFunction.id)) {
      missingFunctions.push({
        function: tmfFunction,
        domain: tmfFunction.domain_name || 'Unknown'
      });
    }
  }
  
  return missingFunctions;
}

// Analyze gaps between TMF reference data and current overview
export async function analyzeTMFReferenceGaps(
  currentDomains: any[]
): Promise<{
  missingDomains: { domain: TMFDomain; functionCount: number; functions: TMFFunction[] }[];
  missingFunctions: { function: TMFFunction; domain: string }[];
  totalMissingItems: number;
}> {
  const [allTMFDomains, allTMFFunctions] = await Promise.all([
    TMFReferenceService.getDomains(),
    TMFReferenceService.getAllFunctions()
  ]);
  
  const [missingDomains, missingFunctions] = await Promise.all([
    getMissingTMFDomainsFromReference(currentDomains, allTMFDomains),
    getMissingTMFFunctionsFromReference(currentDomains, allTMFFunctions)
  ]);
  
  return {
    missingDomains,
    missingFunctions,
    totalMissingItems: missingDomains.length + missingFunctions.length
  };
}
