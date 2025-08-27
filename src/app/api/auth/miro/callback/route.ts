import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Check if we're on port 3000 and need to redirect to port 3002
  const currentPort = request.nextUrl.port || '3000';
  if (currentPort === '3000') {
    // Redirect to port 3002 with the same parameters
    const redirectUrl = new URL(request.url);
    redirectUrl.port = '3002';
    redirectUrl.hostname = request.nextUrl.hostname;
    
    console.log(`Redirecting OAuth callback from port 3000 to port 3002: ${redirectUrl.toString()}`);
    
    return NextResponse.redirect(redirectUrl);
  }

  console.log(`Processing OAuth callback on port ${currentPort} with code: ${code ? 'present' : 'missing'}`);

  if (error) {
    console.error('OAuth error received:', error);
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code) {
    console.error('No authorization code received');
    return NextResponse.redirect(
      new URL('/?error=No authorization code received', request.url)
    );
  }

  try {
    const clientId = process.env.MIRO_CLIENT_ID;
    const clientSecret = process.env.MIRO_CLIENT_SECRET;
    const redirectUri = process.env.MIRO_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      console.error('Missing Miro configuration');
      return NextResponse.redirect(
        new URL('/?error=Miro configuration missing', request.url)
      );
    }

    console.log('Exchanging authorization code for access token...');

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
      return NextResponse.redirect(
        new URL('/?error=Failed to exchange authorization code', request.url)
      );
    }

    const tokenData = await tokenResponse.json();
    console.log('Token exchange successful, redirecting to main page...');

    // Store the access token in a secure way (in production, use a database or secure session)
    // For now, we'll redirect with the token as a query parameter (not secure for production)
    return NextResponse.redirect(
      new URL(`/?token=${encodeURIComponent(tokenData.access_token)}&success=true`, request.url)
    );

  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/?error=OAuth callback processing failed', request.url)
    );
  }
}
