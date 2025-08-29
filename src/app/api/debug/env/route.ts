import { NextResponse } from 'next/server';

export async function GET() {
  console.log('=== ENVIRONMENT DEBUG ===');
  console.log('All environment variables:', Object.keys(process.env).filter(key => key.includes('MIRO')));
  console.log('MIRO_CLIENT_ID:', process.env.MIRO_CLIENT_ID);
  console.log('MIRO_CLIENT_SECRET:', process.env.MIRO_CLIENT_SECRET ? '***SET***' : 'NOT SET');
  console.log('MIRO_REDIRECT_URI:', process.env.MIRO_REDIRECT_URI);
  console.log('=== END ENVIRONMENT DEBUG ===');

  return NextResponse.json({
    miroClientId: process.env.MIRO_CLIENT_ID,
    miroClientSecret: process.env.MIRO_CLIENT_SECRET ? '***SET***' : 'NOT SET',
    miroRedirectUri: process.env.MIRO_REDIRECT_URI,
    allMiroVars: Object.keys(process.env).filter(key => key.includes('MIRO')),
    nodeEnv: process.env.NODE_ENV,
    cwd: process.cwd()
  });
}

