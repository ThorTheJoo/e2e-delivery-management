'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, Clock, DollarSign } from 'lucide-react';
import { CETv22ResourceAnalysis, CETv22JobProfile } from '@/types';

interface CETv22ResourceDashboardProps {
  resourceAnalysis: CETv22ResourceAnalysis;
  jobProfiles: CETv22JobProfile[];
}

export const CETv22ResourceDashboard: React.FC<CETv22ResourceDashboardProps> = ({
  resourceAnalysis,
  jobProfiles
}) => {
  return (
    <div className="space-y-6">
      {/* Resource Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{resourceAnalysis.totalEffort.toLocaleString()}</div>
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
                <div className="text-2xl font-bold">{Math.round(resourceAnalysis.resourceUtilization)}%</div>
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
      <Card>
        <CardHeader>
          <CardTitle>Resource Role Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {resourceAnalysis.roleBreakdown.map((role, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium">{role.role}</div>
                    <div className="text-sm text-muted-foreground">
                      {role.effort.toLocaleString()} hours
                    </div>
                  </div>
                </div>
                <Badge variant="secondary">
                  {role.percentage.toFixed(1)}%
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Job Profiles */}
      <Card>
        <CardHeader>
          <CardTitle>Job Profiles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {jobProfiles.slice(0, 10).map((profile, index) => (
              <div key={profile.id || index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
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
                    <span className="font-medium">Location:</span> {profile.demandLocationCountryCode}
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
