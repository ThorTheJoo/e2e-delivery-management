'use client';

import React from 'react';
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
  Clock,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { CETv22Project, CETv22AnalysisResult, CETv22JobProfile } from '@/types';

interface CETv22ProjectOverviewProps {
  projectData: CETv22Project;
  analysisData: CETv22AnalysisResult | null;
  jobProfiles?: CETv22JobProfile[];
}

export const CETv22ProjectOverview: React.FC<CETv22ProjectOverviewProps> = ({
  projectData,
  analysisData,
  jobProfiles = [],
}) => {
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(new Set());

  // Debug logging
  React.useEffect(() => {
    console.log('CETv22ProjectOverview - Received data:', {
      projectData,
      analysisData: analysisData ? 'present' : 'null',
      jobProfiles: jobProfiles?.length || 0,
      jobProfilesData: jobProfiles,
      analysisDataResources: analysisData?.resources ? 'present' : 'null',
      resourcesData: analysisData?.resources,
      analysisDataDomainBreakdown: analysisData?.resources?.domainBreakdown?.length || 0
    });
  }, [projectData, analysisData, jobProfiles]);

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

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'High':
        return 'destructive';
      case 'Medium':
        return 'secondary';
      case 'Low':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'default';
      case 'in progress':
        return 'secondary';
      case 'draft':
        return 'outline';
      case 'on hold':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* No Data Message */}
      {!analysisData && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Analysis Data Available</h3>
          <p className="text-muted-foreground mb-4">
            Upload a CET v22.0 Excel file using the File Upload section above to begin analysis.
          </p>
        </div>
      )}

      {/* Project Header */}
      {analysisData && (
        <div className="border-b pb-6">
          <div
            className="mb-4 flex cursor-pointer items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted/50"
            onClick={() => toggleSection('project-header')}
          >
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-purple-200 bg-purple-100">
                {expandedSections.has('project-header') ? (
                  <ChevronDown className="h-5 w-5 text-purple-700" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-purple-700" />
                )}
              </div>
              <div>
                <h3 className="flex items-center space-x-2 text-base font-semibold">
                  <Building className="h-4 w-4" />
            <span>{projectData.projectName}</span>
            <Badge variant={getStatusColor(projectData.status)}>{projectData.status}</Badge>
                </h3>
                <p className="text-sm text-muted-foreground">
                  Project details and configuration
                </p>
              </div>
            </div>
          </div>
          {expandedSections.has('project-header') && (
            <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
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
            </div>
          )}
        </div>
      )}

      {/* Analysis Summary Cards */}
      {analysisData && (
        <>

          {/* Resource Summary */}
          <div className="border-b pb-6">
            <div
              className="mb-4 flex cursor-pointer items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted/50"
              onClick={() => toggleSection('resource-summary')}
            >
              <div className="flex items-center space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-green-200 bg-green-100">
                  {expandedSections.has('resource-summary') ? (
                    <ChevronDown className="h-5 w-5 text-green-700" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-green-700" />
                  )}
                </div>
                <div>
                  <h3 className="flex items-center space-x-2 text-base font-semibold">
                    <Users className="h-4 w-4" />
                    <span>Resource Summary</span>
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Resource allocation and utilization metrics
                  </p>
                </div>
              </div>
                  </div>
            {expandedSections.has('resource-summary') && (
              <div className="space-y-6">
                {/* Resource Summary Cards */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg bg-blue-50 p-4 text-center">
                  <div className="mb-1 text-2xl font-bold text-blue-600">
                    {analysisData.resources.totalEffort.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Hours</div>
                </div>
                <div className="rounded-lg bg-green-50 p-4 text-center">
                  <div className="mb-1 text-2xl font-bold text-green-600">
                    {analysisData.resources.peakResources}
                  </div>
                  <div className="text-sm text-muted-foreground">Peak Resources</div>
                </div>
                <div className="rounded-lg bg-orange-50 p-4 text-center">
                  <div className="mb-1 text-2xl font-bold text-orange-600">
                    {Math.round(analysisData.resources.resourceUtilization)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Utilization</div>
                </div>
                <div className="rounded-lg bg-purple-50 p-4 text-center">
                  <div className="mb-1 text-2xl font-bold text-purple-600">
                    {analysisData.resources.averageResources}
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Resources</div>
                </div>
              </div>

                {/* Role Breakdown Subsection */}
                <div className="border-b pb-4">
                  <div
                    className="mb-4 flex cursor-pointer items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted/50"
                    onClick={() => toggleSection('role-breakdown')}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg border-2 border-blue-200 bg-blue-100">
                        {expandedSections.has('role-breakdown') ? (
                          <ChevronDown className="h-4 w-4 text-blue-700" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-blue-700" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold">Role Breakdown</h4>
                        <p className="text-xs text-muted-foreground">
                          Resource allocation by role
                        </p>
                      </div>
                    </div>
                  </div>
                  {expandedSections.has('role-breakdown') && (
                    <div className="space-y-4">
                      {/* Top 5 Roles - Detailed View */}
                      <div>
                        <h6 className="text-xs font-medium text-gray-700 mb-3">Top Roles (by effort)</h6>
                        <div className="space-y-3">
                          {analysisData.resources.roleBreakdown.slice(0, 5).map((role, index) => (
                            <div key={index} className="rounded-lg border p-3">
                              <div className="mb-2 flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100">
                                    <Users className="h-3 w-3 text-blue-600" />
                                  </div>
                                  <span className="text-sm font-medium truncate">{role.role}</span>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-bold text-blue-600">
                                    {role.effort.toLocaleString()}h
                                  </div>
                                  <Badge variant="secondary" className="text-xs">{role.percentage.toFixed(1)}%</Badge>
                                </div>
                              </div>
                              <div className="h-2 w-full rounded-full bg-gray-200">
                                <div
                                  className="h-2 rounded-full bg-blue-600"
                                  style={{ width: `${role.percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Remaining Roles - Compact Grid View */}
                      {analysisData.resources.roleBreakdown.length > 5 && (
                        <div>
                          <h6 className="text-xs font-medium text-gray-700 mb-3">
                            Other Roles ({analysisData.resources.roleBreakdown.length - 5})
                          </h6>
                          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
                            {analysisData.resources.roleBreakdown.slice(5).map((role, index) => (
                              <div key={index + 5} className="rounded-md border border-gray-200 p-2 bg-gray-50">
                                <div className="flex items-center justify-between">
                                  <div className="min-w-0 flex-1">
                                    <div className="text-xs font-medium text-gray-900 truncate" title={role.role}>
                                      {role.role}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {role.effort.toLocaleString()}h
                                    </div>
                                  </div>
                                  <Badge variant="outline" className="text-xs ml-2">
                                    {role.percentage.toFixed(1)}%
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Summary Stats */}
                      <div className="border-t pt-3">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-lg font-bold text-gray-900">
                              {analysisData.resources.roleBreakdown.length}
                            </div>
                            <div className="text-xs text-gray-500">Total Roles</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-blue-600">
                              {analysisData.resources.roleBreakdown.slice(0, 5).reduce((sum, role) => sum + role.percentage, 0).toFixed(1)}%
                            </div>
                            <div className="text-xs text-gray-500">Top 5 Share</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-gray-600">
                              {analysisData.resources.roleBreakdown.slice(5).reduce((sum, role) => sum + role.percentage, 0).toFixed(1)}%
                            </div>
                            <div className="text-xs text-gray-500">Others Share</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Domain Breakdown Subsection */}
                <div className="border-b pb-4">
                  <div
                    className="mb-4 flex cursor-pointer items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted/50"
                    onClick={() => toggleSection('domain-breakdown')}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg border-2 border-green-200 bg-green-100">
                        {expandedSections.has('domain-breakdown') ? (
                          <ChevronDown className="h-4 w-4 text-green-700" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-green-700" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold">Domain Breakdown</h4>
                        <p className="text-xs text-muted-foreground">
                          Effort distribution by domain
                        </p>
                      </div>
                    </div>
                  </div>
                  {expandedSections.has('domain-breakdown') && (
                    <div className="space-y-4">
                      {analysisData.resources.domainBreakdown && analysisData.resources.domainBreakdown.length > 0 ? (
                        analysisData.resources.domainBreakdown.map((domain, index) => (
                          <div key={index} className="rounded-lg border p-4">
                            <div className="mb-3 flex items-center justify-between">
                              <h5 className="text-sm font-medium">{domain.domain}</h5>
                              <div className="text-right">
                                <div className="text-lg font-bold text-blue-600">
                                  {domain.totalEffort.toLocaleString()}
                                </div>
                                <div className="text-xs text-muted-foreground">Total Hours</div>
                              </div>
                            </div>

                            <div className="mb-3">
                              <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                                <span>Domain Share</span>
                                <span>{domain.percentage.toFixed(1)}%</span>
                              </div>
                              <div className="h-2 w-full rounded-full bg-gray-200">
                                <div
                                  className="h-2 rounded-full bg-blue-600"
                                  style={{ width: `${domain.percentage}%` }}
                                ></div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <h6 className="text-xs font-medium text-gray-700">Role Breakdown:</h6>
                              {domain.roleBreakdown.map((role, roleIndex) => (
                                <div key={roleIndex} className="flex items-center justify-between text-xs">
                                  <span className="text-gray-600">{role.role}</span>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-gray-500">{role.effort.toLocaleString()}h</span>
                                    <Badge variant="secondary" className="text-xs">
                                      {role.percentage.toFixed(1)}%
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-4 text-center text-sm text-muted-foreground">
                          <p>No domain breakdown data available.</p>
                          <p className="mt-1 text-xs">
                            This section requires Ph1Demand worksheet data with domain information.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Job Profiles Subsection */}
                <div className="border-b pb-4">
                  <div
                    className="mb-4 flex cursor-pointer items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted/50"
                    onClick={() => toggleSection('job-profiles')}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg border-2 border-purple-200 bg-purple-100">
                        {expandedSections.has('job-profiles') ? (
                          <ChevronDown className="h-4 w-4 text-purple-700" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-purple-700" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold">Job Profiles</h4>
                        <p className="text-xs text-muted-foreground">
                          Available job profiles and rates
                        </p>
                      </div>
                    </div>
                  </div>
                  {expandedSections.has('job-profiles') && (
                    <div className="space-y-4">
                      {jobProfiles && jobProfiles.length > 0 ? (
                        <>
                          {/* Actual Job Profiles */}
                          <div>
                            <h6 className="text-xs font-medium text-gray-700 mb-3">Job Profiles from Data</h6>
                            <div className="space-y-3">
                              {jobProfiles.slice(0, 5).map((profile, index) => (
                                <div key={profile.id || index} className="rounded-lg border p-3">
                                  <div className="mb-2 flex items-center justify-between">
                                    <h5 className="text-sm font-medium">{profile.projectRole}</h5>
                                    <Badge variant="outline" className="text-xs">{profile.resourceLevel}</Badge>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                    <div>
                                      <span className="font-medium">Team:</span> {profile.projectTeam}
                                    </div>
                                    <div>
                                      <span className="font-medium">Rate:</span> ${profile.hourlyRate}/hr
                                    </div>
                                    <div>
                                      <span className="font-medium">Location:</span> {profile.demandLocationCountryCode}
                                    </div>
                                    <div>
                                      <span className="font-medium">Type:</span> {profile.workerType}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            {jobProfiles.length > 5 && (
                              <div className="text-center text-xs text-muted-foreground mt-2">
                                And {jobProfiles.length - 5} more profiles...
                              </div>
                            )}
                          </div>
                        </>
                      ) : analysisData?.resources?.roleBreakdown && analysisData.resources.roleBreakdown.length > 0 ? (
                        <>
                          {/* Role-Based Profiles (Fallback) */}
                          <div>
                            <h6 className="text-xs font-medium text-gray-700 mb-3">Role Profiles (Derived from Analysis)</h6>
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                              {analysisData.resources.roleBreakdown.slice(0, 6).map((role, index) => {
                                // Determine resource level based on role name and effort
                                const roleLower = role.role.toLowerCase();
                                let resourceLevel = 'Mid';
                                let hourlyRate = 100;
                                
                                if (roleLower.includes('senior') || roleLower.includes('lead') || roleLower.includes('architect')) {
                                  resourceLevel = 'Senior';
                                  hourlyRate = 150;
                                } else if (roleLower.includes('junior') || roleLower.includes('associate')) {
                                  resourceLevel = 'Junior';
                                  hourlyRate = 75;
                                }
                                
                                if (roleLower.includes('architect')) hourlyRate += 25;
                                else if (roleLower.includes('manager')) hourlyRate += 20;
                                else if (roleLower.includes('specialist')) hourlyRate += 15;
                                
                                return (
                                  <div key={index} className="rounded-md border border-gray-200 p-3 bg-white">
                                    <div className="mb-2 flex items-center justify-between">
                                      <h5 className="text-sm font-medium truncate" title={role.role}>{role.role}</h5>
                                      <Badge variant="outline" className="text-xs">{resourceLevel}</Badge>
                                    </div>
                                    <div className="space-y-1 text-xs text-muted-foreground">
                                      <div className="flex justify-between">
                                        <span className="font-medium">Effort:</span>
                                        <span>{role.effort.toLocaleString()}h ({role.percentage.toFixed(1)}%)</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="font-medium">Est. Rate:</span>
                                        <span>${hourlyRate}/hr</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="font-medium">Type:</span>
                                        <span>Full-Time</span>
                                      </div>
                                    </div>
                                    {/* Effort Progress Bar */}
                                    <div className="mt-2">
                                      <div className="h-1.5 w-full rounded-full bg-gray-200">
                                        <div
                                          className="h-1.5 rounded-full bg-blue-600"
                                          style={{ width: `${Math.min(role.percentage, 100)}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            
                            {/* Summary Stats */}
                            <div className="mt-4 border-t pt-3">
                              <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                  <div className="text-lg font-bold text-gray-900">
                                    {analysisData.resources.roleBreakdown.length}
                                  </div>
                                  <div className="text-xs text-gray-500">Total Roles</div>
                                </div>
                                <div>
                                  <div className="text-lg font-bold text-blue-600">
                                    ${Math.round(analysisData.resources.roleBreakdown.reduce((sum, role) => {
                                      const roleLower = role.role.toLowerCase();
                                      let hourlyRate = 100;
                                      if (roleLower.includes('senior') || roleLower.includes('lead') || roleLower.includes('architect')) {
                                        hourlyRate = 150;
                                      } else if (roleLower.includes('junior') || roleLower.includes('associate')) {
                                        hourlyRate = 75;
                                      }
                                      if (roleLower.includes('architect')) hourlyRate += 25;
                                      else if (roleLower.includes('manager')) hourlyRate += 20;
                                      else if (roleLower.includes('specialist')) hourlyRate += 15;
                                      return sum + (hourlyRate * role.effort);
                                    }, 0)).toLocaleString()}
                                  </div>
                                  <div className="text-xs text-gray-500">Est. Total Cost</div>
                                </div>
                                <div>
                                  <div className="text-lg font-bold text-green-600">
                                    ${Math.round(analysisData.resources.roleBreakdown.reduce((sum, role) => {
                                      const roleLower = role.role.toLowerCase();
                                      let hourlyRate = 100;
                                      if (roleLower.includes('senior') || roleLower.includes('lead') || roleLower.includes('architect')) {
                                        hourlyRate = 150;
                                      } else if (roleLower.includes('junior') || roleLower.includes('associate')) {
                                        hourlyRate = 75;
                                      }
                                      if (roleLower.includes('architect')) hourlyRate += 25;
                                      else if (roleLower.includes('manager')) hourlyRate += 20;
                                      else if (roleLower.includes('specialist')) hourlyRate += 15;
                                      return sum + hourlyRate;
                                    }, 0) / analysisData.resources.roleBreakdown.length)}
                                  </div>
                                  <div className="text-xs text-gray-500">Avg Rate/hr</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="py-4 text-center text-sm text-muted-foreground">
                          <p>No job profiles or role data available.</p>
                          <p className="mt-1 text-xs">Upload a CET v22.0 file to see role-based profiles.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Effort Breakdown */}
          <div className="border-b pb-6">
            <div
              className="mb-4 flex cursor-pointer items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted/50"
              onClick={() => toggleSection('effort-distribution')}
            >
              <div className="flex items-center space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-orange-200 bg-orange-100">
                  {expandedSections.has('effort-distribution') ? (
                    <ChevronDown className="h-5 w-5 text-orange-700" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-orange-700" />
                  )}
                </div>
                <div>
                  <h3 className="flex items-center space-x-2 text-base font-semibold">
                    <TrendingUp className="h-4 w-4" />
                <span>Effort Distribution</span>
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Effort breakdown by phase and role
                  </p>
                </div>
              </div>
            </div>
            {expandedSections.has('effort-distribution') && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="mb-3 text-sm font-medium text-muted-foreground">By Phase</h4>
                    <div className="space-y-2">
                      {analysisData.effort.phaseBreakdown.map((phase) => (
                        <div key={phase.phaseNumber} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="h-3 w-3 rounded-full bg-blue-500"></div>
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
                    <h4 className="mb-3 text-sm font-medium text-muted-foreground">By Role</h4>
                    <div className="space-y-2">
                      {analysisData.resources.roleBreakdown.slice(0, 5).map((role) => (
                        <div key={role.role} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="h-3 w-3 rounded-full bg-green-500"></div>
                            <span className="truncate text-sm">{role.role}</span>
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

                <div className="grid grid-cols-1 gap-4 text-center md:grid-cols-3">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <div className="text-lg font-bold text-gray-900">
                      {analysisData.phases.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Phases</div>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <div className="text-lg font-bold text-gray-900">
                      {analysisData.products.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Products</div>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <div className="text-lg font-bold text-gray-900">
                      {analysisData.risks.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Risks Identified</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Phase Overview */}
          <div className="border-b pb-6">
            <div
              className="mb-4 flex cursor-pointer items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted/50"
              onClick={() => toggleSection('phase-overview')}
            >
              <div className="flex items-center space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-indigo-200 bg-indigo-100">
                  {expandedSections.has('phase-overview') ? (
                    <ChevronDown className="h-5 w-5 text-indigo-700" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-indigo-700" />
                  )}
                </div>
                <div>
                  <h3 className="flex items-center space-x-2 text-base font-semibold">
                    <Clock className="h-4 w-4" />
                <span>Phase Overview</span>
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Detailed phase breakdown and timeline
                  </p>
                </div>
              </div>
            </div>
            {expandedSections.has('phase-overview') && (
              <div className="space-y-4">
                {analysisData.phases.map((phase) => (
                  <div key={phase.phaseNumber} className="rounded-lg border p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-lg font-semibold">{phase.phaseName}</h3>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getComplexityColor(phase.complexity)}>
                          {phase.complexity}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {phase.duration} weeks
                        </span>
                      </div>
                    </div>

                    <div className="mb-3 grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div>
                        <div className="text-sm text-muted-foreground">Effort</div>
                        <div className="font-medium">
                          {phase.totalEffort.toLocaleString()} hours
                        </div>
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
                        <div className="mb-2 text-sm text-muted-foreground">Key Deliverables</div>
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
                        <div className="mb-2 flex items-center text-sm text-muted-foreground">
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          Phase Risks
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {phase.riskFactors.map((risk, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs text-orange-600"
                            >
                              {risk}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Analysis Metadata */}
          <div className="border-b pb-6">
            <div
              className="mb-4 flex cursor-pointer items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted/50"
              onClick={() => toggleSection('analysis-details')}
            >
              <div className="flex items-center space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-gray-200 bg-gray-100">
                  {expandedSections.has('analysis-details') ? (
                    <ChevronDown className="h-5 w-5 text-gray-700" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-700" />
                  )}
                </div>
                <div>
                  <h3 className="flex items-center space-x-2 text-base font-semibold">
                    <CheckCircle className="h-4 w-4" />
                    <span>Analysis Details</span>
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Analysis metadata and processing information
                  </p>
                </div>
              </div>
            </div>
            {expandedSections.has('analysis-details') && (
              <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
