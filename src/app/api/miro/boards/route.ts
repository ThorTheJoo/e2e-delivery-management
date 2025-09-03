import { NextRequest, NextResponse } from 'next/server';
import { MiroApi } from '@mirohq/miro-api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    // Get access token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header with Bearer token is required' },
        { status: 401 }
      );
    }

    const accessToken = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 401 }
      );
    }

    const miroClient = new MiroApi(accessToken);

    switch (action) {
      case 'createBoard':
        const board = await miroClient.createBoard({
          name: data.name,
          description: data.description
        });
        
        return NextResponse.json({
          id: board.id,
          viewLink: board.viewLink || `https://miro.com/app/board/${board.id}`
        });

      case 'createCard':
        const boardInstance = await miroClient.getBoard(data.boardId);
        
        // Create card on the board with minimal required parameters
        const cardData: {
          data: { title: string };
          position?: { x: number; y: number };
          geometry?: { width: number; height: number };
        } = {
          data: {
            title: data.title || 'Untitled Card'
          }
        };

        // Add optional parameters only if they exist
        if (data.position) {
          cardData.position = data.position;
        }
        
        if (data.geometry) {
          cardData.geometry = data.geometry;
        }

        // Add parent frame if provided (this might be the issue)
        if (data.frameId) {
          cardData.parent = { id: data.frameId };
        }

        console.log('Creating card with data:', JSON.stringify(cardData, null, 2));
        
        const card = await boardInstance.createCardItem(cardData);
        
        console.log(`Card ${card.id} created successfully`);
        
        return NextResponse.json({ id: card.id });

      case 'createShape':
        const boardForShape = await miroClient.getBoard(data.boardId);
        
        const shapeData: {
          data: { shape: string; content: string };
          position: { x: number; y: number };
          geometry: { width: number; height: number };
        } = {
          data: {
            shape: data.shape || 'rectangle',
            content: data.content || ''
          },
          position: data.position || { x: 0, y: 0 },
          geometry: data.geometry || { width: 200, height: 100 }
        };

        // Add parent frame if provided
        if (data.frameId) {
          shapeData.parent = { id: data.frameId };
        }

        console.log('Creating shape with data:', JSON.stringify(shapeData, null, 2));
        
        const shape = await boardForShape.createShapeItem(shapeData);
        
        console.log(`Shape ${shape.id} created successfully`);
        
        return NextResponse.json({ id: shape.id });

      case 'createFrame':
        const boardForFrame = await miroClient.getBoard(data.boardId);
        
        const frameData = {
          data: { 
            title: data.title || 'Untitled Frame'
          },
          position: data.position || { x: 0, y: 0 },
          geometry: data.geometry || { width: 800, height: 600 }
        };

        console.log('Creating frame with data:', JSON.stringify(frameData, null, 2));
        
        const frame = await boardForFrame.createFrameItem(frameData);
        
        console.log(`Frame ${frame.id} created successfully`);
        
        return NextResponse.json({ id: frame.id });

      case 'getBoard':
        const _boardToGet = await miroClient.getBoard(data.boardId);
        
        return NextResponse.json({
          id: data.boardId,
          viewLink: `https://miro.com/app/board/${data.boardId}`
        });

      case 'deleteBoard':
        const boardToDelete = await miroClient.getBoard(data.boardId);
        await boardToDelete.delete();
        
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Miro API error:', error);
    
    // Log detailed error information for debugging
    if (error && typeof error === 'object' && 'body' in error) {
      console.error('Miro API error details:', JSON.stringify(error.body, null, 2));
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to perform Miro operation',
        details: error instanceof Error ? error.message : 'Unknown error',
        miroError: error && typeof error === 'object' && 'body' in error ? error.body : null
      },
      { status: 500 }
    );
  }
}
