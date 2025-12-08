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
import { sha256 } from '@/lib/crypto';
import { isAuthenticated } from '@/lib/auth';
import { fetchCurrentUniverse, pushUniverseChanges } from '@/lib/github';
import { parseAndValidateUniverse, serializeUniverse } from '@/lib/universe/mutate';
import { persistUniverseToFile } from '@/lib/universe/persist';
import universeData from '@/../public/universe/universe.json';
import fs from 'fs/promises';
import path from 'path';

/**
 * Check if verbose logging is enabled
 * Set ADMIN_VERBOSE_LOGGING=true to enable detailed workflow logging
 */
const isVerboseLoggingEnabled = (): boolean => {
  return process.env.ADMIN_VERBOSE_LOGGING === 'true' || process.env.NODE_ENV === 'development';
};

/**
 * Log verbose messages only when verbose logging is enabled
 */
const logVerbose = (...args: unknown[]): void => {
  if (isVerboseLoggingEnabled()) {
    console.log(...args);
  }
};

/**
 * GET /api/admin/universe
 * Returns the current universe data with hash for optimistic locking
 * Query params:
 *   - syncFromGitHub: if 'true', fetches latest from GitHub instead of local file
 */
export async function GET(request: NextRequest) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    console.error('[GET /api/admin/universe] Authentication failed');
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  console.log('[GET /api/admin/universe] Request received - fetching universe data');

  try {
    // Check if explicit GitHub sync is requested
    const { searchParams } = new URL(request.url);
    const syncFromGitHub = searchParams.get('syncFromGitHub') === 'true';

    if (syncFromGitHub) {
      // Explicitly requested GitHub sync
      console.log('[GET /api/admin/universe] Explicit GitHub sync requested');
      const githubData = await fetchCurrentUniverse();
      
      if (githubData) {
        const hashPreview = githubData.hash?.substring(0, 8) || 'unknown';
        console.log('[GET /api/admin/universe] Loaded from GitHub, hash:', hashPreview + '...');
        const { universe, errors } = parseAndValidateUniverse(githubData.content);
        return NextResponse.json({
          universe,
          hash: githubData.hash,
          gitBaseHash: githubData.hash, // Both hashes are the same when fetching from GitHub
          localDiskHash: githubData.hash,
          validationErrors: errors,
          source: 'github',
        });
      } else {
        // Explicit GitHub sync failed - return error instead of falling back
        console.error('[GET /api/admin/universe] Explicit GitHub sync failed');
        return NextResponse.json(
          { 
            error: 'GitHub sync failed',
            message: 'Unable to sync from GitHub. Check GitHub configuration and network connectivity.'
          },
          { status: 503 }
        );
      }
    }

    // Default: read from local persisted file
    console.log('[GET /api/admin/universe] Reading from local file');
    const targetPath = process.env.UNIVERSE_DATA_PATH || 'public/universe/universe.json';
    const absolutePath = path.resolve(process.cwd(), targetPath);
    
    try {
      const content = await fs.readFile(absolutePath, 'utf-8');
      console.log('[GET /api/admin/universe] Local file read successfully');
      const localHash = await sha256(content);
      const { universe, errors } = parseAndValidateUniverse(content);
      const hashPreview = localHash?.substring(0, 8) || 'unknown';
      console.log('[GET /api/admin/universe] Loaded local file, hash:', hashPreview + '...', 'galaxies:', universe.galaxies.length);
      
      // Try to get GitHub hash for baseline comparison, but don't fail if unavailable
      let gitHash: string | null = null;
      try {
        const githubData = await fetchCurrentUniverse();
        if (githubData && githubData.hash) {
          gitHash = githubData.hash;
          console.log('[GET /api/admin/universe] GitHub baseline hash:', gitHash.substring(0, 8) + '...');
        } else {
          console.warn('[GET /api/admin/universe] GitHub baseline hash could not be retrieved.');
        }
      } catch (err) {
        console.warn('[GET /api/admin/universe] Could not fetch GitHub baseline:', err instanceof Error ? err.message : String(err));
      }
      
      return NextResponse.json({
        universe,
        hash: localHash, // Legacy field for backwards compatibility
        gitBaseHash: gitHash, // Can be null if GitHub is unreachable
        localDiskHash: localHash, // Current local file hash
        validationErrors: errors,
        source: 'local',
      });
    } catch (error) {
      // If local file doesn't exist, try GitHub as fallback
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn('[GET /api/admin/universe] Local file read failed:', errorMessage, 'Attempting GitHub fallback');
      const githubData = await fetchCurrentUniverse();
      
      if (githubData) {
        const hashPreview = githubData.hash?.substring(0, 8) || 'unknown';
        console.log('[GET /api/admin/universe] Loaded from GitHub fallback, hash:', hashPreview + '...');
        const { universe, errors } = parseAndValidateUniverse(githubData.content);
        return NextResponse.json({
          universe,
          hash: githubData.hash,
          gitBaseHash: githubData.hash,
          localDiskHash: githubData.hash,
          validationErrors: errors,
          source: 'github',
          warning: 'Local file not found, loaded from GitHub',
        });
      }
      
      // Last resort: use imported data
      console.warn('[GET /api/admin/universe] Both local file and GitHub unavailable, using imported data');
      const content = JSON.stringify(universeData, null, 2);
      const hash = await sha256(content);
      const { universe, errors } = parseAndValidateUniverse(content);
      const hashPreview = hash?.substring(0, 8) || 'unknown';
      console.log('[GET /api/admin/universe] Loaded imported data, hash:', hashPreview + '...', 'galaxies:', universe.galaxies.length);
      return NextResponse.json({
        universe,
        hash,
        gitBaseHash: hash,
        localDiskHash: hash,
        validationErrors: errors,
        source: 'default',
        warning: 'Local file and GitHub unavailable, loaded default data',
      });
    }
  } catch (error) {
    console.error('[GET /api/admin/universe] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch universe data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/universe
 * Saves universe changes to local file without committing to GitHub
 */
export async function PATCH(request: NextRequest) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    console.error('[PATCH /api/admin/universe] Authentication failed');
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  console.log('[PATCH /api/admin/universe] Request received - saving to disk');

  try {
    const { universe, currentHash } = await request.json();
    console.log('[PATCH /api/admin/universe] Payload parsed - galaxies:', universe?.galaxies?.length || 0);

    if (!universe) {
      console.error('[PATCH /api/admin/universe] No universe data in payload');
      return NextResponse.json(
        { error: 'Universe data is required' },
        { status: 400 }
      );
    }

    // Optimistic locking: verify current hash if provided
    if (currentHash) {
      const hashPreview = currentHash?.substring(0, 8) || 'unknown';
      console.log('[PATCH /api/admin/universe] Checking optimistic lock with hash:', hashPreview + '...');
      const targetPath = process.env.UNIVERSE_DATA_PATH || 'public/universe/universe.json';
      const absolutePath = path.resolve(process.cwd(), targetPath);
      
      try {
        const currentContent = await fs.readFile(absolutePath, 'utf-8');
        const actualHash = await sha256(currentContent);
        
        if (actualHash !== currentHash) {
          console.warn('[PATCH /api/admin/universe] Conflict detected - hash mismatch');
          return NextResponse.json(
            {
              error: 'Conflict detected',
              message: 'The file has been modified by another user. Please refresh and try again.',
            },
            { status: 409 }
          );
        }
        console.log('[PATCH /api/admin/universe] Hash verification passed');
      } catch (error) {
        // If file doesn't exist yet, allow the save to proceed
        console.warn('[PATCH /api/admin/universe] Universe file does not exist yet, proceeding with initial save');
      }
    }

    // Validate universe data
    console.log('[PATCH /api/admin/universe] Validating universe data...');
    const { errors } = parseAndValidateUniverse(JSON.stringify(universe));
    if (errors.length > 0) {
      console.error('[PATCH /api/admin/universe] Validation failed:', errors.join(', '));
      return NextResponse.json(
        { error: 'Validation failed', validationErrors: errors },
        { status: 400 }
      );
    }
    console.log('[PATCH /api/admin/universe] Validation passed');

    // Persist to local file
    console.log('[PATCH /api/admin/universe] Persisting to file system...');
    const result = await persistUniverseToFile(universe);

    if (result.success) {
      console.log('[PATCH /api/admin/universe] File write successful');
      
      // Calculate new hash from the persisted file to ensure synchronization
      const targetPath = process.env.UNIVERSE_DATA_PATH || 'public/universe/universe.json';
      const absolutePath = path.resolve(process.cwd(), targetPath);
      const persistedContent = await fs.readFile(absolutePath, 'utf-8');
      const hash = await sha256(persistedContent);

      const hashPreview = hash?.substring(0, 8) || 'unknown';
      console.log('[PATCH /api/admin/universe] Success - new local disk hash:', hashPreview + '...');
      return NextResponse.json({
        success: true,
        message: 'Universe data saved successfully',
        hash, // This is the new localDiskHash - gitBaseHash should remain unchanged in client
      });
    } else {
      console.error('[PATCH /api/admin/universe] Persist failed:', result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          message: 'Failed to save universe data to disk',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[PATCH /api/admin/universe] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to save universe data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/universe
 * Commits universe changes to GitHub (reads from persisted file)
 * 
 * This endpoint implements a two-step workflow:
 * 1. PATCH saves changes to local file system
 * 2. POST reads from file system and commits to GitHub
 * 
 * The workflow ensures:
 * - Changes are validated before GitHub commit
 * - File content on disk is authoritative source
 * - Fresh GitHub SHA is fetched before commit to prevent conflicts
 * - Optimistic locking prevents concurrent edit issues
 */
export async function POST(request: NextRequest) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    console.error('[POST /api/admin/universe] Authentication failed');
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  logVerbose('[POST /api/admin/universe] ========================================');
  console.log('[POST /api/admin/universe] Request received - committing to GitHub');
  logVerbose('[POST /api/admin/universe] Workflow: Step 2 of 2 (Step 1 was PATCH to save to disk)');

  try {
    const { commitMessage, createPR, gitBaseHash } = await request.json();
    const messagePreview = commitMessage?.substring(0, 50) || '';
    logVerbose('[POST /api/admin/universe] Payload:', { commitMessage: messagePreview, createPR, hasGitBaseHash: !!gitBaseHash });

    if (!commitMessage) {
      console.error('[POST /api/admin/universe] No commit message provided');
      return NextResponse.json(
        { error: 'Commit message is required' },
        { status: 400 }
      );
    }

    // Read content from the persisted file to prevent data loss
    // This ensures we're committing exactly what was saved to disk
    const targetPath = process.env.UNIVERSE_DATA_PATH || 'public/universe/universe.json';
    const absolutePath = path.resolve(process.cwd(), targetPath);
    
    logVerbose('[POST /api/admin/universe] Step 1: Reading from persisted file:', targetPath);
    let content: string;
    try {
      content = await fs.readFile(absolutePath, 'utf-8');
      logVerbose('[POST /api/admin/universe] File read successfully, size:', content.length, 'bytes');
      logVerbose('[POST /api/admin/universe] File is authoritative source for commit');
    } catch (error) {
      console.error('[POST /api/admin/universe] Failed to read persisted file:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'No saved data found',
          message: 'Please save your changes to disk before committing',
        },
        { status: 400 }
      );
    }

    // Validate the persisted data
    logVerbose('[POST /api/admin/universe] Step 2: Validating persisted data...');
    const { errors } = parseAndValidateUniverse(content);
    if (errors.length > 0) {
      console.error('[POST /api/admin/universe] Validation failed:', errors.join(', '));
      return NextResponse.json(
        { error: 'Validation failed', validationErrors: errors },
        { status: 400 }
      );
    }
    logVerbose('[POST /api/admin/universe] Validation passed');

    /**
     * Log local disk state before committing (diagnostic only)
     * 
     * This function logs if the local disk file has diverged from the gitBaseHash.
     * In the normal save→commit workflow, the hashes WILL differ because:
     * 1. User loaded editor with gitBaseHash from GitHub
     * 2. User made edits and saved to disk (updates local file, gitBaseHash unchanged)
     * 3. User commits (we're here - local file has changes, gitBaseHash is still original)
     * 
     * We log the difference but DON'T fail because:
     * - The divergence is expected and intentional in the save→commit workflow
     * - The GitHub layer will fetch fresh SHA and detect actual remote conflicts
     * - This check is primarily for diagnostics and debugging
     */
    const logLocalStateBeforeCommit = async (
      localContent: string,
      expectedGitBaseHash: string | undefined
    ): Promise<void> => {
      logVerbose('[POST /api/admin/universe] Step 3: Logging local state before commit...');
      const onDiskHash = await sha256(localContent);
      
      if (expectedGitBaseHash && onDiskHash !== expectedGitBaseHash) {
        logVerbose('[POST /api/admin/universe] Note: Local disk hash differs from gitBaseHash');
        logVerbose('[POST /api/admin/universe] GitBaseHash:', expectedGitBaseHash.substring(0, 8) + '...');
        logVerbose('[POST /api/admin/universe] OnDiskHash:', onDiskHash.substring(0, 8) + '...');
        logVerbose('[POST /api/admin/universe] This is EXPECTED in save→commit workflow (user saved changes locally)');
      } else {
        logVerbose('[POST /api/admin/universe] Local disk hash matches gitBaseHash or no hash provided');
      }
    };

    await logLocalStateBeforeCommit(content, gitBaseHash);

    // Push to GitHub
    logVerbose('[POST /api/admin/universe] Step 4: Pushing to GitHub...');
    logVerbose('[POST /api/admin/universe] Note: GitHub layer will fetch fresh SHA to prevent conflicts');
    const result = await pushUniverseChanges(
      content,
      commitMessage,
      createPR || false,
      gitBaseHash // Pass gitBaseHash for logging/context, but actual GitHub SHA fetching happens in pushUniverseChanges
    );

    if (result.success) {
      logVerbose('[POST /api/admin/universe] ========================================');
      console.log('[POST /api/admin/universe] SUCCESS: GitHub push successful');
      if (result.prUrl) {
        console.log('[POST /api/admin/universe] PR URL:', result.prUrl);
      }
      logVerbose('[POST /api/admin/universe] ========================================');
      
      // Return the new hash which should now be the gitBaseHash for future operations
      return NextResponse.json({
        success: true,
        message: result.message,
        sha: result.sha,
        hash: result.sha, // This becomes the new gitBaseHash after successful commit
        prUrl: result.prUrl,
      });
    } else {
      logVerbose('[POST /api/admin/universe] ========================================');
      console.error('[POST /api/admin/universe] FAILED: GitHub push failed');
      console.error('[POST /api/admin/universe] Error:', result.error);
      logVerbose('[POST /api/admin/universe] ========================================');
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          message: result.message,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    logVerbose('[POST /api/admin/universe] ========================================');
    console.error('[POST /api/admin/universe] EXCEPTION: Unexpected error:', error);
    logVerbose('[POST /api/admin/universe] ========================================');
    return NextResponse.json(
      { error: 'Failed to commit universe data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
