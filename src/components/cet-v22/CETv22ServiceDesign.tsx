'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { FileText, Upload, BarChart3, Users, TrendingUp, CheckCircle, XCircle } from 'lucide-react';

import { CETv22Data, CETv22AnalysisResult, CETv22IntegrationMappings } from '@/types';
import { CETv22AnalyzerService } from '@/services/cet-v22-analyzer';

// Import sub-components
import { CETv22FileUpload } from './CETv22FileUpload';
import { CETv22ProjectOverview } from './CETv22ProjectOverview';
import { CETv22ResourceDashboard } from './CETv22ResourceDashboard';
import { CETv22EffortAnalysis } from './CETv22EffortAnalysis';
import { CETv22PhaseTimeline } from './CETv22PhaseTimeline';
import { CETv22RiskAssessment } from './CETv22RiskAssessment';
import { CETv22IntegrationPanel } from './CETv22IntegrationPanel';

interface CETv22ServiceDesignProps {
  onIntegrationComplete?: () => void;
  onError?: (error: Error) => void;
}

type ProcessingState = 'idle' | 'uploading' | 'parsing' | 'analyzing' | 'integrating' | 'completed' | 'error';

export const CETv22ServiceDesign: React.FC<CETv22ServiceDesignProps> = ({
  onIntegrationComplete,
  onError
}) => {
  // State management
  const [activeTab, setActiveTab] = useState('upload');
  const [processingState, setProcessingState] = useState<ProcessingState>('idle');
  const [progress, setProgress] = useState(0);
  const [cetData, setCetData] = useState<CETv22Data | null>(null);
  const [analysisResult, setAnalysisResult] = useState<CETv22AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);



  // File processing handler
  const handleFileProcessed = useCallback(async (data: CETv22Data) => {
    try {
      setCetData(data);
      setProcessingState('analyzing');
      setProgress(60);
      setError(null);

      // Analyze the data
      const analyzerService = new CETv22AnalyzerService();
      const analysis = await analyzerService.analyzeCETData(data);
      setAnalysisResult(analysis);
      setProcessingState('completed');
      setProgress(100);
      setActiveTab('overview');

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error.message);
      setProcessingState('error');
      onError?.(error);
    }
  }, [onError]);

  // Integration handler
  const handleIntegrationComplete = useCallback((mappings: CETv22IntegrationMappings) => {
    setIntegrationMappings(mappings);
    setActiveTab('integration');
    onIntegrationComplete?.();
  }, [onIntegrationComplete]);

  // Error handler
  const handleError = useCallback((error: Error) => {
    setError(error.message);
    setProcessingState('error');
    onError?.(error);
  }, [onError]);

  // Reset handler
  const handleReset = useCallback(() => {
    setCetData(null);
    setAnalysisResult(null);
    setIntegrationMappings(null);
    setProcessingState('idle');
    setProgress(0);
    setError(null);
    setActiveTab('upload');
  }, []);

  // Get processing status display
  const getProcessingStatus = () => {
    switch (processingState) {
      case 'uploading':
        return { text: 'Uploading file...', color: 'blue' };
      case 'parsing':
        return { text: 'Parsing Excel data...', color: 'blue' };
      case 'analyzing':
        return { text: 'Analyzing resource demands...', color: 'blue' };
      case 'integrating':
        return { text: 'Integrating with delivery system...', color: 'blue' };
      case 'completed':
        return { text: 'Analysis completed successfully', color: 'green' };
      case 'error':
        return { text: 'Processing failed', color: 'red' };
      default:
        return { text: 'Ready to upload', color: 'gray' };
    }
  };

  const status = getProcessingStatus();

  return (
    <div className="space-y-6">
      {/* Header with status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle className="text-xl">CET v22.0 Service Design</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Resource demand planning and service design based on CET v22.0 analysis
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant={status.color === 'green' ? 'default' : status.color === 'red' ? 'destructive' : 'secondary'}>
                {status.text}
              </Badge>
              {processingState !== 'idle' && (
                <Button variant="outline" size="sm" onClick={handleReset}>
                  Reset
                </Button>
              )}
            </div>
          </div>

          {processingState !== 'idle' && processingState !== 'completed' && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Processing...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Error display */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main content tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="upload" disabled={processingState === 'analyzing'}>
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="overview" disabled={!cetData}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="resources" disabled={!analysisResult}>
            <Users className="h-4 w-4 mr-2" />
            Resources
          </TabsTrigger>
          <TabsTrigger value="effort" disabled={!analysisResult}>
            <TrendingUp className="h-4 w-4 mr-2" />
            Effort
          </TabsTrigger>
          <TabsTrigger value="timeline" disabled={!analysisResult}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="integration" disabled={!analysisResult}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Integration
          </TabsTrigger>
        </TabsList>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-6">
          <CETv22FileUpload
            onFileProcessed={handleFileProcessed}
            onError={handleError}
            disabled={processingState !== 'idle'}
          />
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {cetData && (
            <CETv22ProjectOverview
              projectData={cetData.project}
              analysisData={analysisResult}
            />
          )}
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-6">
          {analysisResult && (
            <CETv22ResourceDashboard
              resourceAnalysis={analysisResult.resources}
              jobProfiles={cetData?.jobProfiles || []}
            />
          )}
        </TabsContent>

        {/* Effort Tab */}
        <TabsContent value="effort" className="space-y-6">
          {analysisResult && (
            <CETv22EffortAnalysis
              effortAnalysis={analysisResult.effort}
              phases={cetData?.phases || []}
              products={cetData?.products || []}
            />
          )}
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-6">
          {analysisResult && cetData && (
            <CETv22PhaseTimeline
              phaseAnalysis={analysisResult.phases}
              timelineData={analysisResult.resources.timelineAnalysis}
              resourceDemands={cetData.resourceDemands}
            />
          )}
        </TabsContent>

        {/* Integration Tab */}
        <TabsContent value="integration" className="space-y-6">
          {analysisResult && cetData && (
            <CETv22IntegrationPanel
              analysisResult={analysisResult}
              cetData={cetData}
              onIntegrationComplete={handleIntegrationComplete}
              onError={handleError}
            />
          )}

          {/* Risk Assessment - Always show if we have analysis */}
          {analysisResult && (
            <CETv22RiskAssessment
              riskAnalysis={analysisResult.risks}
              projectAnalysis={analysisResult.project}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Summary footer */}
      {analysisResult && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {analysisResult.resources.totalEffort.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Total Hours</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {analysisResult.resources.peakResources}
                </div>
                <div className="text-sm text-muted-foreground">Peak Resources</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {analysisResult.effort.phaseBreakdown.length}
                </div>
                <div className="text-sm text-muted-foreground">Phases</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {analysisResult.risks.length}
                </div>
                <div className="text-sm text-muted-foreground">Risks Identified</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
