'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Plus,
  CheckCircle,
  Circle,
  Search,
  AlertCircle,
  Info,
} from 'lucide-react';
import { TMFFunction, TMFDomain } from '@/types';
import { analyzeTMFReferenceGaps } from '@/lib/specsync-tmf-utils';

interface MissingTMFDomain {
  domain: TMFDomain;
  functionCount: number;
  functions: TMFFunction[];
}

interface MissingTMFFunction {
  function: TMFFunction;
  domain: string;
}

interface EnhancedAddCustomDomainDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDomains: any[];
  onAddMissingDomain: (domain: MissingTMFDomain) => void;
  onAddMissingFunctions: (functions: MissingTMFFunction[]) => void;
  onAddCustomDomain: (data: { name: string; description: string; referenceDomainId?: string }) => void;
  referenceDomains: any[];
}

export function EnhancedAddCustomDomainDialog({
  open,
  onOpenChange,
  currentDomains,
  onAddMissingDomain,
  onAddMissingFunctions,
  onAddCustomDomain,
  referenceDomains,
}: EnhancedAddCustomDomainDialogProps) {
  const [missingDomains, setMissingDomains] = useState<MissingTMFDomain[]>([]);
  const [missingFunctions, setMissingFunctions] = useState<MissingTMFFunction[]>([]);
  const [selectedFunctions, setSelectedFunctions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('missing-domains');

  // Analyze missing items when dialog opens
  useEffect(() => {
    if (open) {
      analyzeMissingItems();
    }
  }, [open, currentDomains]);

  const analyzeMissingItems = async () => {
    setLoading(true);
    try {
      const gaps = await analyzeTMFReferenceGaps(currentDomains);
      setMissingDomains(gaps.missingDomains);
      setMissingFunctions(gaps.missingFunctions);
    } catch (error) {
      console.error('Error analyzing missing TMF reference items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMissingDomain = (domain: MissingTMFDomain) => {
    onAddMissingDomain(domain);
    // Remove from missing domains list
    setMissingDomains(prev => prev.filter(d => d.domain.id !== domain.domain.id));
  };

  const handleAddSelectedFunctions = () => {
    const selected = missingFunctions.filter(f => selectedFunctions.has(f.function.id));
    onAddMissingFunctions(selected);
    // Remove selected functions from missing list
    setMissingFunctions(prev => prev.filter(f => !selectedFunctions.has(f.function.id)));
    setSelectedFunctions(new Set());
  };

  const handleSelectAllFunctions = () => {
    if (selectedFunctions.size === missingFunctions.length) {
      setSelectedFunctions(new Set());
    } else {
      setSelectedFunctions(new Set(missingFunctions.map(f => f.function.id)));
    }
  };

  const filteredMissingFunctions = missingFunctions.filter(f =>
    f.function.function_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Custom Domain & Functions
            {missingDomains.length + missingFunctions.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {missingDomains.length + missingFunctions.length} missing items
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="missing-domains">
              Missing Domains ({missingDomains.length})
            </TabsTrigger>
            <TabsTrigger value="missing-functions">
              Missing Functions ({missingFunctions.length})
            </TabsTrigger>
            <TabsTrigger value="manual-add">
              Manual Add
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="missing-domains" className="h-full overflow-hidden">
              <div className="h-full flex flex-col">
                <div className="p-4 border-b">
                  <p className="text-sm text-muted-foreground">
                    TMF domains from reference data that aren't in your current overview
                  </p>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4">
                  {loading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : missingDomains.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-muted-foreground">
                      <Info className="h-5 w-5 mr-2" />
                      No missing domains found
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {missingDomains.map((domain) => (
                        <Card key={domain.domain.id} className="hover:shadow-md transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-lg">{domain.domain.name}</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                  {domain.functionCount} TMF functions available
                                </p>
                              </div>
                              <Button
                                onClick={() => handleAddMissingDomain(domain)}
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Domain + Functions
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="text-xs text-muted-foreground">
                              <strong>Functions:</strong> {domain.functions.slice(0, 5).map(f => f.function_name).join(', ')}
                              {domain.functions.length > 5 && ` +${domain.functions.length - 5} more`}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="missing-functions" className="h-full overflow-hidden">
              <div className="h-full flex flex-col">
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-muted-foreground">
                      TMF functions from reference data that aren't in your overview
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAllFunctions}
                      >
                        {selectedFunctions.size === missingFunctions.length ? 'Deselect All' : 'Select All'}
                      </Button>
                      <Button
                        onClick={handleAddSelectedFunctions}
                        disabled={selectedFunctions.size === 0}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Add Selected ({selectedFunctions.size})
                      </Button>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search functions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4">
                  {loading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : filteredMissingFunctions.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-muted-foreground">
                      <Info className="h-5 w-5 mr-2" />
                      {searchTerm ? 'No functions match your search' : 'No missing functions found'}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredMissingFunctions.map((item) => (
                        <Card key={item.function.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-3">
                              <Checkbox
                                checked={selectedFunctions.has(item.function.id)}
                                onCheckedChange={(checked) => {
                                  const newSelected = new Set(selectedFunctions);
                                  if (checked) {
                                    newSelected.add(item.function.id);
                                  } else {
                                    newSelected.delete(item.function.id);
                                  }
                                  setSelectedFunctions(newSelected);
                                }}
                              />
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium truncate">{item.function.function_name}</h4>
                                  <Badge variant="outline" className="text-xs text-blue-600 bg-blue-50">
                                    TMF Function
                                  </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  <span className="font-medium">{item.function.domain_name}</span>
                                  {item.function.vertical && (
                                    <span> • {item.function.vertical}</span>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {item.function.af_level_1 && (
                                    <span>AF Level 1: {item.function.af_level_1}</span>
                                  )}
                                  {item.function.af_level_2 && (
                                    <span> • AF Level 2: {item.function.af_level_2}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="manual-add" className="h-full overflow-hidden">
              <div className="h-full overflow-y-auto p-4">
                <ManualAddDomainForm
                  onAdd={onAddCustomDomain}
                  referenceDomains={referenceDomains}
                />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// Manual Add Domain Form Component (existing functionality)
function ManualAddDomainForm({
  onAdd,
  referenceDomains,
}: {
  onAdd: (data: { name: string; description: string; referenceDomainId?: string }) => void;
  referenceDomains: any[];
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
        <label htmlFor="reference-domain" className="text-sm font-medium">
          Reference Domain (Optional)
        </label>
        <select
          id="reference-domain"
          value={selectedReference}
          onChange={(e) => setSelectedReference(e.target.value)}
          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="custom">Custom Domain</option>
          {referenceDomains.map((domain) => (
            <option key={domain.id} value={domain.id}>
              {domain.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="domain-name" className="text-sm font-medium">
          Domain Name
        </label>
        <input
          id="domain-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter domain name"
          required
          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="domain-description" className="text-sm font-medium">
          Description
        </label>
        <textarea
          id="domain-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter domain description"
          required
          rows={3}
          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
          Add Domain
        </Button>
      </div>
    </form>
  );
}
