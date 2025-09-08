import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  console.log('=== MIRO AUTH DEBUG ===');

  // Read configuration from server-side storage (set by /api/miro/config)
  const serverConfig = (global as any).miroConfig;

  if (!serverConfig) {
    console.error(
      'No Miro configuration found on server. Please save configuration in the UI first.',
    );
    return NextResponse.json(
      {
        error: 'Miro configuration not found on server',
        details: 'Please save your Miro configuration in the UI first, then try again.',
        solution:
          'Go to Miro Configuration tab, enter your credentials, and click "Save Configuration"',
      },
      { status: 500 },
    );
  }

  const { clientId, redirectUri, scopes } = serverConfig;

  console.log('Using server-side configuration:');
  console.log('MIRO_CLIENT_ID:', clientId);
  console.log('MIRO_REDIRECT_URI:', redirectUri);
  console.log('MIRO_SCOPES:', scopes);
  console.log(
    'All env vars:',
    Object.keys(process.env).filter((key) => key.includes('MIRO')),
  );

  // Validate configuration
  if (!clientId || !redirectUri) {
    console.error('Invalid server configuration:', {
      clientId: !!clientId,
      redirectUri: !!redirectUri,
    });
    return NextResponse.json(
      {
        error: 'Invalid Miro configuration on server',
        details: {
          clientId: !!clientId,
          redirectUri: !!redirectUri,
          message: 'Server configuration is missing required fields',
        },
      },
      { status: 500 },
    );
  }

  // Generate OAuth 2.0 authorization URL
  const authUrl = new URL('https://miro.com/oauth/authorize');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('state', 'miro-oauth-state'); // In production, use a secure random string
  authUrl.searchParams.set(
    'scope',
    scopes?.join(' ') || 'boards:read boards:write boards:write:team',
  );

  console.log('Generated auth URL:', authUrl.toString());
  console.log('=== END MIRO AUTH DEBUG ===');

  return NextResponse.json({
    authUrl: authUrl.toString(),
    message: 'OAuth 2.0 authorization URL generated',
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ error: 'Authorization code is required' }, { status: 400 });
    }

    // Read configuration from server-side storage
    const serverConfig = (global as any).miroConfig;

    if (!serverConfig) {
      return NextResponse.json(
        { error: 'Miro configuration not found on server. Please save configuration first.' },
        { status: 500 },
      );
    }

    const { clientId, clientSecret, redirectUri } = serverConfig;

    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.json(
        { error: 'Incomplete Miro configuration on server' },
        { status: 500 },
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
        { status: 500 },
      );
    }

    const tokenData = await tokenResponse.json();

    return NextResponse.json({
      success: true,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      tokenType: tokenData.token_type,
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.json({ error: 'OAuth callback processing failed' }, { status: 500 });
  }
}
