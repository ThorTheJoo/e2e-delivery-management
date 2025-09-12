'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, ChevronDown, ChevronRight, FileSpreadsheet, Search, Filter } from 'lucide-react';
import { TMFDomain, TMFFunction, SpecSyncState } from '@/types';
import { SpecSyncImport } from './specsync-import';
import { TMFReferenceService } from '@/lib/tmf-reference-service-new';
import { getMappedTMFunctions, getAvailableTMFunctionsForCustomDomain } from '@/lib/specsync-tmf-utils';

interface TMFOdaManagerProps {
  onStateChange?: (state: any) => void;
  initialState?: any;
}

interface DomainWithFunctions extends TMFDomain {
  functions: TMFFunction[];
  isExpanded: boolean;
  isSelected: boolean;
  selectedFunctionIds: string[];
  mappedFunctionCount: number;
  mappedFunctionIds?: string[];
}

export function TMFOdaManager({ onStateChange: _onStateChange, initialState: _initialState }: TMFOdaManagerProps) {
  const [domains, setDomains] = useState<DomainWithFunctions[]>([]);
  const [specSyncState, setSpecSyncState] = useState<SpecSyncState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomainFilter, setSelectedDomainFilter] = useState<string>('all');
  // const [_showAddCustomDomain, _setShowAddCustomDomain] = useState(false);
  // const [_availableFunctions, _setAvailableFunctions] = useState<TMFFunction[]>([]);

  // Load TMF reference data
  useEffect(() => {
    loadTMFReferenceData();
  }, []);

  // Update domains when SpecSync data changes
  useEffect(() => {
    if (specSyncState) {
      updateDomainsWithSpecSyncData();
    }
  }, [specSyncState]);

  const loadTMFReferenceData = async () => {
    try {
      setIsLoading(true);
      
      // Check if reference data exists
      const hasData = await TMFReferenceService.initializeReferenceData();
      if (!hasData) {
        console.warn('TMF reference data not loaded. Please run the setup script.');
        setIsLoading(false);
        return;
      }

      // Load domains
      const tmfDomains = await TMFReferenceService.getDomains();
      
      // Load functions for each domain
      const domainsWithFunctions: DomainWithFunctions[] = await Promise.all(
        tmfDomains.map(async (domain) => {
          const functions = await TMFReferenceService.getFunctionsByDomain(domain.id);
          return {
            ...domain,
            functions,
            isExpanded: false,
            isSelected: false,
            selectedFunctionIds: [],
            mappedFunctionCount: 0,
          };
        })
      );

      setDomains(domainsWithFunctions);
    } catch (error) {
      console.error('Error loading TMF reference data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateDomainsWithSpecSyncData = useCallback(async () => {
    if (!specSyncState) return;

    try {
      // Get mapped TMF functions from SpecSync data
      const mappedFunctions = await getMappedTMFunctions(specSyncState.items);
      
      // Update domain counts
      const updatedDomains = domains.map(domain => {
        const domainMappedFunctions = mappedFunctions.filter(
          mf => mf.function.domain_name === domain.name
        );
        
        return {
          ...domain,
          mappedFunctionCount: domainMappedFunctions.length,
          selectedFunctionIds: domainMappedFunctions.map(mf => mf.function.id),
        };
      });

      setDomains(updatedDomains);
    } catch (error) {
      console.error('Error updating domains with SpecSync data:', error);
    }
  }, [specSyncState, domains]);

  const handleSpecSyncImport = (state: SpecSyncState) => {
    setSpecSyncState(state);
  };

  const handleSpecSyncClear = () => {
    setSpecSyncState(null);
    // Reset domain selections
    setDomains(prev => prev.map(domain => ({
      ...domain,
      mappedFunctionCount: 0,
      selectedFunctionIds: [],
    })));
  };

  const toggleDomainExpansion = (domainId: string) => {
    setDomains(prev => prev.map(domain => 
      domain.id === domainId 
        ? { ...domain, isExpanded: !domain.isExpanded }
        : domain
    ));
  };

  const toggleFunctionSelection = (domainId: string, functionId: string) => {
    setDomains(prev => prev.map(domain => {
      if (domain.id !== domainId) return domain;
      
      const isSelected = domain.selectedFunctionIds.includes(functionId);
      const newSelectedIds = isSelected
        ? domain.selectedFunctionIds.filter(id => id !== functionId)
        : [...domain.selectedFunctionIds, functionId];
      
      return {
        ...domain,
        selectedFunctionIds: newSelectedIds,
        isSelected: newSelectedIds.length > 0,
      };
    }));
  };

  const handleAddCustomDomain = async () => {
    // setShowAddCustomDomain(true);
    
    // Get available functions for custom domain addition
    const mappedFunctionIds = domains.flatMap(d => d.selectedFunctionIds);
    const available = await getAvailableTMFunctionsForCustomDomain(mappedFunctionIds);
    // setAvailableFunctions(available);
  };

  const filteredDomains = domains.filter(domain => {
    const matchesSearch = searchQuery === '' || 
      domain.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      domain.functions.some(func => 
        func.function_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    const matchesFilter = selectedDomainFilter === 'all' ||
      (selectedDomainFilter === 'mapped' && domain.mappedFunctionCount > 0) ||
      (selectedDomainFilter === 'unmapped' && domain.mappedFunctionCount === 0);
    
    return matchesSearch && matchesFilter;
  });

  const totalDomains = domains.length;
  const totalFunctions = domains.reduce((sum, domain) => sum + domain.functions.length, 0);
  const mappedDomains = domains.filter(d => d.mappedFunctionCount > 0).length;
  const mappedFunctions = domains.reduce((sum, domain) => sum + domain.mappedFunctionCount, 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Domain & TMF Function Overview</h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading TMF reference data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Domain & TMF Function Overview</h2>
        <div className="flex gap-2">
          <Button
            onClick={handleAddCustomDomain}
            variant="outline"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Custom Domain
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{totalDomains}</div>
            <div className="text-sm text-gray-600">Total Domains</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{totalFunctions}</div>
            <div className="text-sm text-gray-600">Total Functions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{mappedDomains}</div>
            <div className="text-sm text-gray-600">Mapped Domains</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{mappedFunctions}</div>
            <div className="text-sm text-gray-600">Mapped Functions</div>
          </CardContent>
        </Card>
      </div>

      {/* SpecSync Import */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            SpecSync Import
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SpecSyncImport
            onImport={handleSpecSyncImport}
            onClear={handleSpecSyncClear}
            currentState={specSyncState}
          />
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search domains and functions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={selectedDomainFilter}
            onChange={(e) => setSelectedDomainFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Domains</option>
            <option value="mapped">Mapped Only</option>
            <option value="unmapped">Unmapped Only</option>
          </select>
        </div>
      </div>

      {/* Domains List */}
      <div className="space-y-4">
        {filteredDomains.map((domain) => (
          <Card key={domain.id} className="overflow-hidden">
            <CardHeader 
              className="cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleDomainExpansion(domain.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {domain.isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  )}
                  <div>
                    <CardTitle className="text-lg">{domain.name}</CardTitle>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm text-gray-600">
                        {domain.functions.length} functions
                      </span>
                      {domain.mappedFunctionCount > 0 && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          {domain.mappedFunctionCount} mapped
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle edit
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            {domain.isExpanded && (
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {domain.functions.map((func) => {
                    const isSelected = domain.selectedFunctionIds.includes(func.id);
                    const isMapped = specSyncState && domain.mappedFunctionIds?.includes(func.id);
                    
                    return (
                      <div
                        key={func.id}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                          isSelected 
                            ? 'bg-blue-50 border-blue-200' 
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleFunctionSelection(domain.id, func.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div>
                            <div className="font-medium">{func.function_name}</div>
                            {func.af_level_2 && (
                              <div className="text-sm text-gray-600">{func.af_level_2}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isMapped && (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              Mapped
                            </Badge>
                          )}
                          {func.vertical && (
                            <Badge variant="outline" className="text-gray-600">
                              {func.vertical}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {filteredDomains.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">No domains found matching your search criteria.</p>
        </div>
      )}
    </div>
  );
}
