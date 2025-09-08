'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Download, BarChart3, FileText, Calculator, Settings, RefreshCw, Eye, Users, Edit } from 'lucide-react';
import {
  BOMItem,
  BOMState,
  BOMFilters,
  BOMSummary,
  ServiceDeliveryCategory,
  SpecSyncItem,
  SpecSyncState,
} from '@/types';

interface BillOfMaterialsProps {
  specSyncState: SpecSyncState | null;
  setDomainEfforts: Record<string, number>;
  setMatchedWorkPackages: Record<string, any>;
  cetv22Data?: any; // CETv22 data structure
}

const DEFAULT_SERVICE_DELIVERY_SERVICES: ServiceDeliveryCategory[] = [
  'Migration',
  'Training',
  'Development',
  'Build',
  'Test',
  'Release',
  'Project Management',
  'Program Management',
  'Stakeholder Management',
  'Governance',
  'Architecture',
  'Design',
  'Integration',
  'Platform Engineering',
  'Platform Architecture',
  'Environments',
  'Release Deployment',
  'Production Cutover',
  'Warranty',
  'Hypercare',
];

export function BillOfMaterials({
  specSyncState,
  setDomainEfforts,
  setMatchedWorkPackages,
  cetv22Data,
}: BillOfMaterialsProps) {
  const [bomState, setBomState] = useState<BOMState>({
    items: [],
    filters: {
      domains: [],
      capabilities: [],
      priorities: [],
      sources: [],
      statuses: [],
    },
    summary: {
      totalItems: 0,
      totalEffort: 0,
      totalCost: 0,
      domainBreakdown: {},
      capabilityBreakdown: {},
      serviceBreakdown: {} as Record<ServiceDeliveryCategory, number>,
    },
    lastUpdated: new Date().toISOString(),
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedFilters, setSelectedFilters] = useState<BOMFilters>({
    domains: [],
    capabilities: [],
    priorities: [],
    sources: [],
    statuses: [],
  });

  // Generate BOM items from all data sources
  useEffect(() => {
    console.log('🔄 BOM useEffect triggered with:');
    console.log('• specSyncState:', specSyncState);
    console.log('• setDomainEfforts:', setDomainEfforts);
    console.log('• setMatchedWorkPackages:', setMatchedWorkPackages);
    console.log('• cetv22Data:', cetv22Data);

    const generateBOMItems = (): BOMItem[] => {
      const items: BOMItem[] = [];
      let itemId = 1;

      // 1. Process SpecSync data
      if (specSyncState?.items) {
        specSyncState.items.forEach((specItem, index) => {
          const serviceDeliveryServices = DEFAULT_SERVICE_DELIVERY_SERVICES.map(
            (service, serviceIndex) => ({
              id: `service-${itemId}-${serviceIndex}`,
              name: service,
              category: service,
              effort: Math.random() * 10 + 1, // Random effort for demo
              cost: Math.random() * 1000 + 100, // Random cost for demo
              isIncluded: Math.random() > 0.3, // 70% chance of being included
              description: `Service for ${service.toLowerCase()}`,
            }),
          );

          items.push({
            id: `bom-${itemId++}`,
            tmfDomain: specItem.domain || 'Unknown Domain',
            capability: specItem.capability || 'Unknown Capability',
            requirement: specItem.rephrasedRequirementId || specItem.requirementId,
            applicationComponent: specItem.functionName,
            useCase: specItem.usecase1,
            cutEffort: undefined, // Will be populated from SET data
            resourceDomain: undefined, // Will be populated from CETv22 data
            resourceBreakdown: undefined, // Will be populated from CETv22 data
            serviceDeliveryServices,
            priority: Math.random() > 0.7 ? 'High' : Math.random() > 0.4 ? 'Medium' : 'Low',
            status: 'Identified',
            source: 'SpecSync',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        });
      }

      // 2. Process SET data (domain efforts)
      Object.entries(setDomainEfforts).forEach(([domain, effort]) => {
        const existingItem = items.find(
          (item) => item.tmfDomain.toLowerCase() === domain.toLowerCase(),
        );

        if (existingItem) {
          existingItem.cutEffort = effort;
        } else {
          const serviceDeliveryServices = DEFAULT_SERVICE_DELIVERY_SERVICES.map(
            (service, serviceIndex) => ({
              id: `service-${itemId}-${serviceIndex}`,
              name: service,
              category: service,
              effort: Math.random() * 10 + 1,
              cost: Math.random() * 1000 + 100,
              isIncluded: Math.random() > 0.3,
              description: `Service for ${service.toLowerCase()}`,
            }),
          );

          items.push({
            id: `bom-${itemId++}`,
            tmfDomain: domain,
            capability: `${domain} Capability`,
            requirement: `${domain} Requirements`,
            cutEffort: effort,
            serviceDeliveryServices,
            priority: Math.random() > 0.7 ? 'High' : Math.random() > 0.4 ? 'Medium' : 'Low',
            status: 'Identified',
            source: 'SET',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      });

      // 3. Process CETv22 data if available
      if (cetv22Data) {
        // Add CETv22 specific items
        const serviceDeliveryServices = DEFAULT_SERVICE_DELIVERY_SERVICES.map(
          (service, serviceIndex) => ({
            id: `service-cet-${serviceIndex}`,
            name: service,
            category: service,
            effort: Math.random() * 10 + 1,
            cost: Math.random() * 1000 + 100,
            isIncluded: Math.random() > 0.3,
            description: `Service for ${service.toLowerCase()}`,
          }),
        );

        items.push({
          id: `bom-${itemId++}`,
          tmfDomain: 'CETv22 Domain',
          capability: 'CETv22 Capability',
          requirement: 'CETv22 Requirements',
          resourceDomain: 'CETv22 Resource Domain',
          resourceBreakdown: {
            businessAnalyst: 10,
            solutionArchitect: 8,
            developer: 20,
            qaEngineer: 12,
            projectManager: 5,
            totalEffort: 55,
          },
          serviceDeliveryServices,
          priority: 'High',
          status: 'In Progress',
          source: 'CETv22',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      return items;
    };

    const newItems = generateBOMItems();
    setBomState((prev) => ({
      ...prev,
      items: newItems,
      lastUpdated: new Date().toISOString(),
    }));
  }, [specSyncState, setDomainEfforts, setMatchedWorkPackages, cetv22Data]);

  // Calculate summary statistics
  const summary = useMemo((): BOMSummary => {
    const items = bomState.items;
    const totalItems = items.length;

    // Debug logging for effort calculation
    console.log('🔍 BOM Effort Calculation Debug:');
    console.log('• Total BOM items:', totalItems);
    console.log('• CETv22 data available:', !!cetv22Data);
    console.log('• CETv22 data available:', !!cetv22Data);
    console.log('• CETv22 resourceDemands:', cetv22Data?.resourceDemands);
    console.log('• CETv22 domainBreakdown:', cetv22Data?.domainBreakdown);

    // Debug: Check if there are other fields that might contain hours
    if (cetv22Data?.resourceDemands && cetv22Data.resourceDemands.length > 0) {
      const firstDemand = cetv22Data.resourceDemands[0];
      console.log('• First resource demand structure:', Object.keys(firstDemand));
      console.log('• Sample resource demand item:', firstDemand);
    }

    // Debug: Check if there are other CETv22 data fields
    console.log('• CETv22 data keys:', Object.keys(cetv22Data || {}));
    console.log('• CETv22 phases:', cetv22Data?.phases);
    console.log('• CETv22 project:', cetv22Data?.project);
    console.log('• CETv22 analysis:', cetv22Data?.analysis);

    // Check if we have analysis data with processed hours
    if (cetv22Data?.analysis) {
      console.log('• Analysis data available:', cetv22Data.analysis);
      console.log('• Analysis keys:', Object.keys(cetv22Data.analysis));
    }

    // Calculate total effort from multiple sources
    let totalEffort = 0;

    // 1. Add CUT effort from SET data
    const setEffort = items.reduce((sum, item) => sum + (item.cutEffort || 0), 0);
    totalEffort += setEffort;
    console.log('• SET CUT effort:', setEffort, 'mandays');

    // 2. Add resource effort from CETv22 data (convert hours to mandays)
    let cetv22ResourceEffort = 0;

    // First try to get hours from analysis data if available
    if (cetv22Data?.analysis?.resources) {
      console.log('• Using analysis data for resource effort calculation');
      const totalHours = cetv22Data.analysis.resources.totalHours || 0;
      cetv22ResourceEffort = totalHours / 8;
      totalEffort += cetv22ResourceEffort;
      console.log('• CETv22 analysis resource hours:', totalHours, 'hours');
      console.log('• CETv22 analysis resource effort:', cetv22ResourceEffort, 'mandays');
    } else if (cetv22Data?.resourceDemands) {
      // Fallback to raw resource demands
      console.log('• Using raw resource demands for effort calculation');
      console.log('• First 3 resource demand items:', cetv22Data.resourceDemands.slice(0, 3));

      // Try different possible field names for hours
      const totalHours = cetv22Data.resourceDemands.reduce((sum: number, demand: any) => {
        // Try multiple possible field names for hours
        const hours = demand.totalHours || demand.effortHours || demand.hours || demand.effort || 0;
        console.log(
          `• Resource ${demand.jobProfile}: hours=${hours}, resourceCount=${demand.resourceCount}`,
        );
        return sum + hours * (demand.resourceCount || 1);
      }, 0);

      // Convert hours to mandays (assuming 8 hours per day)
      cetv22ResourceEffort = totalHours / 8;
      totalEffort += cetv22ResourceEffort;
      console.log('• CETv22 resource hours:', totalHours, 'hours');
      console.log('• CETv22 resource effort:', cetv22ResourceEffort, 'mandays');
    }

    // 3. Add domain breakdown effort if available
    let cetv22DomainEffort = 0;

    // First try to get hours from analysis data if available
    if (cetv22Data?.analysis?.resources?.domainBreakdown) {
      console.log('• Using analysis data for domain breakdown effort calculation');
      const domainEffort = cetv22Data.analysis.resources.domainBreakdown.reduce(
        (sum: number, domain: any) => {
          return sum + (domain.totalEffort || 0);
        },
        0,
      );
      // Convert hours to mandays (assuming 8 hours per day)
      cetv22DomainEffort = domainEffort / 8;
      totalEffort += cetv22DomainEffort;
      console.log('• CETv22 analysis domain hours:', domainEffort, 'hours');
      console.log('• CETv22 analysis domain effort:', cetv22DomainEffort, 'mandays');
    } else if (cetv22Data?.domainBreakdown) {
      // Fallback to raw domain breakdown
      console.log('• Using raw domain breakdown for effort calculation');
      const domainEffort = cetv22Data.domainBreakdown.reduce((sum: number, domain: any) => {
        return sum + (domain.totalEffort || 0);
      }, 0);
      // Convert hours to mandays (assuming 8 hours per day)
      cetv22DomainEffort = domainEffort / 8;
      totalEffort += cetv22DomainEffort;
      console.log('• CETv22 domain hours:', domainEffort, 'hours');
      console.log('• CETv22 domain effort:', cetv22DomainEffort, 'mandays');
    }

    console.log('• Total calculated effort:', totalEffort, 'mandays');

    const totalCost = items.reduce(
      (sum, item) =>
        sum +
        item.serviceDeliveryServices.reduce(
          (serviceSum, service) => serviceSum + (service.isIncluded ? service.cost : 0),
          0,
        ),
      0,
    );

    const domainBreakdown = items.reduce(
      (acc, item) => {
        acc[item.tmfDomain] = (acc[item.tmfDomain] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const capabilityBreakdown = items.reduce(
      (acc, item) => {
        acc[item.capability] = (acc[item.capability] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const serviceBreakdown = DEFAULT_SERVICE_DELIVERY_SERVICES.reduce(
      (acc, service) => {
        acc[service] = items.reduce(
          (sum, item) =>
            sum +
            item.serviceDeliveryServices.filter((s) => s.category === service && s.isIncluded)
              .length,
          0,
        );
        return acc;
      },
      {} as Record<ServiceDeliveryCategory, number>,
    );

    return {
      totalItems,
      totalEffort,
      totalCost,
      domainBreakdown,
      capabilityBreakdown,
      serviceBreakdown,
    };
  }, [bomState.items, cetv22Data]);

  // Filter items based on search and filters
  const filteredItems = useMemo(() => {
    return bomState.items.filter((item) => {
      const matchesSearch =
        searchTerm === '' ||
        item.tmfDomain.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.capability.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.requirement.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDomain =
        selectedFilters.domains.length === 0 || selectedFilters.domains.includes(item.tmfDomain);

      const matchesCapability =
        selectedFilters.capabilities.length === 0 ||
        selectedFilters.capabilities.includes(item.capability);

      const matchesPriority =
        selectedFilters.priorities.length === 0 ||
        selectedFilters.priorities.includes(item.priority);

      const matchesSource =
        selectedFilters.sources.length === 0 || selectedFilters.sources.includes(item.source);

      const matchesStatus =
        selectedFilters.statuses.length === 0 || selectedFilters.statuses.includes(item.status);

      return (
        matchesSearch &&
        matchesDomain &&
        matchesCapability &&
        matchesPriority &&
        matchesSource &&
        matchesStatus
      );
    });
  }, [bomState.items, searchTerm, selectedFilters]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      'ID',
      'TMF Domain',
      'Capability',
      'Requirement',
      'Application Component',
      'Use Case',
      'CUT Effort (Mandays)',
      'Resource Domain',
      'Priority',
      'Status',
      'Source',
      'Total Service Cost',
      'Included Services',
    ];

    const csvContent = [
      headers.join(','),
      ...filteredItems.map((item) =>
        [
          item.id,
          `"${item.tmfDomain}"`,
          `"${item.capability}"`,
          `"${item.requirement}"`,
          `"${item.applicationComponent || ''}"`,
          `"${item.useCase || ''}"`,
          item.cutEffort || 0,
          `"${item.resourceDomain || ''}"`,
          item.priority,
          item.status,
          item.source,
          item.serviceDeliveryServices.reduce(
            (sum, service) => sum + (service.isIncluded ? service.cost : 0),
            0,
          ),
          `"${item.serviceDeliveryServices
            .filter((s) => s.isIncluded)
            .map((s) => s.name)
            .join('; ')}"`,
        ].join(','),
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `bill-of-materials-${new Date().toISOString().split('T')[0]}.csv`,
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get unique values for filters
  const uniqueDomains = Array.from(new Set(bomState.items.map((item) => item.tmfDomain)));
  const uniqueCapabilities = Array.from(new Set(bomState.items.map((item) => item.capability)));
  const uniquePriorities = ['Low', 'Medium', 'High', 'Critical'];
  const uniqueSources = ['SpecSync', 'SET', 'CETv22', 'Manual'];
  const uniqueStatuses = ['Identified', 'In Progress', 'Completed', 'On Hold'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2 text-2xl">
                <FileText className="h-6 w-6 text-blue-600" />
                <span>Bill of Materials (BOM)</span>
              </CardTitle>
              <CardDescription>
                Comprehensive inventory of TMF domains, capabilities, requirements, and service
                delivery services
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={() => window.location.reload()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button onClick={exportToCSV}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">{summary.totalItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calculator className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Effort</p>
                <p className="text-2xl font-bold">{summary.totalEffort.toFixed(1)} mandays</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Domains</p>
                <p className="text-2xl font-bold">{Object.keys(summary.domainBreakdown).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Services</p>
                <p className="text-2xl font-bold">
                  {Object.values(summary.serviceBreakdown).reduce((a, b) => a + b, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Domain</label>
              <Select
                value={selectedFilters.domains[0] || 'all'}
                onValueChange={(value) =>
                  setSelectedFilters((prev) => ({
                    ...prev,
                    domains: value === 'all' ? [] : [value],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All domains" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All domains</SelectItem>
                  {uniqueDomains.map((domain) => (
                    <SelectItem key={domain} value={domain}>
                      {domain}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Capability</label>
              <Select
                value={selectedFilters.capabilities[0] || 'all'}
                onValueChange={(value) =>
                  setSelectedFilters((prev) => ({
                    ...prev,
                    capabilities: value === 'all' ? [] : [value],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All capabilities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All capabilities</SelectItem>
                  {uniqueCapabilities.map((capability) => (
                    <SelectItem key={capability} value={capability}>
                      {capability}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <Select
                value={selectedFilters.priorities[0] || 'all'}
                onValueChange={(value) =>
                  setSelectedFilters((prev) => ({
                    ...prev,
                    priorities: value === 'all' ? [] : [value],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All priorities</SelectItem>
                  {uniquePriorities.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {priority}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Source</label>
              <Select
                value={selectedFilters.sources[0] || 'all'}
                onValueChange={(value) =>
                  setSelectedFilters((prev) => ({
                    ...prev,
                    sources: value === 'all' ? [] : [value],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sources</SelectItem>
                  {uniqueSources.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={selectedFilters.statuses[0] || 'all'}
                onValueChange={(value) =>
                  setSelectedFilters((prev) => ({
                    ...prev,
                    statuses: value === 'all' ? [] : [value],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {uniqueStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Item Details</TabsTrigger>
          <TabsTrigger value="services">Service Delivery</TabsTrigger>
          <TabsTrigger value="set-estimates">SET Estimates</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Data Consolidation Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Data Consolidation Preview</CardTitle>
              <CardDescription>
                Preview of how TMF SpecSync, SET Estimation, and CETv22 Resource Domain data is
                consolidated
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Data Source Summary */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Card className="p-4">
                  <div className="mb-2 flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <h4 className="font-medium">TMF SpecSync</h4>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    {specSyncState?.items?.length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Items</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {specSyncState?.counts?.totalRequirements || 0} Requirements
                  </p>
                </Card>

                <Card className="p-4">
                  <div className="mb-2 flex items-center space-x-2">
                    <Calculator className="h-5 w-5 text-green-600" />
                    <h4 className="font-medium">SET Estimation</h4>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {Object.keys(setDomainEfforts).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Domains</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {Object.values(setDomainEfforts).reduce((sum, effort) => sum + effort, 0)} Total
                    Mandays
                  </p>
                </Card>

                <Card className="p-4">
                  <div className="mb-2 flex items-center space-x-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    <h4 className="font-medium">CETv22 Resources</h4>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">
                    {cetv22Data?.resourceDemands?.length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Resource Demands</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {cetv22Data?.phases?.length || 0} Phases
                  </p>
                </Card>
              </div>

              {/* Effort Breakdown Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Effort Calculation Breakdown</CardTitle>
                  <CardDescription>
                    How total effort (mandays) is calculated from different data sources
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-lg bg-blue-50 p-4">
                      <h4 className="mb-2 font-medium text-blue-800">SET CUT Effort</h4>
                      <p className="text-2xl font-bold text-blue-600">
                        {bomState.items
                          .reduce((sum, item) => sum + (item.cutEffort || 0), 0)
                          .toFixed(1)}
                      </p>
                      <p className="text-sm text-blue-600">Mandays</p>
                    </div>

                    <div className="rounded-lg bg-green-50 p-4">
                      <h4 className="mb-2 font-medium text-green-800">CETv22 Resource Effort</h4>
                      <p className="text-2xl font-bold text-green-600">
                        {(() => {
                          let totalHours = 0;
                          if (cetv22Data?.resourceDemands) {
                            totalHours = cetv22Data.resourceDemands.reduce(
                              (sum: number, demand: any) => sum + (demand.totalHours || 0),
                              0,
                            );
                          }
                          if (cetv22Data?.domainBreakdown) {
                            totalHours += cetv22Data.domainBreakdown.reduce(
                              (sum: number, domain: any) => sum + (domain.totalEffort || 0),
                              0,
                            );
                          }
                          return (totalHours / 8).toFixed(1);
                        })()}
                      </p>
                      <p className="text-sm text-green-600">Mandays (from hours)</p>
                    </div>

                    <div className="rounded-lg bg-purple-50 p-4">
                      <h4 className="mb-2 font-medium text-purple-800">Total Combined Effort</h4>
                      <p className="text-2xl font-bold text-purple-600">
                        {summary.totalEffort.toFixed(1)}
                      </p>
                      <p className="text-sm text-purple-600">Total Mandays</p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-lg bg-gray-50 p-3">
                    <p className="text-sm text-gray-600">
                      <strong>Calculation:</strong> SET CUT Effort + CETv22 Resource Hours ÷ 8 =
                      Total Mandays
                    </p>
                    <p className="mt-1 text-xs text-gray-500">Assumes 8 working hours per manday</p>
                  </div>
                </CardContent>
              </Card>

              {/* Domain and Capability Breakdown */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Domain Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5" />
                      <span>Domain Breakdown</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(summary.domainBreakdown)
                        .sort(([, a], [, b]) => b - a)
                        .map(([domain, count]) => (
                          <div key={domain} className="flex items-center justify-between">
                            <span className="text-sm">{domain}</span>
                            <Badge variant="secondary">{count}</Badge>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Capability Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5" />
                      <span>Capability Breakdown</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(summary.capabilityBreakdown)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 10)
                        .map(([capability, count]) => (
                          <div key={capability} className="flex items-center justify-between">
                            <span className="truncate text-sm">{capability}</span>
                            <Badge variant="secondary">{count}</Badge>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Consolidated Data Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Consolidated BOM Data Structure</CardTitle>
                  <CardDescription>
                    Sample of the first 5 consolidated items showing data mapping
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="p-2 text-left">TMF Domain</th>
                          <th className="p-2 text-left">Capability</th>
                          <th className="p-2 text-left">Requirement</th>
                          <th className="p-2 text-left">CUT Effort</th>
                          <th className="p-2 text-left">Resource Domain</th>
                          <th className="p-2 text-left">Data Sources</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredItems.slice(0, 5).map((item) => (
                          <tr key={item.id} className="border-b hover:bg-gray-50">
                            <td className="p-2 font-medium">{item.tmfDomain}</td>
                            <td className="p-2">{item.capability}</td>
                            <td className="max-w-xs truncate p-2 text-xs text-muted-foreground">
                              {item.requirement}
                            </td>
                            <td className="p-2">
                              {item.cutEffort ? `${item.cutEffort} mandays` : '-'}
                            </td>
                            <td className="p-2">{item.resourceDomain || '-'}</td>
                            <td className="p-2">
                              <div className="flex flex-wrap gap-1">
                                <Badge variant="outline" className="text-xs">
                                  {item.source}
                                </Badge>
                                {item.applicationComponent && (
                                  <Badge variant="secondary" className="text-xs">
                                    App Component
                                  </Badge>
                                )}
                                {item.useCase && (
                                  <Badge variant="secondary" className="text-xs">
                                    Use Case
                                  </Badge>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground">
                    Showing {Math.min(5, filteredItems.length)} of {filteredItems.length} total
                    consolidated items
                  </div>
                </CardContent>
              </Card>

              {/* Service Delivery Services Consolidation */}
              <Card>
                <CardHeader>
                  <CardTitle>Service Delivery Services Consolidation</CardTitle>
                  <CardDescription>
                    How service delivery services are integrated with BOM items from all data
                    sources
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Service Summary */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="rounded-lg bg-blue-50 p-4">
                        <h4 className="mb-2 font-medium text-blue-800">Total Services Available</h4>
                        <p className="text-2xl font-bold text-blue-600">
                          {DEFAULT_SERVICE_DELIVERY_SERVICES.length}
                        </p>
                        <p className="text-sm text-blue-600">Service Categories</p>
                      </div>
                      <div className="rounded-lg bg-green-50 p-4">
                        <h4 className="mb-2 font-medium text-green-800">Total Service Cost</h4>
                        <p className="text-2xl font-bold text-green-600">
                          $
                          {bomState.items
                            .reduce(
                              (sum, item) =>
                                sum +
                                item.serviceDeliveryServices.reduce(
                                  (serviceSum, service) =>
                                    serviceSum + (service.isIncluded ? service.cost : 0),
                                  0,
                                ),
                              0,
                            )
                            .toLocaleString()}
                        </p>
                        <p className="text-sm text-green-600">Across All BOM Items</p>
                      </div>
                    </div>

                    {/* Service Breakdown by Source */}
                    <div>
                      <h4 className="mb-3 font-medium">Service Distribution by Data Source</h4>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        {['SpecSync', 'SET', 'CETv22'].map((source) => {
                          const sourceItems = bomState.items.filter(
                            (item) => item.source === source,
                          );
                          const totalCost = sourceItems.reduce(
                            (sum, item) =>
                              sum +
                              item.serviceDeliveryServices.reduce(
                                (serviceSum, service) =>
                                  serviceSum + (service.isIncluded ? service.cost : 0),
                                0,
                              ),
                            0,
                          );
                          const serviceCount = sourceItems.reduce(
                            (sum, item) =>
                              sum + item.serviceDeliveryServices.filter((s) => s.isIncluded).length,
                            0,
                          );

                          return (
                            <Card key={source} className="p-3">
                              <div className="text-center">
                                <h5 className="text-sm font-medium">{source}</h5>
                                <p className="text-lg font-bold text-blue-600">{serviceCount}</p>
                                <p className="text-xs text-muted-foreground">Services</p>
                                <p className="text-sm font-medium text-green-600">
                                  ${totalCost.toLocaleString()}
                                </p>
                                <p className="text-xs text-muted-foreground">Total Cost</p>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    </div>

                    {/* Top Services by Usage */}
                    <div>
                      <h4 className="mb-3 font-medium">Most Used Service Delivery Services</h4>
                      <div className="space-y-2">
                        {DEFAULT_SERVICE_DELIVERY_SERVICES.map((service) => ({
                          name: service,
                          count: bomState.items.reduce(
                            (sum, item) =>
                              sum +
                              item.serviceDeliveryServices.filter(
                                (s) => s.category === service && s.isIncluded,
                              ).length,
                            0,
                          ),
                          totalCost: bomState.items.reduce(
                            (sum, item) =>
                              sum +
                              item.serviceDeliveryServices
                                .filter((s) => s.category === service && s.isIncluded)
                                .reduce((serviceSum, s) => serviceSum + s.cost, 0),
                            0,
                          ),
                        }))
                          .sort((a, b) => b.count - a.count)
                          .slice(0, 8)
                          .map((service, index) => (
                            <div
                              key={service.name}
                              className="flex items-center justify-between rounded bg-gray-50 p-2"
                            >
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-600">
                                  #{index + 1}
                                </span>
                                <span className="text-sm">{service.name}</span>
                              </div>
                              <div className="flex items-center space-x-4">
                                <Badge variant="secondary">{service.count} items</Badge>
                                <span className="text-sm font-medium text-green-600">
                                  ${service.totalCost.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CSV Export Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>CSV Export Preview</CardTitle>
                  <CardDescription>
                    Preview of the data structure that will be exported to CSV
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto rounded-lg bg-gray-50 p-4 font-mono text-xs">
                    <div className="mb-2 text-gray-600">CSV Headers:</div>
                    <div className="text-gray-800">
                      ID, TMF Domain, Capability, Requirement, Application Component, Use Case, CUT
                      Effort (Mandays), Resource Domain, Priority, Status, Source, Service Delivery
                      Services
                    </div>
                    <div className="mb-2 mt-4 text-gray-600">Sample Row:</div>
                    <div className="text-gray-800">
                      {filteredItems.length > 0
                        ? `${filteredItems[0].id}, ${filteredItems[0].tmfDomain}, ${filteredItems[0].capability}, "${filteredItems[0].requirement}", ${filteredItems[0].applicationComponent || ''}, ${filteredItems[0].useCase || ''}, ${filteredItems[0].cutEffort || 0}, ${filteredItems[0].resourceDomain || ''}, ${filteredItems[0].priority}, ${filteredItems[0].id}, ${filteredItems[0].source}, ${filteredItems[0].serviceDeliveryServices
                            .filter((s) => s.isIncluded)
                            .map((s) => s.name)
                            .join('; ')}`
                        : 'No data available for preview'}
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button onClick={exportToCSV} className="flex items-center space-x-2">
                      <Download className="h-4 w-4" />
                      Export to CSV
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Item Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>BOM Items ({filteredItems.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2 text-left">Domain</th>
                      <th className="p-2 text-left">Capability</th>
                      <th className="p-2 text-left">Requirement</th>
                      <th className="p-2 text-left">CUT Effort</th>
                      <th className="p-2 text-left">Priority</th>
                      <th className="p-2 text-left">Source</th>
                      <th className="p-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">{item.tmfDomain}</td>
                        <td className="p-2">{item.capability}</td>
                        <td className="p-2">{item.requirement}</td>
                        <td className="p-2">
                          {item.cutEffort ? `${item.cutEffort} mandays` : '-'}
                        </td>
                        <td className="p-2">
                          <Badge
                            variant={
                              item.priority === 'High'
                                ? 'destructive'
                                : item.priority === 'Medium'
                                  ? 'default'
                                  : 'secondary'
                            }
                          >
                            {item.priority}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <Badge variant="outline">{item.source}</Badge>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center space-x-1">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Service Delivery Tab */}
        <TabsContent value="services" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Service Delivery Services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {DEFAULT_SERVICE_DELIVERY_SERVICES.map((service) => {
                  const serviceCount = summary.serviceBreakdown[service] || 0;
                  const totalCost = bomState.items.reduce(
                    (sum, item) =>
                      sum +
                      item.serviceDeliveryServices
                        .filter((s) => s.category === service && s.isIncluded)
                        .reduce((serviceSum, s) => serviceSum + s.cost, 0),
                    0,
                  );

                  return (
                    <Card key={service} className="p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <h4 className="font-medium">{service}</h4>
                        <Badge variant="secondary">{serviceCount}</Badge>
                      </div>
                      <p className="mb-2 text-sm text-muted-foreground">
                        Total Cost: ${totalCost.toLocaleString()}
                      </p>
                      <div className="text-xs text-muted-foreground">
                        Included in {serviceCount} BOM items
                      </div>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Preview Tab */}
        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Consolidation Preview</CardTitle>
              <CardDescription>
                Preview of how TMF SpecSync, SET Estimation, and CETv22 Resource Domain data is
                consolidated
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Data Source Summary */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Card className="p-4">
                  <div className="mb-2 flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <h4 className="font-medium">TMF SpecSync</h4>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    {specSyncState?.items?.length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Items</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {specSyncState?.counts?.totalRequirements || 0} Requirements
                  </p>
                </Card>

                <Card className="p-4">
                  <div className="mb-2 flex items-center space-x-2">
                    <Calculator className="h-5 w-5 text-green-600" />
                    <h4 className="font-medium">SET Estimation</h4>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {Object.keys(setDomainEfforts).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Domains</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {Object.values(setDomainEfforts).reduce((sum, effort) => sum + effort, 0)} Total
                    Mandays
                  </p>
                </Card>

                <Card className="p-4">
                  <div className="mb-2 flex items-center space-x-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    <h4 className="font-medium">CETv22 Resources</h4>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">
                    {cetv22Data?.resourceDemands?.length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Resource Demands</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {cetv22Data?.phases?.length || 0} Phases
                  </p>
                </Card>
              </div>

              {/* Effort Breakdown Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Effort Calculation Breakdown</CardTitle>
                  <CardDescription>
                    How total effort (mandays) is calculated from different data sources
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-lg bg-blue-50 p-4">
                      <h4 className="mb-2 font-medium text-blue-800">SET CUT Effort</h4>
                      <p className="text-2xl font-bold text-blue-600">
                        {bomState.items
                          .reduce((sum, item) => sum + (item.cutEffort || 0), 0)
                          .toFixed(1)}
                      </p>
                      <p className="text-sm text-blue-600">Mandays</p>
                    </div>

                    <div className="rounded-lg bg-green-50 p-4">
                      <h4 className="mb-2 font-medium text-green-800">CETv22 Resource Effort</h4>
                      <p className="text-2xl font-bold text-green-600">
                        {(() => {
                          let totalHours = 0;
                          if (cetv22Data?.resourceDemands) {
                            totalHours = cetv22Data.resourceDemands.reduce(
                              (sum: number, demand: any) => sum + (demand.totalHours || 0),
                              0,
                            );
                          }
                          if (cetv22Data?.domainBreakdown) {
                            totalHours += cetv22Data.domainBreakdown.reduce(
                              (sum: number, domain: any) => sum + (domain.totalEffort || 0),
                              0,
                            );
                          }
                          return (totalHours / 8).toFixed(1);
                        })()}
                      </p>
                      <p className="text-sm text-green-600">Mandays (from hours)</p>
                    </div>

                    <div className="rounded-lg bg-purple-50 p-4">
                      <h4 className="mb-2 font-medium text-purple-800">Total Combined Effort</h4>
                      <p className="text-2xl font-bold text-purple-600">
                        {summary.totalEffort.toFixed(1)}
                      </p>
                      <p className="text-sm text-purple-600">Total Mandays</p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-lg bg-gray-50 p-3">
                    <p className="text-sm text-gray-600">
                      <strong>Calculation:</strong> SET CUT Effort + CETv22 Resource Hours ÷ 8 =
                      Total Mandays
                    </p>
                    <p className="mt-1 text-xs text-gray-500">Assumes 8 working hours per manday</p>
                  </div>
                </CardContent>
              </Card>

              {/* Consolidated Data Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Consolidated BOM Data Structure</CardTitle>
                  <CardDescription>
                    Sample of the first 5 consolidated items showing data mapping
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="p-2 text-left">TMF Domain</th>
                          <th className="p-2 text-left">Capability</th>
                          <th className="p-2 text-left">Requirement</th>
                          <th className="p-2 text-left">CUT Effort</th>
                          <th className="p-2 text-left">Resource Domain</th>
                          <th className="p-2 text-left">Data Sources</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredItems.slice(0, 5).map((item) => (
                          <tr key={item.id} className="border-b hover:bg-gray-50">
                            <td className="p-2 font-medium">{item.tmfDomain}</td>
                            <td className="p-2">{item.capability}</td>
                            <td className="max-w-xs truncate p-2 text-xs text-muted-foreground">
                              {item.requirement}
                            </td>
                            <td className="p-2">
                              {item.cutEffort ? `${item.cutEffort} mandays` : '-'}
                            </td>
                            <td className="p-2">{item.resourceDomain || '-'}</td>
                            <td className="p-2">
                              <div className="flex flex-wrap gap-1">
                                <Badge variant="outline" className="text-xs">
                                  {item.source}
                                </Badge>
                                {item.applicationComponent && (
                                  <Badge variant="secondary" className="text-xs">
                                    App Component
                                  </Badge>
                                )}
                                {item.useCase && (
                                  <Badge variant="secondary" className="text-xs">
                                    Use Case
                                  </Badge>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground">
                    Showing {Math.min(5, filteredItems.length)} of {filteredItems.length} total
                    consolidated items
                  </div>
                </CardContent>
              </Card>

              {/* Service Delivery Services Consolidation */}
              <Card>
                <CardHeader>
                  <CardTitle>Service Delivery Services Consolidation</CardTitle>
                  <CardDescription>
                    How service delivery services are integrated with BOM items from all data
                    sources
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Service Summary */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="rounded-lg bg-blue-50 p-4">
                        <h4 className="mb-2 font-medium text-blue-800">Total Services Available</h4>
                        <p className="text-2xl font-bold text-blue-600">
                          {DEFAULT_SERVICE_DELIVERY_SERVICES.length}
                        </p>
                        <p className="text-sm text-blue-600">Service Categories</p>
                      </div>
                      <div className="rounded-lg bg-green-50 p-4">
                        <h4 className="mb-2 font-medium text-green-800">Total Service Cost</h4>
                        <p className="text-2xl font-bold text-green-600">
                          $
                          {bomState.items
                            .reduce(
                              (sum, item) =>
                                sum +
                                item.serviceDeliveryServices.reduce(
                                  (serviceSum, service) =>
                                    serviceSum + (service.isIncluded ? service.cost : 0),
                                  0,
                                ),
                              0,
                            )
                            .toLocaleString()}
                        </p>
                        <p className="text-sm text-green-600">Across All BOM Items</p>
                      </div>
                    </div>

                    {/* Service Breakdown by Source */}
                    <div>
                      <h4 className="mb-3 font-medium">Service Distribution by Data Source</h4>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        {['SpecSync', 'SET', 'CETv22'].map((source) => {
                          const sourceItems = bomState.items.filter(
                            (item) => item.source === source,
                          );
                          const totalCost = sourceItems.reduce(
                            (sum, item) =>
                              sum +
                              item.serviceDeliveryServices.reduce(
                                (serviceSum, service) =>
                                  serviceSum + (service.isIncluded ? service.cost : 0),
                                0,
                              ),
                            0,
                          );
                          const serviceCount = sourceItems.reduce(
                            (sum, item) =>
                              sum + item.serviceDeliveryServices.filter((s) => s.isIncluded).length,
                            0,
                          );

                          return (
                            <Card key={source} className="p-3">
                              <div className="text-center">
                                <h5 className="text-sm font-medium">{source}</h5>
                                <p className="text-lg font-bold text-blue-600">{serviceCount}</p>
                                <p className="text-xs text-muted-foreground">Services</p>
                                <p className="text-sm font-medium text-green-600">
                                  ${totalCost.toLocaleString()}
                                </p>
                                <p className="text-xs text-muted-foreground">Total Cost</p>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    </div>

                    {/* Top Services by Usage */}
                    <div>
                      <h4 className="mb-3 font-medium">Most Used Service Delivery Services</h4>
                      <div className="space-y-2">
                        {DEFAULT_SERVICE_DELIVERY_SERVICES.map((service) => ({
                          name: service,
                          count: bomState.items.reduce(
                            (sum, item) =>
                              sum +
                              item.serviceDeliveryServices.filter(
                                (s) => s.category === service && s.isIncluded,
                              ).length,
                            0,
                          ),
                          totalCost: bomState.items.reduce(
                            (sum, item) =>
                              sum +
                              item.serviceDeliveryServices
                                .filter((s) => s.category === service && s.isIncluded)
                                .reduce((serviceSum, s) => serviceSum + s.cost, 0),
                            0,
                          ),
                        }))
                          .sort((a, b) => b.count - a.count)
                          .slice(0, 8)
                          .map((service, index) => (
                            <div
                              key={service.name}
                              className="flex items-center justify-between rounded bg-gray-50 p-2"
                            >
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-600">
                                  #{index + 1}
                                </span>
                                <span className="text-sm">{service.name}</span>
                              </div>
                              <div className="flex items-center space-x-4">
                                <Badge variant="secondary">{service.count} items</Badge>
                                <span className="text-sm font-medium text-green-600">
                                  ${service.totalCost.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CSV Export Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>CSV Export Preview</CardTitle>
                  <CardDescription>
                    Preview of the data structure that will be exported to CSV
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto rounded-lg bg-gray-50 p-4 font-mono text-xs">
                    <div className="mb-2 text-gray-600">CSV Headers:</div>
                    <div className="text-gray-800">
                      ID, TMF Domain, Capability, Requirement, Application Component, Use Case, CUT
                      Effort (Mandays), Resource Domain, Priority, Status, Source, Service Delivery
                      Services
                    </div>
                    <div className="mb-2 mt-4 text-gray-600">Sample Row:</div>
                    <div className="text-gray-800">
                      {filteredItems.length > 0
                        ? `${filteredItems[0].id}, ${filteredItems[0].tmfDomain}, ${filteredItems[0].capability}, "${filteredItems[0].requirement}", ${filteredItems[0].applicationComponent || ''}, ${filteredItems[0].useCase || ''}, ${filteredItems[0].cutEffort || 0}, ${filteredItems[0].resourceDomain || ''}, ${filteredItems[0].priority}, ${filteredItems[0].status}, ${filteredItems[0].source}, ${filteredItems[0].serviceDeliveryServices
                            .filter((s) => s.isIncluded)
                            .map((s) => s.name)
                            .join('; ')}`
                        : 'No data available for preview'}
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button onClick={exportToCSV} className="flex items-center space-x-2">
                      <Download className="h-4 w-4" />
                      Export to CSV
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
