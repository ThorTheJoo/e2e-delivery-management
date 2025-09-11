// Static TMF Reference Data to avoid Supabase timing issues
export interface StaticTMFDomain {
  id: string;
  name: string;
  description: string;
  functionCount: number;
}

export interface StaticTMFFunction {
  id: string;
  domainId: string;
  functionName: string;
  domainName: string;
  vertical: string | null;
  afLevel1: string | null;
  afLevel2: string | null;
}

// Static TMF Domains (9 domains from reference data)
export const STATIC_TMF_DOMAINS: StaticTMFDomain[] = [
  {
    id: 'domain-1',
    name: 'Business Partner Domain',
    description: 'TMF Business Partner Domain',
    functionCount: 59
  },
  {
    id: 'domain-2', 
    name: 'Customer Domain',
    description: 'TMF Customer Domain',
    functionCount: 220
  },
  {
    id: 'domain-3',
    name: 'Enterprise Domain', 
    description: 'TMF Enterprise Domain',
    functionCount: 179
  },
  {
    id: 'domain-4',
    name: 'Integration Domain',
    description: 'TMF Integration Domain', 
    functionCount: 33
  },
  {
    id: 'domain-5',
    name: 'Market & Sales Domain',
    description: 'TMF Market & Sales Domain',
    functionCount: 46
  },
  {
    id: 'domain-6',
    name: 'Product Domain',
    description: 'TMF Product Domain',
    functionCount: 183
  },
  {
    id: 'domain-7',
    name: 'Resource Domain',
    description: 'TMF Resource Domain',
    functionCount: 183
  },
  {
    id: 'domain-8',
    name: 'Service Domain',
    description: 'TMF Service Domain',
    functionCount: 89
  },
  {
    id: 'domain-9',
    name: 'Common Domain',
    description: 'TMF Common Domain',
    functionCount: 67
  }
];

// Static TMF Functions - Sample functions for each domain
export const STATIC_TMF_FUNCTIONS: StaticTMFFunction[] = [
  // Customer Domain functions
  {
    id: 'func-1',
    domainId: 'domain-2',
    domainName: 'Customer Domain',
    functionName: 'Customer Details Management',
    vertical: 'Customer Management',
    afLevel1: 'Customer Management',
    afLevel2: 'Customer Details Management'
  },
  {
    id: 'func-2',
    domainId: 'domain-2',
    domainName: 'Customer Domain',
    functionName: 'Customer Information Searching',
    vertical: 'Customer Management',
    afLevel1: 'Customer Management',
    afLevel2: 'Customer Information Searching'
  },
  {
    id: 'func-3',
    domainId: 'domain-2',
    domainName: 'Customer Domain',
    functionName: 'Individual Information Management',
    vertical: 'Customer Management',
    afLevel1: 'Customer Management',
    afLevel2: 'Individual Information Management'
  },
  {
    id: 'func-4',
    domainId: 'domain-2',
    domainName: 'Customer Domain',
    functionName: 'Customer Account Management',
    vertical: 'Customer Management',
    afLevel1: 'Customer Management',
    afLevel2: 'Customer Account Management'
  },
  {
    id: 'func-5',
    domainId: 'domain-2',
    domainName: 'Customer Domain',
    functionName: 'Customer Profile Management',
    vertical: 'Customer Management',
    afLevel1: 'Customer Management',
    afLevel2: 'Customer Profile Management'
  },
  {
    id: 'func-6',
    domainId: 'domain-2',
    domainName: 'Customer Domain',
    functionName: 'Customer Relationship Management',
    vertical: 'Customer Management',
    afLevel1: 'Customer Management',
    afLevel2: 'Customer Relationship Management'
  },

  // Product Domain functions
  {
    id: 'func-7',
    domainId: 'domain-6',
    domainName: 'Product Domain',
    functionName: 'Product Catalog Browsing',
    vertical: 'Product Management',
    afLevel1: 'Product Management',
    afLevel2: 'Product Catalog Browsing'
  },
  {
    id: 'func-8',
    domainId: 'domain-6',
    domainName: 'Product Domain',
    functionName: 'Offer and Product Configuration',
    vertical: 'Product Management',
    afLevel1: 'Product Management',
    afLevel2: 'Offer and Product Configuration'
  },
  {
    id: 'func-9',
    domainId: 'domain-6',
    domainName: 'Product Domain',
    functionName: 'Product Information Management',
    vertical: 'Product Management',
    afLevel1: 'Product Management',
    afLevel2: 'Product Information Management'
  },
  {
    id: 'func-10',
    domainId: 'domain-6',
    domainName: 'Product Domain',
    functionName: 'Product Catalog Management',
    vertical: 'Product Management',
    afLevel1: 'Product Management',
    afLevel2: 'Product Catalog Management'
  },
  {
    id: 'func-11',
    domainId: 'domain-6',
    domainName: 'Product Domain',
    functionName: 'Product Offering Management',
    vertical: 'Product Management',
    afLevel1: 'Product Management',
    afLevel2: 'Product Offering Management'
  },
  {
    id: 'func-12',
    domainId: 'domain-6',
    domainName: 'Product Domain',
    functionName: 'Product Specification Management',
    vertical: 'Product Management',
    afLevel1: 'Product Management',
    afLevel2: 'Product Specification Management'
  },
  {
    id: 'func-13',
    domainId: 'domain-6',
    domainName: 'Product Domain',
    functionName: 'Product Lifecycle Management',
    vertical: 'Product Management',
    afLevel1: 'Product Management',
    afLevel2: 'Product Lifecycle Management'
  },
  {
    id: 'func-14',
    domainId: 'domain-6',
    domainName: 'Product Domain',
    functionName: 'Product Pricing Management',
    vertical: 'Product Management',
    afLevel1: 'Product Management',
    afLevel2: 'Product Pricing Management'
  },
  {
    id: 'func-15',
    domainId: 'domain-6',
    domainName: 'Product Domain',
    functionName: 'Product Bundle Management',
    vertical: 'Product Management',
    afLevel1: 'Product Management',
    afLevel2: 'Product Bundle Management'
  },

  // Business Partner Domain functions
  {
    id: 'func-16',
    domainId: 'domain-1',
    domainName: 'Business Partner Domain',
    functionName: 'Business Partner Management',
    vertical: 'Business Partner Management',
    afLevel1: 'Business Partner Management',
    afLevel2: 'Business Partner Management'
  },

  // Enterprise Domain functions
  {
    id: 'func-17',
    domainId: 'domain-3',
    domainName: 'Enterprise Domain',
    functionName: 'Enterprise Resource Management',
    vertical: 'Enterprise Management',
    afLevel1: 'Enterprise Management',
    afLevel2: 'Enterprise Resource Management'
  },

  // Integration Domain functions
  {
    id: 'func-18',
    domainId: 'domain-4',
    domainName: 'Integration Domain',
    functionName: 'System Integration Management',
    vertical: 'Integration Management',
    afLevel1: 'Integration Management',
    afLevel2: 'System Integration Management'
  },

  // Market & Sales Domain functions
  {
    id: 'func-19',
    domainId: 'domain-5',
    domainName: 'Market & Sales Domain',
    functionName: 'Sales Management',
    vertical: 'Sales Management',
    afLevel1: 'Sales Management',
    afLevel2: 'Sales Management'
  },

  // Resource Domain functions
  {
    id: 'func-20',
    domainId: 'domain-7',
    domainName: 'Resource Domain',
    functionName: 'Resource Management',
    vertical: 'Resource Management',
    afLevel1: 'Resource Management',
    afLevel2: 'Resource Management'
  },

  // Service Domain functions
  {
    id: 'func-21',
    domainId: 'domain-8',
    domainName: 'Service Domain',
    functionName: 'Service Management',
    vertical: 'Service Management',
    afLevel1: 'Service Management',
    afLevel2: 'Service Management'
  },

  // Common Domain functions
  {
    id: 'func-22',
    domainId: 'domain-9',
    domainName: 'Common Domain',
    functionName: 'Common Utilities',
    vertical: 'Common Utilities',
    afLevel1: 'Common Utilities',
    afLevel2: 'Common Utilities'
  }
];

