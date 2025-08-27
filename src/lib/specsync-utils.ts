import { SpecSyncItem, SpecSyncState } from '@/types';
import { TMFCapability } from '@/types';

// Map SpecSync items to existing TMF capabilities
export function mapSpecSyncToCapabilities(
  items: SpecSyncItem[], 
  tmfCapabilities: TMFCapability[]
): { countsByCapability: Record<string, number>; assignments: Array<{ requirementId: string; capabilityId: string }>; unmapped: number } {
  const countsByCapability: Record<string, number> = {};
  const assignments: Array<{ requirementId: string; capabilityId: string }> = [];
  let unmapped = 0;
  const seenLocal = new Set();

  // Build a label-to-id map from TMF capabilities
  const labelToId = new Map<string, string>();
  tmfCapabilities.forEach(cap => {
    const normalizedName = cap.name.toLowerCase().trim();
    labelToId.set(normalizedName, cap.id);
    
    // Also map segments
    cap.segments.forEach(segment => {
      const normalizedSegment = segment.toLowerCase().trim();
      labelToId.set(normalizedSegment, cap.id);
    });
  });

  const normalize = (s: string) => String(s || '').trim().toLowerCase();

  items.forEach(item => {
    const capName = normalize(item.capability);
    const af2Name = normalize(item.afLevel2);
    const funcName = normalize(item.functionName);
    const domain = normalize(item.domain);

    let capId: string | null = null;

    // Try to find exact matches first
    if (capName && labelToId.has(capName)) {
      capId = labelToId.get(capName)!;
    } else if (af2Name && labelToId.has(af2Name)) {
      capId = labelToId.get(af2Name)!;
    } else if (funcName && labelToId.has(funcName)) {
      capId = labelToId.get(funcName)!;
    }

    // Domain-guided fallback
    if (!capId) {
      if (/integration/i.test(domain)) {
        capId = /workflow|orchestr/i.test(funcName) ? 'bpm-workflow' : 
                /api|rest|soap|graphql/i.test(funcName) ? 'api-mgmt' : null;
      } else if (/resource/i.test(domain) && /lifecycle|resource/i.test(funcName)) {
        capId = 'resource-lifecycle-mgmt';
      } else if (/product/i.test(domain) && /billing|charging|pricing/i.test(funcName)) {
        capId = 'billing-management';
      } else if (/enterprise/i.test(domain) && /fraud/i.test(funcName)) {
        capId = 'fraud-mgmt';
      } else if (/enterprise/i.test(domain) && /compliance|regulatory|gdpr|sox/i.test(funcName)) {
        capId = 'compliance-mgmt';
      }
    }

    if (capId) {
      const rid = String(item.rephrasedRequirementId || item.sourceRequirementId || Math.random());
      const key = `${capId}||${rid}`;
      
      if (!seenLocal.has(key)) {
        seenLocal.add(key);
        countsByCapability[capId] = (countsByCapability[capId] || 0) + 1;
        assignments.push({ requirementId: rid, capabilityId: capId });
      }
    } else {
      unmapped++;
    }
  });

  return { countsByCapability, assignments, unmapped };
}

