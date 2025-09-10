import {
  Project,
  TMFCapability,
  ETOMProcess,
  WorkPackage,
  Milestone,
  Risk,
  Dependency,
  Document,
  Estimation,
  Schedule,
  CommercialModel,
} from '@/types';
import { getActiveDataSource } from '@/lib/data-source';
import { SupabaseDataService } from '@/lib/supabase-data-service';

// Import demo data
import demoData from '../../demo-data.json';

class DataService {
  private static instance: DataService;
  private data: any;

  private constructor() {
    this.data = demoData;
  }

  public static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  // Project methods
  async getProject(): Promise<Project> {
    // Try Supabase first if enabled; fall back to demo data
    try {
      if (getActiveDataSource() === 'supabase') {
        const projectsSvc = new SupabaseDataService<any>('projects');
        const rows = await projectsSvc.read();
        if (Array.isArray(rows) && rows.length > 0) {
          const p = rows[0];
          const toStr = (v: unknown) => (typeof v === 'string' ? v : v ? String(v) : '');
          const months = (p.duration_months ?? null) as number | null;
          const duration = months && Number.isFinite(months) ? `${months} months` : toStr(this.data?.project?.duration);
          const project: Project = {
            id: toStr(p.id || this.data?.project?.id || 'PROJECT-001'),
            name: toStr(p.name || this.data?.project?.name || 'Project'),
            customer: toStr(p.customer || this.data?.project?.customer || 'Customer'),
            status: (p.status as any) || (this.data?.project?.status ?? 'In Progress'),
            startDate: toStr(p.start_date || this.data?.project?.startDate),
            endDate: toStr(p.end_date || this.data?.project?.endDate),
            duration,
            teamSize: (p.team_size as number) ?? this.data?.project?.teamSize ?? 0,
            workingDaysPerMonth:
              (p.working_days_per_month as number) ?? this.data?.project?.workingDaysPerMonth ?? 20,
          };
          return project;
        }
      }
    } catch (err) {
      console.warn('Supabase project read failed; falling back to demo data.', err);
    }

    return this.data.project;
  }

  async updateProject(project: Partial<Project>): Promise<Project> {
    this.data.project = { ...this.data.project, ...project };
    return this.data.project;
  }

  // TMF Capabilities methods
  async getTMFCapabilities(): Promise<TMFCapability[]> {
    // Hybrid: Supabase (if enabled) -> fallback to demo data
    try {
      if (getActiveDataSource() === 'supabase') {
        const svc = new SupabaseDataService<any>('tmf_reference_capabilities');
        const rows = await svc.read();
        if (Array.isArray(rows) && rows.length > 0) {
          return rows.map((r) => ({
            id: String(r.id),
            name: String(r.name),
            description: String(r.description || ''),
            segments: Array.isArray(r.metadata?.segments) ? r.metadata.segments : [],
            baseEffort: {
              businessAnalyst: Number(r.metadata?.baseEffort?.businessAnalyst ?? 8),
              solutionArchitect: Number(r.metadata?.baseEffort?.solutionArchitect ?? 6),
              developer: Number(r.metadata?.baseEffort?.developer ?? 20),
              qaEngineer: Number(r.metadata?.baseEffort?.qaEngineer ?? 10),
            },
            complexityFactors: typeof r.metadata?.complexityFactors === 'object'
              ? r.metadata.complexityFactors
              : {},
          } as TMFCapability));
        }
      }
    } catch (err) {
      console.warn('Supabase TMF capabilities read failed; using demo data.', err);
    }
    return Object.values(this.data.tmfCapabilities);
  }

  async getTMFCapability(id: string): Promise<TMFCapability | null> {
    return this.data.tmfCapabilities[id] || null;
  }

