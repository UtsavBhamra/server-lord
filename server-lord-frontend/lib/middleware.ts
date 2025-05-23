import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Define public paths that don't require authentication
const publicPaths = ['/login', '/signup', '/'];

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: 'server-lord-secret' });
  const path = request.nextUrl.pathname;
  
  // Check if the path is a dashboard route
  const isDashboardRoute = path.startsWith('/dashboard');
  
  // If accessing dashboard routes without a token, redirect to login
  if (isDashboardRoute && !token) {
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', encodeURI(request.url));
    return NextResponse.redirect(url);
  }
  
  // If accessing login/signup with a valid token, redirect to dashboard
  if (publicPaths.includes(path) && token) {
    const url = new URL('/dashboard', request.url);
    return NextResponse.redirect(url);
  }
  
  return NextResponse.next();
}

// Configure paths that trigger the middleware
export const config = {
  matcher: [
    // Match all dashboard routes
    '/dashboard/:path*',
    // Match login and signup routes
    '/login',
    '/signup',
  ],
};