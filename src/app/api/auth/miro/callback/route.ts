import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/?error=No authorization code received', request.url)
    );
  }

  try {
    const clientId = process.env.MIRO_CLIENT_ID;
    const clientSecret = process.env.MIRO_CLIENT_SECRET;
    const redirectUri = process.env.MIRO_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.redirect(
        new URL('/?error=Miro configuration missing', request.url)
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
      return NextResponse.redirect(
        new URL('/?error=Failed to exchange authorization code', request.url)
      );
    }

    const tokenData = await tokenResponse.json();

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
