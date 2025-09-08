import {
  CETv22Data,
  CETv22AnalysisResult,
  CETv22ProjectAnalysis,
  CETv22ResourceAnalysis,
  CETv22EffortAnalysis,
  CETv22PhaseAnalysis,
  CETv22ProductAnalysis,
  CETv22RiskAnalysis,
  CETv22AnalysisMetadata,
  CETv22RoleEffort,
  CETv22TimelineData,
  CETv22EffortTrend,
  CETv22AnalysisError,
  CETv22DomainEffort,
} from '@/types';

export class CETv22AnalyzerService {
  async analyzeCETData(rawData: CETv22Data): Promise<CETv22AnalysisResult> {
    try {
      const analysisStart = Date.now();

      const projectAnalysis = this.analyzeProject(rawData.project);
      const resourceAnalysis = this.analyzeResources(rawData.resourceDemands, rawData.jobProfiles);
      const effortAnalysis = this.analyzeEffort(rawData.resourceDemands);
      const phaseAnalysis = this.analyzePhases(rawData.phases, rawData.resourceDemands);
      const productAnalysis = this.analyzeProducts(rawData.products, rawData.resourceDemands);
      const riskAnalysis = this.analyzeRisks(
        rawData.resourceDemands,
        rawData.jobProfiles,
        rawData.project,
      );
      const metadata = this.generateMetadata(rawData, analysisStart);

      return {
        project: projectAnalysis,
        resources: resourceAnalysis,
        effort: effortAnalysis,
        phases: phaseAnalysis,
        products: productAnalysis,
        risks: riskAnalysis,
        metadata,
      };
    } catch (error) {
      throw new CETv22AnalysisError(
        `Failed to analyze CET data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  private analyzeProject(project: any): CETv22ProjectAnalysis {
    return {
      customerName: project.customerName,
      projectName: project.projectName,
      digitalTelco: project.digitalTelco,
      region: project.region,
      language: project.language,
      sfdcType: project.sfdcType,
      createdDate: project.createdDate,
      status: project.status,
      complexity: this.assessProjectComplexity(project),
      riskFactors: this.identifyProjectRisks(project),
    };
  }

  private analyzeResources(demands: any[], jobProfiles: any[]): CETv22ResourceAnalysis {
    const totalEffort = demands.reduce((sum, demand) => sum + (demand.effortHours || 0), 0);
    const peakResources = Math.max(...demands.map((d) => d.resourceCount || 0), 0);
    const avgResources =
      demands.length > 0
        ? demands.reduce((sum, demand) => sum + (demand.resourceCount || 0), 0) / demands.length
        : 0;

    return {
      totalEffort,
      peakResources,
      averageResources: Math.round(avgResources),
      resourceUtilization: this.calculateResourceUtilization(demands),
      roleBreakdown: this.analyzeRoleBreakdown(demands, jobProfiles),
      timelineAnalysis: this.analyzeResourceTimeline(demands),
      domainBreakdown: this.analyzeDomainBreakdown(demands),
    };
  }

  private analyzeEffort(demands: any[]): CETv22EffortAnalysis {
    const phaseEfforts = new Map<number, number>();
    const weeklyEfforts = new Map<number, number>();

    demands.forEach((demand) => {
      const phase = demand.phaseNumber || 1;
      const week = demand.weekNumber || 1;
      const effort = demand.effortHours || 0;

      phaseEfforts.set(phase, (phaseEfforts.get(phase) || 0) + effort);
      weeklyEfforts.set(week, (weeklyEfforts.get(week) || 0) + effort);
    });

    const totalEffort = Array.from(phaseEfforts.values()).reduce((sum, effort) => sum + effort, 0);

    return {
      phaseBreakdown: Array.from(phaseEfforts.entries()).map(([phase, effort]) => ({
        phaseNumber: phase,
        totalEffort: effort,
        percentage: totalEffort > 0 ? (effort / totalEffort) * 100 : 0,
      })),
      weeklyBreakdown: Array.from(weeklyEfforts.entries()).map(([week, effort]) => ({
        weekNumber: week,
        totalEffort: effort,
      })),
      totalEffort,
      effortTrends: this.analyzeEffortTrends(weeklyEfforts),
    };
  }

  private analyzePhases(phases: any[], demands: any[]): CETv22PhaseAnalysis[] {
    return phases.map((phase) => {
      const phaseDemands = demands.filter((d) => d.phaseNumber === phase.phaseNumber);
      const totalEffort = phaseDemands.reduce((sum, d) => sum + (d.effortHours || 0), 0);
      const resourceCount = Math.max(...phaseDemands.map((d) => d.resourceCount || 0), 0);
      const duration = (phase.endWeek || 4) - (phase.startWeek || 1) + 1;

      return {
        phaseNumber: phase.phaseNumber,
        phaseName: phase.phaseName,
        totalEffort,
        resourceCount,
        duration,
        complexity: this.calculatePhaseComplexity(totalEffort, resourceCount, duration),
        deliverables: phase.deliverables || [],
        riskFactors: this.identifyPhaseRisks(phase, phaseDemands),
      };
    });
  }

  private analyzeProducts(products: any[], demands: any[]): CETv22ProductAnalysis[] {
    return products.map((product) => {
      const productDemands = demands.filter((d) => d.productType === product.type);
      const totalEffort = productDemands.reduce((sum, d) => sum + (d.effortHours || 0), 0);
      const resourceCount = Math.max(...productDemands.map((d) => d.resourceCount || 0), 0);

      return {
        name: product.name,
        type: product.type,
        totalEffort,
        resourceCount,
        complexity: this.calculateProductComplexity(totalEffort, resourceCount),
        phases: product.phases || [1, 2, 3, 4],
        riskFactors: this.identifyProductRisks(product, productDemands),
      };
    });
  }

  private analyzeRisks(demands: any[], jobProfiles: any[], project: any): CETv22RiskAnalysis[] {
    const risks: CETv22RiskAnalysis[] = [];

    // High effort concentration risk
    const totalEffort = demands.reduce((sum, d) => sum + (d.effortHours || 0), 0);
    const highEffortProducts = demands
      .filter((d) => (d.effortHours || 0) > totalEffort * 0.3)
      .map((d) => d.productType);

    if (highEffortProducts.length > 0) {
      risks.push({
        source: highEffortProducts.join(', '),
        riskName: 'Effort Concentration Risk',
        probability: 'Medium',
        impact: 'High',
        mitigation: 'Distribute workload across multiple products and phases',
      });
    }

    // Resource availability risk
    const peakResources = Math.max(...demands.map((d) => d.resourceCount || 0), 0);
    if (peakResources > 20) {
      risks.push({
        source: 'Resource Planning',
        riskName: 'Resource Availability Risk',
        probability: 'High',
        impact: 'High',
        mitigation: 'Plan resource hiring and training in advance',
      });
    }

    // Skill gap risk
    const uniqueRoles = new Set(demands.map((d) => d.jobProfile));
    const availableSkills = new Set(jobProfiles.map((p) => p.projectRole));
    const skillGaps = Array.from(uniqueRoles).filter((role) => !availableSkills.has(role));

    if (skillGaps.length > 0) {
      risks.push({
        source: skillGaps.join(', '),
        riskName: 'Skill Gap Risk',
        probability: 'Medium',
        impact: 'Medium',
        mitigation: 'Develop training programs or hire specialized resources',
      });
    }

    // Timeline risk
    const projectDuration =
      demands.length > 0
        ? Math.max(...demands.map((d) => d.weekNumber || 0)) / 4 // Convert weeks to months
        : 0;

    if (projectDuration > 12) {
      risks.push({
        source: 'Project Timeline',
        riskName: 'Timeline Risk',
        probability: 'Medium',
        impact: 'High',
        mitigation: 'Implement agile delivery methods and phased releases',
      });
    }

    return risks;
  }

  private generateMetadata(rawData: CETv22Data, analysisStart: number): CETv22AnalysisMetadata {
    const analysisTime = Date.now() - analysisStart;

    return {
      analyzedAt: new Date().toISOString(),
      analysisTime,
      confidence: this.calculateConfidence(rawData),
      dataQuality: this.assessDataQuality(rawData),
    };
  }

  // Helper methods
  private assessProjectComplexity(project: any): 'Low' | 'Medium' | 'High' {
    let complexityScore = 0;

    // Region complexity
    if (project.region && project.region !== 'Global') complexityScore += 1;

    // Digital Telco complexity
    if (project.digitalTelco && project.digitalTelco !== 'Standard') complexityScore += 1;

    // Language complexity
    if (project.language && project.language !== 'English') complexityScore += 1;

    if (complexityScore >= 2) return 'High';
    if (complexityScore >= 1) return 'Medium';
    return 'Low';
  }

  private identifyProjectRisks(project: any): string[] {
    const risks: string[] = [];

    if (project.region === 'Global') {
      risks.push('Multi-region coordination required');
    }

    if (project.language !== 'English') {
      risks.push('Language translation requirements');
    }

    if (project.digitalTelco !== 'Standard') {
      risks.push('Specialized telco requirements');
    }

    return risks;
  }

  private calculateResourceUtilization(demands: any[]): number {
    if (demands.length === 0) return 0;

    const totalEffort = demands.reduce((sum, d) => sum + (d.effortHours || 0), 0);
    const totalResourceHours = demands.reduce((sum, d) => sum + (d.resourceCount || 0) * 40, 0);

    return totalResourceHours > 0 ? (totalEffort / totalResourceHours) * 100 : 0;
  }

  private analyzeRoleBreakdown(demands: any[], jobProfiles: any[]): CETv22RoleEffort[] {
    const roleEfforts = new Map<string, number>();

    demands.forEach((demand) => {
      const role = demand.jobProfile || 'Unknown';
      const effort = demand.effortHours || 0;
      roleEfforts.set(role, (roleEfforts.get(role) || 0) + effort);
    });

    const totalEffort = Array.from(roleEfforts.values()).reduce((sum, effort) => sum + effort, 0);

    return Array.from(roleEfforts.entries())
      .map(([role, effort]) => ({
        role,
        effort,
        percentage: totalEffort > 0 ? (effort / totalEffort) * 100 : 0,
      }))
      .sort((a, b) => b.effort - a.effort);
  }

  private analyzeResourceTimeline(demands: any[]): CETv22TimelineData[] {
    const timelineData = new Map<number, { effort: number; resources: number; date: string }>();

    demands.forEach((demand) => {
      const week = demand.weekNumber || 1;
      const existing = timelineData.get(week) || {
        effort: 0,
        resources: 0,
        date: demand.weekDate || '',
      };

      timelineData.set(week, {
        effort: existing.effort + (demand.effortHours || 0),
        resources: Math.max(existing.resources, demand.resourceCount || 0),
        date: existing.date || demand.weekDate || '',
      });
    });

    return Array.from(timelineData.entries())
      .sort(([a], [b]) => a - b)
      .map(([weekNumber, data]) => ({
        weekNumber,
        totalEffort: data.effort,
        resourceCount: data.resources,
        date: data.date,
      }));
  }

  private analyzeEffortTrends(weeklyEfforts: Map<number, number>): CETv22EffortTrend[] {
    const sortedWeeks = Array.from(weeklyEfforts.entries()).sort(([a], [b]) => a - b);
    const trends: CETv22EffortTrend[] = [];

    for (let i = 0; i < sortedWeeks.length; i++) {
      const [week, effort] = sortedWeeks[i];
      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';

      if (i > 0) {
        const prevEffort = sortedWeeks[i - 1][1];
        const change = ((effort - prevEffort) / prevEffort) * 100;

        if (change > 10) trend = 'increasing';
        else if (change < -10) trend = 'decreasing';
      }

      trends.push({
        week,
        effort,
        trend,
      });
    }

    return trends;
  }

  private analyzeDomainBreakdown(demands: any[]): CETv22DomainEffort[] {
    console.log('analyzeDomainBreakdown - Input demands:', demands);
    console.log('analyzeDomainBreakdown - Total demands count:', demands.length);

    // Debug: Log first few demands to see their structure
    console.log('analyzeDomainBreakdown - First 3 demands:', demands.slice(0, 3));

    interface DomainData {
      totalEffort: number;
      roleEfforts: Map<string, number>;
      resourceCount: number;
      phases: Set<number>;
    }

    const domainMap = new Map<string, DomainData>();

    // Filter only Ph1Demand data for domain analysis
    const ph1Demands = demands.filter(
      (d) => d.phaseNumber === 1 && d.domain && d.totalMandateEffort,
    );
    console.log('analyzeDomainBreakdown - Ph1Demand filtered:', ph1Demands);
    console.log(
      'analyzeDomainBreakdown - Ph1Demand with domain:',
      ph1Demands.filter((d) => d.domain),
    );
    console.log(
      'analyzeDomainBreakdown - Ph1Demand with totalMandateEffort:',
      ph1Demands.filter((d) => d.totalMandateEffort),
    );

    // Debug: Check what's being filtered out
    const phase1Demands = demands.filter((d) => d.phaseNumber === 1);
    console.log('analyzeDomainBreakdown - All phase 1 demands:', phase1Demands.length);
    console.log(
      'analyzeDomainBreakdown - Phase 1 demands with domain:',
      phase1Demands.filter((d) => d.domain).length,
    );
    console.log(
      'analyzeDomainBreakdown - Phase 1 demands with totalMandateEffort:',
      phase1Demands.filter((d) => d.totalMandateEffort).length,
    );

    ph1Demands.forEach((demand) => {
      const domain = demand.domain || 'Unknown';
      const effort = demand.totalMandateEffort || 0;

      if (!domainMap.has(domain)) {
        domainMap.set(domain, {
          totalEffort: 0,
          roleEfforts: new Map(),
          resourceCount: 0,
          phases: new Set(),
        });
      }

      const domainData = domainMap.get(domain)!;
      domainData.totalEffort += effort;
      domainData.resourceCount = Math.max(domainData.resourceCount, demand.resourceCount || 0);
      domainData.phases.add(demand.phaseNumber || 1);

      const role = demand.jobProfile || 'Unknown';
      if (!domainData.roleEfforts.has(role)) {
        domainData.roleEfforts.set(role, 0);
      }
      domainData.roleEfforts.set(role, domainData.roleEfforts.get(role)! + effort);
    });

    console.log('analyzeDomainBreakdown - Domain map:', domainMap);

    const totalEffort = Array.from(domainMap.values()).reduce(
      (sum, data) => sum + data.totalEffort,
      0,
    );

    const result: CETv22DomainEffort[] = Array.from(domainMap.entries()).map(([domain, data]) => {
      const roleBreakdown: CETv22RoleEffort[] = Array.from(data.roleEfforts.entries()).map(
        ([role, effort]) => ({
          role,
          effort,
          percentage: totalEffort > 0 ? (effort / totalEffort) * 100 : 0,
        }),
      );

      return {
        domain,
        totalEffort: data.totalEffort,
        resourceCount: data.resourceCount,
        percentage: totalEffort > 0 ? (data.totalEffort / totalEffort) * 100 : 0,
        roleBreakdown,
        phases: Array.from(data.phases),
      };
    });

    console.log('analyzeDomainBreakdown - Final result:', result);
    return result;
  }

  private calculatePhaseComplexity(
    totalEffort: number,
    resourceCount: number,
    duration: number,
  ): 'Low' | 'Medium' | 'High' {
    const effortScore = totalEffort / 1000; // Effort per 1000 hours
    const resourceScore = resourceCount / 10; // Resources per 10 people
    const durationScore = duration / 4; // Duration per month

    const complexityScore = effortScore + resourceScore + durationScore;

    if (complexityScore >= 3) return 'High';
    if (complexityScore >= 1.5) return 'Medium';
    return 'Low';
  }

  private identifyPhaseRisks(phase: any, phaseDemands: any[]): string[] {
    const risks: string[] = [];

    const totalEffort = phaseDemands.reduce((sum, d) => sum + (d.effortHours || 0), 0);
    if (totalEffort > 2000) {
      risks.push('High effort concentration');
    }

    const peakResources = Math.max(...phaseDemands.map((d) => d.resourceCount || 0), 0);
    if (peakResources > 15) {
      risks.push('High resource requirements');
    }

    const duration = (phase.endWeek || 4) - (phase.startWeek || 1) + 1;
    if (duration > 12) {
      risks.push('Extended timeline');
    }

    return risks;
  }

  private calculateProductComplexity(
    totalEffort: number,
    resourceCount: number,
  ): 'Low' | 'Medium' | 'High' {
    const effortScore = totalEffort / 1000;
    const resourceScore = resourceCount / 10;

    const complexityScore = effortScore + resourceScore;

    if (complexityScore >= 2) return 'High';
    if (complexityScore >= 1) return 'Medium';
    return 'Low';
  }

  private identifyProductRisks(product: any, productDemands: any[]): string[] {
    const risks: string[] = [];

    const totalEffort = productDemands.reduce((sum, d) => sum + (d.effortHours || 0), 0);
    if (totalEffort > 1500) {
      risks.push('High complexity implementation');
    }

    const uniqueRoles = new Set(productDemands.map((d) => d.jobProfile));
    if (uniqueRoles.size > 5) {
      risks.push('Multiple specialized skills required');
    }

    return risks;
  }

  private calculateConfidence(rawData: CETv22Data): number {
    let confidenceScore = 0;
    let totalChecks = 0;

    // Check project data completeness
    totalChecks += 1;
    if (rawData.project.customerName && rawData.project.projectName) {
      confidenceScore += 1;
    }

    // Check resource demands data quality
    totalChecks += 1;
    if (rawData.resourceDemands.length > 0) {
      const validDemands = rawData.resourceDemands.filter(
        (d) => d.weekNumber && d.effortHours > 0 && d.resourceCount > 0,
      );
      confidenceScore += validDemands.length / rawData.resourceDemands.length;
    }

    // Check job profiles completeness
    totalChecks += 1;
    if (rawData.jobProfiles.length > 0) {
      const completeProfiles = rawData.jobProfiles.filter(
        (p) => p.projectRole && p.resourceLevel && p.hourlyRate > 0,
      );
      confidenceScore += completeProfiles.length / rawData.jobProfiles.length;
    }

    return totalChecks > 0 ? (confidenceScore / totalChecks) * 100 : 0;
  }

  private assessDataQuality(rawData: CETv22Data): 'Poor' | 'Fair' | 'Good' | 'Excellent' {
    const confidence = this.calculateConfidence(rawData);

    if (confidence >= 90) return 'Excellent';
    if (confidence >= 75) return 'Good';
    if (confidence >= 50) return 'Fair';
    return 'Poor';
  }
}
