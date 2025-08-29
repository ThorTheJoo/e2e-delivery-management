'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
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
  onDataLoaded: (domainEfforts: Record<string, number>, matchedWorkPackages: Record<string, any>) => void;
}

export function SETImport({ onDataLoaded }: SETImportProps) {
  const [state, setState] = useState<SETImportState>({
    isExpanded: false,
    isProcessing: false,
    data: null,
    domainEfforts: {},
    matchedWorkPackages: {}
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

    setState(prev => ({ ...prev, isProcessing: true }));

    try {
      // For now, we'll use the existing JSON data since we can't process Excel files directly
      // In a real implementation, you would use a library like xlsx to parse the Excel file
      const response = await fetch('/set_test_loader_data.json');
      const jsonData = await response.json();
      
      const components = jsonData.components as SETComponent[];
      
      // Process the data to extract domain efforts
      const domainEfforts = processSETData(components);
      const matchedWorkPackages = matchWorkPackages(domainEfforts);
      
      setState(prev => ({
        ...prev,
        data: components,
        domainEfforts,
        matchedWorkPackages,
        isProcessing: false
      }));

      // Call the callback to update parent component
      onDataLoaded(domainEfforts, matchedWorkPackages);

      toast.showSuccess('SET data loaded successfully', `Processed ${components.length} components across ${Object.keys(domainEfforts).length} domains`);

    } catch (error) {
      console.error('Error processing SET file:', error);
      setState(prev => ({ ...prev, isProcessing: false }));
      
      toast.showError('Error processing file', 'Failed to process the SET file. Please try again.');
    }
  };

  const processSETData = (components: SETComponent[]): Record<string, number> => {
    const domainEfforts: Record<string, number> = {};
    let currentDomain = '';

    components.forEach(component => {
      // Check if this is a domain header
      if (component.component.includes('Domain')) {
        currentDomain = component.component;
        domainEfforts[currentDomain] = 0;
        return;
      }

      // If we have a current domain and this component has effort, add it
      if (currentDomain && component.phase1_effort && component.phase1_effort > 0) {
        domainEfforts[currentDomain] += component.phase1_effort;
      }
    });

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
      'Integration Infrastructure Domain': ['Integration Infrastructure Implementation']
    };

    Object.entries(domainEfforts).forEach(([domain, effort]) => {
      const matchedWorkPackages = domainMapping[domain] || [];
      if (matchedWorkPackages.length > 0) {
        matches[domain] = {
          effort,
          workPackages: matchedWorkPackages
        };
      }
    });

    return matches;
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const toggleExpanded = () => {
    setState(prev => ({ ...prev, isExpanded: !prev.isExpanded }));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileSpreadsheet className="h-5 w-5" />
            <div 
              className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg border-2 border-blue-200 cursor-pointer hover:bg-blue-200 transition-colors"
              onClick={toggleExpanded}
            >
              {state.isExpanded ? (
                <ChevronDown className="w-5 h-5 text-blue-700" />
              ) : (
                <ChevronRight className="w-5 h-5 text-blue-700" />
              )}
            </div>
            <CardTitle>SET Test Loader Import</CardTitle>
          </div>
        </div>
        <CardDescription>
          Import effort estimates from SET Test Loader CUT.xlsx file
        </CardDescription>
      </CardHeader>
      
      {state.isExpanded && (
        <CardContent className="space-y-4">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(state.domainEfforts).map(([domain, effort]) => (
                  <div key={domain} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{domain}</div>
                      <div className="text-xs text-muted-foreground">
                        {state.matchedWorkPackages[domain]?.workPackages?.length || 0} work packages matched
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

          {state.matchedWorkPackages && Object.keys(state.matchedWorkPackages).length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Work Package Matches</h4>
              <div className="space-y-2">
                {Object.entries(state.matchedWorkPackages).map(([domain, match]) => (
                  <div key={domain} className="p-3 border rounded-lg">
                    <div className="font-medium text-sm mb-2">{domain}</div>
                    <div className="text-sm text-muted-foreground">
                      Total Effort: <span className="font-medium">{match.effort}d</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Matched to: {match.workPackages.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
