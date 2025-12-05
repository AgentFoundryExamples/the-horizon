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

import { NextRequest, NextResponse } from 'next/server';
import { validatePassword, createSession, checkRateLimit, recordFailedAttempt, clearLoginAttempts } from '@/lib/auth';

/**
 * Gets client IP address from request
 */
function getClientIp(request: NextRequest): string {
  // Try to get real IP from headers (works with proxies/CDNs)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  // Fallback to a default (in development, this might not be available)
  return 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    
    // Check rate limiting
    const rateLimit = checkRateLimit(clientIp);
    if (!rateLimit.allowed) {
      const resetIn = rateLimit.resetAt ? Math.ceil((rateLimit.resetAt - Date.now()) / 1000 / 60) : 15;
      return NextResponse.json(
        { 
          success: false, 
          error: `Too many login attempts. Please try again in ${resetIn} minutes.` 
        },
        { status: 429 }
      );
    }
    
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password is required' },
        { status: 400 }
      );
    }

    if (await validatePassword(password)) {
      // Clear failed attempts on successful login
      clearLoginAttempts(clientIp);
      await createSession();
      return NextResponse.json({ success: true });
    } else {
      // Record failed attempt
      recordFailedAttempt(clientIp);
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      );
    }
  } catch (error) {
    // Log error without exposing sensitive details
    console.error('Login error occurred');
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
