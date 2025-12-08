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
 * GitHub API integration for committing universe.json changes
 * Uses GitHub REST API to create branches, commit files, and open pull requests
 */

import { sha256 } from './crypto';

export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  branch: string;
}

export interface CommitResult {
  success: boolean;
  message: string;
  sha?: string;
  prUrl?: string;
  error?: string;
}

/**
 * Gets GitHub configuration from environment variables
 */
export function getGitHubConfig(): GitHubConfig | null {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_OWNER = process.env.GITHUB_OWNER || process.env.VERCEL_GIT_REPO_OWNER;
  const GITHUB_REPO = process.env.GITHUB_REPO || process.env.VERCEL_GIT_REPO_SLUG;
  const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';

  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    console.error('GitHub configuration incomplete. Required: GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO');
    return null;
  }

  return {
    token: GITHUB_TOKEN,
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    branch: GITHUB_BRANCH,
  };
}

/**
 * Validates GitHub token format
 */
export function validateGitHubToken(token: string): boolean {
  return token.startsWith('ghp_') || token.startsWith('github_pat_');
}

/**
 * Fetches the current SHA of a file from GitHub
 */
async function getFileSha(
  config: GitHubConfig,
  path: string
): Promise<{ sha: string; content: string } | null> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}?ref=${config.branch}`,
      {
        headers: {
          Authorization: `Bearer ${config.token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null; // File doesn't exist
      }
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    return { sha: data.sha, content };
  } catch (error) {
    // Log sanitized error without exposing tokens
    console.error('Error fetching file SHA from GitHub');
    throw error;
  }
}

/**
 * Creates a new branch from the base branch
 */
async function createBranch(
  config: GitHubConfig,
  branchName: string
): Promise<string> {
  try {
    // Get the SHA of the base branch
    const baseResponse = await fetch(
      `https://api.github.com/repos/${config.owner}/${config.repo}/git/ref/heads/${config.branch}`,
      {
        headers: {
          Authorization: `Bearer ${config.token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (!baseResponse.ok) {
      throw new Error(`Failed to get base branch: ${baseResponse.status} ${baseResponse.statusText}`);
    }

    const baseData = await baseResponse.json();
    const baseSha = baseData.object.sha;

    // Create new branch
    const createResponse = await fetch(
      `https://api.github.com/repos/${config.owner}/${config.repo}/git/refs`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ref: `refs/heads/${branchName}`,
          sha: baseSha,
        }),
      }
    );

    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      throw new Error(`Failed to create branch: ${errorData.message || createResponse.statusText}`);
    }

    return baseSha;
  } catch (error) {
    // Log sanitized error
    console.error('Error creating branch in GitHub');
    throw error;
  }
}

/**
 * Commits a file to GitHub
 */