  // TMF Reference Domains (read-only, hybrid)
  async getTMFReferenceDomains(): Promise<
    Array<{ id: string; name: string; description: string; category?: string; version?: string }>
  > {
    try {
      if (getActiveDataSource() === 'supabase') {
        const svc = new SupabaseDataService<any>('tmf_reference_domains');
        const rows = await svc.read();
        if (Array.isArray(rows) && rows.length > 0) {
          return rows.map((r) => ({
            id: String(r.id),
            name: String(r.name),
            description: String(r.description || ''),
            category: r.category || r.metadata?.category,
            version: r.version || '1.0',
          }));
        }
      }
    } catch (err) {
      console.warn('Supabase TMF domains read failed; using fallback.', err);
    }

    // Fallback to local static reference service if available, otherwise map from demo data keys
    try {
      const { TMFReferenceService } = await import('@/lib/tmf-reference-service');
      return TMFReferenceService.getReferenceDomains();
    } catch {
      // Last resort: infer from demo data keys
      return Object.keys(this.data?.tmfCapabilities || {}).map((k, i) => ({
        id: `domain-${i + 1}`,
        name: k,
        description: k,
        category: 'Business',
        version: '1.0',
      }));
    }
  }

  async updateTMFCapability(
    id: string,
    capability: Partial<TMFCapability>,
  ): Promise<TMFCapability> {
    this.data.tmfCapabilities[id] = { ...this.data.tmfCapabilities[id], ...capability };
    return this.data.tmfCapabilities[id];
  }

  // eTOM Processes methods
  async getETOMProcesses(): Promise<ETOMProcess[]> {
    const processes: ETOMProcess[] = [];

    // Transform the demo data to match the expected ETOMProcess interface
    Object.values(this.data.etomProcesses).forEach((process: any) => {
      // Create a base effort based on the complexity multiplier and standard effort
      const baseEffort = {
        businessAnalyst: Math.round(10 * (process.complexityMultiplier || 1)),
        solutionArchitect: Math.round(8 * (process.complexityMultiplier || 1)),
        developer: Math.round(20 * (process.complexityMultiplier || 1)),
        qaEngineer: Math.round(12 * (process.complexityMultiplier || 1)),
      };

      // Create complexity factors based on the complexity multiplier
      const complexityFactors = {
        complexity: process.complexityMultiplier || 1,
        dependencies: (process.dependencies?.length || 0) * 0.1 + 1,
        outputs: (process.outputs?.length || 0) * 0.05 + 1,
      };

      processes.push({
        id: process.id,
        name: process.name,
        description: process.description,
        level: 1, // Default level
        category: 'Core Process', // Default category
        subProcesses: [], // No sub-processes in demo data
        baseEffort,
        complexityFactors,
      });
    });

    return processes;
  }

  async getETOMProcess(id: string): Promise<ETOMProcess | null> {
    return this.data.etomProcesses[id] || null;
  }

  // Work Packages methods - Create sample work packages from TMF capabilities
  async getWorkPackages(): Promise<WorkPackage[]> {
    const tmfCapabilities = await this.getTMFCapabilities();
    return tmfCapabilities.map((capability, index) => ({
      id: `wp-${index + 1}`,
      name: `${capability.name} Implementation`,
      description: `Implementation of ${capability.name} capability`,
      type: 'Development' as const,
      effort: capability.baseEffort,
      dependencies: [],
      milestones: [],
      risks: [],
      status: 'Not Started' as const,
    }));
  }

  async getWorkPackage(id: string): Promise<WorkPackage | null> {
    const workPackages = await this.getWorkPackages();
    return workPackages.find((wp) => wp.id === id) || null;
  }

  async createWorkPackage(workPackage: Omit<WorkPackage, 'id'>): Promise<WorkPackage> {
    const newWorkPackage: WorkPackage = {
      ...workPackage,
      id: `wp-${Date.now()}`,
    };

    // Since we're generating work packages dynamically, we'll just return the new one
    return newWorkPackage;
  }

  async updateWorkPackage(id: string, updates: Partial<WorkPackage>): Promise<WorkPackage> {
    const workPackage = await this.getWorkPackage(id);
    if (!workPackage) {
      throw new Error(`Work package with id ${id} not found`);
    }

    return { ...workPackage, ...updates };
  }

