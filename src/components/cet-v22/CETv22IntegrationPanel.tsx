'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Settings, Play } from 'lucide-react';
import {
  CETv22AnalysisResult,
  CETv22Data,
  CETv22IntegrationMappings,
  CETv22IntegrationOptions,
} from '@/types';

interface CETv22IntegrationPanelProps {
  analysisResult: CETv22AnalysisResult;
  cetData: CETv22Data;
  onIntegrationComplete: (mappings: CETv22IntegrationMappings) => void;
  onError: (error: Error) => void;
}

export const CETv22IntegrationPanel: React.FC<CETv22IntegrationPanelProps> = ({
  analysisResult,
  cetData,
  onIntegrationComplete,
  onError,
}) => {
  const [integrationOptions, setIntegrationOptions] = useState<CETv22IntegrationOptions>({
    createWorkPackages: true,
    createMilestones: true,
    allocateResources: true,
    identifyRisks: true,
    updateExisting: false,
    createDraft: true,
    validateOnly: false,
  });

  const [isIntegrating, setIsIntegrating] = useState(false);

  const handleOptionChange = (option: keyof CETv22IntegrationOptions, value: boolean) => {
    setIntegrationOptions((prev) => ({
      ...prev,
      [option]: value,
    }));
  };

  const handleIntegration = async () => {
    try {
      setIsIntegrating(true);

      // Simulate integration process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Create mock integration mappings
      const mockMappings: CETv22IntegrationMappings = {
        toWorkPackages: analysisResult.products.map((product) => ({
          cetProduct: product.name,
          workPackageName: `${product.name} Implementation`,
          estimatedEffort: {
            businessAnalyst: Math.round(product.totalEffort * 0.15),
            solutionArchitect: Math.round(product.totalEffort * 0.2),
            developer: Math.round(product.totalEffort * 0.5),
            qaEngineer: Math.round(product.totalEffort * 0.15),
          },
          confidence: 'High',
          dependencies: [],
          milestones: [],
        })),
        toMilestones: analysisResult.phases.map((phase) => ({
          cetPhase: phase.phaseNumber,
          milestoneName: `Phase ${phase.phaseNumber} Completion`,
          estimatedDate: new Date().toISOString().split('T')[0],
          deliverables: phase.deliverables,
          dependencies: [],
        })),
        toResources: analysisResult.resources.roleBreakdown.map((role) => ({
          cetJobProfile: role.role,
          resourceRole: role.role,
          skillLevel: 'Intermediate',
          costCenter: 'Default',
          availability: 40,
        })),
        toRisks: analysisResult.risks.map((risk) => ({
          cetSource: risk.source,
          riskName: risk.riskName,
          probability: risk.probability as 'Low' | 'Medium' | 'High',
          impact: risk.impact as 'Low' | 'Medium' | 'High',
          mitigation: risk.mitigation,
        })),
        confidence: {
          overall: analysisResult.metadata.confidence,
          workPackages: 85,
          milestones: 90,
          resources: 80,
          risks: 75,
        },
      };

      onIntegrationComplete(mockMappings);
    } catch (error) {
      onError(error instanceof Error ? error : new Error('Integration failed'));
    } finally {
      setIsIntegrating(false);
    }
  };

  const integrationItems = [
    {
      key: 'createWorkPackages',
      label: 'Create Work Packages',
      description: 'Generate work packages based on CET products',
      count: analysisResult.products.length,
    },
    {
      key: 'createMilestones',
      label: 'Create Milestones',
      description: 'Generate milestones based on CET phases',
      count: analysisResult.phases.length,
    },
    {
      key: 'allocateResources',
      label: 'Allocate Resources',
      description: 'Allocate resources based on job profiles',
      count: cetData.jobProfiles.length,
    },
    {
      key: 'identifyRisks',
      label: 'Identify Risks',
      description: 'Create risk items based on analysis',
      count: analysisResult.risks.length,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Integration Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Integration Options</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {integrationItems.map((item) => (
              <div key={item.key} className="flex items-center space-x-3 rounded-lg border p-3">
                <Checkbox
                  id={item.key}
                  checked={
                    integrationOptions[item.key as keyof CETv22IntegrationOptions] as boolean
                  }
                  onCheckedChange={(checked) =>
                    handleOptionChange(
                      item.key as keyof CETv22IntegrationOptions,
                      checked as boolean,
                    )
                  }
                />
                <div className="flex-1">
                  <label htmlFor={item.key} className="cursor-pointer font-medium">
                    {item.label}
                  </label>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <Badge variant="secondary">{item.count} items</Badge>
              </div>
            ))}

            {/* Advanced Options */}
            <div className="mt-6 border-t pt-4">
              <h4 className="mb-3 font-medium">Advanced Options</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="updateExisting"
                    checked={integrationOptions.updateExisting}
                    onCheckedChange={(checked) =>
                      handleOptionChange('updateExisting', checked as boolean)
                    }
                  />
                  <label htmlFor="updateExisting" className="cursor-pointer text-sm">
                    Update existing items
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="createDraft"
                    checked={integrationOptions.createDraft}
                    onCheckedChange={(checked) =>
                      handleOptionChange('createDraft', checked as boolean)
                    }
                  />
                  <label htmlFor="createDraft" className="cursor-pointer text-sm">
                    Create as draft items
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="validateOnly"
                    checked={integrationOptions.validateOnly}
                    onCheckedChange={(checked) =>
                      handleOptionChange('validateOnly', checked as boolean)
                    }
                  />
                  <label htmlFor="validateOnly" className="cursor-pointer text-sm">
                    Validation only (no creation)
                  </label>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integration Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-blue-50 p-4 text-center">
              <div className="mb-1 text-2xl font-bold text-blue-600">
                {integrationOptions.createWorkPackages ? analysisResult.products.length : 0}
              </div>
              <div className="text-sm text-muted-foreground">Work Packages</div>
            </div>
            <div className="rounded-lg bg-green-50 p-4 text-center">
              <div className="mb-1 text-2xl font-bold text-green-600">
                {integrationOptions.createMilestones ? analysisResult.phases.length : 0}
              </div>
              <div className="text-sm text-muted-foreground">Milestones</div>
            </div>
            <div className="rounded-lg bg-purple-50 p-4 text-center">
              <div className="mb-1 text-2xl font-bold text-purple-600">
                {integrationOptions.allocateResources ? cetData.jobProfiles.length : 0}
              </div>
              <div className="text-sm text-muted-foreground">Resources</div>
            </div>
            <div className="rounded-lg bg-orange-50 p-4 text-center">
              <div className="mb-1 text-2xl font-bold text-orange-600">
                {integrationOptions.identifyRisks ? analysisResult.risks.length : 0}
              </div>
              <div className="text-sm text-muted-foreground">Risks</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integration Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Ready to Integrate</h3>
              <p className="text-sm text-muted-foreground">
                Click below to integrate CET v22.0 data with your delivery system
              </p>
            </div>
            <Button
              onClick={handleIntegration}
              disabled={isIntegrating}
              size="lg"
              className="flex items-center space-x-2"
            >
              {isIntegrating ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                  <span>Integrating...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span>Start Integration</span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Integration Status */}
      {isIntegrating && (
        <Alert variant="info">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Integration in Progress</AlertTitle>
          <AlertDescription>
            Integration is in progress. This may take a few moments...
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
