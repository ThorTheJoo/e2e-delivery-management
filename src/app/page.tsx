'use client';

import { useState, useEffect, useCallback } from 'react';
import { Project, TMFFunction, ETOMProcess, WorkPackage, Milestone, Risk, Dependency, Document, TMFOdaDomain, SpecSyncItem } from '@/types';
import { BlueDolphinObjectEnhanced } from '@/types/blue-dolphin';
import { dataService } from '@/lib/data-service';
import { formatDate, getStatusColor, getSeverityColor } from '@/lib/utils';
import { getBuildInfo } from '@/lib/build-info';
import { getActiveDataSource, isSupabaseEnvConfigured } from '@/lib/data-source';
import { getStaticTMFDomains, getStaticTMFFunctions } from '@/lib/static-tmf-reference-data';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
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
import { BlueDolphinVisualization } from '@/components/blue-dolphin-visualization';
import { BlueDolphinConfiguration } from '@/components/blue-dolphin-configuration';
import { BlueDolphinWorkspaceOperations } from '@/components/blue-dolphin-workspace-operations';
import { SpecSyncBlueDolphinMapping } from '@/components/specsync-blue-dolphin-mapping';
import { SpecSyncRelationshipTraversal } from '@/components/specsync-relationship-traversal';
import { MiroConfiguration } from '@/components/miro-configuration';
import { ConfluenceConfiguration } from '@/components/confluence-configuration';
import { SupabaseConfiguration } from '@/components/supabase-configuration';
import { MiroSetupGuide } from '@/components/miro-setup-guide';
import { ADOConfigurationComponent } from '@/components/ado-configuration';
import { ADOIntegration } from '@/components/ado-integration';
import { CETv22ServiceDesign } from '@/components/cet-v22/CETv22ServiceDesign';
import { BillOfMaterials } from '@/components/bill-of-materials';
import { BOMConfiguration } from '@/components/bom-configuration';
import { useToast, ToastContainer } from '@/components/ui/toast';
import { ComplexityMatrix } from '@/components/complexity-matrix';
import {
  mapSpecSyncToTMFunctions,
  calculateUseCaseCountsByFunction,
  saveSpecSyncData,
  loadSpecSyncData,
  clearSpecSyncData,
} from '@/lib/specsync-utils';
import {
  Network,
  Route,
  Calculator,
  Calendar,
  DollarSign,
  FileText,
  AlertTriangle,
  Flag,
  Database,
  Workflow,
  Settings,
  TrendingUp,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Layout,
  PencilRuler,
  Server,
} from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const [project, setProject] = useState<Project | null>({
    id: 'INIT-001',
    name: 'Initial Project',
    customer: 'Demo Customer',
    status: 'In Progress',
    startDate: '2025-01-15',
    endDate: '2025-07-15',
    duration: '6 months',
    teamSize: 4,
    workingDaysPerMonth: 20,
  });
  const [tmfFunctions, setTmfFunctions] = useState<TMFFunction[]>([]);
  const [etomProcesses, setEtomProcesses] = useState<ETOMProcess[]>([]);
  const [workPackages, setWorkPackages] = useState<WorkPackage[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [ignored, setDependencies] = useState<Dependency[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Initializing application...');
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  
  // NEW - State for relationship traversal
  const [mappingResults, setMappingResults] = useState<any[]>([]);
  // const [_traversalResults, _setTraversalResults] = useState<any[]>([]);
  const [blueDolphinTraversalResults, setBlueDolphinTraversalResults] = useState<any[]>([]);
  const [workspaceFilter] = useState<string>('Grant Test'); // Fixed: Use correct workspace

  // Handle navigation events from child components
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // Prevent duplicate loadData invocations in React 18 strict/dev
    if ((window as any).__appDataLoading__) {
      return;
    }
    (window as any).__appDataLoading__ = true;
    const handleNavigateToTab = (event: CustomEvent) => {
      setActiveTab(event.detail);
    };

    window.addEventListener('navigate-to-tab', handleNavigateToTab as EventListener);
    return () => {
      window.removeEventListener('navigate-to-tab', handleNavigateToTab as EventListener);
    };
  }, []);

  // Handle tab changes and reset expanded states
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Reset all expanded states when switching tabs
    setIsSpecSyncExpanded(false);
    setIsTmfManagerExpanded(false);
    setIsTmfCapabilitiesExpanded(false);
    setIsEtomProcessesExpanded(false);
  };

  // Toggle solution model sections
  const toggleSolutionModelSection = (sectionId: string) => {
    const newExpanded = new Set(solutionModelSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setSolutionModelSections(newExpanded);
  };
  const [specSyncState, setSpecSyncState] = useState<SpecSyncState | null>(null);
  const [requirementCounts, setRequirementCounts] = useState<Record<string, number>>({}); // used when rendering function cards
  const [useCaseCounts, setUseCaseCounts] = useState<Record<string, number>>({});
  const [isSpecSyncExpanded, setIsSpecSyncExpanded] = useState(false);
  const [isTmfManagerExpanded, setIsTmfManagerExpanded] = useState(false);
  const [isTmfCapabilitiesExpanded, setIsTmfCapabilitiesExpanded] = useState(false);
  const [isEtomProcessesExpanded, setIsEtomProcessesExpanded] = useState(false);
  const [solutionModelSections, setSolutionModelSections] = useState<Set<string>>(
    new Set([]),
  );
  const [workPackageEstimationExpanded, setWorkPackageEstimationExpanded] = useState(false);
  const [setDomainEfforts, setSetDomainEfforts] = useState<Record<string, number>>({});
  const [setMatchedWorkPackages, setSetMatchedWorkPackages] = useState<Record<string, any>>({});
  const [cetv22Data, setCetv22Data] = useState<any>(null);
  const [tmfDomains, setTmfDomains] = useState<TMFOdaDomain[]>([]);
  const [userTmfDomains, setUserTmfDomains] = useState<any[]>([]);
  const [specSyncItems, setSpecSyncItems] = useState<SpecSyncItem[]>([]);
  const [blueDolphinObjects, setBlueDolphinObjects] = useState<BlueDolphinObjectEnhanced[]>([]);
  

  // Handle Blue Dolphin objects loaded from integration component
  const handleBlueDolphinObjectsLoaded = (objects: BlueDolphinObjectEnhanced[]) => {
    console.log('🔵 Blue Dolphin objects loaded in main page:', objects.length);
    setBlueDolphinObjects(objects);
  };

  // Handle Blue Dolphin objects loaded from traversal component
  const handleTraversalBlueDolphinObjectsLoaded = (objects: BlueDolphinObjectEnhanced[]) => {
    console.log('🔵 Blue Dolphin objects loaded from traversal in main page:', objects.length);
    setBlueDolphinObjects(objects);
  };

  // Load Blue Dolphin traversal results from localStorage
  const loadTraversalResultsFromStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem('blueDolphinTraversalObjects');
      if (stored) {
        const data = JSON.parse(stored);
        if (data.objects && Array.isArray(data.objects)) {
          console.log('💾 [Main Page] Loaded Blue Dolphin traversal objects from localStorage:', data.objects.length);
          
          // Convert stored objects back to TraversalResult format
          // For now, we'll create a simple structure that can be used by MiroBoardCreator
          const traversalResults = [{
            applicationFunction: data.objects.find((obj: any) => obj.Definition === 'Application Function') || null,
            businessProcesses: {
              topLevel: data.objects.filter((obj: any) => obj.Definition === 'Business Process' && obj.hierarchyLevel === 'top'),
              childLevel: data.objects.filter((obj: any) => obj.Definition === 'Business Process' && obj.hierarchyLevel === 'child'),
              grandchildLevel: data.objects.filter((obj: any) => obj.Definition === 'Business Process' && obj.hierarchyLevel === 'grandchild')
            },
            applicationServices: {
              topLevel: data.objects.filter((obj: any) => obj.Definition === 'Application Service' && obj.hierarchyLevel === 'top'),
              childLevel: data.objects.filter((obj: any) => obj.Definition === 'Application Service' && obj.hierarchyLevel === 'child'),
              grandchildLevel: data.objects.filter((obj: any) => obj.Definition === 'Application Service' && obj.hierarchyLevel === 'grandchild')
            },
            applicationInterfaces: {
              topLevel: data.objects.filter((obj: any) => obj.Definition === 'Application Interface' && obj.hierarchyLevel === 'top'),
              childLevel: data.objects.filter((obj: any) => obj.Definition === 'Application Interface' && obj.hierarchyLevel === 'child'),
              grandchildLevel: data.objects.filter((obj: any) => obj.Definition === 'Application Interface' && obj.hierarchyLevel === 'grandchild')
            },
            deliverables: {
              topLevel: data.objects.filter((obj: any) => obj.Definition === 'Deliverable' && obj.hierarchyLevel === 'top'),
              childLevel: data.objects.filter((obj: any) => obj.Definition === 'Deliverable' && obj.hierarchyLevel === 'child'),
              grandchildLevel: data.objects.filter((obj: any) => obj.Definition === 'Deliverable' && obj.hierarchyLevel === 'grandchild')
            },
            relatedApplicationFunctions: data.objects.filter((obj: any) => obj.Definition === 'Application Function'),
            specSyncFunctionName: 'Loaded from Storage',
            traversalMetadata: {
              totalObjectsFound: data.objects.length,
              maxDepthReached: 3,
              processingTimeMs: 0,
              cacheHitRate: 1.0
            }
          }];
          
          setBlueDolphinTraversalResults(traversalResults);
          console.log('📊 [Main Page] Converted to traversal results format:', traversalResults.length);
        }
      }
    } catch (error) {
      console.error('❌ [Main Page] Failed to load traversal results from localStorage:', error);
    }
  }, []);

  const toast = useToast();

  // Check for error messages in URL parameters (for Miro auth errors)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const success = urlParams.get('success');

    if (error) {
      toast.showError(`Miro Authentication Error: ${error}`);
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (success) {
      toast.showSuccess('Miro authentication successful!');
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast]);

  // Load traversal results from localStorage on component mount
  useEffect(() => {
    loadTraversalResultsFromStorage();
  }, [loadTraversalResultsFromStorage]);

  useEffect(() => {
    console.log('useEffect triggered, starting data loading process...');
    setLoadingMessage('Initializing data service...');

    const loadData = async () => {
      try {
        console.log('Starting data load...');
        setLoadingMessage('Connecting to data sources...');

        // Test data service initialization
        console.log('Data service instance:', dataService);
        setLoadingMessage('Loading project data...');

        // Load project data first to ensure we have basic data
        console.log('Attempting to load project data...');

        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Data loading timeout')), 8000); // 8 second timeout
        });

        const projectData = await Promise.race([
          dataService.getProject(),
          timeoutPromise
        ]);

        console.log('Project loaded successfully:', projectData);
        setProject(projectData as Project);
        setLoadingMessage('Project data loaded, loading additional data...');

        // Set loading to false immediately after project is loaded
        console.log('Setting loading to false...');
        setLoading(false);

        // Load other data in parallel with individual error handling
        console.log('Loading additional data...');

        try {
          const { TMFReferenceService } = await import('@/lib/tmf-reference-service-new');
          const tmfData = await TMFReferenceService.getAllFunctions();
          console.log('TMF functions loaded:', tmfData?.length || 0);
          setTmfFunctions(tmfData || []);
        } catch (e) {
          console.error('Error loading TMF functions:', e);
          setTmfFunctions([]);
        }

        // Load user TMF domains (read-only; safe fallback inside service)
        try {
          const userDomains = await dataService.getUserTmfDomains();
          if (Array.isArray(userDomains) && userDomains.length > 0) {
            // Map to TMFDomainCapabilityManager expected shape
            const mapped = userDomains.map((d) => ({
              id: d.id,
              name: d.name,
              description: d.description,
              referenceDomainId: (d as any).referenceDomainId,
              isSelected: Boolean((d as any).isSelected),
              isExpanded: false,
              requirementCount: 0,
              capabilities: (d.capabilities || []).map((c: any) => ({
                id: c.id,
                name: c.name,
                description: c.description || '',
                referenceCapabilityId: c.referenceCapabilityId,
                domainId: c.domainId || d.id,
                isSelected: Boolean(c.isSelected),
                requirementCount: Number(c.requirementCount ?? 0),
              })),
            }));
            setUserTmfDomains(mapped);
          } else {
            setUserTmfDomains([]);
          }
        } catch (e) {
          console.warn('User TMF domains load failed; using local defaults.', e);
          setUserTmfDomains([]);
        }

        try {
          const etomData = await dataService.getETOMProcesses();
          console.log('eTOM processes loaded:', etomData?.length || 0);
          setEtomProcesses(etomData || []);
        } catch (e) {
          console.error('Error loading eTOM processes:', e);
          setEtomProcesses([]);
        }

        try {
          const workPackagesData = await dataService.getWorkPackages();
          console.log('Work packages loaded:', workPackagesData?.length || 0);
          setWorkPackages(workPackagesData || []);
        } catch (e) {
          console.error('Error loading work packages:', e);
          setWorkPackages([]);
        }

        try {
          const milestonesData = await dataService.getMilestones();
          console.log('Milestones loaded:', milestonesData?.length || 0);
          setMilestones(milestonesData || []);
        } catch (e) {
          console.error('Error loading milestones:', e);
          setMilestones([]);
        }

        try {
          const risksData = await dataService.getRisks();
          console.log('Risks loaded:', risksData?.length || 0);
          setRisks(risksData || []);
        } catch (e) {
          console.error('Error loading risks:', e);
          setRisks([]);
        }

        try {
          const dependenciesData = await dataService.getDependencies();
          console.log('Dependencies loaded:', dependenciesData?.length || 0);
          setDependencies(dependenciesData || []);
        } catch (e) {
          console.error('Error loading dependencies:', e);
          setDependencies([]);
        }

        try {
          const documentsData = await dataService.getDocuments();
          console.log('Documents loaded:', documentsData?.length || 0);
          setDocuments(documentsData || []);
        } catch (e) {
          console.error('Error loading documents:', e);
          setDocuments([]);
        }

        console.log('All data loading attempts completed');

        // Load CETv22 data from local storage if available
        try {
          const savedCetv22Data = localStorage.getItem('cetv22Data');
          const savedCetv22Analysis = localStorage.getItem('cetv22Analysis');

          if (savedCetv22Data) {
            const parsedData = JSON.parse(savedCetv22Data);
            console.log('CETv22 data loaded from local storage:', parsedData);
            setCetv22Data(parsedData);
          }

          if (savedCetv22Analysis) {
            const parsedAnalysis = JSON.parse(savedCetv22Analysis);
            console.log('CETv22 analysis loaded from local storage:', parsedAnalysis);
            // Merge analysis data with the main data
            if (savedCetv22Data) {
              const parsedData = JSON.parse(savedCetv22Data);
              const mergedData = {
                ...parsedData,
                analysis: parsedAnalysis,
              };
              setCetv22Data(mergedData);
            }
          }
        } catch (e) {
          console.warn('Failed to load CETv22 data from local storage:', e);
        }

        // Load SET data from local storage if available
        try {
          const savedSetData = localStorage.getItem('set-data');
          if (savedSetData) {
            const parsedData = JSON.parse(savedSetData);
            console.log('SET data loaded from local storage:', parsedData);
            if (parsedData.domainEfforts) {
              setSetDomainEfforts(parsedData.domainEfforts);
            }
            if (parsedData.matchedWorkPackages) {
              setSetMatchedWorkPackages(parsedData.matchedWorkPackages);
            }
          }
        } catch (e) {
          console.warn('Failed to load SET data from local storage:', e);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setLoadingMessage('Loading failed, using demo data...');

        // Fallback data if data service fails
        console.log('Using fallback data...');
        const fallbackProject: Project = {
          id: 'FALLBACK-001',
          name: 'Demo Project (Fallback Mode)',
          customer: 'Demo Customer',
          status: 'In Progress',
          startDate: '2025-01-15',
          endDate: '2025-07-15',
          duration: '6 months',
          teamSize: 4,
          workingDaysPerMonth: 20,
        };

        setProject(fallbackProject);
        setTmfFunctions([]);
        setEtomProcesses([]);
        setWorkPackages([]);
        setMilestones([]);
        setRisks([]);
        setDependencies([]);
        setDocuments([]);

        console.log('Fallback data set, setting loading to false...');
        setLoadingMessage('Ready to use!');
        setLoading(false);
      } finally {
        // Ensure loading is always set to false, even if there's an unexpected error
        setTimeout(() => {
          if (loading) {
            console.log('Emergency loading timeout - forcing loading to false');
            setLoadingMessage('Emergency timeout reached - app ready');
            setLoading(false);
          }
        }, 12000); // 12 second emergency timeout
      }
    };

    // Start loading immediately
    console.log('Calling loadData function...');
    loadData();

    // Immediate fallback timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('Loading timeout reached, forcing loading to false');
      setLoading(false);
    }, 1000); // Reduced to 1 second timeout

    return () => {
      clearTimeout(timeoutId);
      delete (window as any).__appDataLoading__;
    };
  }, [loading]);

  // Load saved SpecSync data
  useEffect(() => {
    try {
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
            status: 'In Progress',
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
            status: 'In Progress',
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
            status: 'In Progress',
          },
        ];
        setSpecSyncItems(defaultSpecSyncItems);
      }
    } catch (error) {
      console.error('Error loading SpecSync data:', error);
      // Set default data on error
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
          status: 'In Progress',
        },
      ];
      setSpecSyncItems(defaultSpecSyncItems);
    }
  }, []);

  // Update requirement counts when tmfFunctions are loaded
  // Intentionally exclude updateRequirementCounts from deps to avoid rebind loops
  useEffect(() => {
    if (specSyncState && tmfFunctions.length > 0) {
      updateRequirementCounts(specSyncState);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tmfFunctions, specSyncState]);

  // Initialize default TMF domains if none exist
  // Intentionally only on mount to seed defaults
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
              updatedAt: new Date().toISOString(),
            },
            {
              id: 'customer-relationship-management',
              name: 'Customer Relationship Management',
              description: 'Customer interaction and relationship tracking',
              domainId: 'customer-management',
              isSelected: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          isSelected: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
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
              updatedAt: new Date().toISOString(),
            },
            {
              id: 'offer-management',
              name: 'Offer Management',
              description: 'Product offer creation and management',
              domainId: 'product-management',
              isSelected: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          isSelected: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
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
              updatedAt: new Date().toISOString(),
            },
            {
              id: 'payment-management',
              name: 'Payment Management',
              description: 'Payment processing and management',
              domainId: 'revenue-management',
              isSelected: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          isSelected: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      setTmfDomains(defaultTmfDomains);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Changed from [tmfDomains.length] to [] to prevent infinite loop

  const handleSpecSyncImport = (state: SpecSyncState) => {
    console.log('🎯 handleSpecSyncImport called with:', state);
    console.log('📊 SpecSync data summary:', {
      totalRequirements: state.counts.totalRequirements,
      domains: Object.keys(state.counts.domains),
      useCases: state.counts.useCases,
      fileName: state.fileName
    });
    setSpecSyncState(state);
    setSpecSyncItems(state.items); // Update specSyncItems for MiroBoardCreator
    updateRequirementCounts(state);
    saveSpecSyncData(state);

    const mapping = mapSpecSyncToTMFunctions(state.items, tmfFunctions);
    const topCaps = Object.entries(mapping.countsByFunction)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([k, v]) => `${k}(${v})`)
      .join(', ');

    // Enhanced success notification
    toast.showSuccess(
      '🎉 SpecSync Import Successful!',
      `Successfully imported ${state.items.length} requirements from ${Object.keys(state.counts.domains).length} domains. ${topCaps ? `Top capabilities: ${topCaps}` : ''}`,
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

  const handleTmfStateChange = useCallback((domains: Array<{ id: string; name: string; description: string; isSelected: boolean; capabilities: Array<{ id: string; name: string; description: string; isSelected: boolean }> }>) => {
    // Convert UserDomain[] to TMFOdaDomain[] for MiroBoardCreator
    const tmfDomains: TMFOdaDomain[] = domains.map((domain) => ({
      id: domain.id,
      name: domain.name,
      description: domain.description,
      capabilities: domain.capabilities.map((cap) => ({
        id: cap.id,
        name: cap.name,
        description: cap.description,
        domainId: domain.id,
        isSelected: cap.isSelected,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })),
      isSelected: domain.isSelected,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    setTmfDomains(tmfDomains);
  }, []);

  const updateRequirementCounts = (state: SpecSyncState) => {
    // Only update counts if tmfFunctions are loaded
    if (tmfFunctions.length > 0) {
      const mapping = mapSpecSyncToTMFunctions(state.items, tmfFunctions);
      setRequirementCounts(mapping.countsByFunction);

      const useCaseMapping = calculateUseCaseCountsByFunction(state.items, tmfFunctions);
      setUseCaseCounts(useCaseMapping);
    }
  };

  // Get domain and function cards with integrated data from SpecSync, SET, and service design
  const getDomainFunctionCards = () => {
    // PRIORITY 1: If we have SpecSync data, use it to create cards based on actual requirements
    if (specSyncState && specSyncState.items.length > 0) {
      console.log('🎯 Dashboard: Using SpecSync data for TMF Domain and Function Overview');
      console.log('📊 SpecSync items count:', specSyncState.items.length);
      console.log('📊 SpecSync domains:', [...new Set(specSyncState.items.map(item => item.domain))]);
      console.log('📊 SpecSync functions:', [...new Set(specSyncState.items.map(item => item.functionName))]);
      const domainMap = new Map<string, {
        name: string;
        functions: Array<{
          id: string;
          function_name: string;
          domain_name: string;
          vertical?: string;
          function_id?: string;
          uid?: string;
          requirementCount: number;
          useCaseCount: number;
          developmentEffort: number;
          mandateEffort: number;
          requirements: Array<{
            id: string;
            requirementId: string;
            description: string;
            priority: string;
            status: string;
            usecase1?: string;
          }>;
        }>;
        totalRequirements: number;
      }>();

      // Group SpecSync items by function name and domain
      const functionGroups = new Map<string, SpecSyncItem[]>();
      
      specSyncState.items.forEach((item) => {
        const domainName = item.domain || 'Unknown';
        const functionName = item.functionName || item.capability || 'Unknown Function';
        const key = `${domainName}||${functionName}`;
        
        if (!functionGroups.has(key)) {
          functionGroups.set(key, []);
        }
        functionGroups.get(key)!.push(item);
      });

      functionGroups.forEach((items, key) => {
        const [domainName, functionName] = key.split('||');
        
        if (!domainMap.has(domainName)) {
          domainMap.set(domainName, {
            name: domainName,
            functions: [],
            totalRequirements: 0,
          });
        }

        const domain = domainMap.get(domainName)!;
        const requirementCount = items.length;
        const useCaseCount = items.filter(item => item.usecase1).length;
        
        // Get effort data from SET file (estimation page)
        const domainEffort = setDomainEfforts[domainName] || 0;
        const developmentEffort = Math.round(domainEffort / Math.max(domain.functions.length, 1)) || 5; // Default 5 days
        
        // Get mandate effort from service design data (CETv22)
        let mandateEffort = 0;
        if (cetv22Data && cetv22Data.resourceDemands) {
          // Calculate mandate effort based on resource demands for this domain
          const domainResourceDemands = cetv22Data.resourceDemands.filter((demand: { productType: string; jobProfile: string; effortHours: number }) => 
            demand.productType.toLowerCase().includes(domainName.toLowerCase()) ||
            demand.jobProfile.toLowerCase().includes(domainName.toLowerCase())
          );
          mandateEffort = Math.round(domainResourceDemands.reduce((sum: number, demand: { effortHours: number }) => sum + demand.effortHours, 0) / 8); // Convert hours to days
        }

        domain.functions.push({
          id: `specsync-${functionName.replace(/\s+/g, '-').toLowerCase()}`,
          function_name: functionName,
          domain_name: domainName,
          vertical: items[0].vertical,
          function_id: items[0].requirementId,
          uid: items[0].id,
          requirementCount,
          useCaseCount,
          developmentEffort,
          mandateEffort,
          requirements: items.map((req) => ({
            id: req.id,
            requirementId: req.requirementId,
            description: req.description ?? '',
            priority: req.priority ?? '',
            status: req.status ?? '',
            usecase1: req.usecase1,
          })),
        });

        domain.totalRequirements += requirementCount;
      });

      return Array.from(domainMap.values());
    }

    // PRIORITY 2: If we have TMF functions from Supabase, use them
    if (tmfFunctions.length > 0) {
      console.log('🎯 Dashboard: Using TMF functions data for TMF Domain and Function Overview');
      console.log('📊 TMF functions count:', tmfFunctions.length);
      console.log('📊 TMF domains:', [...new Set(tmfFunctions.map(func => func.domain_name))]);
      const domainMap = new Map<string, {
        name: string;
        functions: Array<{
          id: string;
          function_name: string;
          domain_name: string;
          vertical?: string;
          function_id?: string;
          uid?: string;
          requirementCount: number;
          useCaseCount: number;
          developmentEffort: number;
          mandateEffort: number;
          requirements: Array<{
            id: string;
            requirementId: string;
            description: string;
            priority: string;
            status: string;
            usecase1?: string;
          }>;
        }>;
        totalRequirements: number;
      }>();

      tmfFunctions.forEach((func) => {
        const domainName = func.domain_name || 'Unknown';
        if (!domainMap.has(domainName)) {
          domainMap.set(domainName, {
            name: domainName,
            functions: [],
            totalRequirements: 0,
          });
        }

        const domain = domainMap.get(domainName)!;
        const useCaseCount = useCaseCounts[func.id] || 0;
        
        // Get effort data from SET file (estimation page)
        const domainEffort = setDomainEfforts[domainName] || 0;
        const developmentEffort = Math.round(domainEffort / domain.functions.length) || 0;
        
        // Get mandate effort from service design data (CETv22)
        let mandateEffort = 0;
        if (cetv22Data && cetv22Data.resourceDemands) {
          // Calculate mandate effort based on resource demands for this domain
          const domainResourceDemands = cetv22Data.resourceDemands.filter((demand: { productType: string; jobProfile: string; effortHours: number }) => 
            demand.productType.toLowerCase().includes(domainName.toLowerCase()) ||
            demand.jobProfile.toLowerCase().includes(domainName.toLowerCase())
          );
          mandateEffort = Math.round(domainResourceDemands.reduce((sum: number, demand: { effortHours: number }) => sum + demand.effortHours, 0) / 8); // Convert hours to days
        }

        // Find requirements that match this TMF function
        const matchingRequirements = specSyncState?.items.filter(item => {
          const itemFunction = (item.functionName || '').toString().trim().toLowerCase();
          const itemDomain = (item.domain || '').toString().trim().toLowerCase();
          const functionName = func.function_name.trim().toLowerCase();
          const domainNameLower = domainName.toLowerCase();

          // Try to match function name and domain
          const functionMatch = itemFunction === functionName || 
                               itemFunction.includes(functionName) || 
                               functionName.includes(itemFunction);
          const domainMatch = itemDomain === domainNameLower || 
                             itemDomain.includes(domainNameLower) || 
                             domainNameLower.includes(itemDomain);

          return functionMatch && domainMatch;
        }) || [];

        const requirementCount = requirementCounts[func.id] ?? matchingRequirements.length;

        domain.functions.push({
          id: func.id,
          function_name: func.function_name,
          domain_name: func.domain_name || 'Unknown',
          vertical: func.vertical ?? undefined,
          function_id: (func.function_id ?? undefined) as unknown as string | undefined,
          uid: (func.uid ?? undefined) as unknown as string | undefined,
          requirementCount,
          useCaseCount,
          developmentEffort,
          mandateEffort,
          requirements: matchingRequirements.map((req) => ({
            id: req.id,
            requirementId: req.requirementId,
            description: req.description ?? '',
            priority: req.priority ?? '',
            status: req.status ?? '',
            usecase1: req.usecase1,
          })),
        });

        domain.totalRequirements += requirementCount;
      });

      return Array.from(domainMap.values());
    }

    // Return empty array if no data available
    console.log('⚠️ Dashboard: No data available for TMF Domain and Function Overview');
    return [];
  };

  const handleSETDataLoaded = (
    domainEfforts: Record<string, number>,
    matchedWorkPackages: Record<string, any>,
  ) => {
    console.log('📥 SET data loaded in main page:');
    console.log('📊 Domain efforts:', domainEfforts);
    console.log('📊 Matched work packages:', matchedWorkPackages);
    console.log('📊 Total effort:', Object.values(domainEfforts).reduce((a, b) => a + b, 0));
    
    setSetDomainEfforts(domainEfforts);
    setSetMatchedWorkPackages(matchedWorkPackages);

    // Save to localStorage for persistence
    try {
      const setData = {
        domainEfforts,
        matchedWorkPackages,
        timestamp: new Date().toISOString(),
        totalEffort: Object.values(domainEfforts).reduce((a, b) => a + b, 0)
      };
      localStorage.setItem('set-data', JSON.stringify(setData));
      console.log('💾 SET data saved to localStorage');
    } catch (error) {
      console.error('❌ Failed to save SET data to localStorage:', error);
    }
  };

  if (loading) {
    console.log('Rendering loading screen, loading state:', loading);
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-32 w-32 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="mt-4 text-lg text-muted-foreground">
            Loading E2E Delivery Management System...
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {loadingMessage}
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <button
              onClick={() => {
                console.log('Manual refresh button clicked');
                setLoading(false);
              }}
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Skip Loading
            </button>
            <button
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className="rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700 text-sm"
            >
              {showDiagnostics ? 'Hide' : 'Show'} Diagnostics
            </button>
          </div>

          {showDiagnostics && (
            <div className="mt-6 max-w-md rounded bg-gray-100 p-4 text-left text-xs">
              <h4 className="font-semibold mb-2">Loading Diagnostics:</h4>
              <ul className="space-y-1">
                <li>• Data source: {getActiveDataSource()}</li>
                <li>• Supabase configured: {isSupabaseEnvConfigured() ? 'Yes' : 'No'}</li>
                <li>• Current message: {loadingMessage}</li>
                <li>• Timeout: 8 seconds</li>
                <li>• Emergency timeout: 15 seconds</li>
              </ul>
              <div className="mt-3">
                <p className="text-red-600 font-medium">Having trouble?</p>
                <p>Try: Configure Supabase in Settings → Supabase Configuration</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Error Loading Project</h1>
          <p className="mt-2 text-muted-foreground">Unable to load project data</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Load Blue Dolphin objects from localStorage for accurate count
  const getBlueDolphinObjectsCount = () => {
    try {
      const stored = localStorage.getItem('blueDolphinTraversalObjects');
      if (stored) {
        const data = JSON.parse(stored);
        if (data.objects && Array.isArray(data.objects)) {
          console.log('💾 [Dashboard] Blue Dolphin objects from localStorage:', data.objects.length);
          console.log('💾 [Dashboard] Blue Dolphin objectTypes:', data.objectTypes);
          return data.objects.length;
        }
      }
    } catch (error) {
      console.error('❌ [Dashboard] Failed to load Blue Dolphin objects from localStorage:', error);
    }
    console.log('💾 [Dashboard] Fallback to traversal results:', blueDolphinTraversalResults.length);
    return blueDolphinTraversalResults.length; // Fallback to traversal results
  };

  // Calculate realistic dashboard metrics from consolidated data
  const calculateDashboardMetrics = () => {
    // Total Effort: Combine SpecSync requirements + SET estimates + CETv22 resource demands
    let totalEffort = 0;
    
    // SpecSync effort (based on requirements complexity)
    if (specSyncState && specSyncState.items.length > 0) {
      totalEffort += specSyncState.items.length * 5; // 5 days per requirement
    }
    
    // SET domain efforts
    const setTotalEffort = Object.values(setDomainEfforts).reduce((sum, effort) => sum + effort, 0);
    totalEffort += setTotalEffort;
    
    // CETv22 resource demands
    if (cetv22Data && cetv22Data.resourceDemands) {
      const cetv22Effort = cetv22Data.resourceDemands.reduce((sum: number, demand: any) => {
        return sum + (demand.effortHours || 0);
      }, 0);
      totalEffort += cetv22Effort;
    }
    
    // Fallback to TMF functions if no other data
    if (totalEffort === 0 && tmfFunctions.length > 0) {
      totalEffort = tmfFunctions.length * 10;
    }

    // TMF Functions: Count from SpecSync + TMF reference data
    let tmfFunctionsCount = 0;
    if (specSyncState && specSyncState.items.length > 0) {
      // Filter out empty/null functions and get unique count
      // Use functionName field from SpecSyncItem interface
      const validFunctions = specSyncState.items
        .map(item => item.functionName)
        .filter(func => func && func.trim() !== '');
      const uniqueFunctions = new Set(validFunctions).size;
      console.log('🔍 TMF Functions Debug:', {
        totalItems: specSyncState.items.length,
        allFunctionNames: specSyncState.items.map(item => item.functionName),
        validFunctions: validFunctions,
        uniqueFunctions: Array.from(new Set(validFunctions)),
        uniqueCount: uniqueFunctions
      });
      tmfFunctionsCount = uniqueFunctions;
    } else if (tmfFunctions.length > 0) {
      tmfFunctionsCount = tmfFunctions.length;
    }

    // eTOM Processes: Count from available data
    let etomProcessesCount = 0;
    if (etomProcesses.length > 0) {
      etomProcessesCount = etomProcesses.length;
    } else if (specSyncState && specSyncState.items.length > 0) {
      // Estimate based on SpecSync domains
      etomProcessesCount = Object.keys(specSyncState.counts.domains).length;
    }

    // Progress: Calculate based on completed vs total work
    const completedWorkPackages = workPackages.filter((wp) => wp.status === 'Completed').length;
    const totalWorkPackages = workPackages.length;
    let progressPercentage = 0;
    
    if (totalWorkPackages > 0) {
      progressPercentage = (completedWorkPackages / totalWorkPackages) * 100;
    } else if (specSyncState && specSyncState.items.length > 0) {
      // Estimate progress based on SpecSync data completeness
      const completedRequirements = specSyncState.items.filter(item => 
        item.status === 'Completed' || item.status === 'Done'
      ).length;
      progressPercentage = (completedRequirements / specSyncState.items.length) * 100;
    }

    // Blue Dolphin Objects count
    const blueDolphinObjectsCount = getBlueDolphinObjectsCount();

    return {
      totalEffort: Math.round(totalEffort),
      tmfFunctionsCount,
      etomProcessesCount,
      progressPercentage: Math.round(progressPercentage),
      blueDolphinObjectsCount
    };
  };

  const dashboardMetrics = calculateDashboardMetrics();
  const { totalEffort, tmfFunctionsCount, etomProcessesCount, progressPercentage, blueDolphinObjectsCount } = dashboardMetrics;

  // Log metrics for debugging
  console.log('📊 Dashboard Metrics Calculated:', {
    totalEffort,
    tmfFunctionsCount,
    etomProcessesCount,
    progressPercentage,
    blueDolphinObjectsCount,
    specSyncAvailable: !!(specSyncState && specSyncState.items.length > 0),
    setDataAvailable: Object.keys(setDomainEfforts).length > 0,
    setDomainEfforts: setDomainEfforts,
    cetv22DataAvailable: !!cetv22Data,
    cetv22Data: cetv22Data ? {
      hasResourceDemands: !!cetv22Data.resourceDemands,
      resourceDemandsLength: cetv22Data.resourceDemands?.length || 0,
      hasJobProfiles: !!cetv22Data.jobProfiles,
      jobProfilesLength: cetv22Data.jobProfiles?.length || 0
    } : null
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-tmf-50 via-white to-etom-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                <Network className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-3">
                  <h1 className="text-2xl font-bold">CSG Delivery Orchestrator</h1>
                  <Badge variant="secondary" className="bg-orange-500 text-white hover:bg-orange-600">
                    ALPHA
                  </Badge>
                </div>
                <p className="text-white/90">
                  v{getBuildInfo().version} - {getBuildInfo().compliance}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <div className="text-sm text-white/80">Project</div>
                <div className="font-semibold">{project.name}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-white/80">Status</div>
                <div className="font-semibold">{project.status}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-white/80">Customer</div>
                <div className="font-semibold">{project.customer}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-white/80">Build</div>
                <div className="font-semibold">{getBuildInfo().buildHash}</div>
                <div className="text-xs text-white/70">{getBuildInfo().buildTimestamp}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="h-px bg-white/20"></div>
      </header>

      {/* Main Content with Sidebar */}
      <div className="flex h-[calc(100vh-120px)]">
        {/* Navigation Sidebar */}
        <NavigationSidebar activeTab={activeTab} onTabChange={handleTabChange} />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList className="grid w-full grid-cols-10">
              <TabsTrigger value="dashboard" className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="tmf" className="flex items-center space-x-2">
                <Network className="h-4 w-4" />
                <span className="hidden sm:inline">Requirements</span>
              </TabsTrigger>
              <TabsTrigger value="solution-model" className="flex items-center space-x-2">
                <PencilRuler className="h-4 w-4" />
                <span className="hidden sm:inline">Solution Model</span>
              </TabsTrigger>

              <TabsTrigger value="estimation" className="flex items-center space-x-2">
                <Calculator className="h-4 w-4" />
                <span className="hidden sm:inline">Estimation</span>
              </TabsTrigger>
              <TabsTrigger value="service-design" className="flex items-center space-x-2">
                <PencilRuler className="h-4 w-4" />
                <span className="hidden sm:inline">Service Design</span>
              </TabsTrigger>
              <TabsTrigger value="bill-of-materials" className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Bill of Materials</span>
              </TabsTrigger>
              <TabsTrigger value="scheduling" className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Scheduling</span>
              </TabsTrigger>
              <TabsTrigger value="commercial" className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4" />
                <span className="hidden sm:inline">Commercial</span>
              </TabsTrigger>
              <TabsTrigger value="visual-mapping" className="flex items-center space-x-2">
                <Layout className="h-4 w-4" />
                <span className="hidden sm:inline">Visual Mapping</span>
              </TabsTrigger>
              <TabsTrigger value="ado" className="flex items-center space-x-2">
                <Server className="h-4 w-4" />
                <span className="hidden sm:inline">ADO Integration</span>
              </TabsTrigger>
              
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6">
              {/* Project Overview Section - Moved to Top */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
                        <div
                          key={risk.id}
                          className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                        >
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

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="metric-card border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
                  <div className="metric-value text-blue-900">{totalEffort.toLocaleString()}</div>
                  <div className="metric-label text-blue-700">Total Effort (Days)</div>
                  <div className="text-xs text-blue-600 mt-1">
                    {specSyncState && specSyncState.items.length > 0 ? 'SpecSync + SET + CETv22' : 'TMF Reference'}
                  </div>
                </Card>
                <Card className="metric-card border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                  <div className="metric-value text-green-900">{tmfFunctionsCount}</div>
                  <div className="metric-label text-green-700">TMF Functions</div>
                  <div className="text-xs text-green-600 mt-1">
                    {specSyncState && specSyncState.items.length > 0 ? 'From SpecSync' : 'Reference Data'}
                  </div>
                </Card>
                <Card className="metric-card border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50">
                  <div className="metric-value text-purple-900">{etomProcessesCount}</div>
                  <div className="metric-label text-purple-700">eTOM Processes</div>
                  <div className="text-xs text-purple-600 mt-1">
                    {etomProcesses.length > 0 ? 'Loaded' : 'Estimated'}
                  </div>
                </Card>
                <Card className="metric-card border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
                  <div className="metric-value text-orange-900">{progressPercentage}%</div>
                  <div className="metric-label text-orange-700">Progress</div>
                  <div className="text-xs text-orange-600 mt-1">
                    {workPackages.length > 0 ? 'Work Packages' : 'Requirements'}
                  </div>
                </Card>
              </div>

              {/* Additional KPI Cards Row */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* Requirements Count */}
                {specSyncState && specSyncState.items.length > 0 && (
                  <Card className="metric-card border-cyan-200 bg-gradient-to-br from-cyan-50 to-sky-50">
                    <div className="metric-value text-cyan-900">{specSyncState.counts.totalRequirements}</div>
                    <div className="metric-label text-cyan-700">Requirements</div>
                    <div className="text-xs text-cyan-600 mt-1">SpecSync Import</div>
                  </Card>
                )}

                {/* Domains Covered */}
                {specSyncState && specSyncState.items.length > 0 && (
                  <Card className="metric-card border-teal-200 bg-gradient-to-br from-teal-50 to-emerald-50">
                    <div className="metric-value text-teal-900">{Object.keys(specSyncState.counts.domains).length}</div>
                    <div className="metric-label text-teal-700">Domains</div>
                    <div className="text-xs text-teal-600 mt-1">Covered</div>
                  </Card>
                )}

                {/* SET Effort */}
                {Object.keys(setDomainEfforts).length > 0 && (
                  <Card className="metric-card border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50">
                    <div className="metric-value text-indigo-900">
                      {Object.values(setDomainEfforts).reduce((sum, effort) => sum + effort, 0).toLocaleString()}
                    </div>
                    <div className="metric-label text-indigo-700">SET Effort (Days)</div>
                    <div className="text-xs text-indigo-600 mt-1">Domain Estimates</div>
                  </Card>
                )}

                {/* Blue Dolphin Objects */}
                {blueDolphinObjectsCount > 0 && (
                  console.log('🔍 Blue Dolphin Objects Debug:', {
                    blueDolphinObjectsCount,
                    traversalResultsLength: blueDolphinTraversalResults.length,
                    localStorageData: !!localStorage.getItem('blueDolphinTraversalObjects')
                  }),
                  <Card className="metric-card border-pink-200 bg-gradient-to-br from-pink-50 to-rose-50">
                    <div className="metric-value text-pink-900">{blueDolphinObjectsCount}</div>
                    <div className="metric-label text-pink-700">Solution Objects</div>
                    <div className="text-xs text-pink-600 mt-1">Blue Dolphin</div>
                  </Card>
                )}

                {/* Use Cases Count */}
                {specSyncState && specSyncState.items.length > 0 && (
                  <Card className="metric-card border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50">
                    <div className="metric-value text-yellow-900">{specSyncState.counts.useCases}</div>
                    <div className="metric-label text-yellow-700">Use Cases</div>
                    <div className="text-xs text-yellow-600 mt-1">SpecSync Import</div>
                  </Card>
                )}
              </div>

              {/* SpecSync Analytics Section */}
              {specSyncState && specSyncState.items.length > 0 && (
                console.log('🎯 Rendering SpecSync Analytics Section:', {
                  totalRequirements: specSyncState.counts.totalRequirements,
                  domains: Object.keys(specSyncState.counts.domains).length,
                  useCases: specSyncState.counts.useCases,
                  fileName: specSyncState.fileName
                }),
                <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-blue-900">
                      <FileText className="h-5 w-5" />
                      <span>SpecSync Requirements Analytics</span>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {specSyncState.items.length} requirements
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-blue-700">
                      Imported from {specSyncState.fileName} • Last updated: {new Date(specSyncState.importedAt).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                      {/* Total Requirements */}
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">{specSyncState.counts.totalRequirements}</div>
                        <div className="text-sm text-blue-700">Total Requirements</div>
                      </div>
                      
                      {/* Domains Covered */}
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">{Object.keys(specSyncState.counts.domains).length}</div>
                        <div className="text-sm text-green-700">Domains Covered</div>
                      </div>
                      
                      {/* Use Cases */}
                      <div className="text-center">
                        <div className="text-3xl font-bold text-purple-600">{specSyncState.counts.useCases}</div>
                        <div className="text-sm text-purple-700">Use Cases</div>
                      </div>
                      
                      {/* Mapping Completeness */}
                      <div className="text-center">
                        <div className="text-3xl font-bold text-orange-600">
                          {Math.round((specSyncState.counts.useCases / specSyncState.counts.totalRequirements) * 100)}%
                        </div>
                        <div className="text-sm text-orange-700">Use Case Coverage</div>
                      </div>
                    </div>
                    
                    {/* Domain Breakdown */}
                    <div className="mt-6">
                      <h4 className="text-sm font-semibold text-blue-900 mb-3">Requirements by Domain</h4>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {Object.entries(specSyncState.counts.domains)
                          .sort(([,a], [,b]) => b - a)
                          .map(([domain, count]) => (
                            <div key={domain} className="flex items-center justify-between rounded-lg bg-white/70 p-3 border border-blue-200">
                              <span className="text-sm font-medium text-blue-900 truncate">{domain}</span>
                              <Badge variant="outline" className="bg-blue-100 text-blue-800">
                                {count}
                              </Badge>
                            </div>
                          ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}


              {/* Blue Dolphin Analytics Section */}
              {(() => {
                console.log('🔍 [Dashboard] Blue Dolphin Analytics Check:', {
                  blueDolphinObjectsCount,
                  shouldRender: blueDolphinObjectsCount > 0
                });
                return blueDolphinObjectsCount > 0;
              })() && (
                <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-purple-900">
                      <Network className="h-5 w-5" />
                      <span>Solution Model Analytics</span>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                        {blueDolphinObjectsCount} objects
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-purple-700">
                      Architecture objects and relationships from Blue Dolphin traversal
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(() => {
                      try {
                        const stored = localStorage.getItem('blueDolphinTraversalObjects');
                        if (stored) {
                          const data = JSON.parse(stored);
                          // const objects = data.objects || []; // Unused variable removed
                          const objectTypes = data.objectTypes || {};
                          
                          return (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                              <div className="bg-white/50 rounded-lg p-4">
                                <h4 className="font-semibold text-purple-800 mb-2">Application Functions</h4>
                                <div className="text-2xl font-bold text-purple-900">
                                  {objectTypes.applicationFunctions || 0}
                                </div>
                                <div className="text-sm text-purple-600">Core functions</div>
                              </div>
                              <div className="bg-white/50 rounded-lg p-4">
                                <h4 className="font-semibold text-purple-800 mb-2">Business Processes</h4>
                                <div className="text-2xl font-bold text-purple-900">
                                  {objectTypes.businessProcesses || 0}
                                </div>
                                <div className="text-sm text-purple-600">Process flows</div>
                              </div>
                              <div className="bg-white/50 rounded-lg p-4">
                                <h4 className="font-semibold text-purple-800 mb-2">Application Services</h4>
                                <div className="text-2xl font-bold text-purple-900">
                                  {objectTypes.applicationServices || 0}
                                </div>
                                <div className="text-sm text-purple-600">Service components</div>
                              </div>
                              <div className="bg-white/50 rounded-lg p-4">
                                <h4 className="font-semibold text-purple-800 mb-2">Deliverables</h4>
                                <div className="text-2xl font-bold text-purple-900">
                                  {objectTypes.deliverables || 0}
                                </div>
                                <div className="text-sm text-purple-600">Project outputs</div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      } catch (error) {
                        console.error('Error parsing Blue Dolphin data:', error);
                        return null;
                      }
                    })()}
                  </CardContent>
                </Card>
              )}

              {/* SET Estimation Analytics Section */}
              {Object.keys(setDomainEfforts).length > 0 && (
                <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-orange-900">
                      <BarChart3 className="h-5 w-5" />
                      <span>SET Estimation Analytics</span>
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                        {Object.keys(setDomainEfforts).length} domains
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-orange-700">
                      Effort estimates and work package breakdown from SET data
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white/50 rounded-lg p-4">
                        <h4 className="font-semibold text-orange-800 mb-2">Domain Effort Summary</h4>
                        <div className="space-y-2">
                          {Object.entries(setDomainEfforts)
                            .sort(([,a], [,b]) => b - a)
                            .slice(0, 5)
                            .map(([domain, effort]) => (
                              <div key={domain} className="flex justify-between items-center">
                                <span className="text-sm text-orange-700 truncate">{domain}</span>
                                <span className="font-medium text-orange-900">{effort}d</span>
                              </div>
                            ))}
                        </div>
                      </div>
                      <div className="bg-white/50 rounded-lg p-4">
                        <h4 className="font-semibold text-orange-800 mb-2">Total Estimation</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Total Effort:</span>
                            <span className="font-medium text-lg text-orange-900">
                              {Object.values(setDomainEfforts).reduce((a, b) => a + b, 0)} days
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Average per Domain:</span>
                            <span className="font-medium text-orange-900">
                              {Math.round(Object.values(setDomainEfforts).reduce((a, b) => a + b, 0) / Object.keys(setDomainEfforts).length)} days
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Domains Covered:</span>
                            <span className="font-medium text-orange-900">
                              {Object.keys(setDomainEfforts).length}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* CETv22 Service Design Analytics Section */}
              {(() => {
                console.log('🔍 [Dashboard] CETv22 Analytics Check:', {
                  cetv22DataExists: !!cetv22Data,
                  cetv22Data: cetv22Data,
                  shouldRender: !!cetv22Data
                });
                return !!cetv22Data;
              })() && (
                <Card className="border-cyan-200 bg-gradient-to-br from-cyan-50 to-sky-50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-cyan-900">
                      <Route className="h-5 w-5" />
                      <span>CETv22 Service Design Analytics</span>
                      <Badge variant="secondary" className="bg-cyan-100 text-cyan-800">
                        Resource Planning
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-cyan-700">
                      Resource demands and job profile analysis from service design data
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(() => {
                      try {
                        const resourceDemands = cetv22Data.resourceDemands || [];
                        // const jobProfiles = cetv22Data.jobProfiles || []; // Unused variable removed
                        // const phases = cetv22Data.phases || []; // Unused variable removed
                        
                        // Calculate totals
                        const totalHours = resourceDemands.reduce((sum: number, demand: any) => sum + (demand.effortHours || 0), 0);
                        const uniqueJobProfiles = new Set(resourceDemands.map((d: any) => d.jobProfile)).size;
                        const uniquePhases = new Set(resourceDemands.map((d: any) => d.phase)).size;
                        
                        // Top job profiles by hours (commented out as unused)
                        // const jobProfileHours = resourceDemands.reduce((acc: Record<string, number>, demand: any) => {
                        //   acc[demand.jobProfile] = (acc[demand.jobProfile] || 0) + (demand.effortHours || 0);
                        //   return acc;
                        // }, {} as Record<string, number>);
                        
                        // const topJobProfiles = Object.entries(jobProfileHours)
                        //   .sort(([,a], [,b]) => (b as number) - (a as number))
                        //   .slice(0, 3); // Unused variable removed
                        
                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white/50 rounded-lg p-4">
                              <h4 className="font-semibold text-cyan-800 mb-2">Total Resource Hours</h4>
                              <div className="text-2xl font-bold text-cyan-900">
                                {totalHours.toLocaleString()}
                              </div>
                              <div className="text-sm text-cyan-600">Hours planned</div>
                            </div>
                            <div className="bg-white/50 rounded-lg p-4">
                              <h4 className="font-semibold text-cyan-800 mb-2">Job Profiles</h4>
                              <div className="text-2xl font-bold text-cyan-900">
                                {uniqueJobProfiles}
                              </div>
                              <div className="text-sm text-cyan-600">Unique roles</div>
                            </div>
                            <div className="bg-white/50 rounded-lg p-4">
                              <h4 className="font-semibold text-cyan-800 mb-2">Project Phases</h4>
                              <div className="text-2xl font-bold text-cyan-900">
                                {uniquePhases}
                              </div>
                              <div className="text-sm text-cyan-600">Phases defined</div>
                            </div>
                            <div className="bg-white/50 rounded-lg p-4">
                              <h4 className="font-semibold text-cyan-800 mb-2">Resource Demands</h4>
                              <div className="text-2xl font-bold text-cyan-900">
                                {resourceDemands.length}
                              </div>
                              <div className="text-sm text-cyan-600">Demand entries</div>
                            </div>
                          </div>
                        );
                      } catch (error) {
                        console.error('Error parsing CETv22 data:', error);
                        return null;
                      }
                    })()}
                  </CardContent>
                </Card>
              )}

              {/* Consolidated Data Insights Section */}
              {specSyncState && specSyncState.items.length > 0 && (
                console.log('🔗 Rendering Consolidated Data Insights:', {
                  specSyncDomains: Object.keys(specSyncState.counts.domains).length,
                  setDomains: Object.keys(setDomainEfforts).length,
                  cetv22Available: !!cetv22Data,
                  blueDolphinObjects: blueDolphinTraversalResults.length,
                  totalSetEffort: Object.values(setDomainEfforts).reduce((a, b) => a + b, 0)
                }),
                <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-green-900">
                      <TrendingUp className="h-5 w-5" />
                      <span>Consolidated Project Insights</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Multi-Source Analysis
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-green-700">
                      Integrated view combining SpecSync requirements with estimation and resource data
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {/* SpecSync + SET Integration */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-green-900">Requirements + Estimation</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-green-700">Requirements with Effort:</span>
                            <Badge variant="outline" className="bg-green-100 text-green-800">
                              {Object.keys(setDomainEfforts).length > 0 ? 
                                Math.round((Object.keys(setDomainEfforts).length / Object.keys(specSyncState.counts.domains).length) * 100) : 0}%
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-green-700">Total Estimated Effort:</span>
                            <span className="font-semibold text-green-900">
                              {Object.values(setDomainEfforts).reduce((a, b) => a + b, 0)} days
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* SpecSync + CETv22 Integration */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-green-900">Requirements + Resources</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-green-700">Resource Data Available:</span>
                            <Badge variant="outline" className="bg-green-100 text-green-800">
                              {cetv22Data ? 'Yes' : 'No'}
                            </Badge>
                          </div>
                          {cetv22Data && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-green-700">Total Resource Hours:</span>
                              <span className="font-semibold text-green-900">
                                {cetv22Data.resourceDemands ? 
                                  Math.round(cetv22Data.resourceDemands.reduce((sum: number, demand: any) => sum + (demand.effortHours || 0), 0) / 8) : 0} days
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* SpecSync + Blue Dolphin Integration */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-green-900">Requirements + Architecture</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-green-700">Architecture Objects:</span>
                            <Badge variant="outline" className="bg-green-100 text-green-800">
                              {blueDolphinTraversalResults.length > 0 ? 
                                blueDolphinTraversalResults.reduce((total, result) => {
                                  return total + (result.businessProcesses?.topLevel?.length || 0) +
                                         (result.businessProcesses?.childLevel?.length || 0) +
                                         (result.businessProcesses?.grandchildLevel?.length || 0) +
                                         (result.applicationServices?.topLevel?.length || 0) +
                                         (result.applicationServices?.childLevel?.length || 0) +
                                         (result.applicationServices?.grandchildLevel?.length || 0) +
                                         (result.applicationInterfaces?.topLevel?.length || 0) +
                                         (result.applicationInterfaces?.childLevel?.length || 0) +
                                         (result.applicationInterfaces?.grandchildLevel?.length || 0) +
                                         (result.deliverables?.topLevel?.length || 0) +
                                         (result.deliverables?.childLevel?.length || 0) +
                                         (result.deliverables?.grandchildLevel?.length || 0) +
                                         (result.relatedApplicationFunctions?.length || 0);
                                }, 0) : 0}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-green-700">Integration Status:</span>
                            <Badge variant="outline" className="bg-green-100 text-green-800">
                              {blueDolphinTraversalResults.length > 0 ? 'Connected' : 'Not Connected'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* eTOM Processes Section - Collapsible */}
              <div className="border-b pb-6">
                <div
                  className="mb-4 flex cursor-pointer items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted/50"
                  onClick={() => setIsEtomProcessesExpanded(!isEtomProcessesExpanded)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-blue-200 bg-blue-100">
                      {isEtomProcessesExpanded ? (
                        <ChevronDown className="h-5 w-5 text-blue-700" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-blue-700" />
                      )}
                    </div>
                    <div>
                      <h3 className="flex items-center space-x-2 text-base font-semibold">
                        <Route className="h-4 w-4" />
                        <span>eTOM Processes</span>
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Enterprise Tomography Operations Map processes and effort breakdowns
                      </p>
                    </div>
                  </div>
                </div>

                {isEtomProcessesExpanded && (
                  <div className="space-y-4">
                    {etomProcesses.map((process) => (
                      <div key={process.id} className="rounded-lg border p-4">
                        <div className="mb-3">
                          <h3 className="text-lg font-semibold">
                            Level {process.level}: {process.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">{process.description}</p>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div>
                            <div className="mb-2 text-sm font-medium">Effort Breakdown</div>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm">Business Analyst:</span>
                                <span className="font-medium">
                                  {process.baseEffort.businessAnalyst}d
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm">Solution Architect:</span>
                                <span className="font-medium">
                                  {process.baseEffort.solutionArchitect}d
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm">Developer:</span>
                                <span className="font-medium">{process.baseEffort.developer}d</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm">QA Engineer:</span>
                                <span className="font-medium">
                                  {process.baseEffort.qaEngineer}d
                                </span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <div className="mb-2 text-sm font-medium">Complexity Factors</div>
                            <div className="space-y-2">
                              {Object.entries(process.complexityFactors).map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                  <span className="text-sm capitalize">
                                    {key.replace(/([A-Z])/g, ' $1')}:
                                  </span>
                                  <span className="font-medium">{value}x</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* F. Domain and Function Overview - Moved from TMF tab */}
              <div className="border-b pb-6">
                <div
                  className="mb-4 flex cursor-pointer items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted/50"
                  onClick={() => setIsTmfCapabilitiesExpanded(!isTmfCapabilitiesExpanded)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-purple-200 bg-purple-100">
                      {isTmfCapabilitiesExpanded ? (
                        <ChevronDown className="h-5 w-5 text-purple-700" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-purple-700" />
                      )}
                    </div>
                    <div>
                      <h3 className="flex items-center space-x-2 text-base font-semibold">
                        <Network className="h-4 w-4" />
                        <span>TMF Domain and Function Overview</span>
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        View TMF domains and functions with requirement counts from imported SpecSync data
                      </p>
                    </div>
                  </div>
                  {specSyncState && (
                    <div
                      className="flex items-center space-x-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Badge variant="secondary">
                        {specSyncState.items.length} requirements mapped
                      </Badge>
                    </div>
                  )}
                </div>
                {isTmfCapabilitiesExpanded && (
                  <div className="space-y-6">
                    {getDomainFunctionCards().map((domain) => (
                      <div key={domain.name} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-semibold text-gray-900">{domain.name}</h4>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              {domain.functions.length} functions
                            </Badge>
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              {domain.totalRequirements} requirements
                            </Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {domain.functions.map((func) => (
                            <Card key={func.id} className="effort-card hover-lift">
                              <CardHeader className="pb-3">
                                <CardTitle className="flex items-center justify-between text-base">
                                  <span className="truncate">{func.function_name}</span>
                                  <RequirementBadge count={func.requirementCount || 0} />
                                </CardTitle>
                                <CardDescription className="line-clamp-2 text-xs">
                                  {func.vertical || 'TMF Function'}
                                </CardDescription>
                              </CardHeader>
                              <CardContent className="pt-0">
                                <div className="space-y-3">
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Domain:</span>
                                      <span className="font-medium">
                                        {func.domain_name || 'Unknown'}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Vertical:</span>
                                      <span className="font-medium">
                                        {func.vertical || 'N/A'}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="border-t pt-2">
                                    <div className="mb-1 text-xs text-muted-foreground">Function Details</div>
                                    <div className="flex flex-wrap gap-1">
                                      <span className="rounded bg-tmf-100 px-1.5 py-0.5 text-xs text-tmf-800">
                                        ID: {func.function_id || 'N/A'}
                                      </span>
                                      {func.uid && (
                                        <span className="rounded bg-tmf-100 px-1.5 py-0.5 text-xs text-tmf-800">
                                          UID: {func.uid}
                                        </span>
                                      )}
                                    </div>
                                    {func.requirements && func.requirements.length > 0 && (
                                      <div className="border-t pt-2">
                                        <div className="mb-2 text-xs text-muted-foreground">
                                          Requirements ({func.requirements.length})
                                        </div>
                                        <div className="space-y-1 max-h-32 overflow-y-auto">
                                          {func.requirements.map((req, _index) => (
                                            <div key={req.id} className="text-xs bg-gray-50 p-2 rounded">
                                              <div className="font-medium text-gray-700">
                                                {req.requirementId}
                                              </div>
                                              <div className="text-gray-600 line-clamp-2">
                                                {req.description}
                                              </div>
                                              <div className="flex items-center gap-2 mt-1">
                                                <span className={`px-1.5 py-0.5 rounded text-xs ${
                                                  req.priority === 'High' ? 'bg-red-100 text-red-800' :
                                                  req.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                                  'bg-green-100 text-green-800'
                                                }`}>
                                                  {req.priority}
                                                </span>
                                                <span className={`px-1.5 py-0.5 rounded text-xs ${
                                                  req.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                                                  req.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                                  'bg-gray-100 text-gray-800'
                                                }`}>
                                                  {req.status}
                                                </span>
                                              </div>
                                              {req.usecase1 && (
                                                <div className="text-xs text-gray-500 mt-1">
                                                  Use case: {req.usecase1}
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {func.useCaseCount > 0 && (
                                      <div className="border-t pt-2">
                                        <div className="mb-1 text-xs text-muted-foreground">
                                          Use Cases
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <span className="rounded bg-orange-100 px-1.5 py-0.5 text-xs font-medium text-orange-800">
                                            {func.useCaseCount} unique use cases
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                              <CardFooter className="pt-0">
                                <div className="w-full text-center">
                                  <div className="mb-1 text-xs text-muted-foreground">
                                    Development Effort
                                  </div>
                                  <div className="text-lg font-bold text-tmf-600">
                                    {func.developmentEffort || 0} days
                                  </div>
                                  {func.mandateEffort > 0 && (
                                    <div className="mt-1 text-xs text-muted-foreground">
                                      Mandate: {func.mandateEffort} days
                                    </div>
                                  )}
                                </div>
                              </CardFooter>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ))}
                    {getDomainFunctionCards().length === 0 && (
                      <div className="text-center py-8">
                        <div className="text-muted-foreground mb-2">No domain and function data available</div>
                        <div className="text-sm text-muted-foreground">
                          Load SpecSync data or TMF reference data to see domain and function cards
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* TMF Capabilities Tab */}
            <TabsContent value="tmf" className="space-y-6">
              {/* TMF ODA Management Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Network className="h-5 w-5" />
                    <span>Solution Inputs</span>
                  </CardTitle>
                  <CardDescription>
                    SpecSync Data Loader and E2E Use Case Parameters
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Complexity Matrix (Non-breaking, additive) */}
                  <ComplexityMatrix />

                  {/* SpecSync Import - Collapsible */}
                  <div className="border-b pb-6">
                    <div
                      className="mb-4 flex cursor-pointer items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted/50"
                      onClick={() => setIsSpecSyncExpanded(!isSpecSyncExpanded)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-blue-200 bg-blue-100">
                          {isSpecSyncExpanded ? (
                            <ChevronDown className="h-5 w-5 text-blue-700" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-blue-700" />
                          )}
                        </div>
                        <div>
                          <h3 className="flex items-center space-x-2 text-base font-semibold">
                            <FileText className="h-4 w-4" />
                            <span>SpecSync Import</span>
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Import requirements and map to TMF capabilities
                          </p>
                        </div>
                      </div>
                      {specSyncState && (
                        <div
                          className="flex items-center space-x-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Badge variant="secondary">
                            {specSyncState.items.length} requirements loaded
                          </Badge>
                          <Button variant="outline" size="sm" onClick={handleSpecSyncClear}>
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
                      className="mb-4 flex cursor-pointer items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted/50"
                      onClick={() => setIsTmfManagerExpanded(!isTmfManagerExpanded)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-green-200 bg-green-100">
                          {isTmfManagerExpanded ? (
                            <ChevronDown className="h-5 w-5 text-green-700" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-green-700" />
                          )}
                        </div>
                        <div>
                          <h3 className="flex items-center space-x-2 text-base font-semibold">
                            <Network className="h-4 w-4" />
                            <span>Domain & TMF Function Overview</span>
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Overview of Specsync Domain/TMF Function Mappings
                          </p>
                        </div>
                      </div>
                      {specSyncState && (
                        <div
                          className="flex items-center space-x-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Badge variant="secondary">
                            {specSyncState.items.length} requirements available
                          </Badge>
                        </div>
                      )}
                    </div>
                    {isTmfManagerExpanded && (
                      <TMFDomainCapabilityManager
                        specSyncData={specSyncState}
                        initialState={userTmfDomains && userTmfDomains.length > 0 ? (userTmfDomains as any) : undefined}
                        onStateChange={handleTmfStateChange}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TMF Demo Tab */}
            <TabsContent value="tmf-demo" className="space-y-6">
              <div className="py-12 text-center">
                <h2 className="mb-4 text-2xl font-bold text-gray-900">TMF ODA Management Demo</h2>
                <p className="mb-6 text-gray-600">
                  Experience the interactive TMF ODA domain and capability management system in a
                  dedicated demo environment
                </p>
                <div className="flex justify-center space-x-4">
                  <Link
                    href="/tmf-demo"
                    className="inline-flex items-center rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    <Network className="mr-2 h-5 w-5" />
                    Launch TMF ODA Demo
                  </Link>
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('tmf')}
                    className="inline-flex items-center px-6 py-3"
                  >
                    <Network className="mr-2 h-5 w-5" />
                    Go to Main TMF Section
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Solution Model Tab */}
            <TabsContent value="solution-model" className="space-y-6">
              <div className="mb-6">
                <h2 className="mb-2 text-2xl font-bold text-gray-900">
                  Solution Model - Integration
                </h2>
                <p className="text-gray-600">
                  Create and manage your solution model in Model. Import domains,
                  capabilities, and requirements from SpecSync and TMF data.
                </p>

                {/* Section Control Buttons */}
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setSolutionModelSections(
                        new Set([
                          'object-data',
                          'requirements-sync',
                          'workspace-operations',
                          'visualization',
                          'domain-management',
                          'capabilities',
                        ]),
                      )
                    }
                  >
                    Expand All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSolutionModelSections(new Set())}
                  >
                    Collapse All
                  </Button>
                </div>
              </div>

              {/* Object Data Section */}
              <div className="border-b pb-6">
                <div
                  className="mb-4 flex cursor-pointer items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted/50"
                  onClick={() => toggleSolutionModelSection('object-data')}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-blue-200 bg-blue-100">
                      {solutionModelSections.has('object-data') ? (
                        <ChevronDown className="h-5 w-5 text-blue-700" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-blue-700" />
                      )}
                    </div>
                    <div>
                      <h3 className="flex items-center space-x-2 text-base font-semibold">
                        <Database className="h-4 w-4" />
                        <span>Object Data</span>
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Retrieve and manage Model objects with enhanced metadata
                      </p>
                    </div>
                  </div>
                </div>
                {solutionModelSections.has('object-data') && (
                  <div className="space-y-4">
                    <BlueDolphinIntegration
                      config={{
                        protocol: 'ODATA',
                        apiUrl: 'https://csgipoc.odata.bluedolphin.app',
                        odataUrl: 'https://csgipoc.odata.bluedolphin.app',
                        apiKey: '',
                        username: 'csgipoc',
                        password: 'ef498b94-732b-46c8-a24c-65fbd27c1482',
                      }}
                      onObjectsLoaded={handleBlueDolphinObjectsLoaded}
                    />
                  </div>
                )}
              </div>

              {/* Requirements Synchronization Section */}
              <div className="border-b pb-6">
                <div
                  className="mb-4 flex cursor-pointer items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted/50"
                  onClick={() => toggleSolutionModelSection('requirements-sync')}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-green-200 bg-green-100">
                      {solutionModelSections.has('requirements-sync') ? (
                        <ChevronDown className="h-5 w-5 text-green-700" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-green-700" />
                      )}
                    </div>
                    <div>
                      <h3 className="flex items-center space-x-2 text-base font-semibold">
                        <FileText className="h-4 w-4" />
                        <span>Requirements Synchronization</span>
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Synchronize requirements between systems
                      </p>
                    </div>
                  </div>
                </div>
                {solutionModelSections.has('requirements-sync') && (
                  <div className="space-y-4">
                    <SpecSyncBlueDolphinMapping
                      specSyncItems={specSyncItems}
                      blueDolphinConfig={{
                        protocol: 'ODATA',
                        apiUrl: 'https://csgipoc.odata.bluedolphin.app',
                        odataUrl: 'https://csgipoc.odata.bluedolphin.app',
                        apiKey: '',
                        username: 'csgipoc',
                        password: 'ef498b94-732b-46c8-a24c-65fbd27c1482',
                      }}
                      onMappingComplete={setMappingResults}
                    />
                    
                    {/* NEW - Relationship Traversal Component */}
                    {mappingResults.length > 0 && (
                      <div className="mt-6">
                        <SpecSyncRelationshipTraversal
                          mappingResults={mappingResults}
                          blueDolphinConfig={{
                            protocol: 'ODATA',
                            apiUrl: 'https://csgipoc.odata.bluedolphin.app',
                            odataUrl: 'https://csgipoc.odata.bluedolphin.app',
                            apiKey: '',
                            username: 'csgipoc',
                            password: 'ef498b94-732b-46c8-a24c-65fbd27c1482',
                          }}
                          workspaceFilter={workspaceFilter}
                          requirements={specSyncItems}
                          onBlueDolphinObjectsLoaded={handleTraversalBlueDolphinObjectsLoaded}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Workspace Operations Section */}
              <div className="border-b pb-6">
                <div
                  className="mb-4 flex cursor-pointer items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted/50"
                  onClick={() => toggleSolutionModelSection('workspace-operations')}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-orange-200 bg-orange-100">
                      {solutionModelSections.has('workspace-operations') ? (
                        <ChevronDown className="h-5 w-5 text-orange-700" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-orange-700" />
                      )}
                    </div>
                    <div>
                      <h3 className="flex items-center space-x-2 text-base font-semibold">
                        <Workflow className="h-4 w-4" />
                        <span>Workspace Operations</span>
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Move objects between Model workspaces using REST API
                      </p>
                    </div>
                  </div>
                </div>
                {solutionModelSections.has('workspace-operations') && (
                  <div className="space-y-4">
                    <BlueDolphinWorkspaceOperations
                      config={{
                        protocol: 'REST',
                        apiUrl: 'https://public-api.eu.bluedolphin.app',
                        odataUrl: 'https://csgipoc.odata.bluedolphin.app',
                        apiKey: 'f49253d1-32c7-492a-b022-64caab216d49',
                        username: 'csgipoc',
                        password: 'ef498b94-732b-46c8-a24c-65fbd27c1482',
                        userApiKey: '1664f037-6c28-41d7-bd7f-5023c197b169',
                        workspaceId: '68b8214f5b12ebdcb8e00345',
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Visualization (Model Graph) */}
              <div className="border-b pb-6">
                <div
                  className="mb-4 flex cursor-pointer items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted/50"
                  onClick={() => toggleSolutionModelSection('visualization')}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-purple-200 bg-purple-100">
                      {solutionModelSections.has('visualization') ? (
                        <ChevronDown className="h-5 w-5 text-purple-700" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-purple-700" />
                      )}
                    </div>
                    <div>
                      <h3 className="flex items-center space-x-2 text-base font-semibold">
                        <Network className="h-4 w-4" />
                        <span>Visualization (Model Graph)</span>
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Explore objects as nodes and relationships as links with dedicated visualization
                        filters
                      </p>
                    </div>
                  </div>
                </div>
                {solutionModelSections.has('visualization') && (
                  <div className="space-y-4">
                    <BlueDolphinVisualization
                      config={{
                        protocol: 'ODATA',
                        apiUrl: 'https://csgipoc.odata.bluedolphin.app',
                        odataUrl: 'https://csgipoc.odata.bluedolphin.app',
                        apiKey: '',
                        username: 'csgipoc',
                        password: 'ef498b94-732b-46c8-a24c-65fbd27c1482',
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Domain Management Section */}
              <div className="border-b pb-6">
                <div
                  className="mb-4 flex cursor-pointer items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted/50"
                  onClick={() => toggleSolutionModelSection('domain-management')}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-indigo-200 bg-indigo-100">
                      {solutionModelSections.has('domain-management') ? (
                        <ChevronDown className="h-5 w-5 text-indigo-700" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-indigo-700" />
                      )}
                    </div>
                    <div>
                      <h3 className="flex items-center space-x-2 text-base font-semibold">
                        <Settings className="h-4 w-4" />
                        <span>Domain Management</span>
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Manage TMF ODA domains and capabilities
                      </p>
                    </div>
                  </div>
                </div>
                {solutionModelSections.has('domain-management') && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Domain management functionality will be implemented here.
                    </p>
                  </div>
                )}
              </div>

              {/* Capabilities Section */}
              <div className="border-b pb-6">
                <div
                  className="mb-4 flex cursor-pointer items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted/50"
                  onClick={() => toggleSolutionModelSection('capabilities')}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-teal-200 bg-teal-100">
                      {solutionModelSections.has('capabilities') ? (
                        <ChevronDown className="h-5 w-5 text-teal-700" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-teal-700" />
                      )}
                    </div>
                    <div>
                      <h3 className="flex items-center space-x-2 text-base font-semibold">
                        <Network className="h-4 w-4" />
                        <span>Capabilities</span>
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Manage TMF ODA capabilities within domains
                      </p>
                    </div>
                  </div>
                </div>
                {solutionModelSections.has('capabilities') && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Capability management functionality will be implemented here.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Estimation Tab */}
            <TabsContent value="estimation" className="space-y-6">
              <SETImport onDataLoaded={handleSETDataLoaded} />

              {/* Work Package Estimation Section */}
              <div className="border-b pb-6">
                <div
                  className="mb-4 flex cursor-pointer items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted/50"
                  onClick={() => setWorkPackageEstimationExpanded(!workPackageEstimationExpanded)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-purple-200 bg-purple-100">
                      {workPackageEstimationExpanded ? (
                        <ChevronDown className="h-5 w-5 text-purple-700" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-purple-700" />
                      )}
                    </div>
                    <div>
                      <h3 className="flex items-center space-x-2 text-base font-semibold">
                        <Calculator className="h-4 w-4" />
                        <span>Work Package Estimation</span>
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Calculate effort estimates for work packages
                      </p>
                    </div>
                  </div>
                </div>

                {workPackageEstimationExpanded && (
                  <div className="space-y-6">
                    {/* Domain and TMF Function Cards */}
                    {(() => {
                      const tmfDomains = getStaticTMFDomains();
                      const tmfFunctions = getStaticTMFFunctions();
                      
                      // Group functions by domain
                      const functionsByDomain = tmfFunctions.reduce((acc, func) => {
                        if (!acc[func.domainName]) {
                          acc[func.domainName] = [];
                        }
                        acc[func.domainName].push(func);
                        return acc;
                      }, {} as Record<string, typeof tmfFunctions>);

                      // Get all domains from both TMF and SET data
                      const allDomains = new Set([
                        ...tmfDomains.map(d => d.name),
                        ...Object.keys(setDomainEfforts)
                      ]);

                      return Array.from(allDomains).map((domainName) => {
                        // Find TMF domain info if it exists
                        const tmfDomain = tmfDomains.find(d => d.name === domainName);
                        const domainFunctions = functionsByDomain[domainName] || [];
                        const setEffort = setDomainEfforts[domainName] || 0;
                        
                        // Create domain info for non-TMF domains (like "Other Efforts")
                        const domainInfo = tmfDomain || {
                          id: `domain-${domainName.toLowerCase().replace(/\s+/g, '-')}`,
                          name: domainName,
                          description: domainName === 'Other Efforts' 
                            ? 'Additional efforts and miscellaneous work items'
                            : `TMF ${domainName}`,
                          functionCount: domainFunctions.length
                        };
                        
                        return (
                          <div key={domainInfo.id} className="rounded-lg border p-6 bg-white shadow-sm">
                            <div className="mb-4 flex items-center justify-between">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">{domainInfo.name}</h3>
                                <p className="text-sm text-gray-600">{domainInfo.description}</p>
                              </div>
                              <div className="flex items-center space-x-3">
                                {setEffort > 0 && (
                                  <Badge variant="secondary" className="text-sm font-medium">
                                    SET: {setEffort}d
                                  </Badge>
                                )}
                                <div className="text-right">
                                  <div className="text-sm font-medium text-gray-900">
                                    {domainFunctions.length} Functions
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {setEffort > 0 ? `${setEffort}d effort` : 'No SET data'}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* TMF Functions Grid */}
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                              {domainName === 'Other Efforts' ? (
                                // Special case for Other Efforts - show placeholder functions
                                <>
                                  <div className="rounded-md border border-gray-200 p-3 bg-gray-50">
                                    <div className="text-sm font-medium text-gray-900">
                                      Reporting & Analytics
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      Financial reporting and data warehouse feeds
                                    </div>
                                  </div>
                                  <div className="rounded-md border border-gray-200 p-3 bg-gray-50">
                                    <div className="text-sm font-medium text-gray-900">
                                      Integration & Migration
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      Data migration and system integration
                                    </div>
                                  </div>
                                  <div className="rounded-md border border-gray-200 p-3 bg-gray-50">
                                    <div className="text-sm font-medium text-gray-900">
                                      Invoice & Billing
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      Invoice generation and billing processes
                                    </div>
                                  </div>
                                </>
                              ) : (
                                // Regular TMF functions
                                <>
                                  {domainFunctions.slice(0, 6).map((func) => (
                                    <div key={func.id} className="rounded-md border border-gray-200 p-3 bg-gray-50">
                                      <div className="text-sm font-medium text-gray-900">
                                        {func.functionName}
                                      </div>
                                      {func.vertical && (
                                        <div className="text-xs text-gray-500 mt-1">
                                          {func.vertical}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                  {domainFunctions.length > 6 && (
                                    <div className="rounded-md border border-gray-200 p-3 bg-gray-100 flex items-center justify-center">
                                      <span className="text-sm text-gray-500">
                                        +{domainFunctions.length - 6} more functions
                                      </span>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                            
                            {/* SET Effort Details */}
                            {setEffort > 0 && (
                              <div className="mt-4 border-t pt-4">
                                <div className="flex items-center justify-between">
                                  <div className="text-sm font-medium text-green-600">
                                    SET Total Effort: {setEffort} days
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Mapped from SET Test Loader data
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                    
                    {/* Summary Card */}
                    {Object.keys(setDomainEfforts).length > 0 && (
                      <Card className="bg-gradient-to-br from-slate-50 to-blue-50 border-slate-200 shadow-lg">
                        <CardHeader className="pb-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <BarChart3 className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <CardTitle className="text-xl text-slate-800">SET Data Summary</CardTitle>
                              <CardDescription className="text-slate-600">
                                Effort breakdown across domains
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                            {Object.entries(setDomainEfforts).map(([domain, effort]) => (
                              <Card key={domain} className="relative overflow-hidden bg-white border-slate-200 hover:shadow-md transition-all duration-200">
                                <CardContent className="p-4 text-center">
                                  <div className="mb-2">
                                    <div className="text-3xl font-bold text-slate-800 mb-1">
                                      {effort}
                                    </div>
                                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                      days
                                    </div>
                                  </div>
                                  <div className="text-sm font-medium text-slate-700 leading-tight">
                                    {domain}
                                  </div>
                                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 opacity-20 rounded-bl-full"></div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                          
                          <div className="border-t border-slate-200 pt-4">
                            <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white border-0 shadow-lg">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-white/20 rounded-lg">
                                      <Calculator className="h-5 w-5" />
                                    </div>
                                    <div>
                                      <div className="text-sm font-medium opacity-90">Total SET Effort</div>
                                      <div className="text-2xl font-bold">
                                        {Object.values(setDomainEfforts).reduce((a, b) => a + b, 0)} days
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-sm opacity-90">Across {Object.keys(setDomainEfforts).length} domains</div>
                                    <div className="text-xs opacity-75">Phase 1 estimation</div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Service Design Tab */}
            <TabsContent value="service-design" className="space-y-6">
              <CETv22ServiceDesign
                onIntegrationComplete={() => {
                  console.log('CET v22.0 integration completed');
                  toast.showSuccess('CET v22.0 integration completed successfully!');
                }}
                onError={(error) => {
                  console.error('CET v22.0 error:', error);
                  toast.showError(`CET v22.0 Error: ${error.message}`);
                }}
              />
            </TabsContent>

            {/* Bill of Materials Tab */}
            <TabsContent value="bill-of-materials" className="space-y-6">
              <BillOfMaterials
                specSyncState={specSyncState}
                setDomainEfforts={setDomainEfforts}
                setMatchedWorkPackages={setMatchedWorkPackages}
                cetv22Data={cetv22Data}
              />
            </TabsContent>

            {/* Scheduling Tab */}
            <TabsContent value="scheduling" className="space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5" />
                      <span>Project Timeline</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Start Date</span>
                        <span className="font-medium">{formatDate(project.startDate)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">End Date</span>
                        <span className="font-medium">{formatDate(project.endDate)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Duration</span>
                        <span className="font-medium">{project.duration}</span>
                      </div>
                      <div className="flex items-center justify-between">
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
                        <div
                          key={milestone.id}
                          className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                        >
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
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                      <div
                        key={document.id}
                        className="flex items-center justify-between rounded-lg border p-4"
                      >
                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{document.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {document.type} • v{document.version} •{' '}
                              {formatDate(document.lastModified)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className={`status-badge ${getStatusColor(document.status)}`}>
                            {document.status}
                          </div>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
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
                blueDolphinTraversalResults={blueDolphinTraversalResults}
              />
            </TabsContent>

            {/* ADO Integration Tab */}
            <TabsContent value="ado" className="space-y-6">
              <ADOIntegration
                project={project}
                tmfDomains={tmfDomains}
                specSyncItems={specSyncItems}
                blueDolphinObjects={blueDolphinObjects}
              />
            </TabsContent>

            {/* Blue Dolphin Configuration Tab */}
            <TabsContent value="blue-dolphin-config" className="space-y-6">
              <BlueDolphinConfiguration />
            </TabsContent>

            {/* Miro Configuration Tab */}
            <TabsContent value="miro-config" className="space-y-6">
              <MiroConfiguration />
            </TabsContent>

            {/* Confluence Configuration Tab */}
            <TabsContent value="confluence-config" className="space-y-6">
              <ConfluenceConfiguration />
            </TabsContent>

            {/* Miro Setup Guide Tab */}
            <TabsContent value="miro-setup" className="space-y-6">
              <MiroSetupGuide />
            </TabsContent>

            {/* ADO Configuration Tab */}
            <TabsContent value="ado-config" className="space-y-6">
              <ADOConfigurationComponent />
            </TabsContent>

            {/* Supabase Configuration Tab */}
            <TabsContent value="supabase-config" className="space-y-6">
              <SupabaseConfiguration />
            </TabsContent>

            {/* BOM Configuration Tab */}
            <TabsContent value="bom-config" className="space-y-6">
              <BOMConfiguration />
            </TabsContent>

            
          </Tabs>
        </main>
      </div>

      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </div>
  );
}
