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
        const card = await boardInstance.createCardItem({
          data: {
            title: data.title,
            description: data.description
          },
          position: data.position,
          geometry: data.geometry,
          style: data.style
        });
        
        return NextResponse.json({ id: card.id });

      case 'createFrame':
        const boardForFrame = await miroClient.getBoard(data.boardId);
        const frame = await boardForFrame.createFrameItem({
          data: { title: data.title },
          position: data.position,
          geometry: data.geometry
        });
        
        return NextResponse.json({ id: frame.id });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Miro API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to perform Miro operation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
