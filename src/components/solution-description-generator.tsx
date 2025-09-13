'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Download, 
  Eye, 
  Settings, 
  Users, 
  Building, 
  Workflow, 
  Database,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { EnhancedSolutionDescriptionService, EnhancedSolutionDescriptionData } from '@/lib/enhanced-solution-description-service';
import { matchPdfContent, MatchedContent } from '@/lib/pdf-matcher';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { SolutionPdf } from '@/lib/solution-pdf';
import { MappingResult, TraversalResultWithPayloads } from '@/types/blue-dolphin-relationships';
import { SpecSyncItem } from '@/types';

interface SolutionDescriptionGeneratorProps {
  mappingResults: MappingResult[];
  traversalResults: TraversalResultWithPayloads[];
  requirements: SpecSyncItem[];
  onGenerate?: (data: EnhancedSolutionDescriptionData) => void;
}

export function SolutionDescriptionGenerator({
  mappingResults,
  traversalResults,
  requirements,
  onGenerate
}: SolutionDescriptionGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedData, setGeneratedData] = useState<EnhancedSolutionDescriptionData | null>(null);
  const [documentContent, setDocumentContent] = useState<string>('');
  const [projectName, setProjectName] = useState('E2E Delivery Management Solution');
  const [clientName, setClientName] = useState('Client Name');
  const [showPreview, setShowPreview] = useState(false);
  const [matchedContent, setMatchedContent] = useState<MatchedContent | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!mappingResults.length || !traversalResults.length || !requirements.length) {
      return;
    }

    setIsGenerating(true);
    try {
      const data = EnhancedSolutionDescriptionService.generateEnhancedSolutionDescription(
        mappingResults,
        traversalResults,
        requirements,
        projectName,
        clientName
      );
      
      const content = EnhancedSolutionDescriptionService.generateDocumentContent(data);
      
      setGeneratedData(data);
      setDocumentContent(content);
      onGenerate?.(data);
    } catch (error) {
      console.error('Error generating solution description:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [mappingResults, traversalResults, requirements, projectName, clientName, onGenerate]);

  const handleDownload = useCallback(() => {
    if (!documentContent) return;
    
    const blob = new Blob([documentContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.replace(/\s+/g, '_')}_Solution_Description.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [documentContent, projectName]);

  const handleGenerateFromPdfs = useCallback(async () => {
    if (!mappingResults.length || !traversalResults.length || !requirements.length) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/pdf-ingest');
      if (!res.ok) throw new Error('Failed to ingest PDFs');
      const payload = await res.json();

      const data = EnhancedSolutionDescriptionService.generateEnhancedSolutionDescription(
        mappingResults,
        traversalResults,
        requirements,
        projectName,
        clientName
      );

      const matches = matchPdfContent(payload.files, requirements, mappingResults, traversalResults);
      setMatchedContent(matches);
      setGeneratedData(data);
      setDocumentContent(EnhancedSolutionDescriptionService.generateDocumentContent(data));
    } catch (err) {
      console.error('PDF-based generation failed', err);
    } finally {
      setIsGenerating(false);
    }
  }, [mappingResults, traversalResults, requirements, projectName, clientName]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Solution Description Generator
          </CardTitle>
          <CardDescription>
            Generate comprehensive solution descriptions based on SpecSync requirements, TMF mappings, and Blue Dolphin traversal results.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="projectName">Project Name</Label>
              <Input
                id="projectName"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name</Label>
              <Input
                id="clientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Enter client name"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating || !mappingResults.length || !traversalResults.length || !requirements.length}
              className="flex-1"
            >
              {isGenerating ? 'Generating...' : 'Generate Solution Description'}
            </Button>
            <Button 
              variant="secondary"
              onClick={handleGenerateFromPdfs}
              disabled={isGenerating || !mappingResults.length || !traversalResults.length || !requirements.length}
            >
              Generate PDF (from PDFs)
            </Button>
            {generatedData && (
              <>
                <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
                  <Eye className="h-4 w-4 mr-2" />
                  {showPreview ? 'Hide Preview' : 'Show Preview'}
                </Button>
                <Button variant="outline" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                {generatedData && (
                  <PDFDownloadLink
                    document={<SolutionPdf data={generatedData} matches={matchedContent || undefined} />}
                    fileName={`${projectName.replace(/\s+/g, '_')}_Solution_Description.pdf`}
                  >
                    {({ loading }) => (
                      <Button variant="outline" disabled={loading}>
                        <Download className="h-4 w-4 mr-2" />
                        {loading ? 'Preparing PDF...' : 'Download PDF'}
                      </Button>
                    )}
                  </PDFDownloadLink>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {generatedData && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="architecture">Architecture</TabsTrigger>
            <TabsTrigger value="usecases">Use Cases</TabsTrigger>
            <TabsTrigger value="traceability">Traceability</TabsTrigger>
            <TabsTrigger value="encompass">Encompass</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{generatedData.statistics.totalRequirements}</div>
                  <p className="text-xs text-muted-foreground">Total requirements</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">TMF Functions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{generatedData.statistics.totalTMFunctions}</div>
                  <p className="text-xs text-muted-foreground">Mapped functions</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Use Cases</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{generatedData.statistics.totalUseCases}</div>
                  <p className="text-xs text-muted-foreground">Generated use cases</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Components</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {generatedData.statistics.totalBusinessProcesses + 
                     generatedData.statistics.totalApplicationServices + 
                     generatedData.statistics.totalApplicationInterfaces + 
                     generatedData.statistics.totalApplicationFunctions}
                  </div>
                  <p className="text-xs text-muted-foreground">Architecture components</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Business Context
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Customer Segments</h4>
                  <div className="flex flex-wrap gap-2">
                    {generatedData.businessContext.clientUnderstanding.customerSegments.map((segment, index) => (
                      <Badge key={index} variant="secondary">{segment}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Product & Service Segments</h4>
                  <div className="flex flex-wrap gap-2">
                    {generatedData.businessContext.clientUnderstanding.productServiceSegments.map((segment, index) => (
                      <Badge key={index} variant="outline">{segment}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Mission Critical</h4>
                  <p className="text-sm text-muted-foreground">
                    {generatedData.businessContext.clientUnderstanding.missionCritical}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="architecture" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Workflow className="h-5 w-5" />
                  Solution Architecture
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">High-level Architecture</h4>
                  <p className="text-sm text-muted-foreground">
                    {generatedData.solutionOverview.highLevelArchitecture}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Capability View</h4>
                  <p className="text-sm text-muted-foreground">
                    {generatedData.solutionOverview.capabilityView}
                  </p>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium mb-3">CSG Solution Components</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(generatedData.solutionOverview.csgSolutionComponents).map(([key, value]) => (
                      <div key={key} className="p-3 border rounded-lg">
                        <h5 className="font-medium text-sm mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</h5>
                        <p className="text-xs text-muted-foreground">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usecases" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Journeys & Use Cases
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-3">Explore Use Cases</h4>
                  <div className="space-y-2">
                    {generatedData.userJourneys.explore.current.map((useCase, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium">{useCase.name}</h5>
                          <Badge className={getStatusColor('completed')}>Current</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{useCase.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {useCase.actors.map((actor, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{actor}</Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium mb-3">Join/Buy Use Cases</h4>
                  <div className="space-y-2">
                    {generatedData.userJourneys.joinBuy.current.map((useCase, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium">{useCase.name}</h5>
                          <Badge className={getStatusColor('completed')}>Current</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{useCase.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {useCase.actors.map((actor, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{actor}</Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="traceability" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Traceability Mapping
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-3">Requirements to Functions</h4>
                  <div className="space-y-2">
                    {generatedData.traceability.requirementsToFunctions.slice(0, 5).map((mapping, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{mapping.sourceName}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="font-medium text-sm">{mapping.targetName}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{mapping.description}</p>
                      </div>
                    ))}
                    {generatedData.traceability.requirementsToFunctions.length > 5 && (
                      <p className="text-sm text-muted-foreground text-center">
                        ... and {generatedData.traceability.requirementsToFunctions.length - 5} more mappings
                      </p>
                    )}
                  </div>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium mb-3">Functions to Services</h4>
                  <div className="space-y-2">
                    {generatedData.traceability.functionsToServices.slice(0, 5).map((mapping, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{mapping.sourceName}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="font-medium text-sm">{mapping.targetName}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{mapping.description}</p>
                      </div>
                    ))}
                    {generatedData.traceability.functionsToServices.length > 5 && (
                      <p className="text-sm text-muted-foreground text-center">
                        ... and {generatedData.traceability.functionsToServices.length - 5} more mappings
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="encompass" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Encompass Integration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Product Description</h4>
                  <p className="text-sm text-muted-foreground">
                    {generatedData.encompassIntegration.productDescription}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Architecture</h4>
                  <p className="text-sm text-muted-foreground">
                    {generatedData.encompassIntegration.architecture}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Functionality</h4>
                  <p className="text-sm text-muted-foreground">
                    {generatedData.encompassIntegration.functionality}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Capabilities</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {generatedData.encompassIntegration.capabilities.map((capability, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{capability}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Document Preview
                </CardTitle>
                <CardDescription>
                  Preview of the generated solution description document
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] w-full border rounded-lg p-4">
                  <pre className="whitespace-pre-wrap text-sm font-mono">
                    {documentContent}
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
