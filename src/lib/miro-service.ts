import { Project, TMFOdaDomain, TMFOdaCapability, SpecSyncItem } from '@/types';

export interface MiroBoardConfig {
  name: string;
  description: string;
  projectId?: string;
}

export interface MiroCardConfig {
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  position?: { x: number; y: number };
  geometry?: { width: number; height: number };
  style?: {
    fillColor?: string;
    strokeColor?: string;
  };
}

export interface MiroFrameConfig {
  title: string;
  position?: { x: number; y: number };
  geometry?: { width: number; height: number };
}

export class MiroService {
  private apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl = '/api/miro/boards';
  }

  private async callMiroAPI(action: string, data: any): Promise<any> {
    const response = await fetch(this.apiBaseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, data }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  public async createBoard(config: MiroBoardConfig): Promise<{ id: string; viewLink: string }> {
    console.log('Creating Miro board:', config.name);
    
    try {
      const result = await this.callMiroAPI('createBoard', {
        name: config.name,
        description: config.description
      });

      console.log('Board created successfully:', result.id);
      return result;
    } catch (error) {
      console.error('Failed to create Miro board:', error);
      throw error;
    }
  }

  public async createTMFBoard(project: Project, domains: TMFOdaDomain[]): Promise<{ id: string; viewLink: string }> {
    // Create main board
    const boardConfig: MiroBoardConfig = {
      name: `${project.name} - TMF Architecture`,
      description: `Visual mapping of ${domains.length} TMF domains with ${domains.reduce((acc, domain) => acc + domain.capabilities.length, 0)} capabilities`
    };

    const board = await this.createBoard(boardConfig);

    // Create domain frames and capability cards
    await this.createDomainFrames(board.id, domains);

    return board;
  }

  private async createDomainFrames(boardId: string, domains: TMFOdaDomain[]): Promise<void> {
    for (let i = 0; i < domains.length; i++) {
      const domain = domains[i];
      
      // Create frame for domain
      const frame = await this.callMiroAPI('createFrame', {
        boardId,
        title: domain.name,
        position: { x: i * 850, y: 0 },
        geometry: { width: 800, height: 600 }
      });

      // Add capability cards within the frame
      await this.createCapabilityCards(boardId, domain.capabilities, frame.id, i);
    }
  }

  private async createCapabilityCards(
    boardId: string, 
    capabilities: TMFOdaCapability[], 
    frameId: string, 
    domainIndex: number
  ): Promise<void> {
    const cardsPerRow = 3;
    const cardWidth = 250;
    const cardHeight = 120;
    const spacing = 20;

    for (let i = 0; i < capabilities.length; i++) {
      const capability = capabilities[i];
      const row = Math.floor(i / cardsPerRow);
      const col = i % cardsPerRow;

      const x = domainIndex * 850 + 50 + col * (cardWidth + spacing);
      const y = 50 + row * (cardHeight + spacing);

      await this.callMiroAPI('createCard', {
        boardId,
        title: capability.name,
        description: capability.description,
        position: { x, y },
        geometry: { width: cardWidth, height: cardHeight },
        style: {
          fillColor: '#4ecdc4',
          strokeColor: '#333'
        }
      });
    }
  }

  public async createSpecSyncBoard(specSyncItems: SpecSyncItem[]): Promise<{ id: string; viewLink: string }> {
    const boardConfig: MiroBoardConfig = {
      name: 'SpecSync Requirements Mapping',
      description: `Visual mapping of ${specSyncItems.length} requirements from SpecSync`
    };

    const board = await this.createBoard(boardConfig);

    await this.createRequirementCards(board.id, specSyncItems);

    return board;
  }

  private async createRequirementCards(boardId: string, items: SpecSyncItem[]): Promise<void> {
    const cardsPerRow = 4;
    const cardWidth = 200;
    const cardHeight = 100;
    const spacing = 15;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const row = Math.floor(i / cardsPerRow);
      const col = i % cardsPerRow;

      const x = 50 + col * (cardWidth + spacing);
      const y = 50 + row * (cardHeight + spacing);

      await this.callMiroAPI('createCard', {
        boardId,
        title: item.rephrasedRequirementId,
        description: `${item.domain} - ${item.functionName}`,
        position: { x, y },
        geometry: { width: cardWidth, height: cardHeight },
        style: {
          fillColor: '#ff6b6b',
          strokeColor: '#333'
        }
      });
    }
  }

  public async getBoard(boardId: string): Promise<any> {
    // This would need a separate API endpoint for getting board details
    throw new Error('getBoard not implemented yet');
  }

  public async deleteBoard(boardId: string): Promise<void> {
    // This would need a separate API endpoint for deleting boards
    throw new Error('deleteBoard not implemented yet');
  }
}

// Export singleton instance
export const miroService = new MiroService();