// Calculate use case counts per capability from SpecSync data
export function calculateUseCaseCountsByCapability(
  items: SpecSyncItem[], 
  tmfCapabilities: TMFCapability[]
): Record<string, number> {
  const useCaseCountsByCapability: Record<string, number> = {};
  const capabilityUseCases: Record<string, Set<string>> = {};

  // Build a label-to-id map from TMF capabilities
  const labelToId = new Map<string, string>();
  tmfCapabilities.forEach(cap => {
    const normalizedName = cap.name.toLowerCase().trim();
    labelToId.set(normalizedName, cap.id);
    
    // Also map segments
    cap.segments.forEach(segment => {
      const normalizedSegment = segment.toLowerCase().trim();
      labelToId.set(normalizedSegment, cap.id);
    });
  });

  const normalize = (s: string) => String(s || '').trim().toLowerCase();

  items.forEach(item => {
    const capName = normalize(item.capability);
    const af2Name = normalize(item.afLevel2);
    const funcName = normalize(item.functionName);
    const domain = normalize(item.domain);
    const useCase = item.usecase1?.trim();

    if (!useCase) return; // Skip items without use case

    let capId: string | null = null;

    // Try to find exact matches first
    if (capName && labelToId.has(capName)) {
      capId = labelToId.get(capName)!;
    } else if (af2Name && labelToId.has(af2Name)) {
      capId = labelToId.get(af2Name)!;
    } else if (funcName && labelToId.has(funcName)) {
      capId = labelToId.get(funcName)!;
    }

    // Try partial matches for capability names
    if (!capId) {
      for (const [normalizedName, id] of Array.from(labelToId.entries())) {
        if (capName && normalizedName.includes(capName) || capName && capName.includes(normalizedName)) {
          capId = id;
          break;
        }
        if (af2Name && normalizedName.includes(af2Name) || af2Name && af2Name.includes(normalizedName)) {
          capId = id;
          break;
        }
      }
    }

    // Domain-guided fallback
    if (!capId) {
      if (/integration/i.test(domain)) {
        capId = /workflow|orchestr/i.test(funcName) ? 'bpm-workflow' : 
                /api|rest|soap|graphql/i.test(funcName) ? 'api-mgmt' : null;
      } else if (/resource/i.test(domain) && /lifecycle|resource/i.test(funcName)) {
        capId = 'resource-lifecycle-mgmt';
      } else if (/product/i.test(domain) && (/billing|charging|pricing|tariff|rating/i.test(funcName) || /billing|charging|pricing|tariff|rating/i.test(capName))) {
        capId = 'billing';
      } else if (/customer/i.test(domain) && (/customer|profile|information/i.test(funcName) || /customer|profile|information/i.test(capName))) {
        capId = 'crm';
      } else if (/enterprise/i.test(domain) && /fraud/i.test(funcName)) {
        capId = 'fraud-mgmt';
      } else if (/enterprise/i.test(domain) && /compliance|regulatory|gdpr|sox/i.test(funcName)) {
        capId = 'compliance-mgmt';
      }
    }

    if (capId) {
      if (!capabilityUseCases[capId]) {
        capabilityUseCases[capId] = new Set();
      }
      capabilityUseCases[capId].add(useCase);
    }
  });

  // Convert sets to counts
  Object.entries(capabilityUseCases).forEach(([capId, useCases]) => {
    useCaseCountsByCapability[capId] = useCases.size;
  });

  return useCaseCountsByCapability;
}

// Generate dynamic capability IDs for unmapped items
export function generateDynamicCapabilityId(basis: string): string {
  const normalized = String(basis || 'capability')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `imported-${normalized}`;
}

// Create dynamic capabilities for unmapped items
export function createDynamicCapabilities(items: SpecSyncItem[]): Record<string, { id: string; name: string; description: string; requirementCount: number }> {
  const dynamicGroups: Record<string, { id: string; name: string; description: string; requirementCount: number }> = {};
  
  items.forEach(item => {
    // For now, we'll create dynamic capabilities for all items
    // In a real implementation, you might want to track which items are mapped
    const domain = item.domain || 'Imported';
    const capabilityName = item.afLevel2 || item.functionName || 'Unknown';
    
    if (!dynamicGroups[domain]) {
      dynamicGroups[domain] = {
        id: generateDynamicCapabilityId(capabilityName),
        name: capabilityName,
        description: item.referenceCapability || '',
        requirementCount: 1
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
  tmfCapabilities: TMFCapability[]
): { total: number; breakdown: Record<string, number> } {
  if (!state.includeInEstimates || !state.items.length) {
    return { total: 0, breakdown: {} };
  }

  const mapping = mapSpecSyncToCapabilities(state.items, tmfCapabilities);
  const breakdown: Record<string, number> = {};
  let total = 0;

  Object.entries(mapping.countsByCapability).forEach(([capId, count]) => {
    const capability = tmfCapabilities.find(cap => cap.id === capId);
    if (capability) {
      const effort = calculateEffortTotal(capability.baseEffort);
      breakdown[capId] = effort * count;
      total += effort * count;
    }
  });

  return { total, breakdown };
}

// Helper function to calculate total effort
function calculateEffortTotal(effort: { businessAnalyst: number; solutionArchitect: number; developer: number; qaEngineer: number }): number {
  return effort.businessAnalyst + effort.solutionArchitect + effort.developer + effort.qaEngineer;
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
  try {
    const raw = localStorage.getItem('specsync-data');
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
