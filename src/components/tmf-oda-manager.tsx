'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit, ChevronDown, ChevronRight, FileSpreadsheet } from 'lucide-react';
import { TMFOdaDomain, TMFOdaCapability, TMFOdaState } from '@/types';
import { SpecSyncImport } from './specsync-import';
import { SpecSyncState } from '@/types';

// Mock TMF ODA reference data based on real TMF standards
const MOCK_TMF_ODA_DOMAINS: Omit<TMFOdaDomain, 'id' | 'capabilities' | 'isSelected' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Market & Sales Domain',
    description: 'Manages market analysis, sales processes, and customer acquisition strategies'
  },
  {
    name: 'Product Domain',
    description: 'Handles product lifecycle, specifications, and offering management'
  },
  {
    name: 'Customer Domain',
    description: 'Manages customer relationships, interactions, and experience'
  },
  {
    name: 'Service Domain',
    description: 'Handles service delivery, quality, and performance management'
  },
  {
    name: 'Resource Domain',
    description: 'Manages network resources, infrastructure, and capacity planning'
  },
  {
    name: 'Business Partner Domain',
    description: 'Handles partner relationships, agreements, and collaboration'
  },
  {
    name: 'Enterprise Domain',
    description: 'Manages corporate functions, security, and governance'
  },
  {
    name: 'Shared Domain',
    description: 'Provides common services and utilities across all domains'
  },
  {
    name: 'Integration Domain',
    description: 'Manages system integration, APIs, and business process orchestration'
  }
];

