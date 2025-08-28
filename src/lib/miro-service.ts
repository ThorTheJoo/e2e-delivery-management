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
      console.error('Miro API response error:', errorData);
      throw new Error(errorData.error || errorData.details || `HTTP ${response.status}: ${response.statusText}`);
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

    // Create new test board with appropriate name based on project type
    const boardConfig: MiroBoardConfig = {
      name: `${projectName} - Visual Mapping (Test)`,
      description: `Test board for ${projectName} visualization - Created for prototyping`
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

  public async clearSpecSyncTestBoard(): Promise<void> {
    // Clear the test board for SpecSync specifically
    await this.clearTestBoard();
  }

  public async createTMFBoard(project: Project, domains: TMFOdaDomain[]): Promise<{ id: string; viewLink: string }> {
    // For prototyping, use the test board functionality
    const board = await this.getOrCreateTestBoard(`${project.name} - TMF Architecture`);

    // Create domain frames and capability cards
    await this.createDomainFrames(board.id, domains);

    return board;
  }

  private async createDomainFrames(boardId: string, domains: TMFOdaDomain[]): Promise<void> {
    for (let i = 0; i < domains.length; i++) {
      const domain = domains[i];
      
      // Create frame for domain
      console.log(`Creating frame for domain: ${domain.name}`);
      
      const frameData = {
        boardId,
        title: domain.name,
        position: { x: i * 1200, y: 0 }, // Increased spacing between frames
        geometry: { width: 1100, height: 700 } // Increased frame dimensions
      };

      console.log('Frame data being sent:', JSON.stringify(frameData, null, 2));
      
      const frame = await this.callMiroAPI('createFrame', frameData);
      
      console.log(`Successfully created frame for domain: ${domain.name} with ID: ${frame.id}`);

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
    const cardsPerRow = 3; // 3 per row to fit within wider frame
    const cardWidth = 300; // Increased to meet Miro's minimum width requirement (256px)
    const cardHeight = 150; // Increased height for better visibility
    const spacing = 30;
    const margin = 50;

    // Frame dimensions: 1100x700
    const frameWidth = 1100;
    const frameHeight = 700;

    console.log(`Creating ${capabilities.length} capability cards for domain index ${domainIndex}`);

    // Calculate starting position to position cards more towards the right side of the frame
    const totalCardsWidth = cardsPerRow * cardWidth + (cardsPerRow - 1) * spacing;
    const cardStartX = margin + (frameWidth - 2 * margin - totalCardsWidth) * 0.7; // Move cards 70% towards the right
    
    for (let i = 0; i < capabilities.length; i++) {
      const capability = capabilities[i];
      const row = Math.floor(i / cardsPerRow);
      const col = i % cardsPerRow;

      // Position cards more towards the right side of the frame (frame is 1100x700)
      const x = cardStartX + col * (cardWidth + spacing);
      const y = margin + row * (cardHeight + spacing);

      // Skip if would exceed frame boundaries
      if (x + cardWidth > frameWidth - margin) {
        console.warn(`Skipping card for capability ${capability.name} - would exceed frame width`);
        continue;
      }

      if (y + cardHeight > frameHeight - margin) {
        console.warn(`Skipping card for capability ${capability.name} - would exceed frame height`);
        continue;
      }

      try {
        console.log(`Creating card for capability: ${capability.name} at position (${x}, ${y})`);
        
        const cardData = {
          boardId,
          frameId, // Pass the frameId so cards are associated with the frame
          title: capability.name,
          description: capability.description,
          position: { x, y },
          geometry: { width: cardWidth, height: cardHeight }
        };

        console.log('Card data being sent:', JSON.stringify(cardData, null, 2));
        
        await this.callMiroAPI('createCard', cardData);
        
        console.log(`Successfully created card for capability: ${capability.name}`);
      } catch (error) {
        console.error(`Failed to create card for capability ${capability.name}:`, error);
        // Don't throw error immediately, continue with other cards
        console.warn(`Continuing with other cards despite error for ${capability.name}`);
      }
    }
  }

  public async createSpecSyncBoard(specSyncItems: SpecSyncItem[]): Promise<{ id: string; viewLink: string }> {
    // For prototyping, use the test board functionality
    const board = await this.getOrCreateTestBoard('SpecSync Requirements Mapping');

    // Create domain frames and usecase cards
    await this.createSpecSyncDomainFrames(board.id, specSyncItems);

    return board;
  }

  private async createSpecSyncDomainFrames(boardId: string, items: SpecSyncItem[]): Promise<void> {
    // Group items by domain
    const domainGroups = new Map<string, SpecSyncItem[]>();
    
    console.log(`Total items received: ${items.length}`);
    console.log(`Sample items:`, items.slice(0, 3).map(item => ({
      id: item.rephrasedRequirementId,
      usecase1: item.usecase1,
      functionName: item.functionName,
      domain: item.domain
    })));
    
    for (const item of items) {
      const domain = item.domain || 'Unknown Domain';
      if (!domainGroups.has(domain)) {
        domainGroups.set(domain, []);
      }
      domainGroups.get(domain)!.push(item);
    }

    console.log(`Creating frames for ${domainGroups.size} domains`);
    for (const [domainName, domainItems] of Array.from(domainGroups.entries())) {
      console.log(`Domain "${domainName}": ${domainItems.length} items`);
    }

    let domainIndex = 0;
    for (const [domainName, domainItems] of Array.from(domainGroups.entries())) {
      // Create frame for domain
      console.log(`Creating frame for domain: ${domainName}`);
      
      const frameData = {
        boardId,
        title: domainName,
        position: { x: domainIndex * 1200, y: 0 }, // Increased spacing between frames
        geometry: { width: 1100, height: 700 } // Increased frame dimensions
      };

      console.log('Frame data being sent:', JSON.stringify(frameData, null, 2));
      
      const frame = await this.callMiroAPI('createFrame', frameData);
      
      console.log(`Successfully created frame for domain: ${domainName} with ID: ${frame.id}`);

      // Add usecase cards within the frame
      await this.createUsecaseCards(boardId, domainItems, frame.id, domainIndex);
      
      domainIndex++;
    }
  }

  private async createUsecaseCards(
    boardId: string, 
    items: SpecSyncItem[], 
    frameId: string, 
    domainIndex: number
  ): Promise<void> {
    const cardsPerRow = 3; // 3 per row to fit within wider frame
    const cardWidth = 300; // Meet Miro's minimum width requirement
    const cardHeight = 150;
    const spacing = 30;
    const margin = 50;

    // Frame dimensions: 1100x700
    const frameWidth = 1100;
    const frameHeight = 700;

    console.log(`Creating ${items.length} usecase cards for domain index ${domainIndex}`);
    console.log(`Items for cards:`, items.map(item => ({
      id: item.rephrasedRequirementId,
      usecase1: item.usecase1,
      functionName: item.functionName,
      domain: item.domain
    })));

    // Calculate starting position to position cards more towards the right side of the frame
    const totalCardsWidth = cardsPerRow * cardWidth + (cardsPerRow - 1) * spacing;
    const cardStartX = margin + (frameWidth - 2 * margin - totalCardsWidth) * 0.7; // Move cards 70% towards the right
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const row = Math.floor(i / cardsPerRow);
      const col = i % cardsPerRow;

      // Position cards more towards the right side of the frame
      const x = cardStartX + col * (cardWidth + spacing);
      const y = margin + row * (cardHeight + spacing);

      // Skip if would exceed frame boundaries
      if (x + cardWidth > frameWidth - margin) {
        console.warn(`Skipping card for ${item.rephrasedRequirementId} - would exceed frame width`);
        continue;
      }

      if (y + cardHeight > frameHeight - margin) {
        console.warn(`Skipping card for ${item.rephrasedRequirementId} - would exceed frame height`);
        continue;
      }

      try {
        console.log(`Creating usecase card for: ${item.rephrasedRequirementId} at position (${x}, ${y})`);
        
        const cardData = {
          boardId,
          frameId,
          title: item.rephrasedRequirementId,
          description: `Usecase: ${item.usecase1 || 'N/A'}\nFunction: ${item.functionName}\nDomain: ${item.domain}`,
          position: { x, y },
          geometry: { width: cardWidth, height: cardHeight }
        };

        console.log('Usecase card data being sent:', JSON.stringify(cardData, null, 2));
        
        await this.callMiroAPI('createCard', cardData);
        
        console.log(`Successfully created usecase card for: ${item.rephrasedRequirementId}`);
      } catch (error) {
        console.error(`Failed to create usecase card for ${item.rephrasedRequirementId}:`, error);
        // Don't throw error immediately, continue with other cards
        console.warn(`Continuing with other cards despite error for ${item.rephrasedRequirementId}`);
      }
    }

    // Create additional diagram shapes for usecase visualization
    await this.createUsecaseDiagramShapes(boardId, items, frameId, domainIndex);
  }

  private async createUsecaseDiagramShapes(
    boardId: string, 
    items: SpecSyncItem[], 
    frameId: string, 
    domainIndex: number
  ): Promise<void> {
    console.log(`Creating usecase diagram shapes for domain index ${domainIndex}`);
    console.log(`Items received: ${items.length}`, items.map(item => ({
      id: item.rephrasedRequirementId,
      usecase1: item.usecase1,
      functionName: item.functionName,
      domain: item.domain
    })));

    // Frame dimensions: 1100x700
    const frameWidth = 1100;
    const frameHeight = 700;
    const margin = 50;

    // Create actor shapes (circles) for each unique function
    const uniqueFunctions = Array.from(new Set(items.map(item => item.functionName)));
    const actorWidth = 100;
    const actorHeight = 100;
    const actorSpacing = 20; // Space between actors
    const actorsPerRow = Math.floor((frameWidth - 2 * margin) / (actorWidth + actorSpacing));
    
    console.log(`Creating ${uniqueFunctions.length} actor shapes with ${actorsPerRow} actors per row`);
    
    // Calculate starting position to position actors more towards the right side of the frame
    const totalActorsWidth = actorsPerRow * actorWidth + (actorsPerRow - 1) * actorSpacing;
    const actorStartX = margin + (frameWidth - 2 * margin - totalActorsWidth) * 0.7; // Move actors 70% towards the right
    
    for (let i = 0; i < uniqueFunctions.length; i++) {
      const functionName = uniqueFunctions[i];
      const row = Math.floor(i / actorsPerRow);
      const col = i % actorsPerRow;
      
      // Position actors centered at bottom of frame
      const x = actorStartX + col * (actorWidth + actorSpacing);
      const y = frameHeight - 150 - row * (actorHeight + 20); // 150px from bottom + row spacing

      // Skip if would exceed frame boundaries
      if (x + actorWidth > frameWidth - margin) {
        console.warn(`Skipping actor shape for ${functionName} - would exceed frame width`);
        continue;
      }

      if (y < margin) {
        console.warn(`Skipping actor shape for ${functionName} - would exceed frame height`);
        continue;
      }

      try {
        const actorData = {
          boardId,
          frameId,
          shape: 'circle',
          content: functionName,
          position: { x, y },
          geometry: { width: actorWidth, height: actorHeight }
        };

        console.log(`Creating actor shape ${i + 1}/${uniqueFunctions.length} for: ${functionName} at position (${x}, ${y})`);
        
        await this.callMiroAPI('createShape', actorData);
        
        console.log(`Successfully created actor shape for: ${functionName}`);
      } catch (error) {
        console.error(`Failed to create actor shape for ${functionName}:`, error);
      }
    }

    // Create usecase shapes for each usecase
    const shapeWidth = 140; // Reduced width to fit more shapes
    const shapeHeight = 80;
    const shapeSpacing = 30; // Reduced spacing to fit more shapes
    const shapesPerRow = Math.floor((frameWidth - 2 * margin) / (shapeWidth + shapeSpacing));
    
    console.log(`Creating ${items.length} usecase shapes with ${shapesPerRow} shapes per row`);
    console.log(`Frame dimensions: ${frameWidth}x${frameHeight}, margin: ${margin}, shape: ${shapeWidth}x${shapeHeight}, spacing: ${shapeSpacing}`);
    
    // Calculate starting position to position shapes more towards the right side of the frame
    const totalShapesWidth = shapesPerRow * shapeWidth + (shapesPerRow - 1) * shapeSpacing;
    const startX = margin + (frameWidth - 2 * margin - totalShapesWidth) * 0.7; // Move shapes 70% towards the right
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      // Skip items without usecase1 data
      if (!item.usecase1 || item.usecase1.trim() === '') {
        console.warn(`Skipping item ${i + 1}/${items.length} - missing usecase1 data:`, item);
        continue;
      }
      
      const row = Math.floor(i / shapesPerRow);
      const col = i % shapesPerRow;
      
      // Position usecases centered within the frame
      const x = startX + col * (shapeWidth + shapeSpacing);
      const y = margin + 100 + row * (shapeHeight + 20); // 100px from top + row spacing

      console.log(`Positioning shape ${i + 1}/${items.length} for ${item.usecase1}: row=${row}, col=${col}, x=${x}, y=${y}`);

      // Skip if would exceed frame boundaries
      if (x + shapeWidth > frameWidth - margin) {
        console.warn(`Skipping usecase shape for ${item.usecase1} - would exceed frame width (x=${x}, width=${shapeWidth}, frameWidth=${frameWidth}, margin=${margin})`);
        continue;
      }

      if (y + shapeHeight > frameHeight - margin) {
        console.warn(`Skipping usecase shape for ${item.usecase1} - would exceed frame height (y=${y}, height=${shapeHeight}, frameHeight=${frameHeight}, margin=${margin})`);
        continue;
      }

      try {
        const usecaseData = {
          boardId,
          frameId,
          shape: 'round_rectangle', // Use round_rectangle instead of oval
          content: item.usecase1 || 'Usecase',
          position: { x, y },
          geometry: { width: shapeWidth, height: shapeHeight }
        };

        console.log(`Creating usecase shape ${i + 1}/${items.length} for: ${item.usecase1} at position (${x}, ${y})`);
        
        await this.callMiroAPI('createShape', usecaseData);
        
        console.log(`Successfully created usecase shape for: ${item.usecase1}`);
      } catch (error) {
        console.error(`Failed to create usecase shape for ${item.usecase1}:`, error);
      }
    }
  }

  private async createRequirementCards(boardId: string, items: SpecSyncItem[]): Promise<void> {
    const cardsPerRow = 4;
    const cardWidth = 300; // Increased to meet Miro's minimum width requirement
    const cardHeight = 150;
    const spacing = 20;
    const margin = 50;

    // Frame dimensions: 1100x700 (assuming standard frame size)
    const frameWidth = 1100;
    const frameHeight = 700;

    // Calculate starting position to position cards more towards the right side of the frame
    const totalCardsWidth = cardsPerRow * cardWidth + (cardsPerRow - 1) * spacing;
    const cardStartX = margin + (frameWidth - 2 * margin - totalCardsWidth) * 0.7; // Move cards 70% towards the right
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const row = Math.floor(i / cardsPerRow);
      const col = i % cardsPerRow;

      // Position cards more towards the right side of the frame
      const x = cardStartX + col * (cardWidth + spacing);
      const y = margin + row * (cardHeight + spacing);

      // Skip if would exceed frame boundaries
      if (x + cardWidth > frameWidth - margin) {
        console.warn(`Skipping requirement card for ${item.rephrasedRequirementId} - would exceed frame width`);
        continue;
      }

      if (y + cardHeight > frameHeight - margin) {
        console.warn(`Skipping requirement card for ${item.rephrasedRequirementId} - would exceed frame height`);
        continue;
      }

      try {
        await this.callMiroAPI('createCard', {
          boardId,
          title: item.rephrasedRequirementId,
          description: `Usecase: ${item.usecase1 || 'N/A'}\nFunction: ${item.functionName}\nDomain: ${item.domain}`,
          position: { x, y },
          geometry: { width: cardWidth, height: cardHeight }
        });
      } catch (error) {
        console.error(`Failed to create requirement card for ${item.rephrasedRequirementId}:`, error);
        console.warn(`Continuing with other cards despite error for ${item.rephrasedRequirementId}`);
      }
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
