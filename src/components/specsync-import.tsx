'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Upload, FileSpreadsheet, X, CheckCircle, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

export interface SpecSyncItem {
  rephrasedRequirementId: string;
  sourceRequirementId: string;
  domain: string;
  vertical: string;
  functionName: string;
  afLevel2: string;
  capability: string;
  referenceCapability: string;
  usecase1: string; // New field for use case identification
}

export interface SpecSyncState {
  fileName: string;
  importedAt: number;
  includeInEstimates: boolean;
  counts: {
    totalRequirements: number;
    domains: Record<string, number>;
    useCases: number; // Number of unique use cases
  };
  items: SpecSyncItem[];
  selectedCapabilityIds: string[];
}

interface SpecSyncImportProps {
  onImport: (state: SpecSyncState) => void;
  onClear: () => void;
  currentState: SpecSyncState | null;
}

export function SpecSyncImport({ onImport, onClear, currentState }: SpecSyncImportProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      return {
        rephrasedRequirementId: row[headerMap.rephrasedRequirementId] || '',
        sourceRequirementId: row[headerMap.sourceRequirementId] || '',
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
    
    return json.map((r: any) => {
      const fn = r['Rephrased Function Name'] || r['Function Name'] || r['Function'] || '';
      const af2 = r['Rephrased AF Lev.2'] || r['Rephrased AF Lev. 2'] || r['AF Lev.2'] || r['AF Level 2'] || r['Architecture Framework Level 2'] || '';
      const rc = r['Reference Capability'] || r['Capability'] || '';
      
      return {
        rephrasedRequirementId: r['Rephrased Requirement ID'] || r['RephrasedRequirementId'] || r['RequirementId'] || '',
        sourceRequirementId: r['Source Requirement ID'] || r['SourceRequirementId'] || '',
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
            
            {/* Requirements Preview Table */}
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Requirements Preview (First 10)</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-muted/70">
                      <th className="border border-muted-foreground/20 px-2 py-1 text-left">ID</th>
                      <th className="border border-muted-foreground/20 px-2 py-1 text-left">Requirement</th>
                      <th className="border border-muted-foreground/20 px-2 py-1 text-left">Domain</th>
                      <th className="border border-muted-foreground/20 px-2 py-1 text-left">Capability</th>
                      <th className="border border-muted-foreground/20 px-2 py-1 text-left">Use Case</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentState.items.slice(0, 10).map((item, index) => (
                      <tr key={index} className="hover:bg-muted/30">
                        <td className="border border-muted-foreground/20 px-2 py-1 font-mono text-xs">
                          {item.rephrasedRequirementId || item.sourceRequirementId || `R${index + 1}`}
                        </td>
                        <td className="border border-muted-foreground/20 px-2 py-1 max-w-xs truncate">
                          {item.functionName || item.afLevel2 || 'N/A'}
                        </td>
                        <td className="border border-muted-foreground/20 px-2 py-1">
                          {item.domain || 'Unspecified'}
                        </td>
                        <td className="border border-muted-foreground/20 px-2 py-1 max-w-xs truncate">
                          {item.capability || item.afLevel2 || 'N/A'}
                        </td>
                        <td className="border border-muted-foreground/20 px-2 py-1 max-w-xs truncate">
                          {item.usecase1 || 'N/A'}
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
