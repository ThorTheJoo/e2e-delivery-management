'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible } from '@/components/ui/collapsible';
import { Users, TrendingUp, Clock, DollarSign } from 'lucide-react';
import { CETv22ResourceAnalysis, CETv22JobProfile } from '@/types';

interface CETv22ResourceDashboardProps {
  resourceAnalysis: CETv22ResourceAnalysis;
  jobProfiles: CETv22JobProfile[];
}

export const CETv22ResourceDashboard: React.FC<CETv22ResourceDashboardProps> = ({
  resourceAnalysis,
  jobProfiles,
}) => {
  // Debug logging
  console.log('CETv22ResourceDashboard - Props received:', { resourceAnalysis, jobProfiles });
  console.log(
    'CETv22ResourceDashboard - resourceAnalysis.domainBreakdown:',
    resourceAnalysis?.domainBreakdown,
  );
  console.log(
    'CETv22ResourceDashboard - resourceAnalysis.domainBreakdown length:',
    resourceAnalysis?.domainBreakdown?.length,
  );
  console.log(
    'CETv22ResourceDashboard - resourceAnalysis keys:',
    Object.keys(resourceAnalysis || {}),
  );

  return (
    <div className="space-y-6">
      {/* Resource Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">
                  {resourceAnalysis.totalEffort.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Total Hours</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{resourceAnalysis.peakResources}</div>
                <div className="text-sm text-muted-foreground">Peak Resources</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">
                  {Math.round(resourceAnalysis.resourceUtilization)}%
                </div>
                <div className="text-sm text-muted-foreground">Utilization</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{jobProfiles.length}</div>
                <div className="text-sm text-muted-foreground">Job Profiles</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role Breakdown */}
      <Collapsible
        title="Resource Role Breakdown"
        defaultCollapsed={true}
        className="border-0 shadow-none"
      >
        <div className="space-y-4">
          {resourceAnalysis.roleBreakdown.map((role, index) => (
            <div key={index} className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium">{role.role}</div>
                  <div className="text-sm text-muted-foreground">
                    {role.effort.toLocaleString()} hours
                  </div>
                </div>
              </div>
              <Badge variant="secondary">{role.percentage.toFixed(1)}%</Badge>
            </div>
          ))}
        </div>
      </Collapsible>

      {/* Domain Breakdown */}
      {resourceAnalysis.domainBreakdown && resourceAnalysis.domainBreakdown.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Domain Breakdown & Total Manday Effort</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {resourceAnalysis.domainBreakdown.map((domain, index) => (
                <div key={index} className="rounded-lg border p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-lg font-medium">{domain.domain}</h3>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {domain.totalEffort.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Hours</div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="mb-1 flex items-center justify-between text-sm text-muted-foreground">
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
                    <h4 className="text-sm font-medium text-gray-700">Role Breakdown:</h4>
                    {domain.roleBreakdown.map((role, roleIndex) => (
                      <div key={roleIndex} className="flex items-center justify-between text-sm">
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
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Domain Breakdown & Total Manday Effort</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="py-8 text-center text-muted-foreground">
              <p>No domain breakdown data available.</p>
              <p className="mt-2 text-sm">
                This section requires Ph1Demand worksheet data with domain (Column M) and total
                manday effort (Column O) information.
              </p>
              <div className="mt-4 rounded-lg bg-gray-50 p-4 text-left text-sm">
                <p>
                  <strong>Debug Info:</strong>
                </p>
                <p>
                  • resourceAnalysis.domainBreakdown:{' '}
                  {JSON.stringify(resourceAnalysis.domainBreakdown)}
                </p>
                <p>
                  • resourceAnalysis.domainBreakdown length:{' '}
                  {resourceAnalysis.domainBreakdown?.length || 0}
                </p>
                <p>• resourceAnalysis keys: {Object.keys(resourceAnalysis).join(', ')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Job Profiles */}
      <Card>
        <CardHeader>
          <CardTitle>Job Profiles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {jobProfiles.slice(0, 10).map((profile, index) => (
              <div key={profile.id || index} className="rounded-lg border p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-medium">{profile.projectRole}</h3>
                  <Badge variant="outline">{profile.resourceLevel}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium">Team:</span> {profile.projectTeam}
                  </div>
                  <div>
                    <span className="font-medium">Rate:</span> ${profile.hourlyRate}/hr
                  </div>
                  <div>
                    <span className="font-medium">Location:</span>{' '}
                    {profile.demandLocationCountryCode}
                  </div>
                  <div>
                    <span className="font-medium">Type:</span> {profile.workerType}
                  </div>
                </div>
              </div>
            ))}
            {jobProfiles.length > 10 && (
              <div className="text-center text-muted-foreground">
                And {jobProfiles.length - 10} more profiles...
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