  // Milestones methods - Create sample milestones
  async getMilestones(): Promise<Milestone[]> {
    return [
      {
        id: 'ms-1',
        name: 'Project Kickoff',
        description: 'Project initiation and team setup',
        date: '2025-01-15',
        type: 'Project',
        status: 'Completed',
        deliverables: ['Project Charter', 'Team Setup'],
      },
      {
        id: 'ms-2',
        name: 'Requirements Phase',
        description: 'Business requirements gathering and analysis',
        date: '2025-02-15',
        type: 'Phase',
        status: 'In Progress',
        deliverables: ['BRD', 'FRD'],
      },
      {
        id: 'ms-3',
        name: 'Design Phase',
        description: 'Solution design and architecture',
        date: '2025-03-15',
        type: 'Phase',
        status: 'Planned',
        deliverables: ['Technical Design', 'Architecture'],
      },
      {
        id: 'ms-4',
        name: 'Development Phase',
        description: 'Core development and implementation',
        date: '2025-05-15',
        type: 'Phase',
        status: 'Planned',
        deliverables: ['Core System', 'APIs'],
      },
      {
        id: 'ms-5',
        name: 'Go-Live',
        description: 'Production deployment and launch',
        date: '2025-07-15',
        type: 'Go-Live',
        status: 'Planned',
        deliverables: ['Production System', 'User Training'],
      },
    ];
  }

  async createMilestone(milestone: Omit<Milestone, 'id'>): Promise<Milestone> {
    const newMilestone: Milestone = {
      ...milestone,
      id: `ms-${Date.now()}`,
    };

    return newMilestone;
  }

  // Risks methods - Transform the structured risks data
  async getRisks(): Promise<Risk[]> {
    const risks: Risk[] = [];

    // Transform high risks
    if (this.data.risks?.high) {
      this.data.risks.high.forEach((risk: any) => {
        risks.push({
          id: risk.id,
          name: risk.description,
          description: risk.description,
          probability: risk.probability as 'Low' | 'Medium' | 'High',
          impact: risk.impact as 'Low' | 'Medium' | 'High',
          severity: 'High' as const,
          mitigation: risk.mitigation,
          owner: risk.owner,
          status: 'Identified' as const,
        });
      });
    }

    // Transform medium risks
    if (this.data.risks?.medium) {
      this.data.risks.medium.forEach((risk: any) => {
        risks.push({
          id: risk.id,
          name: risk.description,
          description: risk.description,
          probability: risk.probability as 'Low' | 'Medium' | 'High',
          impact: risk.impact as 'Low' | 'Medium' | 'High',
          severity: 'Medium' as const,
          mitigation: risk.mitigation,
          owner: risk.owner,
          status: 'Identified' as const,
        });
      });
    }

    // Transform low risks
    if (this.data.risks?.low) {
      this.data.risks.low.forEach((risk: any) => {
        risks.push({
          id: risk.id,
          name: risk.description,
          description: risk.description,
          probability: risk.probability as 'Low' | 'Medium' | 'High',
          impact: risk.impact as 'Low' | 'Medium' | 'High',
          severity: 'Low' as const,
          mitigation: risk.mitigation,
          owner: risk.owner,
          status: 'Identified' as const,
        });
      });
    }

    return risks;
  }

  async createRisk(risk: Omit<Risk, 'id'>): Promise<Risk> {
    const newRisk: Risk = {
      ...risk,
      id: `risk-${Date.now()}`,
    };

    return newRisk;
  }

  // Dependencies methods - Transform the structured dependencies data
  async getDependencies(): Promise<Dependency[]> {
    const dependencies: Dependency[] = [];

    // Transform system dependencies
    if (this.data.dependencies?.system) {
      this.data.dependencies.system.forEach((dep: any) => {
        dependencies.push({
          id: dep.id,
          name: dep.name,
          description: dep.description,
          type: 'Technical' as const,
          source: 'Legacy Systems',
          target: 'New BSS',
          criticality: dep.impact === 'High' ? 'High' : dep.impact === 'Medium' ? 'Medium' : 'Low',
          status:
            dep.status === 'Resolved'
              ? 'Resolved'
              : dep.status === 'In Progress'
                ? 'In Progress'
                : 'Open',
        });
      });
    }

    // Transform data dependencies
    if (this.data.dependencies?.data) {
      this.data.dependencies.data.forEach((dep: any) => {
        dependencies.push({
          id: dep.id,
          name: dep.name,
          description: dep.description,
          type: 'Business' as const,
          source: 'Legacy Data',
          target: 'New Data Model',
          criticality: dep.impact === 'High' ? 'High' : dep.impact === 'Medium' ? 'Medium' : 'Low',
          status:
            dep.status === 'Resolved'
              ? 'Resolved'
              : dep.status === 'In Progress'
                ? 'In Progress'
                : 'Open',
        });
      });
    }

    // Transform infrastructure dependencies
    if (this.data.dependencies?.infrastructure) {
      this.data.dependencies.infrastructure.forEach((dep: any) => {
        dependencies.push({
          id: dep.id,
          name: dep.name,
          description: dep.description,
          type: 'Technical' as const,
          source: 'On-Premise',
          target: 'Cloud',
          criticality: dep.impact === 'High' ? 'High' : dep.impact === 'Medium' ? 'Medium' : 'Low',
          status:
            dep.status === 'Resolved'
              ? 'Resolved'
              : dep.status === 'In Progress'
                ? 'In Progress'
                : 'Open',
        });
      });
    }

    return dependencies;
  }