const MOCK_TMF_ODA_CAPABILITIES: Record<string, Omit<TMFOdaCapability, 'id' | 'domainId' | 'isSelected' | 'createdAt' | 'updatedAt'>[]> = {
  'Market & Sales Domain': [
    { name: 'Sales Territory Management', description: 'Define and manage sales territories and coverage' },
    { name: 'Sales & Customer Development', description: 'Develop sales strategies and customer relationships' },
    { name: 'Lead Management', description: 'Track and manage sales leads through the pipeline' },
    { name: 'Marketing Campaign Workflow Design', description: 'Design and execute marketing campaigns' },
    { name: 'Sales Reporting', description: 'Generate sales performance reports and analytics' },
    { name: 'Sales Analysis', description: 'Analyze sales data and trends for insights' }
  ],
  'Product Domain': [
    { name: 'Ordering Rules Development', description: 'Define business rules for product ordering' },
    { name: 'Product Performance Reporting', description: 'Monitor and report on product performance metrics' },
    { name: 'Product Trouble Ticket Management', description: 'Handle product-related issues and support tickets' },
    { name: 'Product Specification & Offering Strategy Management', description: 'Manage product specifications and strategies' },
    { name: 'Offer and Product Configuration', description: 'Configure product offerings and bundles' },
    { name: 'Product Activation', description: 'Activate products and services for customers' },
    { name: 'Product Profitability Analysis', description: 'Analyze product profitability and financial performance' }
  ],
  'Customer Domain': [
    { name: 'Customer Interaction Management', description: 'Manage all customer touchpoints and interactions' },
    { name: 'Customer Order Management', description: 'Handle customer order processing and lifecycle' },
    { name: 'Loyalty Program Management', description: 'Manage customer loyalty programs and rewards' },
    { name: 'Customer Risk Management', description: 'Assess and manage customer risk profiles' },
    { name: 'Billing Account Administration', description: 'Manage customer billing accounts and preferences' },
    { name: 'Personalized Customer Interaction', description: 'Deliver personalized customer experiences' },
    { name: 'Customer Order Completion', description: 'Ensure successful completion of customer orders' },
    { name: 'Customer Experience Analysis', description: 'Analyze and improve customer experience metrics' }
  ],
  'Service Domain': [
    { name: 'Service Interaction', description: 'Manage service-related customer interactions' },
    { name: 'Service Inventory Management', description: 'Track and manage service inventory and availability' },
    { name: 'Service Order Entry', description: 'Process and manage service orders' },
    { name: 'Service Problem Diagnosis', description: 'Diagnose service issues and problems' },
    { name: 'Service Quality and Performance Analysis', description: 'Monitor service quality and performance metrics' },
    { name: 'Service Design and Development', description: 'Design and develop new services' },
    { name: 'Service Test Orchestration', description: 'Coordinate and manage service testing' },
    { name: 'Service Problem Resolution', description: 'Resolve service issues and problems' }
  ],
  'Resource Domain': [
    { name: 'Resource Interaction Management', description: 'Manage resource-related interactions and requests' },
    { name: 'Resource Test Reporting', description: 'Generate reports on resource testing and validation' },
    { name: 'Resource Inventory Management', description: 'Track and manage resource inventory and availability' },
    { name: 'Resource Network Management', description: 'Manage network resources and connectivity' },
    { name: 'Resource Capacity Management', description: 'Monitor and manage resource capacity and utilization' },
    { name: 'Resource Planning and Building', description: 'Plan and build new resources and infrastructure' },
    { name: 'Resource Problem Management', description: 'Handle resource-related issues and problems' },
    { name: 'Resource Specification and Capability Development', description: 'Define resource specifications and capabilities' }
  ],
  'Business Partner Domain': [
    { name: 'Business Partner Order Management', description: 'Manage orders and transactions with business partners' },
    { name: 'Business Partner Product Regulatory Management', description: 'Handle regulatory compliance for partner products' },
    { name: 'Business Partner Onboarding', description: 'Onboard new business partners and vendors' },
    { name: 'Business Partner Agreement Management', description: 'Manage partner agreements and contracts' },
    { name: 'Purchasing Strategy Definition', description: 'Define purchasing strategies and policies' },
    { name: 'Purchasing Tender Management', description: 'Manage purchasing tenders and procurement processes' }
  ],
  'Enterprise Domain': [
    { name: 'Security Strategy Definition and Management', description: 'Define and manage enterprise security strategies' },
    { name: 'Human Resources Management', description: 'Manage human resources and workforce planning' },
    { name: 'Intellectual Property Management', description: 'Protect and manage intellectual property assets' },
    { name: 'Workforce Organization', description: 'Organize and structure workforce and teams' },
    { name: 'Auditing and Accounting', description: 'Handle financial auditing and accounting processes' },
    { name: 'Payroll Management', description: 'Manage employee payroll and compensation' },
    { name: 'Regulatory Rules Application and Tracking', description: 'Apply and track regulatory compliance rules' },
    { name: 'Corporate Real Estate (Buildings)', description: 'Manage corporate real estate and facilities' }
  ],
  'Shared Domain': [
    { name: 'Identification and Authentication', description: 'Provide user identification and authentication services' },
    { name: 'Digital Identity Management', description: 'Manage digital identities and access control' },
    { name: 'System Administration', description: 'Administer system configurations and settings' },
    { name: 'Business Intelligence', description: 'Provide business intelligence and analytics capabilities' },
    { name: 'Anomaly Detection', description: 'Detect and alert on system anomalies and issues' },
    { name: 'Data Repository Management', description: 'Manage data repositories and storage systems' },
    { name: 'Privacy Definition Management', description: 'Define and manage privacy policies and controls' },
    { name: 'Roles & Permission Definition', description: 'Define user roles and permissions' },
    { name: 'Project Repository Management', description: 'Manage project repositories and documentation' }
  ],
  'Integration Domain': [
    { name: 'Business Rules Management', description: 'Manage business rules and decision logic' },
    { name: 'Business Access Management', description: 'Manage business access and authorization' },
    { name: 'API Implementation and Integration Management', description: 'Implement and manage APIs and integrations' },
    { name: 'External Business Access Management', description: 'Manage external business access and connectivity' },
    { name: 'Customer Service Access Management', description: 'Manage customer service access and support' },
    { name: 'Business Process Improvement', description: 'Improve and optimize business processes' },
    { name: 'API Gateway Management', description: 'Manage API gateways and routing' }
  ]
};

interface TMFOdaManagerProps {
  onStateChange?: (state: TMFOdaState) => void;
  initialState?: TMFOdaState;
}

