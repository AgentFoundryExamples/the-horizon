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
 * POST /api/admin/universe
 * Commits universe changes directly to GitHub
 * 
 * This endpoint validates and commits changes directly to GitHub without
 * intermediate disk persistence (required for Vercel's read-only filesystem).
 * 
 * The workflow ensures:
 * - Changes are validated before GitHub commit
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
  logVerbose('[POST /api/admin/universe] Workflow: Direct commit (no disk persistence)');

  try {
    const { universe, commitMessage, createPR, gitBaseHash } = await request.json();
    const messagePreview = commitMessage?.substring(0, 50) || '';
    logVerbose('[POST /api/admin/universe] Payload:', { 
      commitMessage: messagePreview, 
      createPR, 
      hasGitBaseHash: !!gitBaseHash,
      galaxies: universe?.galaxies?.length || 0 
    });

    if (!universe) {
      console.error('[POST /api/admin/universe] No universe data in payload');
      return NextResponse.json(
        { error: 'Universe data is required' },
        { status: 400 }
      );
    }

    if (!commitMessage) {
      console.error('[POST /api/admin/universe] No commit message provided');
      return NextResponse.json(
        { error: 'Commit message is required' },
        { status: 400 }
      );
    }

    // Validate the universe data
    logVerbose('[POST /api/admin/universe] Step 1: Validating universe data...');
    const { errors } = parseAndValidateUniverse(JSON.stringify(universe));
    if (errors.length > 0) {
      console.error('[POST /api/admin/universe] Validation failed:', errors.join(', '));
      return NextResponse.json(
        { error: 'Validation failed', validationErrors: errors },
        { status: 400 }
      );
    }
    logVerbose('[POST /api/admin/universe] Validation passed');

    // Serialize universe data
    logVerbose('[POST /api/admin/universe] Step 2: Serializing universe data...');
    const content = serializeUniverse(universe);
    logVerbose('[POST /api/admin/universe] Serialized, size:', content.length, 'bytes');

    // Push to GitHub
    logVerbose('[POST /api/admin/universe] Step 3: Pushing to GitHub...');
    logVerbose('[POST /api/admin/universe] Note: GitHub layer will verify gitBaseHash matches current GitHub HEAD');
    const result = await pushUniverseChanges(
      content,
      commitMessage,
      createPR || false,
      gitBaseHash // Pass gitBaseHash for optimistic locking against GitHub
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
        hash: result.hash, // New content hash becomes the gitBaseHash after successful commit
        prUrl: result.prUrl,
      });
    } else {
      logVerbose('[POST /api/admin/universe] ========================================');
      console.error('[POST /api/admin/universe] FAILED: GitHub push failed');
      console.error('[POST /api/admin/universe] Error:', result.error);
      logVerbose('[POST /api/admin/universe] ========================================');
      
      // Return 409 for conflict errors using reliable errorCode instead of string matching
      const isConflict = result.errorCode === 'CONFLICT';
      
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          message: result.message,
        },
        { status: isConflict ? 409 : 400 }
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
