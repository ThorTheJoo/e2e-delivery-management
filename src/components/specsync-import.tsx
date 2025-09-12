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
  const [editingItem, setEditingItem] = useState<{
    index: number;
    field: keyof SpecSyncItem;
  } | null>(null);
  const [editedItems, setEditedItems] = useState<SpecSyncItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize edited items when currentState changes
  useEffect(() => {
    if (currentState) {
      setEditedItems([...currentState.items]);
    }
  }, [currentState]);

  const parseCSVToSpecSyncItems = (text: string): SpecSyncItem[] => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));

    // Header mapping with flexible naming - updated for new column structure
    const headerMap = {
      rephrasedRequirementId:
        headers.find((h) => /rephrased.*requirement.*id/i.test(h)) || 'Rephrased Requirement ID',
      sourceRequirementId:
        headers.find((h) => /source.*requirement.*id/i.test(h)) || 'Source Requirement ID',
      domain: headers.find((h) => /rephrased.*domain/i.test(h)) || 'Rephrased Domain',
      vertical: headers.find((h) => /rephrased.*vertical/i.test(h)) || 'Rephrased Vertical',
      functionName:
        headers.find((h) => /rephrased.*function.*name/i.test(h)) || 'Rephrased Function Name',
      afLevel2: headers.find((h) => /rephrased.*af.*lev.*2/i.test(h)) || 'Rephrased AF Lev.2',
      capability: headers.find((h) => /reference.*capability/i.test(h)) || 'Reference Capability',
      referenceCapability:
        headers.find((h) => /reference.*capability/i.test(h)) || 'Reference Capability',
      usecase1: headers.find((h) => /usecase.*1/i.test(h)) || 'Usecase 1',
    };
    
    console.log('🔍 [SpecSync Import] Headers found:', headers);
    console.log('📋 [SpecSync Import] Header mapping:', {
      rephrasedRequirementId: headerMap.rephrasedRequirementId,
      sourceRequirementId: headerMap.sourceRequirementId,
      functionName: headerMap.functionName
    });

    return lines.slice(1).map((line, index) => {
      const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      // Get rephrased function name with fallback to original requirement text
      const rephrasedFunctionName = row[headerMap.functionName] || 
        row[headerMap.sourceRequirementId] || 
        `REQ-${index + 1}`;

      const requirementId = row[headerMap.sourceRequirementId] || `REQ-${index + 1}`;
      console.log(`📋 [SpecSync Import] Row ${index + 1}: sourceRequirementId="${row[headerMap.sourceRequirementId]}", final requirementId="${requirementId}"`);
      
      return {
        id: `imported-${index + 1}`,
        requirementId: requirementId,
        rephrasedRequirementId: row[headerMap.rephrasedRequirementId] || '',
        domain: row[headerMap.domain] || '',
        vertical: row[headerMap.vertical] || '',
        functionName: rephrasedFunctionName,
        afLevel2: row[headerMap.afLevel2] || '',
        capability: row[headerMap.afLevel2] || '', // Use AF Level 2 as capability
        referenceCapability: row[headerMap.referenceCapability] || '',
        usecase1: row[headerMap.usecase1] || '', // Add usecase1 parsing
      };
    });
  };

  const parseExcelToSpecSyncItems = (data: ArrayBuffer): SpecSyncItem[] => {
    const workbook = XLSX.read(data, { type: 'array' });

    // Prefer a sheet that looks like the rephrased atomic requirements
    const preferred =
      (workbook.SheetNames || []).find((n) => /rephrased|atomic/i.test(String(n))) ||
      workbook.SheetNames[0];

    const ws = workbook.Sheets[preferred];
    const json = XLSX.utils.sheet_to_json(ws, { defval: '' });

    console.log('🔍 [SpecSync Excel Import] Available columns:', Object.keys(json[0] || {}));
    console.log('📋 [SpecSync Excel Import] First row sample:', json[0]);

    return json.map((r: any, index: number) => {
      const fn = r['Rephrased Function Name'] || r['Function Name'] || r['Function'] || '';
      const af2 =
        r['Rephrased AF Lev.2'] ||
        r['Rephrased AF Lev. 2'] ||
        r['AF Lev.2'] ||
        r['AF Level 2'] ||
        r['Architecture Framework Level 2'] ||
        '';
      const rc = r['Reference Capability'] || r['Capability'] || '';
      
      // Get rephrased function name with fallback to original requirement text
      const rephrasedFunctionName = fn || 
        r['Source Requirement ID'] || 
        r['SourceRequirementId'] || 
        `REQ-${index + 1}`;

      const requirementId = r['Source Requirement ID'] || r['SourceRequirementId'] || `REQ-${index + 1}`;
      console.log(`📋 [SpecSync Excel Import] Row ${index + 1}: Source Requirement ID="${r['Source Requirement ID']}", final requirementId="${requirementId}"`);
      
      return {
        id: `excel-${index + 1}`,
        requirementId: requirementId,
        rephrasedRequirementId:
          r['Rephrased Requirement ID'] || r['RephrasedRequirementId'] || r['RequirementId'] || '',
        domain: r['Rephrased Domain'] || r['Domain'] || '',
        vertical: r['Rephrased Vertical'] || r['Vertical'] || '',
        functionName: rephrasedFunctionName,
        afLevel2: af2,
        capability: af2, // STRICT: only AF Level 2
        referenceCapability: rc,
        usecase1: r['Usecase 1'] || r['Usecase 1'] || '', // Add usecase1 parsing
      };
    });
  };

  const buildSpecSyncState = (items: SpecSyncItem[], fileName: string): SpecSyncState => {
    const counts = {
      totalRequirements: items.length,
      domains: {} as Record<string, number>,
      useCases: 0,
    };

    // Track unique use cases
    const uniqueUseCases = new Set<string>();

    items.forEach((item) => {
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
      selectedCapabilityIds: [],
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
            setError(
              `Failed to parse Excel file: ${err instanceof Error ? err.message : 'Unknown error'}`,
            );
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
            setError(
              `Failed to parse CSV file: ${err instanceof Error ? err.message : 'Unknown error'}`,
            );
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
        counts: buildSpecSyncState(newItems, currentState.fileName).counts,
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
    const domainItems = currentState.items.filter(
      (item) => (item.domain || '').trim() === domain.trim(),
    );
    const uniqueUseCases = new Set<string>();
    domainItems.forEach((item) => {
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
          <Button variant="outline" onClick={handleClear} className="flex items-center space-x-2">
            <X className="h-4 w-4" />
            <span>Clear</span>
          </Button>
        )}
      </div>

      {error && (
        <div className="flex items-center space-x-2 rounded-md border border-destructive/20 bg-destructive/10 p-3">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span className="text-sm text-destructive">{error}</span>
        </div>
      )}

      {currentState && (
        <div className="rounded-lg bg-muted/50 p-4">
          <div className="mb-2 flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="font-medium text-green-600">
              {currentState.fileName} imported successfully
            </span>
          </div>
          <div className="space-y-1 text-sm text-muted-foreground">
            <div>Total Requirements: {currentState.counts.totalRequirements}</div>
            <div>Domains: {Object.keys(currentState.counts.domains).length}</div>
            <div>Use Cases: {currentState.counts.useCases}</div>
            <div>Imported: {new Date(currentState.importedAt).toLocaleString()}</div>
          </div>

          {/* Domain Summary with Badge Counts */}
          <div className="mt-4">
            <h4 className="mb-2 text-sm font-medium">Domain Summary</h4>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(currentState.counts.domains).map(([domain, count]) => (
                <div key={domain} className="rounded-lg border border-gray-200 bg-white p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <h5 className="text-sm font-medium text-gray-900">{domain}</h5>
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
            <h4 className="mb-2 text-sm font-medium">
              Requirements Preview (First 15) - Click to Edit
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-muted/70">
                    <th className="border border-muted-foreground/20 px-2 py-1 text-left">Requirement ID</th>
                    <th className="border border-muted-foreground/20 px-2 py-1 text-left">
                      Rephrased Function Name
                    </th>
                    <th className="border border-muted-foreground/20 px-2 py-1 text-left">
                      Domain
                    </th>
                    <th className="border border-muted-foreground/20 px-2 py-1 text-left">
                      Encompass Use Case - Beta
                    </th>
                    <th className="border border-muted-foreground/20 px-2 py-1 text-left">
                      Requirements by Domain
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {editedItems.slice(0, 15).map((item, index) => (
                    <tr key={index} className="hover:bg-muted/30">
                      {/* Requirement ID Column */}
                      <td className="border border-muted-foreground/20 px-2 py-1 font-mono text-xs">
                        {editingItem?.index === index &&
                        editingItem?.field === 'rephrasedRequirementId' ? (
                          <div className="flex items-center space-x-1">
                            <input
                              type="text"
                              value={item.rephrasedRequirementId}
                              onChange={(e) => {
                                const newItems = [...editedItems];
                                newItems[index] = {
                                  ...newItems[index],
                                  rephrasedRequirementId: e.target.value,
                                };
                                setEditedItems(newItems);
                              }}
                              className="w-full rounded border px-1 py-0.5 text-xs"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-4 w-4 p-0"
                              onClick={() =>
                                handleSaveEdit(
                                  index,
                                  'rephrasedRequirementId',
                                  item.rephrasedRequirementId,
                                )
                              }
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
                            <span>
                              {item.rephrasedRequirementId || item.requirementId || `R${index + 1}`}
                            </span>
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
                      {/* Rephrased Function Name Column */}
                      <td className="max-w-xs truncate border border-muted-foreground/20 px-2 py-1">
                        {editingItem?.index === index && editingItem?.field === 'functionName' ? (
                          <div className="flex items-center space-x-1">
                            <input
                              type="text"
                              value={item.functionName}
                              onChange={(e) => {
                                const newItems = [...editedItems];
                                newItems[index] = {
                                  ...newItems[index],
                                  functionName: e.target.value,
                                };
                                setEditedItems(newItems);
                              }}
                              className="w-full rounded border px-1 py-0.5 text-xs"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-4 w-4 p-0"
                              onClick={() =>
                                handleSaveEdit(index, 'functionName', item.functionName)
                              }
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
                            <span>{item.functionName || 'N/A'}</span>
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
                      {/* Domain Column */}
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
                              className="w-full rounded border px-1 py-0.5 text-xs"
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
                      {/* Use Case Column */}
                      <td className="max-w-xs truncate border border-muted-foreground/20 px-2 py-1">
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
                              className="w-full rounded border px-1 py-0.5 text-xs"
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
                      {/* Actions Column */}
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
        Supported formats: CSV, Excel (.xlsx, .xls). Files should contain columns for Rephrased Function Name,
        Domain, Encompass Use Case - Beta, and other requirement fields. The system will read the "Rephrased Function Name" column
        and fallback to the original requirement text if not available.
      </div>
    </div>
  );
}
