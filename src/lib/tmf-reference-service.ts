// TMF ODA Reference Data Types
export interface TMFReferenceDomain {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  created_at: string;
}

export interface TMFReferenceCapability {
  id: string;
  name: string;
  description: string;
  domain_id: string;
  category: string;
  level: string;
  version: string;
  created_at: string;
}

// TMF ODA Reference Data Service
export class TMFReferenceService {
  // Static reference data for development (fallback when Supabase is not configured)
  private static readonly REFERENCE_DOMAINS: TMFReferenceDomain[] = [
    {
      id: 'domain-1',
      name: 'Market & Sales Domain',
      description: 'Manages market analysis, sales processes, and customer acquisition strategies',
      category: 'Business',
      version: '1.0',
      created_at: new Date().toISOString(),
    },
    {
      id: 'domain-2',
      name: 'Product Domain',
      description: 'Handles product lifecycle, specifications, and offering management',
      category: 'Business',
      version: '1.0',
      created_at: new Date().toISOString(),
    },
    {
      id: 'domain-3',
      name: 'Customer Domain',
      description: 'Manages customer relationships, interactions, and experience',
      category: 'Business',
      version: '1.0',
      created_at: new Date().toISOString(),
    },
    {
      id: 'domain-4',
      name: 'Service Domain',
      description: 'Manages service lifecycle, fulfillment, and assurance',
      category: 'Business',
      version: '1.0',
      created_at: new Date().toISOString(),
    },
    {
      id: 'domain-5',
      name: 'Resource Domain',
      description: 'Manages network and IT resources, inventory, and allocation',
      category: 'Technical',
      version: '1.0',
      created_at: new Date().toISOString(),
    },
    {
      id: 'domain-6',
      name: 'Partner Domain',
      description: 'Manages partner relationships, agreements, and collaboration',
      category: 'Business',
      version: '1.0',
      created_at: new Date().toISOString(),
    },
  ];

