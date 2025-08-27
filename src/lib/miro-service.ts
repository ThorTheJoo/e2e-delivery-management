import { MiroApi } from '@mirohq/miro-api';
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
  private client: MiroApi | null = null;
  private isAuthenticated = false;

  constructor() {
    this.initializeClient();
  }

  private initializeClient() {
    const accessToken = process.env.MIRO_ACCESS_TOKEN;
    
    if (accessToken) {
      this.client = new MiroApi(accessToken);
      this.isAuthenticated = true;
    } else {
      console.warn('Miro access token not found. Please configure MIRO_ACCESS_TOKEN in .env.local');
    }
  }

  public isReady(): boolean {
    return this.isAuthenticated && this.client !== null;
  }

  public async authenticate(): Promise<boolean> {
    // For now, we'll use the access token directly
    // In a full implementation, you'd implement OAuth flow here
    const accessToken = process.env.MIRO_ACCESS_TOKEN;
    
    if (!accessToken) {
      throw new Error('Miro access token not configured. Please set MIRO_ACCESS_TOKEN in .env.local');
    }

    try {
      this.client = new MiroApi(accessToken);
      this.isAuthenticated = true;
      return true;
    } catch (error) {
      console.error('Failed to authenticate with Miro:', error);
      return false;
    }
  }

  public async createBoard(config: MiroBoardConfig): Promise<{ id: string; viewLink: string }> {
    if (!this.isReady()) {
      await this.authenticate();
    }

    if (!this.client) {
      throw new Error('Miro client not initialized');
    }

    try {
      const board = await this.client.createBoard({
        name: config.name,
        description: config.description
      });

      return {
        id: board.id,
        viewLink: board.viewLink || `https://miro.com/app/board/${board.id}`
      };
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
    if (this.client) {
      await this.createDomainFrames(board.id, domains);
    }

    return board;
  }

  private async createDomainFrames(boardId: string, domains: TMFOdaDomain[]): Promise<void> {
    if (!this.client) return;

    const board = this.client.getBoard(boardId);
    
    for (let i = 0; i < domains.length; i++) {
      const domain = domains[i];
      
      // Create frame for domain
      const frame = await board.createFrameItem({
        data: { title: domain.name },
        position: { x: i * 850, y: 0 },
        geometry: { width: 800, height: 600 }
      });

      // Add capability cards within the frame
      await this.createCapabilityCards(board, domain.capabilities, frame.id, i);
    }
  }

  private async createCapabilityCards(
    board: any, 
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

      await board.createCardItem({
        data: {
          title: capability.name,
          description: capability.description
        },
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

    if (this.client) {
      await this.createRequirementCards(board.id, specSyncItems);
    }

    return board;
  }

  private async createRequirementCards(boardId: string, items: SpecSyncItem[]): Promise<void> {
    if (!this.client) return;

    const board = this.client.getBoard(boardId);
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

      await board.createCardItem({
        data: {
          title: item.rephrasedRequirementId,
          description: `${item.domain} - ${item.functionName}`
        },
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
    if (!this.isReady()) {
      await this.authenticate();
    }

    if (!this.client) {
      throw new Error('Miro client not initialized');
    }

    try {
      return await this.client.getBoard(boardId);
    } catch (error) {
      console.error('Failed to get Miro board:', error);
      throw error;
    }
  }

  public async deleteBoard(boardId: string): Promise<void> {
    if (!this.isReady()) {
      await this.authenticate();
    }

    if (!this.client) {
      throw new Error('Miro client not initialized');
    }

    try {
      const board = this.client.getBoard(boardId);
      await board.delete();
    } catch (error) {
      console.error('Failed to delete Miro board:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const miroService = new MiroService();
