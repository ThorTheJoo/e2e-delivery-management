'use client';

import { useState, useEffect, useCallback } from 'react';
import { Project, TMFCapability, ETOMProcess, WorkPackage, Milestone, Risk, Dependency, Document, TMFOdaDomain, SpecSyncItem } from '@/types';
import { dataService } from '@/lib/data-service';
import { formatDate, calculateEffortTotal, getStatusColor, getSeverityColor } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { SpecSyncImport } from '@/components/specsync-import';
import { SpecSyncState } from '@/types';
import { RequirementBadge } from '@/components/requirement-badge';
import { TMFDomainCapabilityManager } from '@/components/tmf-domain-capability-manager';
import { NavigationSidebar } from '@/components/navigation-sidebar';
import { SETImport } from '@/components/set-import';
import { MiroBoardCreator } from '@/components/miro-board-creator';
import { BlueDolphinIntegration } from '@/components/blue-dolphin-integration';
import { useToast, ToastContainer } from '@/components/ui/toast';
import { mapSpecSyncToCapabilities, calculateUseCaseCountsByCapability, saveSpecSyncData, loadSpecSyncData, clearSpecSyncData } from '@/lib/specsync-utils';
import { 
  Network, 
  Lightbulb, 
  Route, 
  Calculator, 
  Calendar, 
  DollarSign, 
  FileText, 
  AlertTriangle,
  Flag,
  Users,
  Clock,
  TrendingUp,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Layout,
  PencilRuler
} from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const [project, setProject] = useState<Project | null>(null);
  const [tmfCapabilities, setTmfCapabilities] = useState<TMFCapability[]>([]);
  const [etomProcesses, setEtomProcesses] = useState<ETOMProcess[]>([]);
  const [workPackages, setWorkPackages] = useState<WorkPackage[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [specSyncState, setSpecSyncState] = useState<SpecSyncState | null>(null);
  const [requirementCounts, setRequirementCounts] = useState<Record<string, number>>({});
  const [useCaseCounts, setUseCaseCounts] = useState<Record<string, number>>({});
  const [isSpecSyncExpanded, setIsSpecSyncExpanded] = useState(true);
  const [isTmfManagerExpanded, setIsTmfManagerExpanded] = useState(true);
  const [isTmfCapabilitiesExpanded, setIsTmfCapabilitiesExpanded] = useState(true);
  const [setDomainEfforts, setSetDomainEfforts] = useState<Record<string, number>>({});
  const [setMatchedWorkPackages, setSetMatchedWorkPackages] = useState<Record<string, any>>({});
  const [tmfDomains, setTmfDomains] = useState<TMFOdaDomain[]>([]);
  const [specSyncItems, setSpecSyncItems] = useState<SpecSyncItem[]>([]);
  
  const toast = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Starting data load...');
        
        // Test data service first
        console.log('Testing data service...');
        const testProject = await dataService.getProject();
        console.log('Test project loaded:', testProject);
        
        const [
          projectData,
          tmfData,
          etomData,
          workPackagesData,
          milestonesData,
          risksData,
          dependenciesData,
          documentsData
        ] = await Promise.all([
          dataService.getProject(),
          dataService.getTMFCapabilities(),
          dataService.getETOMProcesses(),
          dataService.getWorkPackages(),
          dataService.getMilestones(),
          dataService.getRisks(),
          dataService.getDependencies(),
          dataService.getDocuments()
        ]);

        console.log('Data loaded successfully:', {
          project: projectData,
          tmfCapabilities: tmfData?.length,
          etomProcesses: etomData?.length,
          workPackages: workPackagesData?.length,
          milestones: milestonesData?.length,
          risks: risksData?.length,
          dependencies: dependenciesData?.length,
          documents: documentsData?.length
        });

        setProject(projectData);
        setTmfCapabilities(tmfData || []);
        setEtomProcesses(etomData || []);
        setWorkPackages(workPackagesData || []);
        setMilestones(milestonesData || []);
        setRisks(risksData || []);
        setDependencies(dependenciesData || []);
        setDocuments(documentsData || []);
        
        console.log('State updated, setting loading to false...');
      } catch (error) {
        console.error('Error loading data:', error);
        
        // Fallback data if data service fails
        console.log('Using fallback data...');
        const fallbackProject: Project = {
          id: 'FALLBACK-001',
          name: 'Fallback Project',
          customer: 'Demo Customer',
          status: 'In Progress',
          startDate: '2025-01-15',
          endDate: '2025-07-15',
          duration: '6 months',
          teamSize: 4,
          workingDaysPerMonth: 20
        };
        
        setProject(fallbackProject);
        setTmfCapabilities([]);
        setEtomProcesses([]);
        setWorkPackages([]);
        setMilestones([]);
        setRisks([]);
        setDependencies([]);
        setDocuments([]);
        
        console.log('Fallback data set, setting loading to false...');
      } finally {
        console.log('Finally block: setting loading to false');
        setLoading(false);
      }
    };

    loadData();
    
    // Fallback timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('Loading timeout reached, forcing loading to false');
      setLoading(false);
    }, 10000); // 10 seconds timeout

    return () => clearTimeout(timeoutId);
  }, []);

  // Load saved SpecSync data
  useEffect(() => {
    const savedState = loadSpecSyncData();
    if (savedState) {
      setSpecSyncState(savedState);
      setSpecSyncItems(savedState.items); // Set specSyncItems for MiroBoardCreator
      // Don't show toast on page reload - only show when user actually imports
    } else {
      // Set default sample SpecSync data if none exists
      const defaultSpecSyncItems: SpecSyncItem[] = [
        {
          id: 'req-001',
          requirementId: 'REQ-001',
          rephrasedRequirementId: 'Customer Data Management',
          domain: 'Customer Management',
          vertical: 'Telecommunications',
          functionName: 'Customer Information Management',
          afLevel2: 'Customer Management',
          capability: 'Customer Data Management',
          referenceCapability: 'TMF Customer Management',
          usecase1: 'Customer Onboarding',
          description: 'System shall manage customer information across all segments',
          priority: 'High',
          status: 'In Progress'
        },
        {
          id: 'req-002',
          requirementId: 'REQ-002',
          rephrasedRequirementId: 'Product Portfolio Management',
          domain: 'Product Management',
          vertical: 'Telecommunications',
          functionName: 'Product Portfolio Management',
          afLevel2: 'Product Management',
          capability: 'Product Portfolio Management',
          referenceCapability: 'TMF Product Management',
          usecase1: 'Product Creation',
          description: 'System shall support end-to-end product lifecycle management',
          priority: 'High',
          status: 'In Progress'
        },
        {
          id: 'req-003',
          requirementId: 'REQ-003',
          rephrasedRequirementId: 'Billing and Charging',
          domain: 'Revenue Management',
          vertical: 'Telecommunications',
          functionName: 'Billing and Charging',
          afLevel2: 'Revenue Management',
          capability: 'Billing and Charging',
          referenceCapability: 'TMF Revenue Management',
          usecase1: 'Invoice Generation',
          description: 'System shall provide comprehensive billing and revenue management',
          priority: 'High',
          status: 'In Progress'
        }
      ];
      setSpecSyncItems(defaultSpecSyncItems);
    }
  }, []);

  // Update requirement counts when tmfCapabilities are loaded
  useEffect(() => {
    if (specSyncState && tmfCapabilities.length > 0) {
      updateRequirementCounts(specSyncState);
    }
  }, [tmfCapabilities, specSyncState]);

  // Initialize default TMF domains if none exist
  useEffect(() => {
    if (tmfDomains.length === 0) {
      const defaultTmfDomains: TMFOdaDomain[] = [
        {
          id: 'customer-management',
          name: 'Customer Management',
          description: 'Customer data and relationship management capabilities',
          capabilities: [
            {
              id: 'customer-information-management',
              name: 'Customer Information Management',
              description: 'Comprehensive customer data management across all segments',
              domainId: 'customer-management',
              isSelected: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 'customer-relationship-management',
              name: 'Customer Relationship Management',
              description: 'Customer interaction and relationship tracking',
              domainId: 'customer-management',
              isSelected: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ],
          isSelected: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'product-management',
          name: 'Product Management',
          description: 'Product and service portfolio management capabilities',
          capabilities: [
            {
              id: 'product-portfolio-management',
              name: 'Product Portfolio Management',
              description: 'End-to-end product lifecycle management',
              domainId: 'product-management',
              isSelected: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 'offer-management',
              name: 'Offer Management',
              description: 'Product offer creation and management',
              domainId: 'product-management',
              isSelected: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ],
          isSelected: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'revenue-management',
          name: 'Revenue Management',
          description: 'Billing, charging, and revenue management capabilities',
          capabilities: [
            {
              id: 'billing-and-charging',
              name: 'Billing and Charging',
              description: 'Comprehensive billing and revenue management',
              domainId: 'revenue-management',
              isSelected: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 'payment-management',
              name: 'Payment Management',
              description: 'Payment processing and management',
              domainId: 'revenue-management',
              isSelected: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ],
          isSelected: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      setTmfDomains(defaultTmfDomains);
    }
  }, []); // Changed from [tmfDomains.length] to [] to prevent infinite loop

  const handleSpecSyncImport = (state: SpecSyncState) => {
    console.log('handleSpecSyncImport called with:', state);
    setSpecSyncState(state);
    setSpecSyncItems(state.items); // Update specSyncItems for MiroBoardCreator
    updateRequirementCounts(state);
    saveSpecSyncData(state);
    
    const mapping = mapSpecSyncToCapabilities(state.items, tmfCapabilities);
    const topCaps = Object.entries(mapping.countsByCapability)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([k, v]) => `${k}(${v})`)
      .join(', ');
    
    // Enhanced success notification
    toast.showSuccess(
      '🎉 SpecSync Import Successful!',
      `Successfully imported ${state.items.length} requirements from ${Object.keys(state.counts.domains).length} domains. ${topCaps ? `Top capabilities: ${topCaps}` : ''}`
    );
  };

  const handleSpecSyncClear = () => {
    setSpecSyncState(null);
    setSpecSyncItems([]); // Clear specSyncItems for MiroBoardCreator
    setRequirementCounts({});
    setUseCaseCounts({});
    clearSpecSyncData();
    toast.showInfo('🗑️ SpecSync data cleared successfully');
  };

  const handleTmfStateChange = useCallback((domains: any[]) => {
    // Convert UserDomain[] to TMFOdaDomain[] for MiroBoardCreator
    const tmfDomains: TMFOdaDomain[] = domains.map(domain => ({
      id: domain.id,
      name: domain.name,
      description: domain.description,
      capabilities: domain.capabilities.map((cap: any) => ({
        id: cap.id,
        name: cap.name,
        description: cap.description,
        domainId: domain.id,
        isSelected: cap.isSelected,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })),
      isSelected: domain.isSelected,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    setTmfDomains(tmfDomains);
  }, []);

  const updateRequirementCounts = (state: SpecSyncState) => {
    // Only update counts if tmfCapabilities are loaded
    if (tmfCapabilities.length > 0) {
      const mapping = mapSpecSyncToCapabilities(state.items, tmfCapabilities);
      setRequirementCounts(mapping.countsByCapability);
      
      const useCaseMapping = calculateUseCaseCountsByCapability(state.items, tmfCapabilities);
      setUseCaseCounts(useCaseMapping);
    }
  };

  const handleSETDataLoaded = (domainEfforts: Record<string, number>, matchedWorkPackages: Record<string, any>) => {
    setSetDomainEfforts(domainEfforts);
    setSetMatchedWorkPackages(matchedWorkPackages);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-muted-foreground">Loading E2E Delivery Management System...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Error Loading Project</h1>
          <p className="mt-2 text-muted-foreground">Unable to load project data</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const totalEffort = tmfCapabilities.reduce((sum, capability) => {
    return sum + calculateEffortTotal(capability.baseEffort);
  }, 0);

  const completedWorkPackages = workPackages.filter(wp => wp.status === 'Completed').length;
  const totalWorkPackages = workPackages.length;
  const progressPercentage = totalWorkPackages > 0 ? (completedWorkPackages / totalWorkPackages) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-tmf-50 via-white to-etom-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-tmf-600 to-etom-600 text-white shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Network className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">CSG Delivery Orchestrator</h1>
                <p className="text-tmf-100">v1.0 - ODA 2025 Compliant</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <div className="text-sm text-tmf-100">Project</div>
                <div className="font-semibold">{project.name}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-tmf-100">Status</div>
                <div className="font-semibold">{project.status}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-tmf-100">Customer</div>
                <div className="font-semibold">{project.customer}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with Sidebar */}
      <div className="flex h-[calc(100vh-120px)]">
        {/* Navigation Sidebar */}
        <NavigationSidebar 
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-10">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="tmf" className="flex items-center space-x-2">
              <Network className="h-4 w-4" />
              <span className="hidden sm:inline">TMF</span>
            </TabsTrigger>
            <TabsTrigger value="tmf-demo" className="flex items-center space-x-2">
              <Network className="h-4 w-4" />
              <span className="hidden sm:inline">TMF Demo</span>
            </TabsTrigger>
            <TabsTrigger value="solution-model" className="flex items-center space-x-2">
              <PencilRuler className="h-4 w-4" />
              <span className="hidden sm:inline">Solution Model</span>
            </TabsTrigger>
            <TabsTrigger value="etom" className="flex items-center space-x-2">
              <Route className="h-4 w-4" />
              <span className="hidden sm:inline">eTOM</span>
            </TabsTrigger>
            <TabsTrigger value="estimation" className="flex items-center space-x-2">
              <Calculator className="h-4 w-4" />
              <span className="hidden sm:inline">Estimation</span>
            </TabsTrigger>
            <TabsTrigger value="scheduling" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Scheduling</span>
            </TabsTrigger>
            <TabsTrigger value="commercial" className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Commercial</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Documents</span>
            </TabsTrigger>
            <TabsTrigger value="visual-mapping" className="flex items-center space-x-2">
              <Layout className="h-4 w-4" />
              <span className="hidden sm:inline">Visual Mapping</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="metric-card">
                <div className="metric-value">{totalEffort}</div>
                <div className="metric-label">Total Effort (Days)</div>
              </Card>
              <Card className="metric-card">
                <div className="metric-value">{tmfCapabilities.length}</div>
                <div className="metric-label">TMF Capabilities</div>
              </Card>
              <Card className="metric-card">
                <div className="metric-value">{etomProcesses.length}</div>
                <div className="metric-label">eTOM Processes</div>
              </Card>
              <Card className="metric-card">
                <div className="metric-value">{progressPercentage.toFixed(0)}%</div>
                <div className="metric-label">Progress</div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Project Overview</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Duration</div>
                      <div className="font-semibold">{project.duration}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Team Size</div>
                      <div className="font-semibold">{project.teamSize} people</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Start Date</div>
                      <div className="font-semibold">{formatDate(project.startDate)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">End Date</div>
                      <div className="font-semibold">{formatDate(project.endDate)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Risks & Issues</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {risks.slice(0, 3).map((risk) => (
                      <div key={risk.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <div className="font-medium">{risk.name}</div>
                          <div className="text-sm text-muted-foreground">{risk.description}</div>
                        </div>
                        <div className={`status-badge ${getSeverityColor(risk.severity)}`}>
                          {risk.severity}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TMF Capabilities Tab */}
          <TabsContent value="tmf" className="space-y-6">
            {/* TMF ODA Management Section */}
            <Card>
              <CardHeader>
                                 <CardTitle className="flex items-center space-x-2">
                   <Network className="h-5 w-5" />
                   <span>TMF Domain and Capability Management</span>
                 </CardTitle>
                 <CardDescription>
                   Manage TMF ODA domains and capabilities with imported requirements
                 </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* TMF Capabilities Overview - Collapsible */}
                <div className="border-b pb-6">
                  <div 
                    className="flex items-center justify-between mb-4 cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors"
                    onClick={() => setIsTmfCapabilitiesExpanded(!isTmfCapabilitiesExpanded)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg border-2 border-purple-200">
                        {isTmfCapabilitiesExpanded ? (
                          <ChevronDown className="w-5 h-5 text-purple-700" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-purple-700" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-base font-semibold flex items-center space-x-2">
                          <Network className="h-4 w-4" />
                          <span>TMF Capabilities Overview</span>
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          View TMF capabilities with requirement counts from imported SpecSync data
                        </p>
                      </div>
                    </div>
                    {specSyncState && (
                      <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                        <Badge variant="secondary">
                          {specSyncState.items.length} requirements mapped
                        </Badge>
                      </div>
                    )}
                  </div>
                  {isTmfCapabilitiesExpanded && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {tmfCapabilities.map((capability) => (
                        <Card key={capability.id} className="effort-card hover-lift">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center justify-between">
                              <span className="truncate">{capability.name}</span>
                              <RequirementBadge count={requirementCounts[capability.id] || 0} />
                            </CardTitle>
                            <CardDescription className="text-xs line-clamp-2">{capability.description}</CardDescription>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">BA:</span>
                                  <span className="font-medium">{capability.baseEffort.businessAnalyst}d</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">SA:</span>
                                  <span className="font-medium">{capability.baseEffort.solutionArchitect}d</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Dev:</span>
                                  <span className="font-medium">{capability.baseEffort.developer}d</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">QA:</span>
                                  <span className="font-medium">{capability.baseEffort.qaEngineer}d</span>
                                </div>
                              </div>
                              <div className="pt-2 border-t">
                                <div className="text-xs text-muted-foreground mb-1">Segments</div>
                                <div className="flex flex-wrap gap-1">
                                  {capability.segments.slice(0, 3).map((segment) => (
                                    <span key={segment} className="px-1.5 py-0.5 bg-tmf-100 text-tmf-800 text-xs rounded">
                                      {segment}
                                    </span>
                                  ))}
                                  {capability.segments.length > 3 && (
                                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                      +{capability.segments.length - 3}
                                    </span>
                                  )}
                                </div>
                                {useCaseCounts[capability.id] > 0 && (
                                  <div className="pt-2 border-t">
                                    <div className="text-xs text-muted-foreground mb-1">Use Cases</div>
                                    <div className="flex items-center gap-1">
                                      <span className="px-1.5 py-0.5 bg-orange-100 text-orange-800 text-xs rounded font-medium">
                                        {useCaseCounts[capability.id]} unique use cases
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                          <CardFooter className="pt-0">
                            <div className="w-full text-center">
                              <div className="text-xs text-muted-foreground mb-1">Total Effort</div>
                              <div className="text-lg font-bold text-tmf-600">
                                {calculateEffortTotal(capability.baseEffort)} days
                              </div>
                            </div>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* SpecSync Import - Collapsible */}
                <div className="border-b pb-6">
                  <div 
                    className="flex items-center justify-between mb-4 cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors"
                    onClick={() => setIsSpecSyncExpanded(!isSpecSyncExpanded)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg border-2 border-blue-200">
                        {isSpecSyncExpanded ? (
                          <ChevronDown className="w-5 h-5 text-blue-700" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-blue-700" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-base font-semibold flex items-center space-x-2">
                          <FileText className="h-4 w-4" />
                          <span>SpecSync Import</span>
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Import requirements and map to TMF capabilities
                        </p>
                      </div>
                    </div>
                    {specSyncState && (
                      <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                        <Badge variant="secondary">
                          {specSyncState.items.length} requirements loaded
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSpecSyncClear}
                        >
                          Clear
                        </Button>
                      </div>
                    )}
                  </div>
                  {isSpecSyncExpanded && (
                    <SpecSyncImport
                      onImport={handleSpecSyncImport}
                      onClear={handleSpecSyncClear}
                      currentState={specSyncState}
                    />
                  )}
                </div>

                {/* TMF Domain and Capability Manager - Collapsible */}
                <div className="border-b pb-6">
                  <div 
                    className="flex items-center justify-between mb-4 cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors"
                    onClick={() => setIsTmfManagerExpanded(!isTmfManagerExpanded)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg border-2 border-green-200">
                        {isTmfManagerExpanded ? (
                          <ChevronDown className="w-5 h-5 text-green-700" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-green-700" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-base font-semibold flex items-center space-x-2">
                          <Network className="h-4 w-4" />
                          <span>TMF Domain and Capability Manager</span>
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Manage TMF ODA domains and capabilities with imported requirements
                        </p>
                      </div>
                    </div>
                    {specSyncState && (
                      <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                        <Badge variant="secondary">
                          {specSyncState.items.length} requirements available
                        </Badge>
                      </div>
                    )}
                  </div>
                  {isTmfManagerExpanded && (
                    <TMFDomainCapabilityManager 
                      specSyncData={specSyncState}
                      onStateChange={handleTmfStateChange}
                    />
                  )}
                </div>


              </CardContent>
            </Card>
          </TabsContent>

          {/* TMF Demo Tab */}
          <TabsContent value="tmf-demo" className="space-y-6">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">TMF ODA Management Demo</h2>
              <p className="text-gray-600 mb-6">
                Experience the interactive TMF ODA domain and capability management system in a dedicated demo environment
              </p>
              <div className="flex justify-center space-x-4">
                <Link 
                  href="/tmf-demo" 
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Network className="w-5 h-5 mr-2" />
                  Launch TMF ODA Demo
                </Link>
                <Button 
                  variant="outline"
                  onClick={() => setActiveTab('tmf')}
                  className="inline-flex items-center px-6 py-3"
                >
                  <Network className="w-5 h-5 mr-2" />
                  Go to Main TMF Section
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Solution Model Tab */}
          <TabsContent value="solution-model" className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Solution Model - Blue Dolphin Integration</h2>
              <p className="text-gray-600">
                Create and manage your solution model in Blue Dolphin. Import domains, capabilities, and requirements from SpecSync and TMF data.
              </p>
            </div>
            
            <BlueDolphinIntegration 
              specSyncData={specSyncState}
              tmfDomains={tmfDomains}
              onSyncComplete={(result) => {
                console.log('Blue Dolphin sync completed:', result);
                toast.showSuccess(`Sync completed: ${result.syncedCount} items processed`);
              }}
            />
          </TabsContent>

          {/* eTOM Processes Tab */}
          <TabsContent value="etom" className="space-y-6">
            <div className="space-y-4">
              {etomProcesses.map((process) => (
                <Card key={process.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <span>Level {process.level}: {process.name}</span>
                    </CardTitle>
                    <CardDescription>{process.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium mb-2">Effort Breakdown</div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Business Analyst:</span>
                            <span className="font-medium">{process.baseEffort.businessAnalyst}d</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Solution Architect:</span>
                            <span className="font-medium">{process.baseEffort.solutionArchitect}d</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Developer:</span>
                            <span className="font-medium">{process.baseEffort.developer}d</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">QA Engineer:</span>
                            <span className="font-medium">{process.baseEffort.qaEngineer}d</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium mb-2">Complexity Factors</div>
                        <div className="space-y-2">
                          {Object.entries(process.complexityFactors).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                              <span className="font-medium">{value}x</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Estimation Tab */}
          <TabsContent value="estimation" className="space-y-6">
            <SETImport onDataLoaded={handleSETDataLoaded} />
            
            <Card>
              <CardHeader>
                <CardTitle>Work Package Estimation</CardTitle>
                <CardDescription>Calculate effort estimates for work packages</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workPackages.map((workPackage) => {
                    // Check if this work package has SET data updates
                    const setMatch = Object.entries(setMatchedWorkPackages).find(([domain, match]) => 
                      match.workPackages.includes(workPackage.name)
                    );
                    
                    const setEffort = setMatch ? setMatch[1].effort : null;
                    const setDomain = setMatch ? setMatch[0] : null;
                    
                    return (
                      <div key={workPackage.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold">{workPackage.name}</h3>
                          <div className="flex items-center space-x-2">
                            {setEffort && (
                              <Badge variant="secondary" className="text-xs">
                                SET: {setEffort}d
                              </Badge>
                            )}
                            <div className={`status-badge ${getStatusColor(workPackage.status)}`}>
                              {workPackage.status}
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{workPackage.description}</p>
                        {setDomain && (
                          <p className="text-xs text-blue-600 mb-2">
                            📊 SET Domain: {setDomain} | Total Effort: {setEffort}d
                          </p>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">BA Effort</div>
                            <div className="font-medium">{workPackage.effort.businessAnalyst}d</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">SA Effort</div>
                            <div className="font-medium">{workPackage.effort.solutionArchitect}d</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Dev Effort</div>
                            <div className="font-medium">{workPackage.effort.developer}d</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">QA Effort</div>
                            <div className="font-medium">{workPackage.effort.qaEngineer}d</div>
                          </div>
                        </div>
                        {setEffort && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="text-sm font-medium text-green-600">
                              SET Total Effort: {setEffort}d
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Original Total: {workPackage.effort.businessAnalyst + workPackage.effort.solutionArchitect + workPackage.effort.developer + workPackage.effort.qaEngineer}d
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scheduling Tab */}
          <TabsContent value="scheduling" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span>Project Timeline</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Start Date</span>
                      <span className="font-medium">{formatDate(project.startDate)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">End Date</span>
                      <span className="font-medium">{formatDate(project.endDate)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Duration</span>
                      <span className="font-medium">{project.duration}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Working Days/Month</span>
                      <span className="font-medium">{project.workingDaysPerMonth}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Flag className="h-5 w-5" />
                    <span>Milestones</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {milestones.map((milestone) => (
                      <div key={milestone.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <div className="font-medium">{milestone.name}</div>
                          <div className="text-sm text-muted-foreground">{milestone.date}</div>
                        </div>
                        <div className={`status-badge ${getStatusColor(milestone.status)}`}>
                          {milestone.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Commercial Tab */}
          <TabsContent value="commercial" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Commercial Model</span>
                </CardTitle>
                <CardDescription>Project financial overview and cost structure</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Cost Structure</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Base Cost:</span>
                        <span className="font-medium">$0</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Risk Contingency:</span>
                        <span className="font-medium">$0</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Profit Margin:</span>
                        <span className="font-medium">$0</span>
                      </div>
                      <div className="border-t pt-2 font-semibold">
                        <div className="flex justify-between">
                          <span>Total Cost:</span>
                          <span>$0</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Resource Allocation</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Team Size:</span>
                        <span className="font-medium">{project.teamSize} people</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Effort:</span>
                        <span className="font-medium">{totalEffort} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Duration:</span>
                        <span className="font-medium">{project.duration}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Project Documents</span>
                </CardTitle>
                <CardDescription>Manage project documentation and deliverables</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {documents.map((document) => (
                    <div key={document.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{document.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {document.type} • v{document.version} • {formatDate(document.lastModified)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`status-badge ${getStatusColor(document.status)}`}>
                          {document.status}
                        </div>
                        <Button variant="outline" size="sm">View</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Visual Mapping Tab */}
          <TabsContent value="visual-mapping" className="space-y-6">
            <MiroBoardCreator 
              project={project}
              tmfDomains={tmfDomains}
              specSyncItems={specSyncItems}
            />
          </TabsContent>
        </Tabs>
      </main>
      </div>
      
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </div>
  );
}