  private static readonly REFERENCE_CAPABILITIES: TMFReferenceCapability[] = [
    // Market & Sales Domain Capabilities
    {
      id: 'cap-1',
      name: 'Sales Territory Management',
      description: 'Manage sales territories and coverage areas',
      domain_id: 'domain-1',
      category: 'Sales',
      level: 'Level 2',
      version: '1.0',
      created_at: new Date().toISOString(),
    },
    {
      id: 'cap-2',
      name: 'Lead Management',
      description: 'Manage and track sales leads and opportunities',
      domain_id: 'domain-1',
      category: 'Sales',
      level: 'Level 2',
      version: '1.0',
      created_at: new Date().toISOString(),
    },
    {
      id: 'cap-3',
      name: 'Market Analysis',
      description: 'Analyze market trends and competitive landscape',
      domain_id: 'domain-1',
      category: 'Marketing',
      level: 'Level 2',
      version: '1.0',
      created_at: new Date().toISOString(),
    },

    // Product Domain Capabilities
    {
      id: 'cap-4',
      name: 'Product Specification Management',
      description: 'Manage product specifications and requirements',
      domain_id: 'domain-2',
      category: 'Product',
      level: 'Level 2',
      version: '1.0',
      created_at: new Date().toISOString(),
    },
    {
      id: 'cap-5',
      name: 'Offering Strategy Management',
      description: 'Manage product offerings and pricing strategies',
      domain_id: 'domain-2',
      category: 'Product',
      level: 'Level 2',
      version: '1.0',
      created_at: new Date().toISOString(),
    },
    {
      id: 'cap-6',
      name: 'Product Lifecycle Management',
      description: 'Manage product lifecycle from conception to retirement',
      domain_id: 'domain-2',
      category: 'Product',
      level: 'Level 2',
      version: '1.0',
      created_at: new Date().toISOString(),
    },
    {
      id: 'cap-6a',
      name: 'Tariff Calculation and Rating',
      description: 'Calculate tariffs and perform rating operations',
      domain_id: 'domain-2',
      category: 'Product',
      level: 'Level 2',
      version: '1.0',
      created_at: new Date().toISOString(),
    },

    // Customer Domain Capabilities
    {
      id: 'cap-7',
      name: 'Customer Interaction Management',
      description: 'Manage customer interactions and touchpoints',
      domain_id: 'domain-3',
      category: 'Customer',
      level: 'Level 2',
      version: '1.0',
      created_at: new Date().toISOString(),
    },
    {
      id: 'cap-8',
      name: 'Customer Relationship Management',
      description: 'Manage customer relationships and data',
      domain_id: 'domain-3',
      category: 'Customer',
      level: 'Level 2',
      version: '1.0',
      created_at: new Date().toISOString(),
    },
    {
      id: 'cap-9',
      name: 'Customer Experience Management',
      description: 'Manage and optimize customer experience',
      domain_id: 'domain-3',
      category: 'Customer',
      level: 'Level 2',
      version: '1.0',
      created_at: new Date().toISOString(),
    },

    // Service Domain Capabilities
    {
      id: 'cap-10',
      name: 'Service Inventory Management',
      description: 'Manage service catalog and inventory',
      domain_id: 'domain-4',
      category: 'Service',
      level: 'Level 2',
      version: '1.0',
      created_at: new Date().toISOString(),
    },
    {
      id: 'cap-11',
      name: 'Service Fulfillment',
      description: 'Manage service delivery and fulfillment',
      domain_id: 'domain-4',
      category: 'Service',
      level: 'Level 2',
      version: '1.0',
      created_at: new Date().toISOString(),
    },
    {
      id: 'cap-12',
      name: 'Service Assurance',
      description: 'Monitor and assure service quality',
      domain_id: 'domain-4',
      category: 'Service',
      level: 'Level 2',
      version: '1.0',
      created_at: new Date().toISOString(),
    },

    // Resource Domain Capabilities
    {
      id: 'cap-13',
      name: 'Resource Inventory Management',
      description: 'Manage network and IT resource inventory',
      domain_id: 'domain-5',
      category: 'Resource',
      level: 'Level 2',
      version: '1.0',
      created_at: new Date().toISOString(),
    },
    {
      id: 'cap-14',
      name: 'Resource Allocation',
      description: 'Manage resource allocation and capacity planning',
      domain_id: 'domain-5',
      category: 'Resource',
      level: 'Level 2',
      version: '1.0',
      created_at: new Date().toISOString(),
    },
    {
      id: 'cap-15',
      name: 'Resource Performance Management',
      description: 'Monitor and manage resource performance',
      domain_id: 'domain-5',
      category: 'Resource',
      level: 'Level 2',
      version: '1.0',
      created_at: new Date().toISOString(),
    },

    // Partner Domain Capabilities
    {
      id: 'cap-16',
      name: 'Partner Relationship Management',
      description: 'Manage partner relationships and agreements',
      domain_id: 'domain-6',
      category: 'Partner',
      level: 'Level 2',
      version: '1.0',
      created_at: new Date().toISOString(),
    },
    {
      id: 'cap-17',
      name: 'Partner Agreement Management',
      description: 'Manage partner agreements and contracts',
      domain_id: 'domain-6',
      category: 'Partner',
      level: 'Level 2',
      version: '1.0',
      created_at: new Date().toISOString(),
    },
    {
      id: 'cap-18',
      name: 'Partner Collaboration Management',
      description: 'Manage partner collaboration and integration',
      domain_id: 'domain-6',
      category: 'Partner',
      level: 'Level 2',
      version: '1.0',
      created_at: new Date().toISOString(),
    },
  ];

  // Get all reference domains
  static async getReferenceDomains(): Promise<TMFReferenceDomain[]> {
    try {
      // For now, return static data
      // In the future, this can be replaced with Supabase calls
      return Promise.resolve(this.REFERENCE_DOMAINS);
    } catch (error) {
      console.error('Error fetching reference domains:', error);
      return [];
    }
  }

  // Get reference capabilities by domain
  static async getReferenceCapabilitiesByDomain(
    domainId: string,
  ): Promise<TMFReferenceCapability[]> {
    try {
      const capabilities = this.REFERENCE_CAPABILITIES.filter((cap) => cap.domain_id === domainId);
      return Promise.resolve(capabilities);
    } catch (error) {
      console.error('Error fetching reference capabilities:', error);
      return [];
    }
  }

  // Get all reference capabilities
  static async getAllReferenceCapabilities(): Promise<TMFReferenceCapability[]> {
    try {
      return Promise.resolve(this.REFERENCE_CAPABILITIES);
    } catch (error) {
      console.error('Error fetching all reference capabilities:', error);
      return [];
    }
  }

  // Initialize reference data (for development/testing)
  static async initializeReferenceData() {
    console.log('Reference data initialized successfully (using static data)');
  }
}
