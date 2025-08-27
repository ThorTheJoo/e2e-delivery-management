import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if this is an OAuth callback request on port 3000
  const url = request.nextUrl;
  const isOAuthCallback = url.pathname === '/api/auth/miro/callback';
  const currentPort = url.port || '3000';
  
  if (isOAuthCallback && currentPort === '3000') {
    // Redirect to port 3002 with the same parameters
    const redirectUrl = new URL(url);
    redirectUrl.port = '3002';
    redirectUrl.hostname = url.hostname;
    
    console.log(`Redirecting OAuth callback from port 3000 to port 3002: ${redirectUrl.toString()}`);
    
    return NextResponse.redirect(redirectUrl);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/api/auth/miro/callback',
};
