import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  try {
    // This endpoint shows the current server-side configuration status
    const serverConfig = (global as any).miroConfig;

    return NextResponse.json({
      message: 'Miro configuration endpoint status',
      method: 'GET',
      serverConfig: serverConfig
        ? {
            clientId: serverConfig.clientId,
            clientSecret: serverConfig.clientSecret ? '***SET***' : 'NOT SET',
            redirectUri: serverConfig.redirectUri,
            scopes: serverConfig.scopes,
          }
        : null,
      isConfigured: !!serverConfig,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in Miro config GET:', error);
    return NextResponse.json({ error: 'Failed to get configuration status' }, { status: 500 });
  }
}

export async function POST(_request: NextRequest) {
  try {
    const body = await _request.json();
    const { config } = body;

    if (!config) {
      return NextResponse.json({ error: 'Configuration data is required' }, { status: 400 });
    }

    if (!config.clientId || !config.clientSecret || !config.redirectUri || !config.scopes) {
      return NextResponse.json(
        {
          error: 'Invalid configuration structure',
          details: {
            clientId: !!config.clientId,
            clientSecret: !!config.clientSecret,
            redirectUri: !!config.redirectUri,
            scopes: Array.isArray(config.scopes),
          },
        },
        { status: 400 },
      );
    }

    (global as any).miroConfig = {
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      redirectUri: config.redirectUri,
      scopes: config.scopes,
    };

    return NextResponse.json({
      success: true,
      message: 'Configuration updated successfully',
      config: {
        clientId: config.clientId,
        clientSecret: config.clientSecret ? '***SET***' : 'NOT SET',
        redirectUri: config.redirectUri,
        scopes: config.scopes,
      },
    });
  } catch (error) {
    console.error('Error in Miro config POST:', error);
    return NextResponse.json({ error: 'Failed to update configuration' }, { status: 500 });
  }
}