async function commitFile(
  config: GitHubConfig,
  path: string,
  content: string,
  message: string,
  branch: string,
  sha?: string
): Promise<string> {
  try {
    const body: Record<string, unknown> = {
      message,
      content: Buffer.from(content).toString('base64'),
      branch,
    };

    if (sha) {
      body.sha = sha;
    }

    const response = await fetch(
      `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${config.token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to commit file: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    return data.commit.sha;
  } catch (error) {
    // Log sanitized error
    console.error('Error committing file to GitHub');
    throw error;
  }
}

/**
 * Creates a pull request
 */
async function createPullRequest(
  config: GitHubConfig,
  title: string,
  head: string,
  body: string
): Promise<string> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${config.owner}/${config.repo}/pulls`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          head,
          base: config.branch,
          body,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to create PR: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    return data.html_url;
  } catch (error) {
    // Log sanitized error
    console.error('Error creating pull request in GitHub');
    throw error;
  }
}

/**
 * Pushes universe.json changes to GitHub
 * @param content - The new universe.json content
 * @param commitMessage - Commit message describing the changes
 * @param createPR - If true, creates a PR; if false, commits directly to main branch
 * @param currentHash - Optional hash of current content for optimistic locking
 */
export async function pushUniverseChanges(
  content: string,
  commitMessage: string,
  createPR: boolean = false,
  currentHash?: string
): Promise<CommitResult> {
  const config = getGitHubConfig();

  if (!config) {
    return {
      success: false,
      message: 'GitHub configuration is incomplete',
      error: 'Missing GITHUB_TOKEN, GITHUB_OWNER, or GITHUB_REPO environment variables',
    };
  }

  if (!validateGitHubToken(config.token)) {
    return {
      success: false,
      message: 'Invalid GitHub token format',
      error: 'Token must start with ghp_ or github_pat_',
    };
  }

  try {
    const filePath = 'public/universe/universe.json';
    
    console.log('[pushUniverseChanges] Starting commit workflow');
    console.log('[pushUniverseChanges] Content size:', content.length, 'bytes');
    console.log('[pushUniverseChanges] Create PR:', createPR);
    
    // Always fetch fresh file SHA and content right before committing
    // This prevents stale SHA errors after disk saves
    console.log('[pushUniverseChanges] Fetching current SHA from GitHub...');
    const fileData = await getFileSha(config, filePath);
    
    if (!fileData) {
      console.error('[pushUniverseChanges] File not found in GitHub repository');
      return {
        success: false,
        message: 'Universe file not found in repository',
        error: 'File does not exist at public/universe/universe.json',
      };
    }
    
    console.log('[pushUniverseChanges] Current GitHub SHA:', fileData.sha.substring(0, 8) + '...');

    // Optimistic locking: check if GitHub content has changed since user loaded it
    if (currentHash) {
      console.log('[pushUniverseChanges] Verifying optimistic lock with provided hash...');
      const actualHash = await sha256(fileData.content);
      const hashPreview = actualHash.substring(0, 8) + '...';
      const providedHashPreview = currentHash.substring(0, 8) + '...';
      
      if (actualHash !== currentHash) {
        console.error('[pushUniverseChanges] Conflict detected!');
        console.error('[pushUniverseChanges] Expected hash:', providedHashPreview);
        console.error('[pushUniverseChanges] Actual hash:', hashPreview);
        return {
          success: false,
          message: 'Content has been modified by another user',
          error: 'The file has changed since you started editing. Please refresh, re-apply your changes, save to disk, and then commit again.',
        };
      }
      console.log('[pushUniverseChanges] Optimistic lock verified - hash matches:', hashPreview);
    }

    // Additional safety check: compare content being committed with GitHub HEAD
    // This detects drift even without currentHash provided
    const contentHash = await sha256(content);
    const githubHash = await sha256(fileData.content);
    
    if (contentHash !== githubHash) {
      if (!currentHash) {
        // Content differs from GitHub but no hash was provided for locking
        // This scenario occurs during:
        // 1. Initial saves where no hash tracking has been established yet
        // 2. Commits after successful disk saves where new content is being pushed
        // Allow the commit to proceed - this is the expected workflow
        console.log('[pushUniverseChanges] Content differs from GitHub HEAD - proceeding with commit');
        console.log('[pushUniverseChanges] This is expected for save-then-commit workflow');
      } else {
        // Hash was provided and matched, but content differs
        // This means the content on disk has the same hash as GitHub
        // This shouldn't happen unless content is identical
        console.log('[pushUniverseChanges] Content differs but hashes match - unusual but proceeding');
      }
    } else {
      console.log('[pushUniverseChanges] Content matches GitHub HEAD - no changes to commit');
    }

    if (createPR) {
      // Create a new branch and PR
      console.log('[pushUniverseChanges] Creating branch and PR workflow...');
      const timestamp = Date.now();
      const branchName = `admin-edit-${timestamp}`;
      console.log('[pushUniverseChanges] Branch name:', branchName);
      
      await createBranch(config, branchName);
      console.log('[pushUniverseChanges] Branch created successfully');
      
      // Fetch fresh SHA again after branch creation to ensure we have the latest
      console.log('[pushUniverseChanges] Re-fetching SHA after branch creation...');
      const freshFileData = await getFileSha(config, filePath);
      if (!freshFileData) {
        console.error('[pushUniverseChanges] File not found after branch creation');
        return {
          success: false,
          message: 'Universe file not found in repository',
          error: 'File does not exist at public/universe/universe.json',
        };
      }
      console.log('[pushUniverseChanges] Fresh SHA after branch creation:', freshFileData.sha.substring(0, 8) + '...');
      
      console.log('[pushUniverseChanges] Committing to new branch...');
      const commitSha = await commitFile(
        config,
        filePath,
        content,
        commitMessage,
        branchName,
        freshFileData.sha // Pass fresh SHA to prevent stale file errors
      );
      console.log('[pushUniverseChanges] Commit successful, SHA:', commitSha.substring(0, 8) + '...');

      console.log('[pushUniverseChanges] Creating pull request...');
      const prUrl = await createPullRequest(
        config,
        commitMessage,
        branchName,
        `Automated universe.json update from admin interface.\n\n${commitMessage}`
      );
      console.log('[pushUniverseChanges] Pull request created:', prUrl);

      return {
        success: true,
        message: 'Pull request created successfully',
        sha: commitSha,
        prUrl,
      };
    } else {
      // Direct commit to main branch - fetch fresh SHA one more time right before commit
      console.log('[pushUniverseChanges] Direct commit to', config.branch, 'branch...');
      console.log('[pushUniverseChanges] Re-fetching SHA immediately before commit...');
      const finalFileData = await getFileSha(config, filePath);
      
      if (!finalFileData) {
        console.error('[pushUniverseChanges] File not found before final commit');
        return {
          success: false,
          message: 'Universe file not found in repository',
          error: 'File does not exist at public/universe/universe.json',
        };
      }
      console.log('[pushUniverseChanges] Final SHA before commit:', finalFileData.sha.substring(0, 8) + '...');
      
      console.log('[pushUniverseChanges] Committing to', config.branch, '...');
      const commitSha = await commitFile(
        config,
        filePath,
        content,
        commitMessage,
        config.branch,
        finalFileData.sha
      );
      console.log('[pushUniverseChanges] Commit successful, SHA:', commitSha.substring(0, 8) + '...');

      return {
        success: true,
        message: 'Changes committed successfully',
        sha: commitSha,
      };
    }
  } catch (error) {
    // Sanitize error message to avoid exposing tokens or sensitive info
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Log sanitized error without details
    console.error('[pushUniverseChanges] Error during GitHub operation');
    console.error('[pushUniverseChanges] Error type:', error instanceof Error ? error.constructor.name : typeof error);
    
    // Check for specific GitHub API error patterns
    if (errorMessage.includes('does not match')) {
      console.error('[pushUniverseChanges] SHA mismatch detected - file changed remotely');
      return {
        success: false,
        message: 'Conflict detected: file changed remotely',
        error: 'The file was modified in GitHub between your save and commit. Please refresh, re-apply your changes, save, and try committing again.',
      };
    }
    
    if (errorMessage.includes('rate limit')) {
      console.error('[pushUniverseChanges] GitHub API rate limit exceeded');
      return {
        success: false,
        message: 'GitHub API rate limit exceeded',
        error: 'Please try again later or upgrade your GitHub token to a higher rate limit.',
      };
    }

    if (errorMessage.includes('401') || errorMessage.includes('Bad credentials')) {
      console.error('[pushUniverseChanges] Authentication failed - invalid or expired token');
      return {
        success: false,
        message: 'Authentication failed',
        error: 'GitHub token is invalid or expired. Please check your GITHUB_TOKEN environment variable.',
      };
    }

    if (errorMessage.includes('403')) {
      console.error('[pushUniverseChanges] Permission denied - insufficient token permissions');
      return {
        success: false,
        message: 'Permission denied',
        error: 'GitHub token does not have required permissions. Ensure it has "repo" scope.',
      };
    }

    console.error('[pushUniverseChanges] Unhandled error:', errorMessage.substring(0, 100));
    return {
      success: false,
      message: 'Failed to push changes to GitHub',
      error: 'An error occurred while communicating with GitHub. Please check your configuration and try again.',
    };
  }
}

/**
 * Fetches the current universe.json content and hash from GitHub
 */
export async function fetchCurrentUniverse(): Promise<{
  content: string;
  hash: string;
} | null> {
  const config = getGitHubConfig();

  if (!config) {
    return null;
  }

  try {
    const filePath = 'public/universe/universe.json';
    const fileData = await getFileSha(config, filePath);
    
    if (!fileData) {
      return null;
    }

    const hash = await sha256(fileData.content);

    return {
      content: fileData.content,
      hash,
    };
  } catch (error) {
    // Log sanitized error
    console.error('Error fetching current universe from GitHub');
    return null;
  }
}
