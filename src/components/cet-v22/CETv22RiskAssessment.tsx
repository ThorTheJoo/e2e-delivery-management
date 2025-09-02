'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, AlertCircle } from 'lucide-react';
import { CETv22RiskAnalysis } from '@/types';

interface CETv22RiskAssessmentProps {
  riskAnalysis: CETv22RiskAnalysis[];
}

export const CETv22RiskAssessment: React.FC<CETv22RiskAssessmentProps> = ({
  riskAnalysis
}) => {
  const getRiskColor = (probability: string, impact: string) => {
    if (probability === 'High' && impact === 'High') return 'destructive';
    if (probability === 'High' || impact === 'High') return 'secondary';
    return 'outline';
  };

  const getRiskIcon = (probability: string, impact: string) => {
    if (probability === 'High' && impact === 'High') return AlertTriangle;
    if (probability === 'High' || impact === 'High') return AlertCircle;
    return Shield;
  };

  return (
    <div className="space-y-6">
      {/* Risk Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Risk Assessment</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600 mb-1">
                {riskAnalysis.filter(r => r.probability === 'High' && r.impact === 'High').length}
              </div>
              <div className="text-sm text-muted-foreground">Critical Risks</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {riskAnalysis.filter(r => r.probability === 'High' || r.impact === 'High').length}
              </div>
              <div className="text-sm text-muted-foreground">High Priority</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600 mb-1">
                {riskAnalysis.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Risks</div>
            </div>
          </div>

          {/* Risk List */}
          <div className="space-y-4">
            {riskAnalysis.map((risk, index) => {
              const IconComponent = getRiskIcon(risk.probability, risk.impact);
              return (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start space-x-3">
                    <IconComponent className="h-5 w-5 text-red-500 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold">{risk.riskName}</h3>
                        <Badge variant={getRiskColor(risk.probability, risk.impact)}>
                          {risk.probability}/{risk.impact}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Source: {risk.source}
                      </p>
                      <div className="text-sm">
                        <strong>Mitigation:</strong> {risk.mitigation}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {riskAnalysis.length === 0 && (
            <div className="text-center py-8">
              <Shield className="h-16 w-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-green-800 mb-2">No Major Risks Identified</h3>
              <p className="text-muted-foreground">
                The analysis did not identify any significant risks in the CET data.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
