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
 * GET /api/admin/universe
 * Returns the current universe data with hash for optimistic locking
 */
export async function GET() {
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
    // Try to fetch from GitHub first for latest version
    console.log('[GET /api/admin/universe] Attempting to fetch from GitHub...');
    const githubData = await fetchCurrentUniverse();
    
    if (githubData) {
      const hashPreview = githubData.hash?.substring(0, 8) || 'unknown';
      console.log('[GET /api/admin/universe] Loaded from GitHub, hash:', hashPreview + '...');
      const { universe, errors } = parseAndValidateUniverse(githubData.content);
      return NextResponse.json({
        universe,
        hash: githubData.hash,
        validationErrors: errors,
      });
    }

    // Fallback to local file
    console.log('[GET /api/admin/universe] GitHub unavailable, falling back to local file');
    const content = JSON.stringify(universeData, null, 2);
    const hash = await sha256(content);

    console.log('[GET /api/admin/universe] Loaded local file, galaxies:', universeData.galaxies.length);
    return NextResponse.json({
      universe: universeData,
      hash,
      validationErrors: [],
    });
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
      console.log('[PATCH /api/admin/universe] Success - new hash:', hashPreview + '...');
      return NextResponse.json({
        success: true,
        message: 'Universe data saved successfully',
        hash,
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

  console.log('[POST /api/admin/universe] Request received - committing to GitHub');

  try {
    const { commitMessage, createPR, currentHash } = await request.json();
    const messagePreview = commitMessage?.substring(0, 50) || '';
    console.log('[POST /api/admin/universe] Payload:', { commitMessage: messagePreview, createPR, hasHash: !!currentHash });

    if (!commitMessage) {
      console.error('[POST /api/admin/universe] No commit message provided');
      return NextResponse.json(
        { error: 'Commit message is required' },
        { status: 400 }
      );
    }

    // Read content from the persisted file to prevent data loss
    const targetPath = process.env.UNIVERSE_DATA_PATH || 'public/universe/universe.json';
    const absolutePath = path.resolve(process.cwd(), targetPath);
    
    console.log('[POST /api/admin/universe] Reading from file:', targetPath);
    let content: string;
    try {
      content = await fs.readFile(absolutePath, 'utf-8');
      console.log('[POST /api/admin/universe] File read successfully, size:', content.length, 'bytes');
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
    console.log('[POST /api/admin/universe] Validating persisted data...');
    const { errors } = parseAndValidateUniverse(content);
    if (errors.length > 0) {
      console.error('[POST /api/admin/universe] Validation failed:', errors.join(', '));
      return NextResponse.json(
        { error: 'Validation failed', validationErrors: errors },
        { status: 400 }
      );
    }
    console.log('[POST /api/admin/universe] Validation passed');

    // Verify hash before committing to prevent race conditions
    const onDiskHash = await sha256(content);
    if (currentHash && onDiskHash !== currentHash) {
      console.warn('[POST /api/admin/universe] Conflict detected - hash mismatch before commit');
      return NextResponse.json(
        {
          error: 'Conflict detected',
          message: 'The file has been modified since you last saved. Please refresh, re-apply your changes, save, and then commit again.',
        },
        { status: 409 }
      );
    }

    // Push to GitHub
    console.log('[POST /api/admin/universe] Pushing to GitHub...');
    const result = await pushUniverseChanges(
      content,
      commitMessage,
      createPR || false,
      currentHash
    );

    if (result.success) {
      const shaPreview = result.sha?.substring(0, 8) || 'unknown';
      console.log('[POST /api/admin/universe] GitHub push successful:', { sha: shaPreview, prUrl: result.prUrl });
      return NextResponse.json({
        success: true,
        message: result.message,
        sha: result.sha,
        prUrl: result.prUrl,
      });
    } else {
      console.error('[POST /api/admin/universe] GitHub push failed:', result.error);
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
    console.error('[POST /api/admin/universe] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to commit universe data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
