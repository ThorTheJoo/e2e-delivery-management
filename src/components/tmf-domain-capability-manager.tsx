'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Search,
  CheckCircle,
  Circle,
} from 'lucide-react';
import { TMFDomain, TMFFunction } from '@/lib/tmf-reference-service-client';
import { getStaticTMFDomains, getStaticTMFFunctions } from '@/lib/static-tmf-reference-data';
import { EnhancedAddCustomDomainDialog } from './enhanced-add-custom-domain-dialog';
import { analyzeTMFReferenceGaps } from '@/lib/specsync-tmf-utils';

interface UserDomain {
  id: string;
  name: string;
  description: string;
  referenceDomainId?: string;
  capabilities: UserCapability[];
  isSelected: boolean;
  isExpanded: boolean;
  requirementCount: number;
}

interface UserCapability {
  id: string;
  name: string;
  description: string;
  referenceFunctionId?: string;
  domainId: string;
  isSelected: boolean;
  requirementCount: number;
}

interface TMFDomainCapabilityManagerProps {
  onStateChange?: (domains: UserDomain[]) => void;
  initialState?: UserDomain[];
  specSyncData?: any; // SpecSync data for requirement mapping
  onMappingComplete?: (mappedDomains: UserDomain[]) => void; // Callback when SpecSync mapping is complete
}