// Helper functions
export function getStaticTMFDomains(): StaticTMFDomain[] {
  return STATIC_TMF_DOMAINS;
}

export function getStaticTMFFunctions(): StaticTMFFunction[] {
  return STATIC_TMF_FUNCTIONS;
}

export function getStaticTMFFunctionsByDomain(domainId: string): StaticTMFFunction[] {
  return STATIC_TMF_FUNCTIONS.filter(func => func.domainId === domainId);
}

export function findBestStaticTMFMatch(specSyncName: string, confidenceThreshold: number = 0.7): StaticTMFFunction | null {
  const normalizedSpec = specSyncName.toLowerCase().trim();
  
  // Try exact match first
  const exactMatch = STATIC_TMF_FUNCTIONS.find(func => 
    func.functionName.toLowerCase().trim() === normalizedSpec
  );
  if (exactMatch) return exactMatch;
  
  // Try partial match
  const partialMatch = STATIC_TMF_FUNCTIONS.find(func => {
    const normalizedTmf = func.functionName.toLowerCase().trim();
    return normalizedTmf.includes(normalizedSpec) || normalizedSpec.includes(normalizedTmf);
  });
  if (partialMatch) return partialMatch;
  
  // Try word-based matching
  const specWords = normalizedSpec.split(/\s+/).filter(w => w.length > 1);
  let bestMatch: StaticTMFFunction | null = null;
  let bestScore = 0;
  
  for (const func of STATIC_TMF_FUNCTIONS) {
    const tmfWords = func.functionName.toLowerCase().trim().split(/\s+/).filter(w => w.length > 1);
    let matchingWords = 0;
    
    for (const specWord of specWords) {
      if (tmfWords.some(tmfWord => 
        tmfWord.includes(specWord) || specWord.includes(tmfWord)
      )) {
        matchingWords++;
      }
    }
    
    const score = matchingWords / specWords.length;
    if (score >= confidenceThreshold && score > bestScore) {
      bestMatch = func;
      bestScore = score;
    }
  }
  
  return bestMatch;
}
