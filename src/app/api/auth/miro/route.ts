import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const clientId = process.env.MIRO_CLIENT_ID;
  const redirectUri = process.env.MIRO_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: 'Miro configuration missing' },
      { status: 500 }
    );
  }

  // Generate OAuth 2.0 authorization URL
  const authUrl = new URL('https://miro.com/oauth/authorize');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('state', 'miro-oauth-state'); // In production, use a secure random string
  authUrl.searchParams.set('scope', 'boards:read boards:write boards:write:team');

  return NextResponse.json({
    authUrl: authUrl.toString(),
    message: 'OAuth 2.0 authorization URL generated'
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Authorization code is required' },
        { status: 400 }
      );
    }

    const clientId = process.env.MIRO_CLIENT_ID;
    const clientSecret = process.env.MIRO_CLIENT_SECRET;
    const redirectUri = process.env.MIRO_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.json(
        { error: 'Miro configuration missing' },
        { status: 500 }
      );
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://api.miro.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', errorData);
      return NextResponse.json(
        { error: 'Failed to exchange authorization code for token' },
        { status: 500 }
      );
    }

    const tokenData = await tokenResponse.json();

    return NextResponse.json({
      success: true,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      tokenType: tokenData.token_type
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.json(
      { error: 'OAuth callback processing failed' },
      { status: 500 }
    );
  }
}
