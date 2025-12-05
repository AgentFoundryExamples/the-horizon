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
import { timingSafeEqual, sha256, randomBytes } from './crypto';

const AUTH_COOKIE_NAME = 'admin-auth';
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24 hours

// In-memory store for rate limiting (resets on server restart)
// NOTE: This is not suitable for multi-instance deployments.
// For production with multiple instances, use a shared cache like Redis.
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

/**
 * Gets the session secret from environment variable
 * Falls back to ADMIN_PASSWORD for backward compatibility but logs warning
 */
function getSessionSecret(): string {
  const SESSION_SECRET = process.env.SESSION_SECRET;
  
  if (SESSION_SECRET) {
    return SESSION_SECRET;
  }
  
  // Fallback to ADMIN_PASSWORD for backward compatibility
  // Log warning that this is not recommended
  console.warn('SESSION_SECRET not set, using ADMIN_PASSWORD as fallback. This is not recommended for production.');
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  
  if (!ADMIN_PASSWORD) {
    throw new Error('Neither SESSION_SECRET nor ADMIN_PASSWORD is configured');
  }
  
  return ADMIN_PASSWORD;
}

// Cache the admin password hash to avoid re-computing it on every call
let adminPasswordHashCache: string | null = null;
let cachedAdminPassword: string | null = null;

/**
 * Gets the admin password from environment variable
 */
function getAdminPassword(): string | undefined {
  return process.env.ADMIN_PASSWORD;
}

/**
 * Validates admin password against environment variable using timing-safe comparison
 */
export async function validatePassword(password: string): Promise<boolean> {
  const ADMIN_PASSWORD = getAdminPassword();
  
  if (!ADMIN_PASSWORD) {
    console.error('ADMIN_PASSWORD not configured in environment variables');
    return false;
  }
  
  if (ADMIN_PASSWORD === 'CHANGE_ME_USE_STRONG_PASSWORD_MIN_16_CHARS') {
    console.error('ADMIN_PASSWORD has not been changed from default value');
    return false;
  }
  
  // Use timing-safe comparison to prevent timing attacks
  try {
    // Check if we need to recompute the admin password hash
    // (happens when ADMIN_PASSWORD changes or on first call)
    if (!adminPasswordHashCache || cachedAdminPassword !== ADMIN_PASSWORD) {
      adminPasswordHashCache = await sha256(ADMIN_PASSWORD);
      cachedAdminPassword = ADMIN_PASSWORD;
    }
    
    const passwordHash = await sha256(password);
    
    return timingSafeEqual(passwordHash, adminPasswordHashCache);
  } catch (error) {
    // If comparison fails for any reason, return false
    return false;
  }
}

/**
 * Check if IP is rate limited
 */
export function checkRateLimit(ip: string): { allowed: boolean; resetAt?: number } {
  const now = Date.now();
  const attempt = loginAttempts.get(ip);
  
  if (attempt) {
    // Check if lockout period has expired
    if (now > attempt.resetAt) {
      loginAttempts.delete(ip);
      return { allowed: true };
    }
    
    // Check if max attempts exceeded
    if (attempt.count >= MAX_LOGIN_ATTEMPTS) {
      return { allowed: false, resetAt: attempt.resetAt };
    }
  }
  
  return { allowed: true };
}

/**
 * Record a failed login attempt
 */
export function recordFailedAttempt(ip: string): void {
  const now = Date.now();
  const attempt = loginAttempts.get(ip);
  
  if (attempt && now < attempt.resetAt) {
    // Increment existing attempt
    attempt.count++;
  } else {
    // Create new attempt record
    loginAttempts.set(ip, {
      count: 1,
      resetAt: now + LOCKOUT_DURATION,
    });
  }
}

/**
 * Clear login attempts for an IP (on successful login)
 */
export function clearLoginAttempts(ip: string): void {
  loginAttempts.delete(ip);
}

/**
 * Creates an authenticated session by setting a secure signed cookie
 */
export async function createSession(): Promise<void> {
  const cookieStore = await cookies();
  
  // Generate a secure random session token (hex string)
  const sessionTokenHex = randomBytes(32);
  
  // Sign the token with the session secret
  const secret = getSessionSecret();
  const signature = await sha256(sessionTokenHex + secret);
  
  const signedToken = `${sessionTokenHex}.${signature}`;
  
  cookieStore.set(AUTH_COOKIE_NAME, signedToken, {
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
  
  if (!authCookie?.value) {
    return false;
  }
  
  // Validate the signed token
  const parts = authCookie.value.split('.');
  if (parts.length !== 2) {
    return false;
  }
  
  const [token, signature] = parts;
  const secret = getSessionSecret();
  const expectedSignature = await sha256(token + secret);
  
  // Use timing-safe comparison for signature validation
  try {
    return timingSafeEqual(signature, expectedSignature);
  } catch (error) {
    return false;
  }
}
