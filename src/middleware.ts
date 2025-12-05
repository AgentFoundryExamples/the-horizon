// Copyright 2025 John Brosnihan
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { sha256, timingSafeEqual } from './lib/crypto';

const AUTH_COOKIE_NAME = 'admin-auth';

/**
 * Gets the session secret from environment variable
 */
function getSessionSecret(): string {
  const SESSION_SECRET = process.env.SESSION_SECRET;
  
  if (SESSION_SECRET) {
    return SESSION_SECRET;
  }
  
  // Fallback to ADMIN_PASSWORD for backward compatibility
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  
  if (!ADMIN_PASSWORD) {
    throw new Error('Neither SESSION_SECRET nor ADMIN_PASSWORD is configured');
  }
  
  return ADMIN_PASSWORD;
}

/**
 * Validates a signed session token
 */
async function validateSessionToken(signedToken: string): Promise<boolean> {
  const parts = signedToken.split('.');
  if (parts.length !== 2) {
    return false;
  }
  
  const [token, signature] = parts;
  
  try {
    const secret = getSessionSecret();
    const expectedSignature = await sha256(token + secret);
    
    // Use timing-safe comparison
    return timingSafeEqual(signature, expectedSignature);
  } catch (error) {
    return false;
  }
}

/**
 * Middleware to protect admin routes
 * Redirects unauthenticated users to the login page
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply to /admin routes (except login page)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const authCookie = request.cookies.get(AUTH_COOKIE_NAME);

    try {
      // Validate session token with error handling for async operations
      const isValid = authCookie ? await validateSessionToken(authCookie.value) : false;
      
      if (!isValid) {
        // Redirect to login page with return URL
        const url = request.nextUrl.clone();
        url.pathname = '/admin/login';
        url.searchParams.set('returnUrl', pathname);
        return NextResponse.redirect(url);
      }
    } catch (error) {
      // If validation fails for any reason, redirect to login
      console.error('Session validation error in middleware:', error);
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      url.searchParams.set('returnUrl', pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};
