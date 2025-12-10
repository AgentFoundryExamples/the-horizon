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
 * Server-side persistence utilities for universe data
 * This module should only be imported in server-side code (API routes)
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { Universe, validateUniverse } from './types';
import { serializeUniverse } from './mutate';

/**
 * Validates that the file path is safe and within allowed directories
 */
function validateFilePath(filePath: string): boolean {
  try {
    // Resolve to absolute path
    const resolved = path.resolve(process.cwd(), filePath);
    const cwd = process.cwd();
    
    // For test environments, allow paths outside cwd (e.g., /tmp)
    // In production, this should be restricted to cwd only
    const isTestEnv = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;
    
    if (!isTestEnv) {
      // Production: ensure the resolved path is within the project directory
      if (!resolved.startsWith(cwd + path.sep) && resolved !== cwd) {
        return false;
      }
    }
    
    // Reject obvious directory traversal attempts in the original path
    const normalized = path.normalize(filePath);
    if (normalized.startsWith('..') || normalized.includes(path.sep + '..')) {
      return false;
    }
    
    return true;
  } catch (error) {
    // If path resolution fails, reject it
    return false;
  }
}

/**
 * Persists universe data to local file system (server-side only)
 * 
 * @deprecated This function is deprecated and will not work on Vercel or other
 * serverless platforms with read-only filesystems. Universe changes should be
 * committed directly to GitHub using pushUniverseChanges() instead.
 * 
 * This function is kept for local development and testing purposes only.
 * 
 * @param universe - The universe data to persist
 * @param filePath - Path to the universe.json file (default from env or public/universe/universe.json)
 * @returns Promise<{ success: boolean; error?: string }>
 */
export async function persistUniverseToFile(
  universe: Universe,
  filePath?: string
): Promise<{ success: boolean; error?: string }> {
  let tempPath: string | null = null;
  
  try {
    // Use provided path, or environment variable, or default
    const targetPath = filePath || 
      process.env.UNIVERSE_DATA_PATH || 
      'public/universe/universe.json';
    
    console.log('[persistUniverseToFile] Persisting to:', targetPath);
    
    // Validate file path to prevent path traversal attacks
    if (!validateFilePath(targetPath)) {
      console.error('[persistUniverseToFile] Path validation failed:', targetPath);
      return {
        success: false,
        error: 'Invalid file path: path traversal not allowed',
      };
    }
    
    // Validate before persisting
    console.log('[persistUniverseToFile] Validating universe data...');
    const validation = validateUniverse(universe);
    if (!validation.valid) {
      console.error('[persistUniverseToFile] Validation failed:', validation.errors.join(', '));
      return {
        success: false,
        error: `Validation failed: ${validation.errors.join(', ')}`,
      };
    }
    console.log('[persistUniverseToFile] Validation passed');

    // Serialize universe with pretty formatting
    const content = serializeUniverse(universe);
    console.log('[persistUniverseToFile] Serialized universe, size:', content.length, 'bytes');

    // Resolve the absolute path
    const absolutePath = path.resolve(process.cwd(), targetPath);

    // Ensure directory exists
    const dir = path.dirname(absolutePath);
    console.log('[persistUniverseToFile] Ensuring directory exists:', dir);
    await fs.mkdir(dir, { recursive: true });

    // Write to file atomically with unique temp file name
    const uniqueSuffix = crypto.randomBytes(8).toString('hex');
    tempPath = `${absolutePath}.tmp.${uniqueSuffix}`;
    
    console.log('[persistUniverseToFile] Writing to temp file:', tempPath);
    await fs.writeFile(tempPath, content, 'utf-8');
    
    console.log('[persistUniverseToFile] Renaming temp file to:', absolutePath);
    await fs.rename(tempPath, absolutePath);
    tempPath = null; // Successfully renamed, no cleanup needed

    console.log('[persistUniverseToFile] Success - file persisted');
    return { success: true };
  } catch (error) {
    console.error('[persistUniverseToFile] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  } finally {
    // Ensure temporary file is cleaned up if it still exists
    if (tempPath) {
      console.log('[persistUniverseToFile] Cleaning up temp file:', tempPath);
      await fs.unlink(tempPath).catch((err) => {
        // Ignore 'file not found' errors, but log others
        if (err.code !== 'ENOENT') {
          console.error('[persistUniverseToFile] Failed to clean up temp file:', err);
          // Not re-throwing to avoid masking the original error
        }
      });
    }
  }
}
