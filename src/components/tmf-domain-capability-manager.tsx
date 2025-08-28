'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Edit, ChevronDown, ChevronRight, Search, CheckCircle, Circle } from 'lucide-react';
import { TMFReferenceService, TMFReferenceDomain, TMFReferenceCapability } from '@/lib/tmf-reference-service';

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
  referenceCapabilityId?: string;
  domainId: string;
  isSelected: boolean;
  requirementCount: number;
}

interface TMFDomainCapabilityManagerProps {
  onStateChange?: (domains: UserDomain[]) => void;
  initialState?: UserDomain[];
  specSyncData?: any; // SpecSync data for requirement mapping
}

export function TMFDomainCapabilityManager({ onStateChange, initialState, specSyncData }: TMFDomainCapabilityManagerProps) {
  const [domains, setDomains] = useState<UserDomain[]>(initialState || []);
  const [referenceDomains, setReferenceDomains] = useState<TMFReferenceDomain[]>([]);
  const [referenceCapabilities, setReferenceCapabilities] = useState<TMFReferenceCapability[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDomainDialogOpen, setAddDomainDialogOpen] = useState(false);
  const [addCapabilityDialogOpen, setAddCapabilityDialogOpen] = useState(false);
  const [selectedDomainForCapability, setSelectedDomainForCapability] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReferenceDomain, setSelectedReferenceDomain] = useState<string>('');
  const isProcessingSpecSync = useRef(false);

  // Load reference data
  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const [domainsData, capabilitiesData] = await Promise.all([
          TMFReferenceService.getReferenceDomains(),
          TMFReferenceService.getAllReferenceCapabilities()
        ]);
        setReferenceDomains(domainsData);
        setReferenceCapabilities(capabilitiesData);
        
        // Initialize with sample data if no domains exist
        if (domains.length === 0) {
          initializeSampleData(domainsData, capabilitiesData);
        }
      } catch (error) {
        console.error('Error loading reference data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadReferenceData();
  }, []);

  // Process SpecSync data after domains are initialized
  useEffect(() => {
    if (specSyncData?.items && domains.length > 0 && !loading && !isProcessingSpecSync.current) {
      isProcessingSpecSync.current = true;
      
      const processSpecSyncData = () => {
        updateRequirementCounts(specSyncData.items);
        autoSelectMatchingDomainsAndCapabilities(specSyncData.items);
        isProcessingSpecSync.current = false;
      };
      
      // Use setTimeout to break the synchronous update cycle
      setTimeout(processSpecSyncData, 0);
    }
  }, [specSyncData?.items, loading, domains.length]); // Only depend on domains.length, not the full domains array

  // Handle onStateChange callback when domains change (but not during SpecSync processing)
  useEffect(() => {
    if (domains.length > 0 && !loading && !isProcessingSpecSync.current) {
      onStateChange?.(domains);
    }
  }, [domains, loading]); // Remove onStateChange from dependencies to prevent infinite loop

  // Initialize sample data
  const initializeSampleData = (referenceDomains: TMFReferenceDomain[], referenceCapabilities: TMFReferenceCapability[]) => {
    const sampleDomains: UserDomain[] = referenceDomains.map((refDomain, index) => {
      const domainCapabilities = referenceCapabilities.filter(cap => cap.domain_id === refDomain.id);
      
      return {
        id: `domain-${index + 1}`,
        name: refDomain.name,
        description: refDomain.description,
        referenceDomainId: refDomain.id,
        capabilities: domainCapabilities.map((refCap, capIndex) => ({
          id: `capability-${index + 1}-${capIndex + 1}`,
          name: refCap.name,
          description: refCap.description,
          referenceCapabilityId: refCap.id,
          domainId: `domain-${index + 1}`,
          isSelected: false,
          requirementCount: 0
        })),
        isSelected: false,
        isExpanded: false,
        requirementCount: 0
      };
    });

    setDomains(sampleDomains);
    onStateChange?.(sampleDomains);
  };



  const autoSelectMatchingDomainsAndCapabilities = (specSyncItems: any[]) => {
    // Extract unique domains and capabilities from SpecSync data
    const importedDomains = new Set<string>();
    const importedCapabilities = new Set<string>();
    
    specSyncItems.forEach((item: any) => {
      if (item.domain) {
        importedDomains.add(item.domain.toString().trim());
      }
      if (item.capability) {
        importedCapabilities.add(item.capability.toString().trim());
      }
      if (item.afLevel2) {
        importedCapabilities.add(item.afLevel2.toString().trim());
      }
    });

    // Update existing domains to auto-select matching ones
    const updatedDomains = domains.map(domain => {
      const domainName = domain.name.toLowerCase();
      const isDomainMatch = Array.from(importedDomains).some(importedDomain => 
        importedDomain.toLowerCase() === domainName
      );

      // Update capabilities within this domain
      const updatedCapabilities = domain.capabilities.map(capability => {
        const capabilityName = capability.name.toLowerCase();
        const isCapabilityMatch = Array.from(importedCapabilities).some(importedCapability => 
          importedCapability.toLowerCase() === capabilityName
        );

        return {
          ...capability,
          isSelected: isCapabilityMatch
        };
      });

      // Add missing capabilities from imported data to this domain
      Array.from(importedCapabilities).forEach(importedCapability => {
        const capabilityExists = updatedCapabilities.some(cap => 
          cap.name.toLowerCase() === importedCapability.toLowerCase()
        );
        
        if (!capabilityExists && isDomainMatch) {
          // Add new capability to this domain
          const newCapability: UserCapability = {
            id: `capability-imported-${Date.now()}-${Math.random()}`,
            name: importedCapability,
            description: `Imported capability: ${importedCapability}`,
            domainId: domain.id,
            isSelected: true,
            requirementCount: 0
          };
          updatedCapabilities.push(newCapability);
        }
      });

      // Domain is selected if any of its capabilities are selected or if domain name matches
      const hasSelectedCapabilities = updatedCapabilities.some(cap => cap.isSelected);
      const isSelected = isDomainMatch || hasSelectedCapabilities;

      return {
        ...domain,
        isSelected,
        capabilities: updatedCapabilities,
        isExpanded: isSelected // Auto-expand selected domains
      };
    });

    // Create missing domains from imported data
    const newDomains: UserDomain[] = [];
    Array.from(importedDomains).forEach(importedDomain => {
      const domainExists = updatedDomains.some(domain => 
        domain.name.toLowerCase() === importedDomain.toLowerCase()
      );
      
      if (!domainExists) {
        // Create new domain from imported data
        const newDomain: UserDomain = {
          id: `domain-imported-${Date.now()}-${Math.random()}`,
          name: importedDomain,
          description: `Imported domain: ${importedDomain}`,
          capabilities: [],
          isSelected: true,
          isExpanded: true,
          requirementCount: 0
        };
        newDomains.push(newDomain);
      }
    });

    // Combine existing and new domains
    const allDomains = [...updatedDomains, ...newDomains];
    
    setDomains(allDomains);
  };

  const updateRequirementCounts = (specSyncItems: any[]) => {
    const updatedDomains = domains.map(domain => {
      const domainCapabilities = domain.capabilities.map(capability => {
        // Count requirements that match this capability
        const requirementCount = specSyncItems.filter((item: any) => {
          const itemCapability = (item.capability || item.afLevel2 || '').toString().toLowerCase();
          const itemDomain = (item.domain || '').toString().toLowerCase();
          const capabilityName = capability.name.toLowerCase();
          const domainName = domain.name.toLowerCase();
          
          // Exact match for better accuracy
          const capabilityMatch = itemCapability === capabilityName;
          const domainMatch = itemDomain === domainName;
          
          return capabilityMatch && domainMatch;
        }).length;

        return {
          ...capability,
          requirementCount
        };
      });

      const domainRequirementCount = domainCapabilities.reduce((sum, cap) => sum + cap.requirementCount, 0);

      return {
        ...domain,
        capabilities: domainCapabilities,
        requirementCount: domainRequirementCount
      };
    });

    setDomains(updatedDomains);
  };

  const addDomain = (domainData: { name: string; description: string; referenceDomainId?: string }) => {
    const newDomain: UserDomain = {
      id: `domain-${Date.now()}`,
      name: domainData.name,
      description: domainData.description,
      referenceDomainId: domainData.referenceDomainId,
      capabilities: [],
      isSelected: false,
      isExpanded: true,
      requirementCount: 0
    };

    const updatedDomains = [...domains, newDomain];
    setDomains(updatedDomains);
    onStateChange?.(updatedDomains);
    setAddDomainDialogOpen(false);
  };

  const addCapability = (capabilityData: { name: string; description: string; referenceCapabilityId?: string }) => {
    const newCapability: UserCapability = {
      id: `capability-${Date.now()}`,
      name: capabilityData.name,
      description: capabilityData.description,
      referenceCapabilityId: capabilityData.referenceCapabilityId,
      domainId: selectedDomainForCapability,
      isSelected: false,
      requirementCount: 0
    };

    const updatedDomains = domains.map(domain => {
      if (domain.id === selectedDomainForCapability) {
        return {
          ...domain,
          capabilities: [...domain.capabilities, newCapability]
        };
      }
      return domain;
    });

    setDomains(updatedDomains);
    onStateChange?.(updatedDomains);
    setAddCapabilityDialogOpen(false);
    setSelectedDomainForCapability('');
  };

  const removeDomain = (domainId: string) => {
    const updatedDomains = domains.filter(domain => domain.id !== domainId);
    setDomains(updatedDomains);
    onStateChange?.(updatedDomains);
  };

  const removeCapability = (domainId: string, capabilityId: string) => {
    const updatedDomains = domains.map(domain => {
      if (domain.id === domainId) {
        return {
          ...domain,
          capabilities: domain.capabilities.filter(cap => cap.id !== capabilityId)
        };
      }
      return domain;
    });
    setDomains(updatedDomains);
    onStateChange?.(updatedDomains);
  };

  const toggleDomainSelection = (domainId: string) => {
    const updatedDomains = domains.map(domain => {
      if (domain.id === domainId) {
        const newSelection = !domain.isSelected;
        // Also toggle all capabilities in this domain
        const updatedCapabilities = domain.capabilities.map(cap => ({
          ...cap,
          isSelected: newSelection
        }));
        return { 
          ...domain, 
          isSelected: newSelection,
          capabilities: updatedCapabilities,
          isExpanded: newSelection // Auto-expand when selected
        };
      }
      return domain;
    });
    setDomains(updatedDomains);
    onStateChange?.(updatedDomains);
  };

  const toggleCapabilitySelection = (domainId: string, capabilityId: string) => {
    const updatedDomains = domains.map(domain => {
      if (domain.id === domainId) {
        const updatedCapabilities = domain.capabilities.map(cap => {
          if (cap.id === capabilityId) {
            return { ...cap, isSelected: !cap.isSelected };
          }
          return cap;
        });
        
        // Check if all capabilities are selected to update domain selection
        const allCapabilitiesSelected = updatedCapabilities.every(cap => cap.isSelected);
        // Check if any capabilities are selected
        const anyCapabilitiesSelected = updatedCapabilities.some(cap => cap.isSelected);
        
        return {
          ...domain,
          capabilities: updatedCapabilities,
          isSelected: allCapabilitiesSelected || anyCapabilitiesSelected,
          isExpanded: anyCapabilitiesSelected // Auto-expand when any capability is selected
        };
      }
      return domain;
    });
    setDomains(updatedDomains);
    onStateChange?.(updatedDomains);
  };

  const toggleDomainExpansion = (domainId: string) => {
    const updatedDomains = domains.map(domain => {
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
      // Auto-add the selected reference domain and its capabilities
      const refDomain = referenceDomains.find(d => d.id === domainId);
      const refCapabilities = referenceCapabilities.filter(cap => cap.domain_id === domainId);
      
      if (refDomain) {
        const newDomain: UserDomain = {
          id: `domain-${Date.now()}`,
          name: refDomain.name,
          description: refDomain.description,
          referenceDomainId: refDomain.id,
          capabilities: refCapabilities.map((refCap, index) => ({
            id: `capability-${Date.now()}-${index}`,
            name: refCap.name,
            description: refCap.description,
            referenceCapabilityId: refCap.id,
            domainId: `domain-${Date.now()}`,
            isSelected: false,
            requirementCount: 0
          })),
          isSelected: false,
          isExpanded: true,
          requirementCount: 0
        };

        const updatedDomains = [...domains, newDomain];
        setDomains(updatedDomains);
        onStateChange?.(updatedDomains);
      }
    }
    setSelectedReferenceDomain('');
  };

  const filteredDomains = domains.filter(domain =>
    domain.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    domain.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    domain.capabilities.some(cap => 
      cap.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cap.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const selectedDomainsCount = domains.filter(d => d.isSelected).length;
  const selectedCapabilitiesCount = domains.reduce((count, domain) => 
    count + domain.capabilities.filter(c => c.isSelected).length, 0
  );

  const totalRequirementsCount = domains.reduce((count, domain) => 
    count + domain.requirementCount, 0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
              <span className="ml-2 text-blue-600 font-medium">
                • {totalRequirementsCount} requirements mapped
              </span>
            )}
            {specSyncData && (
              <span className="ml-2 text-green-600 font-medium">
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
          <Dialog open={addDomainDialogOpen} onOpenChange={setAddDomainDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Add Custom Domain</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Custom TMF Domain</DialogTitle>
              </DialogHeader>
              <AddDomainForm onAdd={addDomain} referenceDomains={referenceDomains} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? 'No domains match your search' : 'No domains added yet. Add your first domain to get started.'}
          </div>
        ) : (
          filteredDomains.map((domain) => (
            <Card key={domain.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => toggleDomainSelection(domain.id)}
                      className="flex items-center space-x-2 hover:bg-muted/50 p-1 rounded"
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
                        className="flex items-center space-x-2 hover:bg-muted/50 p-1 rounded"
                      >
                        {domain.isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <span className="font-semibold">{domain.name}</span>
                        {domain.id.includes('imported') && (
                          <Badge variant="outline" className="text-xs text-blue-600 border-blue-600">
                            Imported
                          </Badge>
                        )}
                      </button>
                    </button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">
                      {domain.capabilities.filter(cap => cap.isSelected).length} selected capabilities
                    </Badge>
                    {domain.requirementCount > 0 && (
                      <Badge variant="outline" className="text-blue-600 border-blue-600">
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDomain(domain.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground ml-10">{domain.description}</p>
              </CardHeader>

              {/* Capabilities List */}
              {domain.isExpanded && (
                <CardContent className="pt-0">
                  <div className="space-y-2 ml-10">
                    {domain.capabilities.length === 0 ? (
                      <div className="text-sm text-muted-foreground py-2">
                        No capabilities added to this domain yet.
                      </div>
                    ) : (
                      domain.capabilities.map((capability) => (
                        <div
                          key={capability.id}
                          className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
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
                                <div className="font-medium text-sm flex items-center space-x-2">
                                  <span>{capability.name}</span>
                                  {capability.id.includes('imported') && (
                                    <Badge variant="outline" className="text-xs text-blue-600 border-blue-600">
                                      Imported
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground">{capability.description}</div>
                              </div>
                            </button>
                          </div>
                          <div className="flex items-center space-x-2">
                            {capability.isSelected && capability.requirementCount > 0 && (
                              <Badge variant="outline" className="text-blue-600 border-blue-600 text-xs">
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
              Add Capability to {domains.find(d => d.id === selectedDomainForCapability)?.name || 'Domain'}
            </DialogTitle>
          </DialogHeader>
          <AddCapabilityForm 
            onAdd={addCapability} 
            referenceCapabilities={referenceCapabilities.filter(cap => {
              const selectedDomain = domains.find(d => d.id === selectedDomainForCapability);
              return cap.domain_id === selectedDomain?.referenceDomainId;
            })}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Add Domain Form Component
function AddDomainForm({ 
  onAdd, 
  referenceDomains 
}: { 
  onAdd: (data: { name: string; description: string; referenceDomainId?: string }) => void;
  referenceDomains: TMFReferenceDomain[];
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
        referenceDomainId: selectedReference === 'custom' ? undefined : selectedReference
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
  referenceCapabilities 
}: { 
  onAdd: (data: { name: string; description: string; referenceCapabilityId?: string }) => void;
  referenceCapabilities: TMFReferenceCapability[];
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
        referenceCapabilityId: selectedReference === 'custom' ? undefined : selectedReference
      });
      setName('');
      setDescription('');
      setSelectedReference('custom');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="reference-capability">Reference Capability (Optional)</Label>
        <Select value={selectedReference} onValueChange={setSelectedReference}>
          <SelectTrigger>
            <SelectValue placeholder="Select a reference capability" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="custom">Custom Capability</SelectItem>
            {referenceCapabilities.map((capability) => (
              <SelectItem key={capability.id} value={capability.id}>
                {capability.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="capability-name">Capability Name</Label>
        <Input
          id="capability-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter capability name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="capability-description">Description</Label>
        <Textarea
          id="capability-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter capability description"
          required
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit">Add Capability</Button>
      </div>
    </form>
  );
}
