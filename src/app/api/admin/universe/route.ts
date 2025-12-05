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
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Try to fetch from GitHub first for latest version
    const githubData = await fetchCurrentUniverse();
    
    if (githubData) {
      const { universe, errors } = parseAndValidateUniverse(githubData.content);
      return NextResponse.json({
        universe,
        hash: githubData.hash,
        validationErrors: errors,
      });
    }

    // Fallback to local file
    const content = JSON.stringify(universeData, null, 2);
    const hash = await sha256(content);

    return NextResponse.json({
      universe: universeData,
      hash,
      validationErrors: [],
    });
  } catch (error) {
    console.error('Error fetching universe:', error);
    return NextResponse.json(
      { error: 'Failed to fetch universe data' },
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
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { universe, currentHash } = await request.json();

    if (!universe) {
      return NextResponse.json(
        { error: 'Universe data is required' },
        { status: 400 }
      );
    }

    // Optimistic locking: verify current hash if provided
    if (currentHash) {
      const targetPath = process.env.UNIVERSE_DATA_PATH || 'public/universe/universe.json';
      const absolutePath = path.resolve(process.cwd(), targetPath);
      
      try {
        const currentContent = await fs.readFile(absolutePath, 'utf-8');
        const actualHash = await sha256(currentContent);
        
        if (actualHash !== currentHash) {
          return NextResponse.json(
            {
              error: 'Conflict detected',
              message: 'The file has been modified by another user. Please refresh and try again.',
            },
            { status: 409 }
          );
        }
      } catch (error) {
        // If file doesn't exist yet, allow the save to proceed
        console.warn('Universe file does not exist yet, proceeding with initial save');
      }
    }

    // Validate universe data
    const { errors } = parseAndValidateUniverse(JSON.stringify(universe));
    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', validationErrors: errors },
        { status: 400 }
      );
    }

    // Persist to local file
    const result = await persistUniverseToFile(universe);

    if (result.success) {
      // Calculate new hash from the persisted file to ensure synchronization
      const targetPath = process.env.UNIVERSE_DATA_PATH || 'public/universe/universe.json';
      const absolutePath = path.resolve(process.cwd(), targetPath);
      const persistedContent = await fs.readFile(absolutePath, 'utf-8');
      const hash = await sha256(persistedContent);

      return NextResponse.json({
        success: true,
        message: 'Universe data saved successfully',
        hash,
      });
    } else {
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
    console.error('Error saving universe to disk:', error);
    return NextResponse.json(
      { error: 'Failed to save universe data' },
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
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { commitMessage, createPR, currentHash } = await request.json();

    if (!commitMessage) {
      return NextResponse.json(
        { error: 'Commit message is required' },
        { status: 400 }
      );
    }

    // Read content from the persisted file to prevent data loss
    const targetPath = process.env.UNIVERSE_DATA_PATH || 'public/universe/universe.json';
    const absolutePath = path.resolve(process.cwd(), targetPath);
    
    let content: string;
    try {
      content = await fs.readFile(absolutePath, 'utf-8');
    } catch (error) {
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
    const { errors } = parseAndValidateUniverse(content);
    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', validationErrors: errors },
        { status: 400 }
      );
    }

    // Push to GitHub
    const result = await pushUniverseChanges(
      content,
      commitMessage,
      createPR || false,
      currentHash
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        sha: result.sha,
        prUrl: result.prUrl,
      });
    } else {
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
    console.error('Error committing universe:', error);
    return NextResponse.json(
      { error: 'Failed to commit universe data' },
      { status: 500 }
    );
  }
}