export function TMFDomainCapabilityManager({
  onStateChange,
  initialState: _initialState,
  specSyncData,
  onMappingComplete,
}: TMFDomainCapabilityManagerProps) {
  const [domains, setDomains] = useState<UserDomain[]>([]);
  const [referenceDomains, setReferenceDomains] = useState<TMFDomain[]>([]);
  const [referenceFunctions, setReferenceFunctions] = useState<TMFFunction[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDomainDialogOpen, setAddDomainDialogOpen] = useState(false);
  const [addCapabilityDialogOpen, setAddCapabilityDialogOpen] = useState(false);
  const [selectedDomainForCapability, setSelectedDomainForCapability] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReferenceDomain, setSelectedReferenceDomain] = useState<string>('');
  const [enhancedDialogOpen, setEnhancedDialogOpen] = useState(false);
  const [missingItemsCount, setMissingItemsCount] = useState(0);
  const isProcessingSpecSync = useRef(false);

  // Load reference data
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        // Use static data to avoid Supabase timing issues
        const staticDomains = getStaticTMFDomains();
        const staticFunctions = getStaticTMFFunctions();
        
        // Convert static data to TMF format for compatibility
        const domainsData: TMFDomain[] = staticDomains.map(domain => ({
          id: domain.id,
          name: domain.name,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          function_count: domain.functionCount
        }));
        
        const functionsData: TMFFunction[] = staticFunctions.map(func => ({
          id: func.id,
          domain_id: func.domainId,
          function_name: func.functionName,
          vertical: func.vertical,
          af_level_1: func.afLevel1,
          af_level_2: func.afLevel2,
          function_id: null,
          uid: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          domain_name: func.domainName
        }));

        setReferenceDomains(domainsData);
        setReferenceFunctions(functionsData);

        // Initialize with TMF reference data only if no existing domains
        if (domains.length === 0) {
          console.log('🔄 Initializing sample data with TMF reference data...');
          initializeSampleData(domainsData, functionsData);
          console.log('✅ Sample data initialized');
        } else {
          console.log('ℹ️ Using existing domains, not initializing sample data');
        }
      } catch (error) {
        console.error('Error loading reference data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadReferenceData();
  }, []);

  // Process SpecSync data after reference data is loaded
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    console.log('🔄 SpecSync useEffect triggered:', {
      hasSpecSyncData: !!specSyncData?.items,
      specSyncItemsLength: specSyncData?.items?.length || 0,
      referenceDomainsLength: referenceDomains.length,
      loading,
      isProcessing: isProcessingSpecSync.current
    });

    if (specSyncData?.items && referenceDomains.length > 0 && !loading && !isProcessingSpecSync.current) {
      console.log('✅ Starting SpecSync processing...');
      isProcessingSpecSync.current = true;

      const processSpecSyncData = async () => {
        try {
          console.log('🚀 Calling autoSelectMatchingDomainsAndCapabilities...');
          await autoSelectMatchingDomainsAndCapabilities(specSyncData.items);
          console.log('✅ autoSelectMatchingDomainsAndCapabilities completed');
          await analyzeMissingItems();
          console.log('✅ analyzeMissingItems completed');
        } catch (error) {
          console.error('❌ Error in processSpecSyncData:', error);
        } finally {
          isProcessingSpecSync.current = false;
          console.log('🏁 SpecSync processing finished');
        }
      };

      // Use setTimeout to break the synchronous update cycle
      setTimeout(processSpecSyncData, 0);
    } else {
      console.log('❌ SpecSync processing skipped:', {
        reason: !specSyncData?.items ? 'No SpecSync data' : 
                referenceDomains.length === 0 ? 'No reference domains' :
                loading ? 'Still loading' : 'Already processing'
      });
    }
  }, [specSyncData?.items, loading, referenceDomains.length]); // Process when reference data is loaded

  // Analyze missing TMF reference items when domains change
  useEffect(() => {
    if (domains.length > 0 && !loading && !isProcessingSpecSync.current) {
      analyzeMissingItems();
    }
  }, [domains.length, loading]); // Analyze when domains change

  // Analyze missing items from TMF reference data
  const analyzeMissingItems = async () => {
    try {
      const gaps = await analyzeTMFReferenceGaps(domains);
      setMissingItemsCount(gaps.totalMissingItems);
    } catch (error) {
      console.error('Error analyzing missing TMF reference items:', error);
    }
  };

  // Memoized callback for onStateChange to prevent unnecessary re-renders
  const handleStateChange = useCallback((updatedDomains: UserDomain[]) => {
    onStateChange?.(updatedDomains);
  }, [onStateChange]);

  // Handle onStateChange callback when domains change (but not during SpecSync processing)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    console.log('🔄 Domains state changed:', {
      domainsLength: domains.length,
      loading,
      isProcessing: isProcessingSpecSync.current,
      selectedDomains: domains.filter(d => d.isSelected).length,
      selectedCapabilities: domains.reduce((sum, d) => sum + d.capabilities.filter(c => c.isSelected).length, 0)
    });
    
    if (domains.length > 0 && !loading && !isProcessingSpecSync.current) {
      console.log('✅ Calling handleStateChange with updated domains');
      handleStateChange(domains);
    } else {
      console.log('❌ Skipping handleStateChange:', {
        reason: domains.length === 0 ? 'No domains' : 
                loading ? 'Still loading' : 'Processing SpecSync'
      });
    }
  }, [domains, loading, handleStateChange]); // Include handleStateChange in dependencies

  // Initialize sample data
  const initializeSampleData = (
    referenceDomains: TMFDomain[],
    referenceFunctions: TMFFunction[],
  ) => {
    const sampleDomains: UserDomain[] = referenceDomains.map((refDomain, index) => {
      const domainFunctions = referenceFunctions.filter(
        (func) => func.domain_id === refDomain.id,
      );

      return {
        id: `domain-${index + 1}`,
        name: refDomain.name,
        description: `TMF ${refDomain.name} domain with ${domainFunctions.length} functions`,
        referenceDomainId: refDomain.id,
        capabilities: domainFunctions.map((refFunc, funcIndex) => ({
          id: `capability-${index + 1}-${funcIndex + 1}`,
          name: refFunc.function_name,
          description: `TMF Function: ${refFunc.function_name}`,
          referenceFunctionId: refFunc.id,
          domainId: `domain-${index + 1}`,
          isSelected: false,
          requirementCount: 0,
        })),
        isSelected: false,
        isExpanded: false,
        requirementCount: 0,
      };
    });

    setDomains(sampleDomains);
    handleStateChange(sampleDomains);
  };

  const autoSelectMatchingDomainsAndCapabilities = async (specSyncItems: any[]) => {
    try {
      console.log('🔍 Starting autoSelectMatchingDomainsAndCapabilities with', specSyncItems.length, 'items');
      console.log('🔍 Current domains state:', domains.length, 'domains loaded');
      
      // EXTRACT ONLY domain and functionName from SpecSync data - NO OTHER FIELDS
      console.log('📋 Processing SpecSync items - ONLY using domain and functionName fields');
      const specSyncData = specSyncItems.map(item => ({
        domain: item.domain?.toString().trim() || '',
        functionName: item.functionName?.toString().trim() || ''
      })).filter(item => item.domain && item.functionName);
      
      console.log('📊 SpecSync data (domain + functionName only):', specSyncData);
      
      // Get unique domains and functions from SpecSync data
      const importedDomains = new Set<string>();
      const importedFunctions = new Set<string>();
      
      specSyncData.forEach(item => {
        if (item.domain) importedDomains.add(item.domain);
        if (item.functionName) importedFunctions.add(item.functionName);
      });
      
      console.log('📊 Imported domains:', Array.from(importedDomains));
      console.log('📊 Imported functions:', Array.from(importedFunctions));
      
      // Log the TMF function names we have available
      const staticFunctions = getStaticTMFFunctions();
      console.log('🎯 Available TMF functions:');
      staticFunctions.forEach(func => {
        console.log(`  - ${func.functionName} (${func.domainName})`);
      });

      // Update existing domains to select matching capabilities
      const updatedDomains = domains.map((domain) => {
        let hasMatchingCapabilities = false;
        let domainSelected = false;

        // STRICT EXACT DOMAIN MATCH ONLY
        console.log(`🔍 Checking domain: "${domain.name}" against SpecSync domains:`, Array.from(importedDomains));
        
        const matchingSpecSyncDomain = Array.from(importedDomains).find(importedDomain => {
          const normalizedDomainName = domain.name.toLowerCase().trim();
          const normalizedImportedDomain = importedDomain.toLowerCase().trim();
          
          console.log(`  🔍 Comparing: "${normalizedDomainName}" vs "${normalizedImportedDomain}"`);
          
          // EXACT MATCH ONLY - NO FUZZY MATCHING
          const exactMatch = normalizedDomainName === normalizedImportedDomain;
          if (exactMatch) {
            console.log(`  ✅ EXACT DOMAIN MATCH`);
          } else {
            console.log(`  ❌ NO DOMAIN MATCH`);
          }
          return exactMatch;
        });

        if (matchingSpecSyncDomain) {
          console.log(`🎯 Found matching domain: ${domain.name} matches ${matchingSpecSyncDomain}`);
          
          // Get functions for this domain from SpecSync data
          const domainSpecSyncItems = specSyncData.filter(item => {
            const itemDomain = item.domain.toLowerCase();
            const matchingDomain = matchingSpecSyncDomain.toLowerCase();
            return itemDomain === matchingDomain;
          });

          console.log(`📋 Found ${domainSpecSyncItems.length} items for domain ${domain.name}`);
          
          // Log the specific functions we're looking for in this domain
          const specSyncFunctionsInDomain = domainSpecSyncItems.map(item => item.functionName);
          console.log(`🔍 Looking for these functions in ${domain.name}:`, specSyncFunctionsInDomain);
          
          // Log the available TMF functions in this domain
          const availableTMFunctions = domain.capabilities.map(cap => cap.name);
          console.log(`🎯 Available TMF functions in ${domain.name}:`, availableTMFunctions);

          // STRICT EXACT MATCHING FUNCTION ONLY
          const matchFunction = (specSyncName: string, tmfName: string): boolean => {
            const normalizedSpec = specSyncName.toLowerCase().trim();
            const normalizedTmf = tmfName.toLowerCase().trim();
            
            console.log(`    🔍 Matching: "${normalizedSpec}" vs "${normalizedTmf}"`);
            
            // EXACT MATCH ONLY - NO FUZZY MATCHING
            const exactMatch = normalizedSpec === normalizedTmf;
            if (exactMatch) {
              console.log(`    ✅ EXACT MATCH`);
            } else {
              console.log(`    ❌ NO MATCH`);
            }
            return exactMatch;
          };

          // Update capabilities to select matching ones
          const updatedCapabilities = domain.capabilities.map((capability) => {
            let isSelected = false;
            
            console.log(`🔍 Checking TMF function: "${capability.name}"`);
            console.log(`  📋 Available SpecSync functions in this domain:`, domainSpecSyncItems.map(item => item.functionName));
            
            // Check against all SpecSync functions in this domain
            for (const item of domainSpecSyncItems) {
              // ONLY use functionName field - NO OTHER FIELDS
              const functionName = item.functionName;
              if (!functionName) continue;
              
              console.log(`  🔍 Comparing with SpecSync: "${functionName}"`);
              
              if (matchFunction(functionName, capability.name)) {
                isSelected = true;
                hasMatchingCapabilities = true;
                console.log(`  ✅ MATCH FOUND: "${capability.name}" matches "${functionName}"`);
                break;
              } else {
                console.log(`  ❌ No match: "${capability.name}" vs "${functionName}"`);
              }
            }

            console.log(`  🎯 Final result for "${capability.name}": ${isSelected ? 'SELECTED' : 'NOT SELECTED'}`);
            return {
              ...capability,
              isSelected,
            };
          });

          // Select domain if it has any matching capabilities
          domainSelected = hasMatchingCapabilities;
          
          // Log summary of what was selected in this domain
          const selectedCapabilities = updatedCapabilities.filter(cap => cap.isSelected);
          console.log(`📊 ${domain.name}: Selected ${selectedCapabilities.length}/${updatedCapabilities.length} capabilities`);
          if (selectedCapabilities.length > 0) {
            console.log(`   ✅ Selected: ${selectedCapabilities.map(cap => cap.name).join(', ')}`);
          } else {
            console.log(`   ❌ No capabilities selected in ${domain.name}`);
          }

          return {
            ...domain,
            isSelected: domainSelected,
            capabilities: updatedCapabilities,
          };
        }

        return domain;
      });

      // Don't create new functions - only map to existing TMF functions
      console.log('✅ Mapping complete - only using existing TMF functions');
      
      // Final verification - log what was actually selected
      console.log('🎯 FINAL VERIFICATION:');
      updatedDomains.forEach(domain => {
        if (domain.isSelected) {
          const selectedFunctions = domain.capabilities.filter(cap => cap.isSelected);
          console.log(`  ${domain.name}: ${selectedFunctions.length} functions selected`);
          selectedFunctions.forEach(func => {
            console.log(`    ✅ ${func.name}`);
          });
        } else {
          console.log(`  ${domain.name}: NOT SELECTED`);
        }
      });
      
      setDomains(updatedDomains);

      console.log('🔄 Updated domains with selections');
      
      // Log final summary
      const totalSelectedDomains = updatedDomains.filter(d => d.isSelected).length;
      const totalSelectedCapabilities = updatedDomains.reduce((sum, d) => 
        sum + d.capabilities.filter(c => c.isSelected).length, 0
      );
      console.log(`🎯 Final Results: ${totalSelectedDomains} domains selected, ${totalSelectedCapabilities} capabilities selected`);
      
      // Use flushSync to ensure immediate UI update
      console.log('🔄 Setting domains state with selections...');
      flushSync(() => {
        setDomains(updatedDomains);
      });
      console.log('✅ Domains state updated');
      
      // Update requirement counts with the updated domains
      console.log('🔄 Updating requirement counts...');
      const finalDomainsWithCounts = updateRequirementCounts(specSyncItems, updatedDomains);
      console.log('✅ Requirement counts updated');
      
      // Final state update with requirement counts
      console.log('🔄 Final state update with requirement counts...');
      flushSync(() => {
        setDomains(finalDomainsWithCounts);
      });
      console.log('✅ Final state update completed');
      
      console.log('✅ SpecSync mapping completed successfully');
      
      // Notify parent component that mapping is complete
      onMappingComplete?.(finalDomainsWithCounts);
      
    } catch (error) {
      console.error('Error in autoSelectMatchingDomainsAndCapabilities:', error);
    }
  };

  const updateRequirementCounts = (specSyncItems: any[], domainsToUpdate?: UserDomain[]) => {
    const domainsToProcess = domainsToUpdate || domains;
    
    console.log('📊 Updating requirement counts for', domainsToProcess.length, 'domains');
    
    const updatedDomains = domainsToProcess.map((domain) => {
      const domainCapabilities = domain.capabilities.map((capability) => {
        // Count requirements that match this function
        const requirementCount = specSyncItems.filter((item: any) => {
          const itemFunction = (item.functionName || '').toString().trim().toLowerCase();
          const itemDomain = (item.domain || '').toString().trim().toLowerCase();
          const functionName = capability.name.trim().toLowerCase();
          const domainName = domain.name.trim().toLowerCase();

          // Exact match for better accuracy
          const functionMatch = itemFunction === functionName;
          const domainMatch = itemDomain === domainName;

          return functionMatch && domainMatch;
        }).length;

        if (requirementCount > 0) {
          console.log(`📈 ${capability.name}: ${requirementCount} requirements`);
        }

        return {
          ...capability,
          requirementCount,
        };
      });

      const domainRequirementCount = domainCapabilities.reduce(
        (sum, cap) => sum + cap.requirementCount,
        0,
      );

      if (domainRequirementCount > 0) {
        console.log(`📈 Domain ${domain.name}: ${domainRequirementCount} total requirements`);
      }

      return {
        ...domain,
        capabilities: domainCapabilities,
        requirementCount: domainRequirementCount,
      };
    });

    // Only update state if we're not already in the middle of updating
    if (!domainsToUpdate) {
      setDomains(updatedDomains);
    }
    
    return updatedDomains;
  };

  // Calculate selected counts for badge display
  const getSelectedCounts = () => {
    const selectedDomains = domains.filter(domain => domain.isSelected).length;
    const selectedCapabilities = domains.reduce((total, domain) => 
      total + domain.capabilities.filter(cap => cap.isSelected).length, 0
    );
    return { selectedDomains, selectedCapabilities };
  };

  const addDomain = (domainData: {
    name: string;
    description: string;
    referenceDomainId?: string;
  }) => {
    const newDomain: UserDomain = {
      id: `domain-${Date.now()}`,
      name: domainData.name,
      description: domainData.description,
      referenceDomainId: domainData.referenceDomainId,
      capabilities: [],
      isSelected: false,
      isExpanded: false,
      requirementCount: 0,
    };

    const updatedDomains = [...domains, newDomain];
    setDomains(updatedDomains);
    handleStateChange(updatedDomains);
    setAddDomainDialogOpen(false);
  };

  const addCapability = (capabilityData: {
    name: string;
    description: string;
    referenceFunctionId?: string;
  }) => {
    const newCapability: UserCapability = {
      id: `capability-${Date.now()}`,
      name: capabilityData.name,
      description: capabilityData.description,
      referenceFunctionId: capabilityData.referenceFunctionId,
      domainId: selectedDomainForCapability,
      isSelected: false,
      requirementCount: 0,
    };

    const updatedDomains = domains.map((domain) => {
      if (domain.id === selectedDomainForCapability) {
        return {
          ...domain,
          capabilities: [...domain.capabilities, newCapability],
        };
      }
      return domain;
    });

    setDomains(updatedDomains);
    handleStateChange(updatedDomains);
    setAddCapabilityDialogOpen(false);
    setSelectedDomainForCapability('');
  };

  // Handle adding missing domain with functions
  const handleAddMissingDomain = async (missingDomain: { domain: TMFDomain; functionCount: number; functions: TMFFunction[] }) => {
    try {
      // Create new domain
      const newDomain: UserDomain = {
        id: `domain-${Date.now()}-${Math.random()}`,
        name: missingDomain.domain.name,
        description: `TMF Domain: ${missingDomain.domain.name} with ${missingDomain.functionCount} functions`,
        isSelected: true,
        isExpanded: false,
        requirementCount: 0,
        capabilities: [],
      };

      // Create capabilities for each TMF function
      const newCapabilities: UserCapability[] = missingDomain.functions.map((func) => ({
        id: `capability-${Date.now()}-${Math.random()}`,
        name: func.function_name,
        description: `TMF Function: ${func.function_name}`,
        domainId: newDomain.id,
        isSelected: true,
        requirementCount: 0,
        referenceFunctionId: func.id,
      }));

      newDomain.capabilities = newCapabilities;

      const updatedDomains = [...domains, newDomain];
      setDomains(updatedDomains);
      handleStateChange(updatedDomains);
      
      // Re-analyze missing items
      await analyzeMissingItems();
    } catch (error) {
      console.error('Error adding missing TMF domain:', error);
    }
  };

  // Handle adding missing functions
  const handleAddMissingFunctions = async (missingFunctions: Array<{ function: TMFFunction; domain: string }>) => {
    try {
      // Group functions by domain
      const functionsByDomain: Record<string, TMFFunction[]> = {};
      missingFunctions.forEach(({ function: func, domain }) => {
        if (!functionsByDomain[domain]) {
          functionsByDomain[domain] = [];
        }
        functionsByDomain[domain].push(func);
      });

      let updatedDomains = [...domains];

      // Add functions to existing domains or create new domains
      for (const [domainName, functions] of Object.entries(functionsByDomain)) {
        const existingDomain = updatedDomains.find(d => d.name.toLowerCase() === domainName.toLowerCase());
        
        if (existingDomain) {
          // Add to existing domain
          const newCapabilities: UserCapability[] = functions.map((func) => ({
            id: `capability-${Date.now()}-${Math.random()}`,
            name: func.function_name,
            description: `TMF Function: ${func.function_name}`,
            domainId: existingDomain.id,
            isSelected: true,
            requirementCount: 0,
            referenceFunctionId: func.id,
          }));

          updatedDomains = updatedDomains.map((domain) =>
            domain.id === existingDomain.id
              ? {
                  ...domain,
                  capabilities: [...domain.capabilities, ...newCapabilities],
                  isSelected: true,
                }
              : domain,
          );
        } else {
          // Create new domain
          const newDomain: UserDomain = {
            id: `domain-${Date.now()}-${Math.random()}`,
            name: domainName,
            description: `TMF Domain: ${domainName} with ${functions.length} functions`,
            isSelected: true,
            isExpanded: false,
            requirementCount: 0,
            capabilities: functions.map((func) => ({
              id: `capability-${Date.now()}-${Math.random()}`,
              name: func.function_name,
              description: `TMF Function: ${func.function_name}`,
              domainId: `domain-${Date.now()}-${Math.random()}`,
              isSelected: true,
              requirementCount: 0,
              referenceFunctionId: func.id,
            })),
          };

          updatedDomains.push(newDomain);
        }
      }

      setDomains(updatedDomains);
      handleStateChange(updatedDomains);

      // Re-analyze missing items
      await analyzeMissingItems();
    } catch (error) {
      console.error('Error adding missing TMF functions:', error);
    }
  };

  const removeDomain = (domainId: string) => {
    const updatedDomains = domains.filter((domain) => domain.id !== domainId);
    setDomains(updatedDomains);
    handleStateChange(updatedDomains);
  };

  const removeCapability = (domainId: string, capabilityId: string) => {
    const updatedDomains = domains.map((domain) => {
      if (domain.id === domainId) {
        return {
          ...domain,
          capabilities: domain.capabilities.filter((cap) => cap.id !== capabilityId),
        };
      }
      return domain;
    });
    setDomains(updatedDomains);
    handleStateChange(updatedDomains);
  };

  const toggleDomainSelection = (domainId: string) => {
    const updatedDomains = domains.map((domain) => {
      if (domain.id === domainId) {
        const newSelection = !domain.isSelected;
        // Also toggle all capabilities in this domain
        const updatedCapabilities = domain.capabilities.map((cap) => ({
          ...cap,
          isSelected: newSelection,
        }));
        return {
          ...domain,
          isSelected: newSelection,
          capabilities: updatedCapabilities,
          isExpanded: false, // Keep collapsed by default
        };
      }
      return domain;
    });
    setDomains(updatedDomains);
    onStateChange?.(updatedDomains);
  };

  const toggleCapabilitySelection = (domainId: string, capabilityId: string) => {
    const updatedDomains = domains.map((domain) => {
      if (domain.id === domainId) {
        const updatedCapabilities = domain.capabilities.map((cap) => {
          if (cap.id === capabilityId) {
            return { ...cap, isSelected: !cap.isSelected };
          }
          return cap;
        });

        // Check if all capabilities are selected to update domain selection
        const allCapabilitiesSelected = updatedCapabilities.every((cap) => cap.isSelected);
        // Check if any capabilities are selected
        const anyCapabilitiesSelected = updatedCapabilities.some((cap) => cap.isSelected);

        return {
          ...domain,
          capabilities: updatedCapabilities,
          isSelected: allCapabilitiesSelected || anyCapabilitiesSelected,
          isExpanded: false, // Keep collapsed by default
        };
      }
      return domain;
    });
    setDomains(updatedDomains);
    handleStateChange(updatedDomains);
  };

  const toggleDomainExpansion = (domainId: string) => {
    const updatedDomains = domains.map((domain) => {
      if (domain.id === domainId) {
        return { ...domain, isExpanded: !domain.isExpanded };
      }
      return domain;
    });
    setDomains(updatedDomains);
  };

  const handleAddCapabilityClick = (domainId: string) => {
    setSelectedDomainForCapability(domainId);
    setAddCapabilityDialogOpen(true);
  };

  const handleReferenceDomainChange = (domainId: string) => {
    setSelectedReferenceDomain(domainId);
    if (domainId && domainId !== 'custom') {
      // Auto-add the selected reference domain and its functions
      const refDomain = referenceDomains.find((d) => d.id === domainId);
      const refFunctions = referenceFunctions.filter((func) => func.domain_id === domainId);

      if (refDomain) {
        const newDomain: UserDomain = {
          id: `domain-${Date.now()}`,
          name: refDomain.name,
          description: `TMF ${refDomain.name} domain with ${refFunctions.length} functions`,
          referenceDomainId: refDomain.id,
          capabilities: refFunctions.map((refFunc, index) => ({
            id: `capability-${Date.now()}-${index}`,
            name: refFunc.function_name,
            description: `TMF Function: ${refFunc.function_name}`,
            referenceFunctionId: refFunc.id,
            domainId: `domain-${Date.now()}`,
            isSelected: false,
            requirementCount: 0,
          })),
          isSelected: false,
          isExpanded: false,
          requirementCount: 0,
        };

        const updatedDomains = [...domains, newDomain];
        setDomains(updatedDomains);
        handleStateChange(updatedDomains);
      }
    }
    setSelectedReferenceDomain('');
  };

  const filteredDomains = domains.filter(
    (domain) =>
      domain.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      domain.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      domain.capabilities.some(
        (cap) =>
          cap.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cap.description.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
  );

  const selectedDomainsCount = domains.filter((d) => d.isSelected).length;
  const selectedCapabilitiesCount = domains.reduce(
    (count, domain) => count + domain.capabilities.filter((c) => c.isSelected).length,
    0,
  );

  const totalRequirementsCount = domains.reduce(
    (count, domain) => count + domain.requirementCount,
    0,
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
        <span className="ml-2">Loading TMF reference data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Summary and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-sm text-muted-foreground">
            {selectedDomainsCount} domains, {selectedCapabilitiesCount} capabilities selected
            {totalRequirementsCount > 0 && (
              <span className="ml-2 font-medium text-blue-600">
                • {totalRequirementsCount} requirements mapped
              </span>
            )}
            {specSyncData && (
              <span className="ml-2 font-medium text-green-600">
                • Import active ({specSyncData.items?.length || 0} requirements)
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedReferenceDomain} onValueChange={handleReferenceDomainChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Quick add TMF domain" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="custom">Custom Domain</SelectItem>
              {referenceDomains.map((domain) => (
                <SelectItem key={domain.id} value={domain.id}>
                  {domain.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            size="sm" 
            className="flex items-center space-x-2"
            onClick={() => setEnhancedDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            <span>Add Custom Domain</span>
            {missingItemsCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {missingItemsCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
        <Input
          placeholder="Search domains and capabilities..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Domains List */}
      <div className="space-y-3">
        {filteredDomains.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            {searchTerm
              ? 'No domains match your search'
              : 'No domains added yet. Add your first domain to get started.'}
          </div>
        ) : (
          filteredDomains.map((domain) => (
            <Card key={domain.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => toggleDomainSelection(domain.id)}
                      className="flex items-center space-x-2 rounded p-1 hover:bg-muted/50"
                    >
                      {domain.isSelected ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-400" />
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDomainExpansion(domain.id);
                        }}
                        className="flex items-center space-x-2 rounded p-1 hover:bg-muted/50"
                      >
                        {domain.isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <span className="font-semibold">{domain.name}</span>
                        {domain.id.includes('imported') && (
                          <Badge
                            variant="outline"
                            className="border-blue-600 text-xs text-blue-600"
                          >
                            Imported
                          </Badge>
                        )}
                      </button>
                    </button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">
                      {domain.capabilities.filter((cap) => cap.isSelected).length} selected
                      capabilities
                    </Badge>
                    {domain.requirementCount > 0 && (
                      <Badge variant="outline" className="border-blue-600 text-blue-600">
                        {domain.requirementCount} requirements
                      </Badge>
                    )}
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAddCapabilityClick(domain.id)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => removeDomain(domain.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <p className="ml-10 text-sm text-muted-foreground">{domain.description}</p>
              </CardHeader>

              {/* Capabilities List */}
              {domain.isExpanded && (
                <CardContent className="pt-0">
                  <div className="ml-10 space-y-2">
                    {domain.capabilities.length === 0 ? (
                      <div className="py-2 text-sm text-muted-foreground">
                        No capabilities added to this domain yet.
                      </div>
                    ) : (
                      domain.capabilities.map((capability) => (
                        <div
                          key={capability.id}
                          className="flex items-center justify-between rounded-lg bg-muted/30 p-3 transition-colors hover:bg-muted/50"
                        >
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => toggleCapabilitySelection(domain.id, capability.id)}
                              className="flex items-center space-x-2"
                            >
                              {capability.isSelected ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <Circle className="h-4 w-4 text-gray-400" />
                              )}
                              <div className="text-left">
                                <div className="flex items-center space-x-2 text-sm font-medium">
                                  <span>{capability.name}</span>
                                  {capability.id.includes('imported') && (
                                    <Badge
                                      variant="outline"
                                      className="border-blue-600 text-xs text-blue-600"
                                    >
                                      Imported
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {capability.description}
                                </div>
                              </div>
                            </button>
                          </div>
                          <div className="flex items-center space-x-2">
                            {capability.isSelected && capability.requirementCount > 0 && (
                              <Badge
                                variant="outline"
                                className="border-blue-600 text-xs text-blue-600"
                              >
                                {capability.requirementCount} reqs
                              </Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCapability(domain.id, capability.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Single Add Capability Dialog */}
      <Dialog open={addCapabilityDialogOpen} onOpenChange={setAddCapabilityDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Add Capability to{' '}
              {domains.find((d) => d.id === selectedDomainForCapability)?.name || 'Domain'}
            </DialogTitle>
          </DialogHeader>
          <AddCapabilityForm
            onAdd={addCapability}
            referenceFunctions={referenceFunctions.filter((func) => {
              const selectedDomain = domains.find((d) => d.id === selectedDomainForCapability);
              return func.domain_id === selectedDomain?.referenceDomainId;
            })}
          />
        </DialogContent>
      </Dialog>

      {/* Enhanced Add Custom Domain Dialog */}
      <EnhancedAddCustomDomainDialog
        open={enhancedDialogOpen}
        onOpenChange={setEnhancedDialogOpen}
        currentDomains={domains}
        onAddMissingDomain={handleAddMissingDomain}
        onAddMissingFunctions={handleAddMissingFunctions}
        onAddCustomDomain={addDomain}
        referenceDomains={referenceDomains}
      />
    </div>
  );
}

// Add Domain Form Component
function AddDomainForm({
  onAdd,
  referenceDomains,
}: {
  onAdd: (data: { name: string; description: string; referenceDomainId?: string }) => void;
  referenceDomains: TMFDomain[];
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedReference, setSelectedReference] = useState<string>('custom');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && description.trim()) {
      onAdd({
        name: name.trim(),
        description: description.trim(),
        referenceDomainId: selectedReference === 'custom' ? undefined : selectedReference,
      });
      setName('');
      setDescription('');
      setSelectedReference('custom');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="reference-domain">Reference Domain (Optional)</Label>
        <Select value={selectedReference} onValueChange={setSelectedReference}>
          <SelectTrigger>
            <SelectValue placeholder="Select a reference domain" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="custom">Custom Domain</SelectItem>
            {referenceDomains.map((domain) => (
              <SelectItem key={domain.id} value={domain.id}>
                {domain.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="domain-name">Domain Name</Label>
        <Input
          id="domain-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter domain name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="domain-description">Description</Label>
        <Textarea
          id="domain-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter domain description"
          required
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit">Add Domain</Button>
      </div>
    </form>
  );
}

// Add Capability Form Component
function AddCapabilityForm({
  onAdd,
  referenceFunctions,
}: {
  onAdd: (data: { name: string; description: string; referenceFunctionId?: string }) => void;
  referenceFunctions: TMFFunction[];
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedReference, setSelectedReference] = useState<string>('custom');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && description.trim()) {
      onAdd({
        name: name.trim(),
        description: description.trim(),
        referenceFunctionId: selectedReference === 'custom' ? undefined : selectedReference,
      });
      setName('');
      setDescription('');
      setSelectedReference('custom');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="reference-function">Reference TMF Function (Optional)</Label>
        <Select value={selectedReference} onValueChange={setSelectedReference}>
          <SelectTrigger>
            <SelectValue placeholder="Select a reference TMF function" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="custom">Custom Function</SelectItem>
            {referenceFunctions.map((func) => (
              <SelectItem key={func.id} value={func.id}>
                {func.function_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="capability-name">Function Name</Label>
        <Input
          id="capability-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter TMF function name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="capability-description">Description</Label>
        <Textarea
          id="capability-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter function description"
          required
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit">Add Function</Button>
      </div>
    </form>
  );
}
