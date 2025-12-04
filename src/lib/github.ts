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

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER || process.env.VERCEL_GIT_REPO_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO || process.env.VERCEL_GIT_REPO_SLUG;
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';

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
    console.error('Error fetching file SHA:', error);
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
    console.error('Error creating branch:', error);
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
    console.error('Error committing file:', error);
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
    console.error('Error creating pull request:', error);
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
    
    // Get current file SHA and content
    const fileData = await getFileSha(config, filePath);
    
    if (!fileData) {
      return {
        success: false,
        message: 'Universe file not found in repository',
        error: 'File does not exist at public/universe/universe.json',
      };
    }

    // Optimistic locking: check if content has changed since user loaded it
    if (currentHash) {
      const crypto = require('crypto');
      const actualHash = crypto
        .createHash('sha256')
        .update(fileData.content)
        .digest('hex');
      
      if (actualHash !== currentHash) {
        return {
          success: false,
          message: 'Content has been modified by another user',
          error: 'The file has changed since you started editing. Please refresh and try again.',
        };
      }
    }

    if (createPR) {
      // Create a new branch and PR
      const timestamp = Date.now();
      const branchName = `admin-edit-${timestamp}`;
      
      await createBranch(config, branchName);
      const commitSha = await commitFile(
        config,
        filePath,
        content,
        commitMessage,
        branchName
      );

      const prUrl = await createPullRequest(
        config,
        commitMessage,
        branchName,
        `Automated universe.json update from admin interface.\n\n${commitMessage}`
      );

      return {
        success: true,
        message: 'Pull request created successfully',
        sha: commitSha,
        prUrl,
      };
    } else {
      // Direct commit to main branch
      const commitSha = await commitFile(
        config,
        filePath,
        content,
        commitMessage,
        config.branch,
        fileData.sha
      );

      return {
        success: true,
        message: 'Changes committed successfully',
        sha: commitSha,
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Check for specific error types
    if (errorMessage.includes('rate limit')) {
      return {
        success: false,
        message: 'GitHub API rate limit exceeded',
        error: 'Please try again later or upgrade your GitHub token to a higher rate limit.',
      };
    }

    if (errorMessage.includes('401') || errorMessage.includes('Bad credentials')) {
      return {
        success: false,
        message: 'Authentication failed',
        error: 'GitHub token is invalid or expired. Please check your GITHUB_TOKEN environment variable.',
      };
    }

    if (errorMessage.includes('403')) {
      return {
        success: false,
        message: 'Permission denied',
        error: 'GitHub token does not have required permissions. Ensure it has "repo" scope.',
      };
    }

    return {
      success: false,
      message: 'Failed to push changes to GitHub',
      error: errorMessage,
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

    const crypto = require('crypto');
    const hash = crypto
      .createHash('sha256')
      .update(fileData.content)
      .digest('hex');

    return {
      content: fileData.content,
      hash,
    };
  } catch (error) {
    console.error('Error fetching current universe:', error);
    return null;
  }
}
