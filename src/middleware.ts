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
import { createHash, timingSafeEqual } from 'crypto';

const AUTH_COOKIE_NAME = 'admin-auth';

/**
 * Validates a signed session token
 */
function validateSessionToken(signedToken: string): boolean {
  const parts = signedToken.split('.');
  if (parts.length !== 2) {
    return false;
  }
  
  const [token, signature] = parts;
  const secret = process.env.ADMIN_PASSWORD || 'fallback-secret';
  const expectedSignature = createHash('sha256')
    .update(token + secret)
    .digest('hex');
  
  // Use timing-safe comparison
  try {
    const signatureBuffer = Buffer.from(signature, 'hex');
    const expectedSignatureBuffer = Buffer.from(expectedSignature, 'hex');
    return timingSafeEqual(signatureBuffer, expectedSignatureBuffer);
  } catch (error) {
    return false;
  }
}

/**
 * Middleware to protect admin routes
 * Redirects unauthenticated users to the login page
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply to /admin routes (except login page)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const authCookie = request.cookies.get(AUTH_COOKIE_NAME);

    if (!authCookie || !validateSessionToken(authCookie.value)) {
      // Redirect to login page with return URL
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
