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

/**
 * Authentication utilities for admin access
 * Provides server-side password validation for admin routes
 */

import { cookies } from 'next/headers';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const AUTH_COOKIE_NAME = 'admin-auth';
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24 hours

/**
 * Validates admin password against environment variable
 */
export function validatePassword(password: string): boolean {
  if (!ADMIN_PASSWORD) {
    console.error('ADMIN_PASSWORD not configured in environment variables');
    return false;
  }
  
  if (ADMIN_PASSWORD === 'CHANGE_ME_USE_STRONG_PASSWORD_MIN_16_CHARS') {
    console.error('ADMIN_PASSWORD has not been changed from default value');
    return false;
  }
  
  return password === ADMIN_PASSWORD;
}

/**
 * Creates an authenticated session by setting a secure cookie
 */
export async function createSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, 'authenticated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
}

/**
 * Destroys the authenticated session by clearing the cookie
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}

/**
 * Checks if the current request has a valid admin session
 */
export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get(AUTH_COOKIE_NAME);
  return authCookie?.value === 'authenticated';
}
