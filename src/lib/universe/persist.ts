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
import { Universe, validateUniverse } from './types';
import { serializeUniverse } from './mutate';

/**
 * Persists universe data to local file system (server-side only)
 * @param universe - The universe data to persist
 * @param filePath - Path to the universe.json file (default: public/universe/universe.json)
 * @returns Promise<{ success: boolean; error?: string }>
 */
export async function persistUniverseToFile(
  universe: Universe,
  filePath: string = 'public/universe/universe.json'
): Promise<{ success: boolean; error?: string }> {
  try {
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
    const absolutePath = path.resolve(process.cwd(), filePath);

    // Ensure directory exists
    const dir = path.dirname(absolutePath);
    await fs.mkdir(dir, { recursive: true });

    // Write to file atomically (write to temp file, then rename)
    const tempPath = `${absolutePath}.tmp`;
    await fs.writeFile(tempPath, content, 'utf-8');
    await fs.rename(tempPath, absolutePath);

    return { success: true };
  } catch (error) {
    console.error('Error persisting universe to file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
