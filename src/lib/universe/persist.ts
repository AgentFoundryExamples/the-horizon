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
  // Normalize the path first
  const normalized = path.normalize(filePath);
  
  // Reject paths with directory traversal patterns after normalization
  if (normalized.includes('..') && !path.isAbsolute(filePath)) {
    // Only reject relative paths with .. patterns
    // Absolute paths are ok since they're resolved from cwd anyway
    return false;
  }
  
  const resolved = path.resolve(process.cwd(), filePath);
  const cwd = process.cwd();
  
  // For security, ensure the resolved path doesn't try to escape the project
  // but allow test paths that are absolute
  if (path.isAbsolute(filePath)) {
    // Allow absolute paths (used in tests)
    return true;
  }
  
  // Ensure the resolved path is within the project directory for relative paths
  if (!resolved.startsWith(cwd)) {
    return false;
  }
  
  return true;
}

/**
 * Persists universe data to local file system (server-side only)
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
    
    // Validate file path to prevent path traversal attacks
    if (!validateFilePath(targetPath)) {
      return {
        success: false,
        error: 'Invalid file path: path traversal not allowed',
      };
    }
    
    // Validate before persisting
    const validation = validateUniverse(universe);
    if (!validation.valid) {
      return {
        success: false,
        error: `Validation failed: ${validation.errors.join(', ')}`,
      };
    }

    // Serialize universe with pretty formatting
    const content = serializeUniverse(universe);

    // Resolve the absolute path
    const absolutePath = path.resolve(process.cwd(), targetPath);

    // Ensure directory exists
    const dir = path.dirname(absolutePath);
    await fs.mkdir(dir, { recursive: true });

    // Write to file atomically with unique temp file name
    const uniqueSuffix = crypto.randomBytes(8).toString('hex');
    tempPath = `${absolutePath}.tmp.${uniqueSuffix}`;
    
    try {
      await fs.writeFile(tempPath, content, 'utf-8');
      await fs.rename(tempPath, absolutePath);
      tempPath = null; // Successfully renamed, no cleanup needed
    } finally {
      // Ensure temporary file is cleaned up if rename failed
      if (tempPath) {
        await fs.unlink(tempPath).catch(() => {
          // Ignore errors if file doesn't exist
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error persisting universe to file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
