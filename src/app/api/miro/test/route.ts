import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  try {
    const accessToken = process.env.MIRO_ACCESS_TOKEN;
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Miro access token not configured' },
        { status: 500 }
      );
    }

    // Analyze the token
    const tokenParts = accessToken.split('.');
    
    return NextResponse.json({
      tokenAnalysis: {
        length: accessToken.length,
        parts: tokenParts.length,
        startsWith: accessToken.substring(0, 20),
        endsWith: accessToken.substring(accessToken.length - 20),
        partLengths: tokenParts.map(part => part.length),
        isValidJWT: tokenParts.length === 3
      },
      message: tokenParts.length === 3 ? 'Token format looks valid' : 'Token format appears invalid - expected 3 parts for JWT'
    });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    return NextResponse.json(
      { 
        error: 'Error in test endpoint',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
