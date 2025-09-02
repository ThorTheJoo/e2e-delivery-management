'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Building,
  MapPin,
  Globe,
  Calendar,
  FileText,
  TrendingUp,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { CETv22Project, CETv22AnalysisResult } from '@/types';

interface CETv22ProjectOverviewProps {
  projectData: CETv22Project;
  analysisData: CETv22AnalysisResult | null;
}

export const CETv22ProjectOverview: React.FC<CETv22ProjectOverviewProps> = ({
  projectData,
  analysisData
}) => {
  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'High': return 'destructive';
      case 'Medium': return 'secondary';
      case 'Low': return 'default';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'default';
      case 'in progress': return 'secondary';
      case 'draft': return 'outline';
      case 'on hold': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="h-5 w-5" />
            <span>{projectData.projectName}</span>
            <Badge variant={getStatusColor(projectData.status)}>
              {projectData.status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Customer</div>
                <div className="font-medium">{projectData.customerName}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Region</div>
                <div className="font-medium">{projectData.region}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Digital Telco</div>
                <div className="font-medium">{projectData.digitalTelco}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Created</div>
                <div className="font-medium">{projectData.createdDate}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Summary Cards */}
      {analysisData && (
        <>
          {/* Project Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Project Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {analysisData.project.complexity}
                  </div>
                  <div className="text-sm text-muted-foreground">Complexity Level</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {Math.round(analysisData.metadata.confidence)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Data Confidence</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {analysisData.metadata.dataQuality}
                  </div>
                  <div className="text-sm text-muted-foreground">Data Quality</div>
                </div>
              </div>

              {analysisData.project.riskFactors.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Project Risk Factors
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {analysisData.project.riskFactors.map((risk, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {risk}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resource Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Resource Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {analysisData.resources.totalEffort.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Hours</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {analysisData.resources.peakResources}
                  </div>
                  <div className="text-sm text-muted-foreground">Peak Resources</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600 mb-1">
                    {Math.round(analysisData.resources.resourceUtilization)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Utilization</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {analysisData.resources.averageResources}
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Resources</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Effort Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Effort Distribution</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">By Phase</h4>
                    <div className="space-y-2">
                      {analysisData.effort.phaseBreakdown.map((phase) => (
                        <div key={phase.phaseNumber} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            <span className="text-sm">Phase {phase.phaseNumber}</span>
                          </div>
                          <div className="text-sm font-medium">
                            {phase.totalEffort.toLocaleString()}h ({phase.percentage.toFixed(1)}%)
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">By Role</h4>
                    <div className="space-y-2">
                      {analysisData.resources.roleBreakdown.slice(0, 5).map((role) => (
                        <div key={role.role} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span className="text-sm truncate">{role.role}</span>
                          </div>
                          <div className="text-sm font-medium">
                            {role.effort.toLocaleString()}h ({role.percentage.toFixed(1)}%)
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">
                      {analysisData.phases.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Phases</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">
                      {analysisData.products.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Products</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">
                      {analysisData.risks.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Risks Identified</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Phase Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Phase Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysisData.phases.map((phase) => (
                  <div key={phase.phaseNumber} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-lg">{phase.phaseName}</h3>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getComplexityColor(phase.complexity)}>
                          {phase.complexity}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {phase.duration} weeks
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div>
                        <div className="text-sm text-muted-foreground">Effort</div>
                        <div className="font-medium">{phase.totalEffort.toLocaleString()} hours</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Resources</div>
                        <div className="font-medium">{phase.resourceCount} people</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Duration</div>
                        <div className="font-medium">{phase.duration} weeks</div>
                      </div>
                    </div>

                    {phase.deliverables.length > 0 && (
                      <div>
                        <div className="text-sm text-muted-foreground mb-2">Key Deliverables</div>
                        <div className="flex flex-wrap gap-1">
                          {phase.deliverables.slice(0, 3).map((deliverable, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {deliverable}
                            </Badge>
                          ))}
                          {phase.deliverables.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{phase.deliverables.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {phase.riskFactors.length > 0 && (
                      <div className="mt-3">
                        <div className="text-sm text-muted-foreground mb-2 flex items-center">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Phase Risks
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {phase.riskFactors.map((risk, index) => (
                            <Badge key={index} variant="outline" className="text-xs text-orange-600">
                              {risk}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Analysis Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Analysis Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <div>
                    <div className="text-sm font-medium">Analysis Completed</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(analysisData.metadata.analyzedAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <div>
                    <div className="text-sm font-medium">Processing Time</div>
                    <div className="text-xs text-muted-foreground">
                      {analysisData.metadata.analysisTime}ms
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
