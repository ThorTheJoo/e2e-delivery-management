'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { FileText, Upload, BarChart3, TrendingUp, CheckCircle, XCircle, ChevronDown, ChevronRight } from 'lucide-react';

import { CETv22Data, CETv22AnalysisResult, CETv22IntegrationMappings } from '@/types';
import { CETv22AnalyzerService } from '@/services/cet-v22-analyzer';

// Import sub-components
import { CETv22FileUpload } from './CETv22FileUpload';
import { CETv22ProjectOverview } from './CETv22ProjectOverview';
import { CETv22EffortAnalysisComponent } from './CETv22EffortAnalysis';
import { CETv22PhaseTimeline } from './CETv22PhaseTimeline';
import { CETv22RiskAssessment } from './CETv22RiskAssessment';
import { CETv22IntegrationPanel } from './CETv22IntegrationPanel';

interface CETv22ServiceDesignProps {
  onIntegrationComplete?: () => void;
  onError?: (error: Error) => void;
}

type ProcessingState =
  | 'idle'
  | 'uploading'
  | 'parsing'
  | 'analyzing'
  | 'integrating'
  | 'completed'
  | 'error';

export const CETv22ServiceDesign: React.FC<CETv22ServiceDesignProps> = ({
  onIntegrationComplete,
  onError,
}) => {
  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [processingState, setProcessingState] = useState<ProcessingState>('idle');
  const [progress, setProgress] = useState(0);
  const [cetData, setCetData] = useState<CETv22Data | null>(null);
  const [analysisResult, setAnalysisResult] = useState<CETv22AnalysisResult | null>(null);
  const [, setIntegrationMappings] = useState<CETv22IntegrationMappings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Helper function to toggle section expansion
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  // Load data from local storage on component mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('cetv22Data');
      const savedAnalysis = localStorage.getItem('cetv22Analysis');

      if (savedData && savedAnalysis) {
        const parsedData = JSON.parse(savedData);
        const parsedAnalysis = JSON.parse(savedAnalysis);

        setCetData(parsedData);
        setAnalysisResult(parsedAnalysis);
        setProcessingState('completed');
        setActiveTab('overview');
      }
    } catch (err) {
      console.warn('Failed to load CETv22 data from local storage:', err);
    }
  }, []);

  // File processing handler
  const handleFileProcessed = useCallback(
    async (data: CETv22Data) => {
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

        // Save to local storage for persistence across page navigation
        localStorage.setItem('cetv22Data', JSON.stringify(data));
        localStorage.setItem('cetv22Analysis', JSON.stringify(analysis));
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error occurred');
        setError(error.message);
        setProcessingState('error');
        onError?.(error);
      }
    },
    [onError],
  );

  // Integration handler
  const handleIntegrationComplete = useCallback(
    (mappings: CETv22IntegrationMappings) => {
      setIntegrationMappings(mappings);
      setActiveTab('integration');
      onIntegrationComplete?.();
    },
    [onIntegrationComplete],
  );

  // Error handler
  const handleError = useCallback(
    (error: Error) => {
      setError(error.message);
      setProcessingState('error');
      onError?.(error);
    },
    [onError],
  );

  // Reset handler
  const handleReset = useCallback(() => {
    setCetData(null);
    setAnalysisResult(null);
    setIntegrationMappings(null);
    setProcessingState('idle');
    setProgress(0);
    setError(null);
    setActiveTab('upload');

    // Clear local storage
    localStorage.removeItem('cetv22Data');
    localStorage.removeItem('cetv22Analysis');
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
      <div className="border-b pb-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-blue-200 bg-blue-100">
              <FileText className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <h1 className="flex items-center space-x-2 text-base font-semibold">
                <span>CET v22.0 Service Design</span>
              </h1>
              <p className="text-sm text-muted-foreground">
                Resource demand planning and service design based on CET v22.0 analysis
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge
              variant={
                status.color === 'green'
                  ? 'default'
                  : status.color === 'red'
                    ? 'destructive'
                    : 'secondary'
              }
            >
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
            <div className="mb-2 flex justify-between text-sm">
              <span>Processing...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}
      </div>

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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <BarChart3 className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="effort" disabled={!analysisResult}>
            <TrendingUp className="mr-2 h-4 w-4" />
            Effort
          </TabsTrigger>
          <TabsTrigger value="timeline" disabled={!analysisResult}>
            <BarChart3 className="mr-2 h-4 w-4" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="integration" disabled={!analysisResult}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Integration
          </TabsTrigger>
        </TabsList>


        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* File Upload Section */}
          <div className="border-b pb-6">
            <div
              className="mb-4 flex cursor-pointer items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted/50"
              onClick={() => toggleSection('file-upload')}
            >
              <div className="flex items-center space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-blue-200 bg-blue-100">
                  {expandedSections.has('file-upload') ? (
                    <ChevronDown className="h-5 w-5 text-blue-700" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-blue-700" />
                  )}
                </div>
                <div>
                  <h3 className="flex items-center space-x-2 text-base font-semibold">
                    <Upload className="h-4 w-4" />
                    <span>File Upload</span>
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Upload CET v22.0 Excel files for analysis
                  </p>
                </div>
              </div>
            </div>
            {expandedSections.has('file-upload') && (
              <div className="space-y-4">
                <CETv22FileUpload
                  onFileProcessed={handleFileProcessed}
                  onError={handleError}
                  disabled={processingState !== 'idle'}
                />
              </div>
            )}
          </div>

          {cetData && (
            <CETv22ProjectOverview 
              projectData={cetData.project} 
              analysisData={analysisResult}
              jobProfiles={cetData.jobProfiles || []}
            />
          )}
        </TabsContent>


        {/* Effort Tab */}
        <TabsContent value="effort" className="space-y-6">
          {analysisResult && (
            <CETv22EffortAnalysisComponent effortAnalysis={analysisResult.effort} />
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
          {analysisResult && <CETv22RiskAssessment riskAnalysis={analysisResult.risks} />}
        </TabsContent>
      </Tabs>

      {/* Summary footer */}
      {analysisResult && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 gap-4 text-center md:grid-cols-4">
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
