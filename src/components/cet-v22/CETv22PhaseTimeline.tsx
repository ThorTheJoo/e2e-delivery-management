'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users } from 'lucide-react';
import { CETv22PhaseAnalysis, CETv22TimelineData, CETv22ResourceDemand } from '@/types';

interface CETv22PhaseTimelineProps {
  phaseAnalysis: CETv22PhaseAnalysis[];
  timelineData: CETv22TimelineData[];
  resourceDemands: CETv22ResourceDemand[];
}

export const CETv22PhaseTimeline: React.FC<CETv22PhaseTimelineProps> = ({
  phaseAnalysis,
  timelineData,
  resourceDemands,
}) => {
  return (
    <div className="space-y-6">
      {/* Phase Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Phase Timeline</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {phaseAnalysis.map((phase) => (
              <div key={phase.phaseNumber} className="rounded-lg border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{phase.phaseName}</h3>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{phase.complexity} Complexity</Badge>
                    <Badge variant="secondary">{phase.duration} weeks</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <div>
                      <div className="text-sm text-muted-foreground">Effort</div>
                      <div className="font-medium">{phase.totalEffort.toLocaleString()} hours</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-green-500" />
                    <div>
                      <div className="text-sm text-muted-foreground">Resources</div>
                      <div className="font-medium">{phase.resourceCount} people</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-purple-500" />
                    <div>
                      <div className="text-sm text-muted-foreground">Duration</div>
                      <div className="font-medium">{phase.duration} weeks</div>
                    </div>
                  </div>
                </div>

                {phase.deliverables.length > 0 && (
                  <div className="mt-3">
                    <div className="mb-2 text-sm text-muted-foreground">Key Deliverables</div>
                    <div className="flex flex-wrap gap-1">
                      {phase.deliverables.slice(0, 3).map((deliverable, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {deliverable}
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

      {/* Resource Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Resource Demand Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <Calendar className="mx-auto mb-4 h-16 w-16 text-gray-400" />
            <p className="text-muted-foreground">
              Interactive timeline visualization would be displayed here
            </p>
            <div className="mt-4 text-sm text-muted-foreground">
              Showing {timelineData.length} data points across {resourceDemands.length} resource
              demands
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
