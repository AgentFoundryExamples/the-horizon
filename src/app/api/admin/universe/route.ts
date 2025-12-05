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
 * POST /api/admin/universe
 * Saves universe changes to GitHub
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
    const { universe, commitMessage, createPR, currentHash } = await request.json();

    if (!universe) {
      return NextResponse.json(
        { error: 'Universe data is required' },
        { status: 400 }
      );
    }

    if (!commitMessage) {
      return NextResponse.json(
        { error: 'Commit message is required' },
        { status: 400 }
      );
    }

    // Validate universe data
    const { errors } = parseAndValidateUniverse(JSON.stringify(universe));
    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', validationErrors: errors },
        { status: 400 }
      );
    }

    // Serialize and push to GitHub
    const content = serializeUniverse(universe);
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
    console.error('Error saving universe:', error);
    return NextResponse.json(
      { error: 'Failed to save universe data' },
      { status: 500 }
    );
  }
}
