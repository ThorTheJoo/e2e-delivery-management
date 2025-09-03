'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';

import { Badge } from '@/components/ui/badge';
import { Upload, X, CheckCircle, AlertCircle, Edit, Save, X as Cancel } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useEffect } from 'react';

import { SpecSyncItem, SpecSyncState } from '@/types';

interface SpecSyncImportProps {
  onImport: (state: SpecSyncState) => void;
  onClear: () => void;
  currentState: SpecSyncState | null;
}

export function SpecSyncImport({ onImport, onClear, currentState }: SpecSyncImportProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<{ index: number; field: keyof SpecSyncItem } | null>(null);
  const [editedItems, setEditedItems] = useState<SpecSyncItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize edited items when currentState changes
  useEffect(() => {
    if (currentState) {
      setEditedItems([...currentState.items]);
    }
  }, [currentState]);

  const parseCSVToSpecSyncItems = (text: string): SpecSyncItem[] => {
    const lines = text.split(/\r?\n/).filter(l => l.trim().length);
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    
    // Header mapping with flexible naming
    const headerMap = {
      rephrasedRequirementId: headers.find(h => /rephrased.*requirement.*id/i.test(h)) || 'Rephrased Requirement ID',
      sourceRequirementId: headers.find(h => /source.*requirement.*id/i.test(h)) || 'Source Requirement ID',
      domain: headers.find(h => /rephrased.*domain/i.test(h)) || 'Rephrased Domain',
      vertical: headers.find(h => /rephrased.*vertical/i.test(h)) || 'Rephrased Vertical',
      functionName: headers.find(h => /rephrased.*function.*name/i.test(h)) || 'Rephrased Function Name',
      afLevel2: headers.find(h => /rephrased.*af.*lev.*2/i.test(h)) || 'Rephrased AF Lev.2',
      capability: headers.find(h => /reference.*capability/i.test(h)) || 'Reference Capability',
      referenceCapability: headers.find(h => /reference.*capability/i.test(h)) || 'Reference Capability',
      usecase1: headers.find(h => /usecase.*1/i.test(h)) || 'Usecase 1'
    };

    return lines.slice(1).map((line, index) => {
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      return {
        id: `imported-${index + 1}`,
        requirementId: row[headerMap.sourceRequirementId] || `REQ-${index + 1}`,
        rephrasedRequirementId: row[headerMap.rephrasedRequirementId] || '',
        domain: row[headerMap.domain] || '',
        vertical: row[headerMap.vertical] || '',
        functionName: row[headerMap.functionName] || '',
        afLevel2: row[headerMap.afLevel2] || '',
        capability: row[headerMap.afLevel2] || '', // Use AF Level 2 as capability
        referenceCapability: row[headerMap.referenceCapability] || '',
        usecase1: row[headerMap.usecase1] || '' // Add usecase1 parsing
      };
    });
  };

  const parseExcelToSpecSyncItems = (data: ArrayBuffer): SpecSyncItem[] => {
    const workbook = XLSX.read(data, { type: 'array' });
    
    // Prefer a sheet that looks like the rephrased atomic requirements
    const preferred = (workbook.SheetNames || []).find(n => 
      /rephrased|atomic/i.test(String(n))
    ) || workbook.SheetNames[0];
    
    const ws = workbook.Sheets[preferred];
    const json = XLSX.utils.sheet_to_json(ws, { defval: '' });
    
    return json.map((r: Record<string, unknown>, index: number) => {
      const fn = r['Rephrased Function Name'] || r['Function Name'] || r['Function'] || '';
      const af2 = r['Rephrased AF Lev.2'] || r['Rephrased AF Lev. 2'] || r['AF Lev.2'] || r['AF Level 2'] || r['Architecture Framework Level 2'] || '';
      const rc = r['Reference Capability'] || r['Capability'] || '';
      
      return {
        id: `excel-${index + 1}`,
        requirementId: r['Source Requirement ID'] || r['SourceRequirementId'] || `REQ-${index + 1}`,
        rephrasedRequirementId: r['Rephrased Requirement ID'] || r['RephrasedRequirementId'] || r['RequirementId'] || '',
        domain: r['Rephrased Domain'] || r['Domain'] || '',
        vertical: r['Rephrased Vertical'] || r['Vertical'] || '',
        functionName: fn,
        afLevel2: af2,
        capability: af2, // STRICT: only AF Level 2
        referenceCapability: rc,
        usecase1: r['Usecase 1'] || r['Usecase 1'] || '' // Add usecase1 parsing
      };
    });
  };

  const buildSpecSyncState = (items: SpecSyncItem[], fileName: string): SpecSyncState => {
    const counts = { 
      totalRequirements: items.length, 
      domains: {} as Record<string, number>,
      useCases: 0
    };
    
    // Track unique use cases
    const uniqueUseCases = new Set<string>();
    
    items.forEach(item => {
      const domain = (item.domain || '').trim() || 'Unspecified';
      counts.domains[domain] = (counts.domains[domain] || 0) + 1;
      
      // Add use case to unique set if it has a value
      if (item.usecase1 && item.usecase1.trim()) {
        uniqueUseCases.add(item.usecase1.trim());
      }
    });
    
    counts.useCases = uniqueUseCases.size;
    
    return {
      fileName: fileName || 'SpecSync Import',
      importedAt: Date.now(),
      includeInEstimates: true,
      counts,
      items,
      selectedCapabilityIds: []
    };
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('File selected:', file.name, file.size, file.type);
    setIsImporting(true);
    setError(null);

    try {
      let items: SpecSyncItem[] = [];

      if (file.name.match(/\.xlsx?$/i)) {
        // Excel file
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            items = parseExcelToSpecSyncItems(data.buffer);
            const state = buildSpecSyncState(items, file.name);
            console.log('Excel import successful:', state);
            onImport(state);
          } catch (err) {
            setError(`Failed to parse Excel file: ${err instanceof Error ? err.message : 'Unknown error'}`);
          } finally {
            setIsImporting(false);
          }
        };
        reader.readAsArrayBuffer(file);
      } else if (file.name.match(/\.csv$/i)) {
        // CSV file
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const text = String(e.target?.result || '');
            items = parseCSVToSpecSyncItems(text);
            const state = buildSpecSyncState(items, file.name);
            console.log('CSV import successful:', state);
            onImport(state);
          } catch (err) {
            setError(`Failed to parse CSV file: ${err instanceof Error ? err.message : 'Unknown error'}`);
          } finally {
            setIsImporting(false);
          }
        };
        reader.readAsText(file);
      } else {
        setError('Unsupported file format. Please use .xlsx, .xls, or .csv files.');
        setIsImporting(false);
      }
    } catch (err) {
      setError(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsImporting(false);
    }
  };

  const handleClear = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClear();
    setError(null);
    setEditingItem(null);
    setEditedItems([]);
  };

  const handleEditItem = (index: number, field: keyof SpecSyncItem) => {
    setEditingItem({ index, field });
  };

  const handleSaveEdit = (index: number, field: keyof SpecSyncItem, value: string) => {
    const newItems = [...editedItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setEditedItems(newItems);
    setEditingItem(null);
    
    // Update the parent state with edited items
    if (currentState) {
      const updatedState = {
        ...currentState,
        items: newItems,
        counts: buildSpecSyncState(newItems, currentState.fileName).counts
      };
      onImport(updatedState);
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
  };

  const getDomainRequirementCount = (domain: string) => {
    if (!currentState) return 0;
    return currentState.counts.domains[domain] || 0;
  };

  const getDomainUseCaseCount = (domain: string) => {
    if (!currentState) return 0;
    const domainItems = currentState.items.filter(item => 
      (item.domain || '').trim() === domain.trim()
    );
    const uniqueUseCases = new Set<string>();
    domainItems.forEach(item => {
      if (item.usecase1 && item.usecase1.trim()) {
        uniqueUseCases.add(item.usecase1.trim());
      }
    });
    return uniqueUseCases.size;
  };

  return (
    <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileImport}
            className="hidden"
            id="specSyncFile"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="flex items-center space-x-2"
          >
            <Upload className="h-4 w-4" />
            <span>{isImporting ? 'Importing...' : 'Select File'}</span>
          </Button>
          
          {currentState && (
            <Button
              variant="outline"
              onClick={handleClear}
              className="flex items-center space-x-2"
            >
              <X className="h-4 w-4" />
              <span>Clear</span>
            </Button>
          )}
        </div>

        {error && (
          <div className="flex items-center space-x-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-destructive text-sm">{error}</span>
          </div>
        )}

        {currentState && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-600">
                {currentState.fileName} imported successfully
              </span>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <div>Total Requirements: {currentState.counts.totalRequirements}</div>
              <div>Domains: {Object.keys(currentState.counts.domains).length}</div>
              <div>Use Cases: {currentState.counts.useCases}</div>
              <div>Imported: {new Date(currentState.importedAt).toLocaleString()}</div>
            </div>
            
            {/* Domain Summary with Badge Counts */}
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Domain Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(currentState.counts.domains).map(([domain, count]) => (
                  <div key={domain} className="p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-sm text-gray-900">{domain}</h5>
                      <div className="flex space-x-1">
                        <Badge variant="secondary" className="text-xs">
                          {count} reqs
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {getDomainUseCaseCount(domain)} use cases
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Requirements Preview Table - Now Modifiable */}
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Requirements Preview (First 10) - Click to Edit</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-muted/70">
                      <th className="border border-muted-foreground/20 px-2 py-1 text-left">ID</th>
                      <th className="border border-muted-foreground/20 px-2 py-1 text-left">Requirement</th>
                      <th className="border border-muted-foreground/20 px-2 py-1 text-left">Domain</th>
                      <th className="border border-muted-foreground/20 px-2 py-1 text-left">Capability</th>
                      <th className="border border-muted-foreground/20 px-2 py-1 text-left">Use Case</th>
                      <th className="border border-muted-foreground/20 px-2 py-1 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editedItems.slice(0, 10).map((item, index) => (
                      <tr key={index} className="hover:bg-muted/30">
                        <td className="border border-muted-foreground/20 px-2 py-1 font-mono text-xs">
                          {editingItem?.index === index && editingItem?.field === 'rephrasedRequirementId' ? (
                            <div className="flex items-center space-x-1">
                              <input
                                type="text"
                                value={item.rephrasedRequirementId}
                                onChange={(e) => {
                                  const newItems = [...editedItems];
                                  newItems[index] = { ...newItems[index], rephrasedRequirementId: e.target.value };
                                  setEditedItems(newItems);
                                }}
                                className="w-full px-1 py-0.5 text-xs border rounded"
                                autoFocus
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-4 w-4 p-0"
                                onClick={() => handleSaveEdit(index, 'rephrasedRequirementId', item.rephrasedRequirementId)}
                              >
                                <Save className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-4 w-4 p-0"
                                onClick={handleCancelEdit}
                              >
                                <Cancel className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <span>{item.rephrasedRequirementId || item.requirementId || `R${index + 1}`}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-4 w-4 p-0"
                                onClick={() => handleEditItem(index, 'rephrasedRequirementId')}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </td>
                        <td className="border border-muted-foreground/20 px-2 py-1 max-w-xs truncate">
                          {editingItem?.index === index && editingItem?.field === 'functionName' ? (
                            <div className="flex items-center space-x-1">
                              <input
                                type="text"
                                value={item.functionName}
                                onChange={(e) => {
                                  const newItems = [...editedItems];
                                  newItems[index] = { ...newItems[index], functionName: e.target.value };
                                  setEditedItems(newItems);
                                }}
                                className="w-full px-1 py-0.5 text-xs border rounded"
                                autoFocus
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-4 w-4 p-0"
                                onClick={() => handleSaveEdit(index, 'functionName', item.functionName)}
                              >
                                <Save className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-4 w-4 p-0"
                                onClick={handleCancelEdit}
                              >
                                <Cancel className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <span>{item.functionName || item.afLevel2 || 'N/A'}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-4 w-4 p-0"
                                onClick={() => handleEditItem(index, 'functionName')}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </td>
                        <td className="border border-muted-foreground/20 px-2 py-1">
                          {editingItem?.index === index && editingItem?.field === 'domain' ? (
                            <div className="flex items-center space-x-1">
                              <input
                                type="text"
                                value={item.domain}
                                onChange={(e) => {
                                  const newItems = [...editedItems];
                                  newItems[index] = { ...newItems[index], domain: e.target.value };
                                  setEditedItems(newItems);
                                }}
                                className="w-full px-1 py-0.5 text-xs border rounded"
                                autoFocus
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-4 w-4 p-0"
                                onClick={() => handleSaveEdit(index, 'domain', item.domain)}
                              >
                                <Save className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-4 w-4 p-0"
                                onClick={handleCancelEdit}
                              >
                                <Cancel className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <span>{item.domain || 'Unspecified'}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-4 w-4 p-0"
                                onClick={() => handleEditItem(index, 'domain')}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </td>
                        <td className="border border-muted-foreground/20 px-2 py-1 max-w-xs truncate">
                          {editingItem?.index === index && editingItem?.field === 'capability' ? (
                            <div className="flex items-center space-x-1">
                              <input
                                type="text"
                                value={item.capability}
                                onChange={(e) => {
                                  const newItems = [...editedItems];
                                  newItems[index] = { ...newItems[index], capability: e.target.value };
                                  setEditedItems(newItems);
                                }}
                                className="w-full px-1 py-0.5 text-xs border rounded"
                                autoFocus
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-4 w-4 p-0"
                                onClick={() => handleSaveEdit(index, 'capability', item.capability)}
                              >
                                <Save className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-4 w-4 p-0"
                                onClick={handleCancelEdit}
                              >
                                <Cancel className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <span>{item.capability || item.afLevel2 || 'N/A'}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-4 w-4 p-0"
                                onClick={() => handleEditItem(index, 'capability')}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </td>
                        <td className="border border-muted-foreground/20 px-2 py-1 max-w-xs truncate">
                          {editingItem?.index === index && editingItem?.field === 'usecase1' ? (
                            <div className="flex items-center space-x-1">
                              <input
                                type="text"
                                value={item.usecase1}
                                onChange={(e) => {
                                  const newItems = [...editedItems];
                                  newItems[index] = { ...newItems[index], usecase1: e.target.value };
                                  setEditedItems(newItems);
                                }}
                                className="w-full px-1 py-0.5 text-xs border rounded"
                                autoFocus
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-4 w-4 p-0"
                                onClick={() => handleSaveEdit(index, 'usecase1', item.usecase1)}
                              >
                                <Save className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-4 w-4 p-0"
                                onClick={handleCancelEdit}
                              >
                                <Cancel className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <span>{item.usecase1 || 'N/A'}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-4 w-4 p-0"
                                onClick={() => handleEditItem(index, 'usecase1')}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </td>
                        <td className="border border-muted-foreground/20 px-2 py-1 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <Badge variant="secondary" className="text-xs">
                              {getDomainRequirementCount(item.domain)} reqs
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {getDomainUseCaseCount(item.domain)} use cases
                            </Badge>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          Supported formats: CSV, Excel (.xlsx, .xls). Files should contain columns for Domain, Function Name, AF Level 2, and Reference Capability.
        </div>
      </div>
    );
}
