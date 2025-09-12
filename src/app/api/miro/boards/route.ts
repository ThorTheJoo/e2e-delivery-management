import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  try {
    // Simple health check endpoint for connection testing
    return NextResponse.json({ 
      status: 'ok', 
      message: 'Miro API endpoint is accessible',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Miro API health check error:', error);
    return NextResponse.json(
      { error: 'Health check failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    // Get access token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header with Bearer token is required' },
        { status: 401 },
      );
    }

    const accessToken = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!accessToken) {
      return NextResponse.json({ error: 'Access token is required' }, { status: 401 });
    }

    console.log('=== MIRO API INITIALIZATION DEBUG ===');
    console.log('Access token length:', accessToken.length);
    console.log('Access token preview:', accessToken.substring(0, 20) + '...');
    console.log('Using direct Miro API calls');

    switch (action) {
      case 'createBoard':
        console.log('=== CREATE BOARD DEBUG ===');
        console.log('Board name:', data.name);
        console.log('Board description:', data.description);
        
        // Use direct Miro API call for board creation
        const boardPayload = {
          name: data.name,
          description: data.description,
        };

        console.log('Board payload:', JSON.stringify(boardPayload, null, 2));

        try {
          const miroApiUrl = 'https://api.miro.com/v2/boards';
          console.log('Miro API URL:', miroApiUrl);
          
          const miroResponse = await fetch(miroApiUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(boardPayload),
          });

          console.log('Miro API response status:', miroResponse.status);
          console.log('Miro API response headers:', Object.fromEntries(miroResponse.headers.entries()));

          if (!miroResponse.ok) {
            const errorText = await miroResponse.text();
            console.error('Miro API error response:', errorText);
            throw new Error(`Miro API error: ${miroResponse.status} - ${errorText}`);
          }

          const boardResponse = await miroResponse.json();
          console.log('Board created successfully:', boardResponse);
          console.log('Board ID:', boardResponse.id);
          console.log('Board ID type:', typeof boardResponse.id);
          console.log('Board ID length:', boardResponse.id?.length);
          console.log('Board viewLink:', boardResponse.viewLink);
          
          return NextResponse.json({
            id: boardResponse.id,
            viewLink: boardResponse.viewLink || `https://miro.com/app/board/${boardResponse.id}`,
          });
        } catch (directApiError) {
          console.error('Direct Miro API call failed:', directApiError);
          throw directApiError;
        }

      case 'createCard':
        console.log('=== CREATE CARD DEBUG ===');
        console.log('Board ID:', data.boardId);
        console.log('Card title:', data.title);
        console.log('Card position:', data.position);
        console.log('Card geometry:', data.geometry);
        console.log('Parent frame ID:', data.frameId);

        // Use direct Miro API call for card creation
        // Note: Cards do not accept geometry/style like shapes/frames. Keep payload minimal.
        const cardPayload: any = {
          data: {
            title: data.title || 'Untitled Card',
            description: data.description || '',
          },
          position: {
            x: data.position?.x ?? 0,
            y: data.position?.y ?? 0,
          },
        };

        // Add parent frame if provided
        if (data.frameId) {
          cardPayload.parent = { id: data.frameId };
        }

        console.log('Card payload:', JSON.stringify(cardPayload, null, 2));

        try {
          const miroApiUrl = `https://api.miro.com/v2/boards/${data.boardId}/cards`;
          console.log('Miro API URL:', miroApiUrl);
          
          const miroResponse = await fetch(miroApiUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(cardPayload),
          });

          console.log('Miro API response status:', miroResponse.status);

          if (!miroResponse.ok) {
            const errorText = await miroResponse.text();
            console.error('Miro API error response:', errorText);
            if (miroResponse.status === 404) {
              // Return a clean not-found response instead of throwing 500 up the stack
              return NextResponse.json(
                { error: 'board_not_found', id: data.boardId },
                { status: 404 },
              );
            }
            throw new Error(`Miro API error: ${miroResponse.status} - ${errorText}`);
          }

          const cardResponse = await miroResponse.json();
          console.log('Card created successfully:', cardResponse);
          
          return NextResponse.json({ id: cardResponse.id });
        } catch (directApiError) {
          console.error('Direct Miro API call failed:', directApiError);
          throw directApiError;
        }

      case 'createShape':
        console.log('=== CREATE SHAPE DEBUG ===');
        console.log('Board ID:', data.boardId);
        console.log('Shape type:', data.shape);
        console.log('Shape content:', data.content);
        console.log('Shape position:', data.position);
        console.log('Shape geometry:', data.geometry);
        console.log('Parent frame ID:', data.frameId);

        // Use direct Miro API call for shape creation
        const shapePayload: any = {
          data: {
            content: data.content || '',
            shape: data.shape || 'round_rectangle', // Specify shape type
          },
          position: {
            x: data.position?.x || 0,
            y: data.position?.y || 0,
          },
          geometry: {
            width: Math.max(data.geometry?.width || 200, 100), // Ensure minimum width
            height: Math.max(data.geometry?.height || 100, 50), // Ensure minimum height
          },
          style: {
            fillColor: '#ffffff',
          }
        };

        // Add parent frame if provided
        if (data.frameId) {
          shapePayload.parent = { id: data.frameId };
        }

        console.log('Shape payload:', JSON.stringify(shapePayload, null, 2));

        try {
          const miroApiUrl = `https://api.miro.com/v2/boards/${data.boardId}/shapes`;
          console.log('Miro API URL:', miroApiUrl);
          
          const miroResponse = await fetch(miroApiUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(shapePayload),
          });

          console.log('Miro API response status:', miroResponse.status);

          if (!miroResponse.ok) {
            const errorText = await miroResponse.text();
            console.error('Miro API error response:', errorText);
            throw new Error(`Miro API error: ${miroResponse.status} - ${errorText}`);
          }

          const shapeResponse = await miroResponse.json();
          console.log('Shape created successfully:', shapeResponse);
          
          return NextResponse.json({ id: shapeResponse.id });
        } catch (directApiError) {
          console.error('Direct Miro API call failed:', directApiError);
          throw directApiError;
        }

      case 'createFrame':
        console.log('=== CREATE FRAME DEBUG ===');
        console.log('Board ID:', data.boardId);
        console.log('Board ID type:', typeof data.boardId);
        console.log('Board ID length:', data.boardId?.length);
        console.log('Frame title:', data.title);
        console.log('Frame position:', data.position);
        console.log('Frame geometry:', data.geometry);
        
        // Use the board ID as-is - it's already in the correct format from Miro API
        const frameBoardId = data.boardId;
        console.log('Using board ID as-is:', frameBoardId);

        // Use direct Miro API call instead of MiroApi package
        console.log('Using direct Miro API call for frame creation...');
        
        const framePayload = {
          data: {
            title: data.title || 'Untitled Frame',
          },
          position: {
            x: data.position?.x || 0,
            y: data.position?.y || 0,
          },
          geometry: {
            width: data.geometry?.width || 800,
            height: data.geometry?.height || 600,
          },
          style: {
            fillColor: '#ffffff',
          }
        };

        console.log('Frame payload:', JSON.stringify(framePayload, null, 2));

        try {
          const miroApiUrl = `https://api.miro.com/v2/boards/${frameBoardId}/frames`;
          console.log('Miro API URL:', miroApiUrl);
          
          const miroResponse = await fetch(miroApiUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(framePayload),
          });

          console.log('Miro API response status:', miroResponse.status);
          console.log('Miro API response headers:', Object.fromEntries(miroResponse.headers.entries()));

          if (!miroResponse.ok) {
            const errorText = await miroResponse.text();
            console.error('Miro API error response:', errorText);
            throw new Error(`Miro API error: ${miroResponse.status} - ${errorText}`);
          }

          const frameResponse = await miroResponse.json();
          console.log('Frame created successfully:', frameResponse);
          
          return NextResponse.json({ id: frameResponse.id });
        } catch (directApiError) {
          console.error('Direct Miro API call failed:', directApiError);
          throw directApiError;
        }

      case 'getBoard':
        console.log('=== GET BOARD DEBUG ===');
        console.log('Board ID:', data.boardId);
        console.log('Board ID type:', typeof data.boardId);
        console.log('Board ID length:', data.boardId?.length);
        
        // Use the board ID as-is - it's already in the correct format from Miro API
        const boardId = data.boardId;
        console.log('Using board ID as-is:', boardId);

        // Use direct Miro API call to check if board exists
        try {
          const miroApiUrl = `https://api.miro.com/v2/boards/${boardId}`;
          console.log('Miro API URL:', miroApiUrl);
          
          const miroResponse = await fetch(miroApiUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          });

          console.log('Miro API response status:', miroResponse.status);

          if (!miroResponse.ok) {
            const errorText = await miroResponse.text();
            console.error('Miro API error response:', errorText);
            throw new Error(`Miro API error: ${miroResponse.status} - ${errorText}`);
          }

          const boardResponse = await miroResponse.json();
          console.log('Board found successfully:', boardResponse);
          
          return NextResponse.json({
            id: boardResponse.id,
            viewLink: boardResponse.viewLink || `https://miro.com/app/board/${boardResponse.id}`,
          });
        } catch (directApiError) {
          console.error('Direct Miro API call failed:', directApiError);
          throw directApiError;
        }

      case 'deleteBoard':
        console.log('=== DELETE BOARD DEBUG ===');
        console.log('Board ID:', data.boardId);
        
        // Use direct Miro API call for board deletion
        try {
          const miroApiUrl = `https://api.miro.com/v2/boards/${data.boardId}`;
          console.log('Miro API URL:', miroApiUrl);
          
          const miroResponse = await fetch(miroApiUrl, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          });

          console.log('Miro API response status:', miroResponse.status);

          if (!miroResponse.ok) {
            const errorText = await miroResponse.text();
            console.error('Miro API error response:', errorText);
            throw new Error(`Miro API error: ${miroResponse.status} - ${errorText}`);
          }

          console.log('Board deleted successfully');
          return NextResponse.json({ success: true });
        } catch (directApiError) {
          console.error('Direct Miro API call failed:', directApiError);
          throw directApiError;
        }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
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
        miroError: error && typeof error === 'object' && 'body' in error ? error.body : null,
      },
      { status: 500 },
    );
  }
}
