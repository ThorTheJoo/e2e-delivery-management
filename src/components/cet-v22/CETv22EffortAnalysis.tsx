'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, BarChart3, PieChart } from 'lucide-react';
import { CETv22EffortAnalysis } from '@/types';

interface CETv22EffortAnalysisProps {
  effortAnalysis: CETv22EffortAnalysis;
}

export const CETv22EffortAnalysis: React.FC<CETv22EffortAnalysisProps> = ({
  effortAnalysis
}) => {
  return (
    <div className="space-y-6">
      {/* Effort Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {effortAnalysis.totalEffort.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total Effort (Hours)</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {effortAnalysis.phaseBreakdown.length}
              </div>
              <div className="text-sm text-muted-foreground">Phases</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {effortAnalysis.weeklyBreakdown.length}
              </div>
              <div className="text-sm text-muted-foreground">Weeks</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Phase Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Phase Breakdown</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {effortAnalysis.phaseBreakdown.map((phase) => (
              <div key={phase.phaseNumber} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Phase {phase.phaseNumber}</h3>
                  <Badge variant="secondary">
                    {phase.percentage.toFixed(1)}%
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {phase.totalEffort.toLocaleString()} hours
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Weekly Effort Trend</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <PieChart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-muted-foreground">
              Weekly effort visualization would be displayed here
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
