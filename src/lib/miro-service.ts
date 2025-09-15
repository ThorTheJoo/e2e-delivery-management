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
  private specSyncTestBoardId: string | null = null;

  constructor() {
    this.apiBaseUrl = '/api/miro/boards';
    // Load test board IDs from localStorage if available
    if (typeof window !== 'undefined') {
      this.testBoardId = localStorage.getItem('miro_test_board_id');
      this.specSyncTestBoardId = localStorage.getItem('miro_specsync_test_board_id');
    }
  }

  private async callMiroAPI(action: string, data: any): Promise<any> {
    // Check if we have a valid access token
    let accessToken = miroAuthService.getAccessToken();

    if (!accessToken) {
      console.error('❌ No valid Miro access token available');
      console.error('🔍 Auth service status:', miroAuthService.isAuthenticated());
      console.error('🔍 LocalStorage token:', typeof window !== 'undefined' ? localStorage.getItem('miro_access_token') : 'N/A');
      
      // Try to restore token from localStorage if available
      if (typeof window !== 'undefined') {
        const storedToken = localStorage.getItem('miro_access_token');
        if (storedToken) {
          console.log('🔄 Attempting to restore token from localStorage...');
          miroAuthService.setTokenFromUrl(storedToken);
          accessToken = miroAuthService.getAccessToken();
        }
      }
      
      if (!accessToken) {
        throw new Error('No valid Miro access token. Please authenticate with Miro first.');
      }
    }

    console.log('🔐 Using Miro access token for API call:', action);

    const response = await fetch(this.apiBaseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ action, data }),
    });

    if (!response.ok) {
      // Special-case 404 from getBoard so we can gracefully create a new board
      if (action === 'getBoard' && response.status === 404) {
        return Promise.reject(Object.assign(new Error('MIRO_BOARD_NOT_FOUND'), { code: 404 }));
      }
      const errorData = await response.json();
      console.error('Miro API response error:', errorData);
      throw new Error(
        errorData.error || errorData.details || `HTTP ${response.status}: ${response.statusText}`,
      );
    }

    return response.json();
  }

  public async createBoard(config: MiroBoardConfig): Promise<{ id: string; viewLink: string }> {
    console.log('=== MIRO SERVICE CREATE BOARD DEBUG ===');
    console.log('Board config received:', JSON.stringify(config, null, 2));
    console.log('Board name:', config.name);
    console.log('Board name length:', config.name?.length);
    console.log('Board name type:', typeof config.name);
    console.log('Board description:', config.description);
    console.log('Board description length:', config.description?.length);
    console.log('=== END MIRO SERVICE DEBUG ===');

    // Ensure board name is valid and within Miro's 60-character limit
    const maxNameLength = 60;
    let boardName = config.name;

    // Validate board name
    if (!boardName || typeof boardName !== 'string' || boardName.trim() === '') {
      console.error('Invalid board name:', boardName);
      throw new Error('Board name is required and must be a non-empty string');
    }

    // Trim whitespace
    boardName = boardName.trim();

    // Check length limit
    if (boardName.length > maxNameLength) {
      console.warn(
        `Board name exceeds ${maxNameLength} characters (${boardName.length}), truncating...`,
      );
      boardName = boardName.substring(0, maxNameLength - 3) + '...';
      console.log('Truncated board name:', boardName);
    }

    console.log('Creating Miro board:', boardName);

    try {
      const result = await this.callMiroAPI('createBoard', {
        name: boardName,
        description: config.description,
      });

      console.log('Board created successfully:', result.id);
      return result;
    } catch (error) {
      console.error('Failed to create Miro board:', error);
      throw error;
    }
  }

  public async getOrCreateTestBoard(
    projectName: string,
  ): Promise<{ id: string; viewLink: string }> {
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
      description: `Test board for ${projectName} visualization - Created for prototyping`,
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

  public async getOrCreateTMFBoard(projectName: string): Promise<{ id: string; viewLink: string }> {
    // Check if we have a stored TMF test board ID
    if (this.testBoardId) {
      try {
        console.log('Attempting to reuse existing TMF test board:', this.testBoardId);
        // Try to get the existing board
        const board = await this.callMiroAPI('getBoard', { boardId: this.testBoardId });
        console.log('Successfully reused existing TMF test board');
        return board;
      } catch (error) {
        console.log('Failed to reuse existing TMF board, creating new one:', error);
        // If the board doesn't exist or we can't access it, create a new one
        this.testBoardId = null;
        if (typeof window !== 'undefined') {
          localStorage.removeItem('miro_test_board_id');
        }
      }
    }

    // Create new TMF test board
    const boardConfig: MiroBoardConfig = {
      name: `${projectName} - TMF Architecture (Test)`,
      description: `Test board for ${projectName} TMF architecture visualization - Created for prototyping`,
    };

    const board = await this.createBoard(boardConfig);

    // Store the board ID for future reuse
    this.testBoardId = board.id;
    if (typeof window !== 'undefined') {
      localStorage.setItem('miro_test_board_id', board.id);
    }

    console.log('Created new TMF test board and stored ID for reuse:', board.id);
    return board;
  }

  public async getOrCreateSpecSyncBoard(
    projectName: string,
  ): Promise<{ id: string; viewLink: string }> {
    // Check if we have a stored SpecSync test board ID
    if (this.specSyncTestBoardId) {
      try {
        console.log('Attempting to reuse existing SpecSync test board:', this.specSyncTestBoardId);
        // Try to get the existing board
        const board = await this.callMiroAPI('getBoard', { boardId: this.specSyncTestBoardId });
        console.log('Successfully reused existing SpecSync test board');
        return board;
      } catch (error: any) {
        if (error?.code === 404 || String(error?.message || '').includes('board_not_found')) {
          console.log('Stored SpecSync board not found on Miro, will create new.');
        } else {
          console.log('Failed to reuse existing SpecSync board, creating new one:', error);
        }
        // If the board doesn't exist or we can't access it, create a new one
        this.specSyncTestBoardId = null;
        if (typeof window !== 'undefined') {
          localStorage.removeItem('miro_specsync_test_board_id');
        }
      }
    }

    // Create new SpecSync test board
    const boardConfig: MiroBoardConfig = {
      name: `${projectName} - SpecSync Requirements (Test)`,
      description: `Test board for ${projectName} SpecSync requirements visualization - Created for prototyping`,
    };

    const board = await this.createBoard(boardConfig);

    // Add a small delay to ensure board is fully created
    console.log('Waiting for board to be fully created...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Store the board ID for future reuse
    this.specSyncTestBoardId = board.id;
    if (typeof window !== 'undefined') {
      localStorage.setItem('miro_specsync_test_board_id', board.id);
    }

    console.log('Created new SpecSync test board and stored ID for reuse:', board.id);
    return board;
  }

  public async clearSpecSyncTestBoard(): Promise<void> {
    if (this.specSyncTestBoardId) {
      try {
        await this.callMiroAPI('deleteBoard', { boardId: this.specSyncTestBoardId });
        console.log('SpecSync test board deleted successfully');
      } catch (error) {
        console.error('Failed to delete SpecSync test board:', error);
      }
    }

    this.specSyncTestBoardId = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('miro_specsync_test_board_id');
    }
  }

  public async createTMFBoard(
    project: Project,
    domains: TMFOdaDomain[],
  ): Promise<{ id: string; viewLink: string }> {
    // For prototyping, use the TMF test board functionality
    const board = await this.getOrCreateTMFBoard(`${project.name} - TMF Architecture`);

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
        geometry: { width: 1100, height: 700 }, // Increased frame dimensions
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
    domainIndex: number,
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
          geometry: { width: cardWidth, height: cardHeight },
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

  public async createSpecSyncBoard(
    specSyncItems: SpecSyncItem[],
  ): Promise<{ id: string; viewLink: string }> {
    console.log('=== MIRO SERVICE: createSpecSyncBoard called ===');
    console.log('Input items count:', specSyncItems.length);
    console.log('First item:', specSyncItems[0]);

    // Check authentication first
    if (!miroAuthService.isAuthenticated()) {
      throw new Error('Not authenticated with Miro. Please connect to Miro first.');
    }

    try {
      // For prototyping, use the test board functionality
      const board = await this.getOrCreateSpecSyncBoard('SpecSync Requirements Mapping');

      // Create domain frames and usecase cards
      await this.createSpecSyncDomainFrames(board.id, specSyncItems);

      return board;
    } catch (error) {
      console.error('❌ Error in createSpecSyncBoard:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('token') || error.message.includes('authentication')) {
          throw new Error('Miro authentication failed. Please reconnect to Miro and try again.');
        } else if (error.message.includes('401')) {
          throw new Error('Miro access denied. Please check your permissions and reconnect.');
        } else if (error.message.includes('403')) {
          throw new Error('Miro access forbidden. Please check your board permissions.');
        } else if (error.message.includes('500')) {
          throw new Error('Miro server error. Please try again later or contact support.');
        }
      }
      
      throw error;
    }
  }

  private async createSpecSyncDomainFrames(boardId: string, items: SpecSyncItem[]): Promise<void> {
    try {
      // Group items by domain
      const domainGroups = new Map<string, SpecSyncItem[]>();

      console.log(`Total items received: ${items.length}`);
      console.log(
        `Sample items:`,
        items.slice(0, 3).map((item) => ({
          id: item.rephrasedRequirementId,
          usecase1: item.usecase1,
          functionName: item.functionName,
          domain: item.domain,
        })),
      );

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
        try {
          // Create frame for domain
          console.log(`Creating frame for domain: ${domainName}`);

          const frameData = {
            boardId,
            title: domainName,
            position: { x: domainIndex * 1200, y: 0 }, // Increased spacing between frames
            geometry: { width: 1100, height: 700 }, // Increased frame dimensions
          };

          console.log('Frame data being sent:', JSON.stringify(frameData, null, 2));

          const frame = await this.callMiroAPI('createFrame', frameData);

          console.log(`Successfully created frame for domain: ${domainName} with ID: ${frame.id}`);

          // Add usecase cards within the frame
          await this.createUsecaseCards(boardId, domainItems, frame.id, domainIndex);

          domainIndex++;
        } catch (frameError) {
          console.error(`❌ Failed to create frame for domain ${domainName}:`, frameError);
          
          // Continue with other domains even if one fails
          if (domainIndex === 0) {
            // If this is the first domain and it fails, re-throw the error
            throw frameError;
          } else {
            console.warn(`Continuing with other domains despite error for ${domainName}`);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error in createSpecSyncDomainFrames:', error);
      throw error;
    }
  }

  private async createUsecaseCards(
    boardId: string,
    items: SpecSyncItem[],
    frameId: string,
    domainIndex: number,
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
    console.log(
      `Items for cards:`,
      items.map((item) => ({
        id: item.rephrasedRequirementId,
        usecase1: item.usecase1,
        functionName: item.functionName,
        domain: item.domain,
      })),
    );

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
        console.warn(
          `Skipping card for ${item.rephrasedRequirementId} - would exceed frame height`,
        );
        continue;
      }

      try {
        console.log(
          `Creating usecase card for: ${item.rephrasedRequirementId} at position (${x}, ${y})`,
        );

        const cardData = {
          boardId,
          frameId,
          title: item.rephrasedRequirementId,
          description: `Usecase: ${item.usecase1 || 'N/A'}\nFunction: ${item.functionName}\nDomain: ${item.domain}`,
          position: { x, y },
          geometry: { width: cardWidth, height: cardHeight },
        };

        console.log('Usecase card data being sent:', JSON.stringify(cardData, null, 2));

        await this.callMiroAPI('createCard', cardData);

        console.log(`Successfully created usecase card for: ${item.rephrasedRequirementId}`);
      } catch (error) {
        console.error(`Failed to create usecase card for ${item.rephrasedRequirementId}:`, error);
        // Don't throw error immediately, continue with other cards
        console.warn(
          `Continuing with other cards despite error for ${item.rephrasedRequirementId}`,
        );
      }
    }

    // Create additional diagram shapes for usecase visualization
    await this.createUsecaseDiagramShapes(boardId, items, frameId, domainIndex);
  }

  private async createUsecaseDiagramShapes(
    boardId: string,
    items: SpecSyncItem[],
    frameId: string,
    domainIndex: number,
  ): Promise<void> {
    console.log(`Creating usecase diagram shapes for domain index ${domainIndex}`);
    console.log(
      `Items received: ${items.length}`,
      items.map((item) => ({
        id: item.rephrasedRequirementId,
        usecase1: item.usecase1,
        functionName: item.functionName,
        domain: item.domain,
      })),
    );

    // TEMP TRACE: summarize missing usecase1 to help pinpoint data origin
    try {
      const totalCount = items.length;
      const missingItems = items.filter(
        (item) => !item.usecase1 || item.usecase1.trim() === '',
      );
      const missingCount = missingItems.length;
      const presentCount = totalCount - missingCount;
      console.log('=== USECASE1 TRACE SUMMARY ===', {
        frameId,
        domainIndex,
        totalCount,
        presentCount,
        missingCount,
      });
      if (missingCount > 0) {
        console.log(
          'Sample missing usecase1 items (up to 5):',
          missingItems.slice(0, 5).map((it) => ({
            id: it.id,
            requirementId: it.requirementId,
            rephrasedRequirementId: it.rephrasedRequirementId,
            functionName: it.functionName,
            domain: it.domain,
          })),
        );
      }
    } catch (traceError) {
      console.warn('USECASE1 trace summary failed:', traceError);
    }

    // Frame dimensions: 1100x700
    const frameWidth = 1100;
    const frameHeight = 700;
    const margin = 50;

    // Create actor shapes (circles) for each unique function
    const uniqueFunctions = Array.from(new Set(items.map((item) => item.functionName)));
    const actorWidth = 100;
    const actorHeight = 100;
    const actorSpacing = 20; // Space between actors
    const actorsPerRow = Math.floor((frameWidth - 2 * margin) / (actorWidth + actorSpacing));

    console.log(
      `Creating ${uniqueFunctions.length} actor shapes with ${actorsPerRow} actors per row`,
    );

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
          geometry: { width: actorWidth, height: actorHeight },
        };

        console.log(
          `Creating actor shape ${i + 1}/${uniqueFunctions.length} for: ${functionName} at position (${x}, ${y})`,
        );

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
    console.log(
      `Frame dimensions: ${frameWidth}x${frameHeight}, margin: ${margin}, shape: ${shapeWidth}x${shapeHeight}, spacing: ${shapeSpacing}`,
    );

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

      console.log(
        `Positioning shape ${i + 1}/${items.length} for ${item.usecase1}: row=${row}, col=${col}, x=${x}, y=${y}`,
      );

      // Skip if would exceed frame boundaries
      if (x + shapeWidth > frameWidth - margin) {
        console.warn(
          `Skipping usecase shape for ${item.usecase1} - would exceed frame width (x=${x}, width=${shapeWidth}, frameWidth=${frameWidth}, margin=${margin})`,
        );
        continue;
      }

      if (y + shapeHeight > frameHeight - margin) {
        console.warn(
          `Skipping usecase shape for ${item.usecase1} - would exceed frame height (y=${y}, height=${shapeHeight}, frameHeight=${frameHeight}, margin=${margin})`,
        );
        continue;
      }

      try {
        const usecaseData = {
          boardId,
          frameId,
          shape: 'round_rectangle', // Use round_rectangle instead of oval
          content: item.usecase1 || 'Usecase',
          position: { x, y },
          geometry: { width: shapeWidth, height: shapeHeight },
        };

        console.log(
          `Creating usecase shape ${i + 1}/${items.length} for: ${item.usecase1} at position (${x}, ${y})`,
        );

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
        console.warn(
          `Skipping requirement card for ${item.rephrasedRequirementId} - would exceed frame width`,
        );
        continue;
      }

      if (y + cardHeight > frameHeight - margin) {
        console.warn(
          `Skipping requirement card for ${item.rephrasedRequirementId} - would exceed frame height`,
        );
        continue;
      }

      try {
        await this.callMiroAPI('createCard', {
          boardId,
          title: item.rephrasedRequirementId,
          description: `Usecase: ${item.usecase1 || 'N/A'}\nFunction: ${item.functionName}\nDomain: ${item.domain}`,
          position: { x, y },
          geometry: { width: cardWidth, height: cardHeight },
        });
      } catch (error) {
        console.error(
          `Failed to create requirement card for ${item.rephrasedRequirementId}:`,
          error,
        );
        console.warn(
          `Continuing with other cards despite error for ${item.rephrasedRequirementId}`,
        );
      }
    }
  }

  public async getBoard(boardId: string): Promise<any> {
    return await this.callMiroAPI('getBoard', { boardId });
  }

  public async deleteBoard(_boardId: string): Promise<void> {
    // This would need a separate API endpoint for deleting boards
    throw new Error('deleteBoard not implemented yet');
  }

  public isAuthenticated(): boolean {
    return miroAuthService.isAuthenticated();
  }

  private async getOrCreateSolutionModelBoard(boardName: string): Promise<{ id: string; viewLink: string }> {
    try {
      // Try to get existing board first
      const existingBoard = await this.callMiroAPI('getBoard', { boardId: 'solution-model-board' });
      if (existingBoard && existingBoard.id) {
        console.log('📋 Using existing Solution Model board:', existingBoard.id);
        return existingBoard;
      }
    } catch (error) {
      console.log('📋 No existing Solution Model board found, creating new one');
    }

    // Create new board
    const boardData = {
      name: boardName,
      description: 'Solution Model Integration - Blue Dolphin Architecture Objects with SpecSync Requirements',
    };

    const board = await this.callMiroAPI('createBoard', boardData);
    console.log('✅ Solution Model board created:', board.id);
    
    // Store board ID for future reference
    if (typeof window !== 'undefined') {
      localStorage.setItem('miro_solution_model_board_id', board.id);
    }

    return board;
  }

  private async createSolutionModelFrames(
    boardId: string,
    traversalResults: any[],
    _specSyncItems: any[]
  ): Promise<void> {
    try {
      console.log('Creating Solution Model frames for board:', boardId);
      
      // Create frames for each object type
      const frameConfigs = [
        {
          title: 'Business Processes',
          objects: this.extractObjectsByType(traversalResults, 'businessProcesses'),
          position: { x: 0, y: 0 },
          color: '#E3F2FD'
        },
        {
          title: 'Application Services',
          objects: this.extractObjectsByType(traversalResults, 'applicationServices'),
          position: { x: 1200, y: 0 },
          color: '#F3E5F5'
        },
        {
          title: 'Application Interfaces',
          objects: this.extractObjectsByType(traversalResults, 'applicationInterfaces'),
          position: { x: 2400, y: 0 },
          color: '#E8F5E8'
        },
        {
          title: 'Application Functions',
          objects: this.extractObjectsByType(traversalResults, 'relatedApplicationFunctions'),
          position: { x: 0, y: 800 },
          color: '#FFF3E0'
        },
        {
          title: 'Deliverables',
          objects: this.extractObjectsByType(traversalResults, 'deliverables'),
          position: { x: 1200, y: 800 },
          color: '#FCE4EC'
        }
      ];

      for (const config of frameConfigs) {
        if (config.objects.length > 0) {
          await this.createObjectTypeFrame(boardId, config);
        }
      }

      console.log('✅ Solution Model frames created successfully');
    } catch (error) {
      console.error('❌ Error creating Solution Model frames:', error);
      throw error;
    }
  }

  private extractObjectsByType(traversalResults: any[], type: string): any[] {
    const objects: any[] = [];
    
    for (const result of traversalResults) {
      if (type === 'businessProcesses') {
        objects.push(...result.businessProcesses?.topLevel || []);
        objects.push(...result.businessProcesses?.childLevel || []);
        objects.push(...result.businessProcesses?.grandchildLevel || []);
      } else if (type === 'applicationServices') {
        objects.push(...result.applicationServices?.topLevel || []);
        objects.push(...result.applicationServices?.childLevel || []);
        objects.push(...result.applicationServices?.grandchildLevel || []);
      } else if (type === 'applicationInterfaces') {
        objects.push(...result.applicationInterfaces?.topLevel || []);
        objects.push(...result.applicationInterfaces?.childLevel || []);
        objects.push(...result.applicationInterfaces?.grandchildLevel || []);
      } else if (type === 'deliverables') {
        objects.push(...result.deliverables?.topLevel || []);
        objects.push(...result.deliverables?.childLevel || []);
        objects.push(...result.deliverables?.grandchildLevel || []);
      } else if (type === 'relatedApplicationFunctions') {
        objects.push(...result.relatedApplicationFunctions || []);
        if (result.applicationFunction) {
          objects.push(result.applicationFunction);
        }
      }
    }
    
    return objects;
  }

  private async createObjectTypeFrame(
    boardId: string,
    config: { title: string; objects: any[]; position: { x: number; y: number }; color: string }
  ): Promise<void> {
    try {
      console.log(`Creating frame for ${config.title} with ${config.objects.length} objects`);

      // Create frame
      const frameData = {
        boardId,
        title: config.title,
        position: config.position,
        geometry: { width: 1100, height: 700 },
        style: { fillColor: config.color }
      };

      const frame = await this.callMiroAPI('createFrame', frameData);
      console.log(`✅ Frame created for ${config.title}:`, frame.id);

      // Create cards for objects
      await this.createObjectCards(boardId, frame.id, config.objects, config.title);

    } catch (error) {
      console.error(`❌ Failed to create frame for ${config.title}:`, error);
      throw error;
    }
  }

  private async createObjectCards(
    boardId: string,
    frameId: string,
    objects: any[],
    frameTitle: string
  ): Promise<void> {
    const cardsPerRow = 3;
    const cardWidth = 300;
    const cardHeight = 150;
    const spacing = 30;
    const margin = 50;

    console.log(`Creating ${objects.length} cards for ${frameTitle}`);

    for (let i = 0; i < objects.length; i++) {
      const obj = objects[i];
      const row = Math.floor(i / cardsPerRow);
      const col = i % cardsPerRow;

      const x = margin + col * (cardWidth + spacing);
      const y = margin + row * (cardHeight + spacing);

      try {
        const cardData = {
          boardId,
          frameId,
          title: obj.Title || obj.name || `Object ${i + 1}`,
          description: obj.Description || obj.description || `Type: ${obj.Definition || 'Unknown'}`,
          position: { x, y },
          geometry: { width: cardWidth, height: cardHeight },
          style: { fillColor: '#FFFFFF' }
        };

        await this.callMiroAPI('createCard', cardData);
        console.log(`✅ Card created for ${obj.Title || obj.name}`);

      } catch (error) {
        console.error(`❌ Failed to create card for ${obj.Title || obj.name}:`, error);
        // Continue with other cards
      }
    }
  }

  public async createSolutionModelBoard(
    traversalResults: any[],
    specSyncItems: any[],
    project: any
  ): Promise<{ id: string; viewLink: string }> {
    console.log('=== MIRO SERVICE: createSolutionModelBoard called ===');
    console.log('Input traversal results count:', traversalResults.length);
    console.log('Input specSync items count:', specSyncItems.length);
    console.log('Project:', project);

    // Check authentication first
    if (!miroAuthService.isAuthenticated()) {
      throw new Error('Not authenticated with Miro. Please connect to Miro first.');
    }

    try {
      // Create the main board
      const board = await this.getOrCreateSolutionModelBoard('Solution Model Integration');

      // Create frames for each object type
      await this.createSolutionModelFrames(board.id, traversalResults, specSyncItems);

      return board;
    } catch (error) {
      console.error('❌ Error in createSolutionModelBoard:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('token') || error.message.includes('authentication')) {
          throw new Error('Miro authentication failed. Please reconnect to Miro and try again.');
        } else if (error.message.includes('401')) {
          throw new Error('Miro access denied. Please check your permissions and reconnect.');
        } else if (error.message.includes('403')) {
          throw new Error('Miro access forbidden. Please check your board permissions.');
        } else if (error.message.includes('500')) {
          throw new Error('Miro server error. Please try again later or contact support.');
        }
      }
      
      throw error;
    }
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
