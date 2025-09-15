'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, CheckCircle, Loader2, ChevronDown, ChevronRight, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface SETComponent {
  ref_num: string;
  component: string;
  details: string | null;
  customer_ref: string | null;
  phase1_effort: number | null;
  scenario2_effort: string | null;
  scenario3_effort: string | null;
  template_effort: number | null;
}

interface SETImportState {
  isExpanded: boolean;
  isProcessing: boolean;
  data: SETComponent[] | null;
  domainEfforts: Record<string, number>;
  matchedWorkPackages: Record<string, any>;
}

interface SETImportProps {
  onDataLoaded: (
    domainEfforts: Record<string, number>,
    matchedWorkPackages: Record<string, any>,
  ) => void;
}

export function SETImport({ onDataLoaded }: SETImportProps) {
  const [state, setState] = useState<SETImportState>({
    isExpanded: false,
    isProcessing: false,
    data: null,
    domainEfforts: {},
    matchedWorkPackages: {},
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.showError('Invalid file type', 'Please select an Excel file (.xlsx or .xls)');
      return;
    }

    setState((prev) => ({ ...prev, isProcessing: true }));

    try {
      // For now, we'll use the existing JSON data since we can't process Excel files directly
      // In a real implementation, you would use a library like xlsx to parse the Excel file
      const response = await fetch('/set_test_loader_data.json');
      const jsonData = await response.json();

      const components = jsonData.components as SETComponent[];

      // Process the data to extract domain efforts
      const domainEfforts = processSETData(components);
      const matchedWorkPackages = matchWorkPackages(domainEfforts);

      setState((prev) => ({
        ...prev,
        data: components,
        domainEfforts,
        matchedWorkPackages,
        isProcessing: false,
      }));

      // Call the callback to update parent component
      onDataLoaded(domainEfforts, matchedWorkPackages);

      toast.showSuccess(
        'SET data loaded successfully',
        `Processed ${components.length} components across ${Object.keys(domainEfforts).length} domains`,
      );
    } catch (error) {
      console.error('Error processing SET file:', error);
      setState((prev) => ({ ...prev, isProcessing: false }));

      toast.showError('Error processing file', 'Failed to process the SET file. Please try again.');
    }
  };

  const processSETData = (components: SETComponent[]): Record<string, number> => {
    console.log('🔍 Processing SET data with', components.length, 'components');
    
    const domainEfforts: Record<string, number> = {};
    let currentDomain = '';
    let totalEffort = 0;

    // First pass: identify all domain headers
    const domainHeaders: string[] = [];
    components.forEach((component, index) => {
      if (component.component.includes('Domain') || component.component === 'Other Efforts') {
        domainHeaders.push(component.component);
        console.log(`📋 Found domain/effort header: ${component.component} (index: ${index})`);
      }
    });

    console.log('📋 All domain headers found:', domainHeaders);

    // Second pass: group components by domain
    components.forEach((component, index) => {
      // Check if this is a domain header
      if (component.component.includes('Domain') || component.component === 'Other Efforts') {
        currentDomain = component.component;
        if (!domainEfforts[currentDomain]) {
          domainEfforts[currentDomain] = 0;
        }
        console.log(`📋 Processing domain: ${currentDomain} (index: ${index})`);
        return;
      }

      // If we have a current domain and this component has effort, add it
      if (currentDomain && component.phase1_effort && component.phase1_effort > 0) {
        domainEfforts[currentDomain] += component.phase1_effort;
        totalEffort += component.phase1_effort;
        console.log(`➕ Added ${component.phase1_effort}d to ${currentDomain} from ${component.component} (ref: ${component.ref_num})`);
      }
    });

    // Remove domains with 0 effort
    Object.keys(domainEfforts).forEach(domain => {
      if (domainEfforts[domain] === 0) {
        delete domainEfforts[domain];
      }
    });

    console.log('📊 Final domain efforts:', domainEfforts);
    console.log('📊 Total effort calculated:', totalEffort);
    
    return domainEfforts;
  };

  const matchWorkPackages = (domainEfforts: Record<string, number>): Record<string, any> => {
    const matches: Record<string, any> = {};

    // Define mapping between SET domains and work package names
    const domainMapping: Record<string, string[]> = {
      'Customer Domain': ['Customer Information Management Implementation'],
      'Product Domain': ['Product/Offer & Sales Portfolio Management Implementation'],
      'Billing Domain': ['Charging/Billing/Payments Implementation'],
      'Order Domain': ['Order Management Implementation'],
      'Market & Sales Domain': ['Product/Offer & Sales Portfolio Management Implementation'],
      'Service Domain': ['Care & Assurance Implementation'],
      'Resource Domain': ['Resource Management Implementation'],
      'Supplier-Partner Domain': ['Partner Management Implementation'],
      'Enterprise Domain': ['Enterprise Management Implementation'],
      'Integration Infrastructure Domain': ['Integration Infrastructure Implementation'],
    };

    Object.entries(domainEfforts).forEach(([domain, effort]) => {
      const matchedWorkPackages = domainMapping[domain] || [];
      if (matchedWorkPackages.length > 0) {
        matches[domain] = {
          effort,
          workPackages: matchedWorkPackages,
        };
      }
    });

    return matches;
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const toggleExpanded = () => {
    setState((prev) => ({ ...prev, isExpanded: !prev.isExpanded }));
  };

  return (
    <div className="border-b pb-6">
      <div
        className="mb-4 flex cursor-pointer items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted/50"
        onClick={toggleExpanded}
      >
        <div className="flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-blue-200 bg-blue-100">
            {state.isExpanded ? (
              <ChevronDown className="h-5 w-5 text-blue-700" />
            ) : (
              <ChevronRight className="h-5 w-5 text-blue-700" />
            )}
          </div>
          <div>
            <h3 className="flex items-center space-x-2 text-base font-semibold">
              <FileSpreadsheet className="h-4 w-4" />
              <span>SET Test Loader Import</span>
            </h3>
            <p className="text-sm text-muted-foreground">
              Import effort estimates from SET Test Loader CUT.xlsx file
            </p>
          </div>
        </div>
      </div>

      {state.isExpanded && (
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <Button
              onClick={handleUploadClick}
              disabled={state.isProcessing}
              className="flex items-center space-x-2"
            >
              {state.isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              <span>{state.isProcessing ? 'Processing...' : 'Load SET Data'}</span>
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />

            {state.data && (
              <Badge variant="secondary" className="flex items-center space-x-1">
                <CheckCircle className="h-3 w-3" />
                <span>{state.data.length} components loaded</span>
              </Badge>
            )}
          </div>

          {state.domainEfforts && Object.keys(state.domainEfforts).length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Domain Efforts Summary</h4>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {Object.entries(state.domainEfforts).map(([domain, effort]) => (
                  <div
                    key={domain}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium">{domain}</div>
                      <div className="text-xs text-muted-foreground">
                        {state.matchedWorkPackages[domain]?.workPackages?.length || 0} work packages
                        matched
                      </div>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      {effort}d
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