export function TMFOdaManager({ onStateChange, initialState }: TMFOdaManagerProps) {
  const [state, setState] = useState<TMFOdaState>(initialState || {
    domains: [],
    selectedDomainIds: [],
    selectedCapabilityIds: []
  });
  
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());
  const [editingDomain, setEditingDomain] = useState<string | null>(null);
  const [editingCapability, setEditingCapability] = useState<string | null>(null);
  const [newDomainForm, setNewDomainForm] = useState({ name: '', description: '' });
  const [newCapabilityForm, setNewCapabilityForm] = useState({ name: '', description: '' });
  const [showAddDomainForm, setShowAddDomainForm] = useState(false);
  const [showAddCapabilityForm, setShowAddCapabilityForm] = useState<string | null>(null);
  
  // New state for collapsible sections
  const [isSpecSyncExpanded, setIsSpecSyncExpanded] = useState(false);
  const [isDomainsExpanded, setIsDomainsExpanded] = useState(false);
  const [specSyncState, setSpecSyncState] = useState<SpecSyncState | null>(null);

  // Initialize with mock data if no initial state
  useEffect(() => {
    if (!initialState && state.domains.length === 0) {
      const mockDomains = MOCK_TMF_ODA_DOMAINS.map(domain => ({
        ...domain,
        id: `domain-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        capabilities: MOCK_TMF_ODA_CAPABILITIES[domain.name]?.map(capability => ({
          ...capability,
          id: `capability-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          domainId: `domain-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          isSelected: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })) || [],
        isSelected: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
      
      setState(prev => ({
        ...prev,
        domains: mockDomains
      }));
    }
  }, [initialState, state.domains.length]);

  // Notify parent of state changes
  useEffect(() => {
    onStateChange?.(state);
  }, [state, onStateChange]);

  const generateId = () => `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const handleAddDomain = () => {
    if (!newDomainForm.name.trim()) return;
    
    const newDomain: TMFOdaDomain = {
      id: generateId(),
      name: newDomainForm.name.trim(),
      description: newDomainForm.description.trim(),
      capabilities: [],
      isSelected: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setState(prev => ({
      ...prev,
      domains: [...prev.domains, newDomain]
    }));

    setNewDomainForm({ name: '', description: '' });
    setShowAddDomainForm(false);
  };

  const handleAddCapability = (domainId: string) => {
    if (!newCapabilityForm.name.trim()) return;
    
    const newCapability: TMFOdaCapability = {
      id: generateId(),
      name: newCapabilityForm.name.trim(),
      description: newCapabilityForm.description.trim(),
      domainId,
      isSelected: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setState(prev => ({
      ...prev,
      domains: prev.domains.map(domain => 
        domain.id === domainId 
          ? { ...domain, capabilities: [...domain.capabilities, newCapability] }
          : domain
      )
    }));

    setNewCapabilityForm({ name: '', description: '' });
    setShowAddCapabilityForm(null);
  };

  const handleRemoveDomain = (domainId: string) => {
    setState(prev => ({
      ...prev,
      domains: prev.domains.filter(domain => domain.id !== domainId),
      selectedDomainIds: prev.selectedDomainIds.filter(id => id !== domainId),
      selectedCapabilityIds: prev.selectedCapabilityIds.filter(id => 
        !prev.domains.find(domain => domain.id === domainId)?.capabilities.some(cap => cap.id === id)
      )
    }));
  };

  const handleRemoveCapability = (domainId: string, capabilityId: string) => {
    setState(prev => ({
      ...prev,
      domains: prev.domains.map(domain => 
        domain.id === domainId 
          ? { ...domain, capabilities: domain.capabilities.filter(cap => cap.id !== capabilityId) }
          : domain
      ),
      selectedCapabilityIds: prev.selectedCapabilityIds.filter(id => id !== capabilityId)
    }));
  };

  const handleToggleDomainSelection = (domainId: string) => {
    setState(prev => {
      const domain = prev.domains.find(d => d.id === domainId);
      if (!domain) return prev;

      const newSelectedDomainIds = prev.selectedDomainIds.includes(domainId)
        ? prev.selectedDomainIds.filter(id => id !== domainId)
        : [...prev.selectedDomainIds, domainId];

      const newSelectedCapabilityIds = prev.selectedCapabilityIds.filter(id => 
        !domain.capabilities.some(cap => cap.id === id)
      );

      return {
        ...prev,
        selectedDomainIds: newSelectedDomainIds,
        selectedCapabilityIds: newSelectedCapabilityIds
      };
    });
  };

  const handleToggleCapabilitySelection = (capabilityId: string) => {
    setState(prev => ({
      ...prev,
      selectedCapabilityIds: prev.selectedCapabilityIds.includes(capabilityId)
        ? prev.selectedCapabilityIds.filter(id => id !== capabilityId)
        : [...prev.selectedCapabilityIds, capabilityId]
    }));
  };

  const handleToggleDomainExpansion = (domainId: string) => {
    setExpandedDomains(prev => {
      const newSet = new Set(prev);
      if (newSet.has(domainId)) {
        newSet.delete(domainId);
      } else {
        newSet.add(domainId);
      }
      return newSet;
    });
  };

  const handleEditDomain = (domainId: string, field: 'name' | 'description', value: string) => {
    setState(prev => ({
      ...prev,
      domains: prev.domains.map(domain => 
        domain.id === domainId 
          ? { ...domain, [field]: value, updatedAt: new Date().toISOString() }
          : domain
      )
    }));
  };

  const handleEditCapability = (capabilityId: string, field: 'name' | 'description', value: string) => {
    setState(prev => ({
      ...prev,
      domains: prev.domains.map(domain => ({
        ...domain,
        capabilities: domain.capabilities.map(capability => 
          capability.id === capabilityId 
            ? { ...capability, [field]: value, updatedAt: new Date().toISOString() }
            : capability
        )
      }))
    }));
  };

  const getSelectedCounts = () => {
    const selectedDomains = state.domains.filter(domain => state.selectedDomainIds.includes(domain.id));
    const selectedCapabilities = selectedDomains.flatMap(domain => 
      domain.capabilities.filter(capability => state.selectedCapabilityIds.includes(capability.id))
    );
    
    return {
      domains: selectedDomains.length,
      capabilities: selectedCapabilities.length
    };
  };

  const counts = getSelectedCounts();

  const handleSpecSyncImport = (specSyncData: SpecSyncState) => {
    setSpecSyncState(specSyncData);
    console.log('SpecSync data imported:', specSyncData);
    
    // Auto-select capabilities based on SpecSync data
    const newSelectedCapabilityIds = new Set<string>();
    
    specSyncData.items.forEach(item => {
      const capabilityName = (item.capability || item.afLevel2 || '').trim().toLowerCase();
      const domainName = (item.domain || '').trim().toLowerCase();
      
      // Find matching domain
      const matchingDomain = state.domains.find(domain => 
        domain.name.toLowerCase().includes(domainName) || 
        domainName.includes(domain.name.toLowerCase())
      );
      
      if (matchingDomain) {
        // Find matching capabilities within the domain
        matchingDomain.capabilities.forEach(capability => {
          const capName = capability.name.toLowerCase();
          if (capName.includes(capabilityName) || capabilityName.includes(capName)) {
            newSelectedCapabilityIds.add(capability.id);
          }
        });
      }
    });
    
    // Update state with auto-selected capabilities
    if (newSelectedCapabilityIds.size > 0) {
      setState(prev => ({
        ...prev,
        selectedCapabilityIds: Array.from(newSelectedCapabilityIds)
      }));
    }
  };

  const handleSpecSyncClear = () => {
    setSpecSyncState(null);
  };

  // Calculate requirement and use case counts for domains and capabilities
  const getDomainRequirementCount = (domainName: string) => {
    if (!specSyncState) return 0;
    return specSyncState.counts.domains[domainName] || 0;
  };

  const getDomainUseCaseCount = (domainName: string) => {
    if (!specSyncState) return 0;
    const domainItems = specSyncState.items.filter(item => 
      (item.domain || '').trim().toLowerCase() === domainName.toLowerCase()
    );
    const uniqueUseCases = new Set<string>();
    domainItems.forEach(item => {
      if (item.usecase1 && item.usecase1.trim()) {
        uniqueUseCases.add(item.usecase1.trim());
      }
    });
    return uniqueUseCases.size;
  };

  const getSelectedCapabilityCount = (domainId: string) => {
    const domain = state.domains.find(d => d.id === domainId);
    if (!domain) return 0;
    
    // Count only selected capabilities within this domain
    return domain.capabilities.filter(cap => 
      state.selectedCapabilityIds.includes(cap.id)
    ).length;
  };

  const getCapabilityRequirementCount = (capabilityName: string) => {
    if (!specSyncState) return 0;
    return specSyncState.items.filter(item => 
      (item.capability || item.afLevel2 || '').trim().toLowerCase() === capabilityName.toLowerCase()
    ).length;
  };

  const getCapabilityUseCaseCount = (capabilityName: string) => {
    if (!specSyncState) return 0;
    const capabilityItems = specSyncState.items.filter(item => 
      (item.capability || item.afLevel2 || '').trim().toLowerCase() === capabilityName.toLowerCase()
    );
    const uniqueUseCases = new Set<string>();
    capabilityItems.forEach(item => {
      if (item.usecase1 && item.usecase1.trim()) {
        uniqueUseCases.add(item.usecase1.trim());
      }
    });
    return uniqueUseCases.size;
  };

  return (
    <div className="space-y-6">
      {/* Capability Overview Section - Always visible at top */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-blue-900">Capability Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{state.domains.length}</div>
              <div className="text-sm text-blue-700">Total Domains</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{counts.domains}</div>
              <div className="text-sm text-green-700">Selected Domains</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{counts.capabilities}</div>
              <div className="text-sm text-purple-700">Selected Capabilities</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {specSyncState ? specSyncState.counts.useCases : 0}
              </div>
              <div className="text-sm text-orange-700">Use Cases</div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-blue-200">
            <div className="text-sm text-blue-800">
              <p className="font-medium">Current Status:</p>
              <p>• {state.domains.length} TMF ODA domains available</p>
              <p>• {state.domains.reduce((sum, domain) => sum + domain.capabilities.length, 0)} total capabilities across all domains</p>
              {specSyncState && (
                <>
                  <p>• {specSyncState.counts.totalRequirements} SpecSync requirements imported</p>
                  <p>• {specSyncState.counts.useCases} unique use cases identified</p>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SpecSync Import Section - Collapsible */}
      <Card className="border-gray-200">
        <CardHeader 
          className="cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setIsSpecSyncExpanded(!isSpecSyncExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg border-2 border-blue-200">
                {isSpecSyncExpanded ? (
                  <ChevronDown className="w-7 h-7 text-blue-700" />
                ) : (
                  <ChevronRight className="w-7 h-7 text-blue-700" />
                )}
              </div>
              <CardTitle className="text-lg">SpecSync Import</CardTitle>
              {specSyncState && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {specSyncState.counts.totalRequirements} requirements
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <FileSpreadsheet className="w-5 h-5 text-gray-500" />
            </div>
          </div>
        </CardHeader>
        {isSpecSyncExpanded && (
          <CardContent>
            <SpecSyncImport
              onImport={handleSpecSyncImport}
              onClear={handleSpecSyncClear}
              currentState={specSyncState}
            />
          </CardContent>
        )}
      </Card>

      {/* Domains and Capabilities Management Section - Collapsible */}
      <Card className="border-gray-200">
        <CardHeader 
          className="cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setIsDomainsExpanded(!isDomainsExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button className="p-1 hover:bg-gray-100 rounded">
                {isDomainsExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
              <CardTitle className="text-lg">TMF ODA Domains & Capabilities</CardTitle>
              <Badge variant="secondary">
                {counts.domains} selected domains, {counts.capabilities} selected capabilities
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAddDomainForm(true);
                }}
                className="bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Domain
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {isDomainsExpanded && (
          <CardContent>
            {/* Add Domain Form */}
            {showAddDomainForm && (
              <Card className="border-blue-200 bg-blue-50 mb-6">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Domain Name
                      </label>
                      <input
                        type="text"
                        value={newDomainForm.name}
                        onChange={(e) => setNewDomainForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter domain name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <input
                        type="text"
                        value={newDomainForm.description}
                        onChange={(e) => setNewDomainForm(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter description"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAddDomainForm(false);
                        setNewDomainForm({ name: '', description: '' });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleAddDomain} className="bg-blue-600 hover:bg-blue-700">
                      Add Domain
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Domains List */}
            <div className="space-y-4">
              {state.domains.map(domain => (
                <Card key={domain.id} className="border-gray-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleToggleDomainExpansion(domain.id)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          {expandedDomains.has(domain.id) ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                        
                        <input
                          type="checkbox"
                          checked={state.selectedDomainIds.includes(domain.id)}
                          onChange={() => handleToggleDomainSelection(domain.id)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        
                        <div className="flex-1">
                          {editingDomain === domain.id ? (
                            <input
                              type="text"
                              value={domain.name}
                              onChange={(e) => handleEditDomain(domain.id, 'name', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              onBlur={() => setEditingDomain(null)}
                              onKeyDown={(e) => e.key === 'Enter' && setEditingDomain(null)}
                              autoFocus
                            />
                          ) : (
                            <h3 className="text-lg font-semibold text-gray-900">{domain.name}</h3>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          {getSelectedCapabilityCount(domain.id)} selected capabilities
                        </Badge>
                        {specSyncState && (
                          <>
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                              {getDomainRequirementCount(domain.name)} reqs
                            </Badge>
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                              {getDomainUseCaseCount(domain.name)} use cases
                            </Badge>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingDomain(editingDomain === domain.id ? null : domain.id)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowAddCapabilityForm(showAddCapabilityForm === domain.id ? null : domain.id)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveDomain(domain.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {editingDomain === domain.id ? (
                      <input
                        type="text"
                        value={domain.description}
                        onChange={(e) => handleEditDomain(domain.id, 'description', e.target.value)}
                        className="w-full px-2 py-1 mt-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter description"
                        onBlur={() => setEditingDomain(null)}
                        onKeyDown={(e) => e.key === 'Enter' && setEditingDomain(null)}
                      />
                    ) : (
                      <p className="text-gray-600 text-sm">{domain.description}</p>
                    )}
                  </CardHeader>

                  {/* Add Capability Form */}
                  {showAddCapabilityForm === domain.id && (
                    <CardContent className="pt-0 pb-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-md">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Capability Name
                          </label>
                          <input
                            type="text"
                            value={newCapabilityForm.name}
                            onChange={(e) => setNewCapabilityForm(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter capability name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                          </label>
                          <input
                            type="text"
                            value={newCapabilityForm.description}
                            onChange={(e) => setNewCapabilityForm(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter description"
                          />
                        </div>
                        <div className="md:col-span-2 flex justify-end space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setShowAddCapabilityForm(null);
                              setNewCapabilityForm({ name: '', description: '' });
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleAddCapability(domain.id)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Add Capability
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  )}

                  {/* Capabilities List */}
                  {expandedDomains.has(domain.id) && (
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {domain.capabilities.map(capability => (
                          <div
                            key={capability.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                          >
                            <div className="flex items-center space-x-3 flex-1">
                              <input
                                type="checkbox"
                                checked={state.selectedCapabilityIds.includes(capability.id)}
                                onChange={() => handleToggleCapabilitySelection(capability.id)}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                              />
                              
                              <div className="flex-1">
                                {editingCapability === capability.id ? (
                                  <input
                                    type="text"
                                    value={capability.name}
                                    onChange={(e) => handleEditCapability(capability.id, 'name', e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    onBlur={() => setEditingCapability(null)}
                                    onKeyDown={(e) => e.key === 'Enter' && setEditingCapability(null)}
                                    autoFocus
                                  />
                                ) : (
                                  <h4 className="font-medium text-gray-900">{capability.name}</h4>
                                )}
                                
                                {editingCapability === capability.id ? (
                                  <input
                                    type="text"
                                    value={capability.description}
                                    onChange={(e) => handleEditCapability(capability.id, 'description', e.target.value)}
                                    className="w-full px-2 py-1 mt-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter description"
                                    onBlur={() => setEditingCapability(null)}
                                    onKeyDown={(e) => e.key === 'Enter' && setEditingCapability(null)}
                                  />
                                ) : (
                                  <p className="text-gray-600 text-sm">{capability.description}</p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {specSyncState && state.selectedCapabilityIds.includes(capability.id) && (
                                <>
                                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                    {getCapabilityRequirementCount(capability.name)} reqs
                                  </Badge>
                                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                    {getCapabilityUseCaseCount(capability.name)} use cases
                                  </Badge>
                                </>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingCapability(editingCapability === capability.id ? null : capability.id)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveCapability(domain.id, capability.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        
                        {domain.capabilities.length === 0 && (
                          <div className="text-center py-4 text-gray-500">
                            No capabilities added yet. Click the + button to add one.
                          </div>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
              
              {state.domains.length === 0 && (
                <Card className="border-dashed border-gray-300">
                  <CardContent className="text-center py-12">
                    <div className="text-gray-500">
                      <p className="text-lg font-medium mb-2">No TMF ODA domains added yet</p>
                      <p className="text-sm">Click &quot;Add Domain&quot; to get started with TMF ODA management</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
