import * as XLSX from 'xlsx';
import {
  CETv22Data,
  CETv22Project,
  CETv22ResourceDemand,
  CETv22JobProfile,
  CETv22LookupValue,
  CETv22DealType,
  CETv22Phase,
  CETv22Product,
  CETv22ParsingError
} from '@/types';

export class CETv22ParserService {
  async parseExcelFile(fileBuffer: Buffer): Promise<CETv22Data> {
    try {
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheets = this.extractSheets(workbook);

      return {
        project: this.extractProjectInfo(sheets),
        resourceDemands: this.extractResourceDemands(sheets),
        jobProfiles: this.extractJobProfiles(sheets),
        phases: this.extractPhases(sheets),
        products: this.extractProducts(sheets),
        lookupValues: this.extractLookupValues(sheets),
        dealTypes: this.extractDealTypes(sheets)
      };
    } catch (error) {
      throw new CETv22ParsingError(
        `Failed to parse CET v22.0 Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  private extractSheets(workbook: XLSX.WorkBook): Record<string, any[][]> {
    const sheets: Record<string, any[][]> = {};

    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      sheets[sheetName] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    });

    return sheets;
  }

  private extractProjectInfo(sheets: Record<string, any[][]>): CETv22Project {
    try {
      const attributesSheet = sheets['Attributes'];
      if (!attributesSheet) {
        throw new Error('Attributes sheet not found');
      }

      return {
        customerName: this.findCellValue(attributesSheet, 'Customer Name') || 'Unknown Customer',
        projectName: this.findCellValue(attributesSheet, 'Project Name') || 'CET Project',
        digitalTelco: this.findCellValue(attributesSheet, 'Digital Telco') || 'Standard',
        region: this.findCellValue(attributesSheet, 'Region') || 'Global',
        language: this.findCellValue(attributesSheet, 'Language') || 'English',
        sfdcType: this.findCellValue(attributesSheet, 'SFDC Type') || 'New Business',
        createdDate: this.findCellValue(attributesSheet, 'Created Date') || new Date().toISOString().split('T')[0],
        status: this.findCellValue(attributesSheet, 'Status') || 'Draft'
      };
    } catch (error) {
      console.warn('Error extracting project info:', error);
      // Return default project info
      return {
        customerName: 'Unknown Customer',
        projectName: 'CET Project',
        digitalTelco: 'Standard',
        region: 'Global',
        language: 'English',
        sfdcType: 'New Business',
        createdDate: new Date().toISOString().split('T')[0],
        status: 'Draft'
      };
    }
  }

  private extractResourceDemands(sheets: Record<string, any[][]>): CETv22ResourceDemand[] {
    const demands: CETv22ResourceDemand[] = [];
    const demandSheets = ['Ph1Demand', 'Ph2Demand', 'Ph3Demand', 'Ph4Demand', 'GovDemand', 'ENCDemand', 'ASCDemand', 'CMADemand'];

    demandSheets.forEach(sheetName => {
      if (sheets[sheetName]) {
        const sheetDemands = this.processDemandSheet(sheets[sheetName], sheetName);
        demands.push(...sheetDemands);
      }
    });

    return demands;
  }

  private processDemandSheet(sheetData: any[][], sheetName: string): CETv22ResourceDemand[] {
    const demands: CETv22ResourceDemand[] = [];

    if (sheetData.length < 2) return demands; // Need at least header + one data row

    const headers = sheetData[0];

    for (let i = 1; i < sheetData.length; i++) {
      const row = sheetData[i];
      if (this.isValidDemandRow(row, headers)) {
        const demand = this.createResourceDemand(row, headers, sheetName);
        if (demand) {
          demands.push(demand);
        }
      }
    }

    return demands;
  }

  private createResourceDemand(row: any[], headers: string[], sheetName: string): CETv22ResourceDemand | null {
    try {
      const weekNumber = parseInt(this.getCellValue(row, headers, 'Week Number'));
      const effortHours = parseFloat(this.getCellValue(row, headers, 'Effort Hours') || '0');
      const resourceCount = parseInt(this.getCellValue(row, headers, 'Resource Count') || '0');

      if (isNaN(weekNumber) || isNaN(effortHours) || isNaN(resourceCount)) {
        return null;
      }

      return {
        weekNumber,
        weekDate: this.getCellValue(row, headers, 'Week Date') || '',
        jobProfile: this.getCellValue(row, headers, 'Job Profile') || 'Unknown',
        effortHours,
        resourceCount,
        productType: this.getProductTypeFromSheet(sheetName),
        phaseNumber: this.getPhaseFromSheet(sheetName),
        complexityLevel: this.getCellValue(row, headers, 'Complexity Level')
      };
    } catch (error) {
      console.warn('Error creating resource demand:', error);
      return null;
    }
  }

  private extractJobProfiles(sheets: Record<string, any[][]>): CETv22JobProfile[] {
    const profiles: CETv22JobProfile[] = [];

    if (!sheets['JobProfiles']) return profiles;

    const sheetData = sheets['JobProfiles'];
    if (sheetData.length < 2) return profiles;

    const headers = sheetData[0];

    for (let i = 1; i < sheetData.length; i++) {
      const row = sheetData[i];
      const profile = this.createJobProfile(row, headers);
      if (profile) {
        profiles.push(profile);
      }
    }

    return profiles;
  }

  private createJobProfile(row: any[], headers: string[]): CETv22JobProfile | null {
    try {
      const id = this.getCellValue(row, headers, 'ID') || `profile_${Date.now()}_${Math.random()}`;

      return {
        id,
        productService: this.getCellValue(row, headers, 'Product Service') || 'Unknown',
        projectTeam: this.getCellValue(row, headers, 'Project Team') || 'Unknown',
        projectRole: this.getCellValue(row, headers, 'Project Role') || 'Unknown',
        salesRegion: this.getCellValue(row, headers, 'Sales Region') || 'Global',
        salesTerritory: this.getCellValue(row, headers, 'Sales Territory') || 'Global',
        supervisoryOrganization: this.getCellValue(row, headers, 'Supervisory Organization') || 'Unknown',
        workdayJobProfile: this.getCellValue(row, headers, 'Workday Job Profile') || 'Unknown',
        resourceLevel: this.getCellValue(row, headers, 'Resource Level') || 'Mid',
        resourceCostRegion: this.getCellValue(row, headers, 'Resource Cost Region') || 'Global',
        demandLocationCountryCode: this.getCellValue(row, headers, 'Demand Location Country Code') || 'US',
        workerType: this.getCellValue(row, headers, 'Worker Type') || 'Full-Time',
        hourlyRate: parseFloat(this.getCellValue(row, headers, 'Hourly Rate') || '100'),
        availability: parseFloat(this.getCellValue(row, headers, 'Availability') || '40')
      };
    } catch (error) {
      console.warn('Error creating job profile:', error);
      return null;
    }
  }

  private extractPhases(sheets: Record<string, any[][]>): CETv22Phase[] {
    const phases: CETv22Phase[] = [];

    // Create default phases based on demand sheets
    const phaseSheets = ['Ph1Demand', 'Ph2Demand', 'Ph3Demand', 'Ph4Demand'];
    const phaseNames = ['Requirements & Analysis', 'Design & Architecture', 'Implementation', 'Testing & Deployment'];

    phaseSheets.forEach((sheetName, index) => {
      if (sheets[sheetName]) {
        const phaseNumber = index + 1;
        const phaseData = this.analyzePhaseData(sheets[sheetName], phaseNumber);

        phases.push({
          phaseNumber,
          phaseName: phaseNames[index],
          startWeek: phaseData.startWeek,
          endWeek: phaseData.endWeek,
          totalEffort: phaseData.totalEffort,
          resourceCount: phaseData.resourceCount,
          complexityLevel: this.calculateComplexityLevel(phaseData.totalEffort),
          deliverables: this.getPhaseDeliverables(phaseNumber)
        });
      }
    });

    return phases;
  }

  private analyzePhaseData(sheetData: any[][], phaseNumber: number): { startWeek: number; endWeek: number; totalEffort: number; resourceCount: number } {
    if (sheetData.length < 2) {
      return { startWeek: 1, endWeek: 4, totalEffort: 0, resourceCount: 0 };
    }

    const headers = sheetData[0];
    let startWeek = Infinity;
    let endWeek = 0;
    let totalEffort = 0;
    let maxResourceCount = 0;

    for (let i = 1; i < sheetData.length; i++) {
      const row = sheetData[i];
      const weekNumber = parseInt(this.getCellValue(row, headers, 'Week Number'));
      const effortHours = parseFloat(this.getCellValue(row, headers, 'Effort Hours') || '0');
      const resourceCount = parseInt(this.getCellValue(row, headers, 'Resource Count') || '0');

      if (!isNaN(weekNumber)) {
        startWeek = Math.min(startWeek, weekNumber);
        endWeek = Math.max(endWeek, weekNumber);
        totalEffort += effortHours;
        maxResourceCount = Math.max(maxResourceCount, resourceCount);
      }
    }

    return {
      startWeek: startWeek === Infinity ? 1 : startWeek,
      endWeek: endWeek === 0 ? 4 : endWeek,
      totalEffort,
      resourceCount: maxResourceCount
    };
  }

  private extractProducts(sheets: Record<string, any[][]>): CETv22Product[] {
    const products: CETv22Product[] = [];
    const productSheets = ['GovDemand', 'ENCDemand', 'ASCDemand', 'CMADemand'];
    const productNames = ['Governance', 'Encompass', 'Ascendon', 'CMA'];

    productSheets.forEach((sheetName, index) => {
      if (sheets[sheetName]) {
        const productData = this.analyzeProductData(sheets[sheetName]);

        products.push({
          name: productNames[index],
          type: this.getProductTypeFromSheet(sheetName),
          totalEffort: productData.totalEffort,
          resourceCount: productData.resourceCount,
          complexityLevel: this.calculateComplexityLevel(productData.totalEffort),
          phases: [1, 2, 3, 4] // All products span all phases
        });
      }
    });

    return products;
  }

  private analyzeProductData(sheetData: any[][]): { totalEffort: number; resourceCount: number } {
    if (sheetData.length < 2) {
      return { totalEffort: 0, resourceCount: 0 };
    }

    const headers = sheetData[0];
    let totalEffort = 0;
    let maxResourceCount = 0;

    for (let i = 1; i < sheetData.length; i++) {
      const row = sheetData[i];
      const effortHours = parseFloat(this.getCellValue(row, headers, 'Effort Hours') || '0');
      const resourceCount = parseInt(this.getCellValue(row, headers, 'Resource Count') || '0');

      totalEffort += effortHours;
      maxResourceCount = Math.max(maxResourceCount, resourceCount);
    }

    return { totalEffort, resourceCount: maxResourceCount };
  }

  private extractLookupValues(sheets: Record<string, any[][]>): CETv22LookupValue[] {
    const lookupValues: CETv22LookupValue[] = [];

    // Extract from various reference sheets
    const referenceSheets = ['LookupValues', 'GovRefData', 'ENCRefData', 'ASCRefData', 'CMARefData'];

    referenceSheets.forEach(sheetName => {
      if (sheets[sheetName]) {
        const sheetLookups = this.processLookupSheet(sheets[sheetName], sheetName);
        lookupValues.push(...sheetLookups);
      }
    });

    return lookupValues;
  }

  private processLookupSheet(sheetData: any[][], sheetName: string): CETv22LookupValue[] {
    const lookups: CETv22LookupValue[] = [];

    if (sheetData.length < 2) return lookups;

    const headers = sheetData[0];

    for (let i = 1; i < sheetData.length; i++) {
      const row = sheetData[i];
      const lookup = this.createLookupValue(row, headers, sheetName);
      if (lookup) {
        lookups.push(lookup);
      }
    }

    return lookups;
  }

  private createLookupValue(row: any[], headers: string[], category: string): CETv22LookupValue | null {
    try {
      const key = this.getCellValue(row, headers, 'Key') || this.getCellValue(row, headers, 'Code');
      const value = this.getCellValue(row, headers, 'Value') || this.getCellValue(row, headers, 'Name');
      const description = this.getCellValue(row, headers, 'Description');

      if (!key || !value) return null;

      return {
        key,
        value,
        category,
        description
      };
    } catch (error) {
      console.warn('Error creating lookup value:', error);
      return null;
    }
  }

  private extractDealTypes(sheets: Record<string, any[][]>): CETv22DealType[] {
    const dealTypes: CETv22DealType[] = [];

    if (!sheets['Deal Types Definition']) return dealTypes;

    const sheetData = sheets['Deal Types Definition'];
    if (sheetData.length < 2) return dealTypes;

    const headers = sheetData[0];

    for (let i = 1; i < sheetData.length; i++) {
      const row = sheetData[i];
      const dealType = this.createDealType(row, headers);
      if (dealType) {
        dealTypes.push(dealType);
      }
    }

    return dealTypes;
  }

  private createDealType(row: any[], headers: string[]): CETv22DealType | null {
    try {
      const id = this.getCellValue(row, headers, 'ID') || `deal_${Date.now()}_${Math.random()}`;
      const name = this.getCellValue(row, headers, 'Name') || 'Unknown Deal Type';

      return {
        id,
        name,
        description: this.getCellValue(row, headers, 'Description') || '',
        commercialModel: this.getCellValue(row, headers, 'Commercial Model') || 'Fixed Price',
        riskFactors: this.getCellValue(row, headers, 'Risk Factors')?.split(',') || []
      };
    } catch (error) {
      console.warn('Error creating deal type:', error);
      return null;
    }
  }

  // Utility methods
  private findCellValue(sheet: any[][], searchTerm: string): string {
    for (const row of sheet) {
      for (let i = 0; i < row.length; i++) {
        const cellValue = String(row[i] || '').toLowerCase();
        if (cellValue.includes(searchTerm.toLowerCase())) {
          // Look for value in next cell or same row
          if (i + 1 < row.length && row[i + 1]) {
            return String(row[i + 1]);
          }
        }
      }
    }
    return '';
  }

  private getCellValue(row: any[], headers: string[], columnName: string): string {
    const index = headers.findIndex(header =>
      String(header || '').toLowerCase().includes(columnName.toLowerCase())
    );
    return index !== -1 && row[index] ? String(row[index]) : '';
  }

  private isValidDemandRow(row: any[], headers: string[]): boolean {
    const weekIndex = headers.findIndex(h => String(h || '').toLowerCase().includes('week number'));
    const effortIndex = headers.findIndex(h => String(h || '').toLowerCase().includes('effort hours'));

    if (weekIndex === -1 || effortIndex === -1) return false;

    const weekNumber = parseInt(String(row[weekIndex] || ''));
    const effortHours = parseFloat(String(row[effortIndex] || ''));

    return !isNaN(weekNumber) && !isNaN(effortHours) && effortHours > 0;
  }

  private getProductTypeFromSheet(sheetName: string): string {
    const mapping: Record<string, string> = {
      'Ph1Demand': 'Phase 1',
      'Ph2Demand': 'Phase 2',
      'Ph3Demand': 'Phase 3',
      'Ph4Demand': 'Phase 4',
      'GovDemand': 'Governance',
      'ENCDemand': 'Encompass',
      'ASCDemand': 'Ascendon',
      'CMADemand': 'CMA'
    };
    return mapping[sheetName] || sheetName;
  }

  private getPhaseFromSheet(sheetName: string): number {
    if (sheetName.includes('Ph1')) return 1;
    if (sheetName.includes('Ph2')) return 2;
    if (sheetName.includes('Ph3')) return 3;
    if (sheetName.includes('Ph4')) return 4;
    return 1;
  }

  private calculateComplexityLevel(totalEffort: number): 'Low' | 'Medium' | 'High' {
    if (totalEffort > 2000) return 'High';
    if (totalEffort > 1000) return 'Medium';
    return 'Low';
  }

  private getPhaseDeliverables(phaseNumber: number): string[] {
    const deliverables: Record<number, string[]> = {
      1: ['Requirements Document', 'Project Charter', 'Team Setup', 'Initial Architecture'],
      2: ['Technical Design', 'Architecture Document', 'Development Plan', 'Test Strategy'],
      3: ['Core Implementation', 'Unit Tests', 'Integration Tests', 'User Documentation'],
      4: ['System Testing', 'User Acceptance Testing', 'Go-Live Preparation', 'Production Deployment']
    };
    return deliverables[phaseNumber] || [`Phase ${phaseNumber} Deliverables`];
  }
}
