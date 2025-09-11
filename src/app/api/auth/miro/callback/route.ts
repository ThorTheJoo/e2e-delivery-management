import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('=== MIRO CALLBACK DEBUG ===');
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Log the current port for debugging
  const currentPort = request.nextUrl.port || '3000';
  console.log(`Processing OAuth callback on port ${currentPort}`);

  console.log('Callback parameters:');
  console.log('- Code:', code ? 'present' : 'missing');
  console.log('- State:', state);
  console.log('- Error:', error);
  console.log('- All params:', Object.fromEntries(searchParams.entries()));
  console.log(
    `Processing OAuth callback on port ${currentPort} with code: ${code ? 'present' : 'missing'}`,
  );

  if (error) {
    console.error('OAuth error received:', error);
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error)}`, request.url));
  }

  if (!code) {
    console.error('No authorization code received');
    return NextResponse.redirect(new URL('/?error=No authorization code received', request.url));
  }

  try {
    // Read configuration from server-side storage (set by /api/miro/config)
    const serverConfig = (global as any).miroConfig;

    if (!serverConfig) {
      console.error(
        'No Miro configuration found on server. Please save configuration in the UI first.',
      );
      return NextResponse.redirect(
        new URL(
          '/?error=Miro configuration not found on server - Please save configuration first',
          request.url,
        ),
      );
    }

    const { clientId, clientSecret, redirectUri } = serverConfig;

    console.log('Using server-side configuration:');
    console.log('- Client ID:', clientId);
    console.log('- Client Secret:', clientSecret ? '***SET***' : 'NOT SET');
    console.log('- Redirect URI:', redirectUri);

    if (!clientId || !clientSecret || !redirectUri) {
      console.error('Incomplete Miro configuration on server');
      return NextResponse.redirect(
        new URL('/?error=Incomplete Miro configuration on server', request.url),
      );
    }

    console.log('Exchanging authorization code for access token...');

    // Log the request details being sent to Miro
    const requestBody = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      redirect_uri: redirectUri,
    });

    console.log('=== TOKEN EXCHANGE REQUEST DEBUG ===');
    console.log('Request URL:', 'https://api.miro.com/v1/oauth/token');
    console.log('Request method: POST');
    console.log('Request headers:', { 'Content-Type': 'application/x-www-form-urlencoded' });
    console.log('Request body params:');
    console.log('- grant_type:', 'authorization_code');
    console.log('- client_id:', clientId);
    console.log(
      '- client_secret:',
      clientSecret === 'YOUR_MIRO_CLIENT_SECRET_HERE' ? 'PLACEHOLDER_VALUE' : '***SET***',
    );
    console.log('- code:', code);
    console.log('- redirect_uri:', redirectUri);
    console.log('=== END REQUEST DEBUG ===');

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://api.miro.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: requestBody,
    });

    console.log('=== TOKEN EXCHANGE RESPONSE DEBUG ===');
    console.log('Response status:', tokenResponse.status);
    console.log('Response status text:', tokenResponse.statusText);
    console.log('Response headers:', Object.fromEntries(tokenResponse.headers.entries()));

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed - Full error response:');
      console.error('Status:', tokenResponse.status);
      console.error('Status Text:', tokenResponse.statusText);
      console.error('Response Headers:', Object.fromEntries(tokenResponse.headers.entries()));
      console.error('Response Body:', errorData);

      // Try to parse error response for better error messages
      let errorMessage = 'Failed to exchange authorization code';
      try {
        const errorJson = JSON.parse(errorData);
        console.error('Parsed error JSON:', errorJson);
        if (errorJson.error_description) {
          errorMessage = errorJson.error_description;
        } else if (errorJson.error) {
          errorMessage = errorJson.error;
        } else if (errorJson.message) {
          errorMessage = errorJson.message;
        }
      } catch (e) {
        console.error('Failed to parse error response as JSON:', e);
        // If we can't parse the error, use the raw text
        errorMessage = `Token exchange failed: ${errorData}`;
      }

      console.log('=== END RESPONSE DEBUG ===');

      return NextResponse.redirect(
        new URL(`/?error=${encodeURIComponent(errorMessage)}`, request.url),
      );
    }

    const tokenData = await tokenResponse.json();
    console.log('Token exchange successful!');
    console.log('Full token response data:', tokenData);
    console.log('Token response summary:', {
      access_token: tokenData.access_token ? '***PRESENT***' : 'missing',
      token_type: tokenData.token_type,
      expires_in: tokenData.expires_in,
      refresh_token: tokenData.refresh_token ? '***PRESENT***' : 'missing',
    });
    console.log('=== END RESPONSE DEBUG ===');
    console.log('=== END MIRO CALLBACK DEBUG ===');

    // Store the access token in a secure way (in production, use a database or secure session)
    // For now, we'll redirect with the token as a query parameter (not secure for production)
    return NextResponse.redirect(
      new URL(`/?token=${encodeURIComponent(tokenData.access_token)}&success=true`, request.url),
    );
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(new URL('/?error=OAuth callback processing failed', request.url));
  }
}
