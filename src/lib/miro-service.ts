import { Project, TMFOdaDomain, TMFOdaCapability, SpecSyncItem } from '@/types';
import { miroAuthService } from './miro-auth-service';

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
  private testBoardId: string | null = null;

  constructor() {
    this.apiBaseUrl = '/api/miro/boards';
    // Load test board ID from localStorage if available
    if (typeof window !== 'undefined') {
      this.testBoardId = localStorage.getItem('miro_test_board_id');
    }
  }

  private async callMiroAPI(action: string, data: any): Promise<any> {
    // Check if we have a valid access token
    const accessToken = miroAuthService.getAccessToken();
    
    if (!accessToken) {
      throw new Error('No valid Miro access token. Please authenticate with Miro first.');
    }

    const response = await fetch(this.apiBaseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
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

  public async getOrCreateTestBoard(projectName: string): Promise<{ id: string; viewLink: string }> {
    // Check if we have a stored test board ID
    if (this.testBoardId) {
      try {
        console.log('Attempting to reuse existing test board:', this.testBoardId);
        // Try to get the existing board
        const board = await this.callMiroAPI('getBoard', { boardId: this.testBoardId });
        console.log('Successfully reused existing test board');
        return board;
      } catch (error) {
        console.log('Failed to reuse existing board, creating new one:', error);
        // If the board doesn't exist or we can't access it, create a new one
        this.testBoardId = null;
        if (typeof window !== 'undefined') {
          localStorage.removeItem('miro_test_board_id');
        }
      }
    }

    // Create new test board
    const boardConfig: MiroBoardConfig = {
      name: `${projectName} - TMF Architecture (Test)`,
      description: `Test board for TMF domain and capability visualization - Created for prototyping`
    };

    const board = await this.createBoard(boardConfig);
    
    // Store the board ID for future reuse
    this.testBoardId = board.id;
    if (typeof window !== 'undefined') {
      localStorage.setItem('miro_test_board_id', board.id);
    }
    
    console.log('Created new test board and stored ID for reuse:', board.id);
    return board;
  }

  public async clearTestBoard(): Promise<void> {
    if (this.testBoardId) {
      try {
        await this.callMiroAPI('deleteBoard', { boardId: this.testBoardId });
        console.log('Test board deleted successfully');
      } catch (error) {
        console.error('Failed to delete test board:', error);
      }
    }
    
    this.testBoardId = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('miro_test_board_id');
    }
  }

  public async createTMFBoard(project: Project, domains: TMFOdaDomain[]): Promise<{ id: string; viewLink: string }> {
    // For prototyping, use the test board functionality
    const board = await this.getOrCreateTestBoard(project.name);

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

    console.log(`Creating ${capabilities.length} capability cards for domain index ${domainIndex}`);

    for (let i = 0; i < capabilities.length; i++) {
      const capability = capabilities[i];
      const row = Math.floor(i / cardsPerRow);
      const col = i % cardsPerRow;

      const x = domainIndex * 850 + 50 + col * (cardWidth + spacing);
      const y = 50 + row * (cardHeight + spacing);

      try {
        console.log(`Creating card for capability: ${capability.name} at position (${x}, ${y})`);
        
        await this.callMiroAPI('createCard', {
          boardId,
          frameId, // Pass the frameId so cards are associated with the frame
          title: capability.name,
          description: capability.description,
          position: { x, y },
          geometry: { width: cardWidth, height: cardHeight },
          style: {
            fillColor: '#4ecdc4',
            strokeColor: '#333'
          }
        });
        
        console.log(`Successfully created card for capability: ${capability.name}`);
      } catch (error) {
        console.error(`Failed to create card for capability ${capability.name}:`, error);
        throw error;
      }
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

  public isAuthenticated(): boolean {
    return miroAuthService.isAuthenticated();
  }

  public async authenticate(): Promise<void> {
    if (!this.isAuthenticated()) {
      const authUrl = await miroAuthService.initiateOAuth();
      window.location.href = authUrl;
    }
  }
}

// Export singleton instance
export const miroService = new MiroService();