  async createDependency(dependency: Omit<Dependency, 'id'>): Promise<Dependency> {
    const newDependency: Dependency = {
      ...dependency,
      id: `dep-${Date.now()}`,
    };

    return newDependency;
  }

  // Documents methods - Create sample documents
  async getDocuments(): Promise<Document[]> {
    return [
      {
        id: 'doc-1',
        name: 'Business Requirements Document',
        type: 'Requirements',
        status: 'Draft',
        version: '1.0',
        lastModified: '2025-01-20',
        owner: 'Business Analyst',
        tags: ['Requirements', 'Business', 'BRD'],
      },
      {
        id: 'doc-2',
        name: 'Technical Design Document',
        type: 'Design',
        status: 'In Review',
        version: '0.9',
        lastModified: '2025-02-01',
        owner: 'Solution Architect',
        tags: ['Design', 'Technical', 'Architecture'],
      },
      {
        id: 'doc-3',
        name: 'Test Plan',
        type: 'Test Plan',
        status: 'Draft',
        version: '1.0',
        lastModified: '2025-02-10',
        owner: 'QA Lead',
        tags: ['Testing', 'Quality', 'Test Plan'],
      },
      {
        id: 'doc-4',
        name: 'User Guide',
        type: 'User Guide',
        status: 'Draft',
        version: '1.0',
        lastModified: '2025-01-15',
        owner: 'Technical Writer',
        tags: ['Documentation', 'User Guide', 'Training'],
      },
    ];
  }

  async createDocument(document: Omit<Document, 'id' | 'lastModified'>): Promise<Document> {
    const newDocument: Document = {
      ...document,
      id: `doc-${Date.now()}`,
      lastModified: new Date().toISOString(),
    };

    return newDocument;
  }

  // Estimation methods
  async calculateEstimation(
    workPackageId: string,
    complexityMultiplier: number = 1,
    riskMultiplier: number = 1,
  ): Promise<Estimation> {
    const workPackage = await this.getWorkPackage(workPackageId);
    if (!workPackage) {
      throw new Error(`Work package with id ${workPackageId} not found`);
    }

    const baseEffort = workPackage.effort;
    const totalEffort = {
      businessAnalyst: Math.round(
        baseEffort.businessAnalyst * complexityMultiplier * riskMultiplier,
      ),
      solutionArchitect: Math.round(
        baseEffort.solutionArchitect * complexityMultiplier * riskMultiplier,
      ),
      developer: Math.round(baseEffort.developer * complexityMultiplier * riskMultiplier),
      qaEngineer: Math.round(baseEffort.qaEngineer * complexityMultiplier * riskMultiplier),
    };

    const estimation: Estimation = {
      id: `est-${Date.now()}`,
      workPackageId,
      baseEffort,
      complexityMultiplier,
      riskMultiplier,
      totalEffort,
      confidence: this.calculateConfidence(complexityMultiplier, riskMultiplier),
      assumptions: [],
    };

    return estimation;
  }

  private calculateConfidence(
    complexityMultiplier: number,
    riskMultiplier: number,
  ): 'Low' | 'Medium' | 'High' {
    const totalMultiplier = complexityMultiplier * riskMultiplier;
    if (totalMultiplier <= 1.2) return 'High';
    if (totalMultiplier <= 1.5) return 'Medium';
    return 'Low';
  }

  // Export data
  async exportData(): Promise<string> {
    return JSON.stringify(this.data, null, 2);
  }

  // Import data
  async importData(data: string): Promise<void> {
    try {
      this.data = JSON.parse(data);
    } catch (error) {
      throw new Error('Invalid JSON data');
    }
  }
}

export const dataService = DataService.getInstance();
export default dataService;
