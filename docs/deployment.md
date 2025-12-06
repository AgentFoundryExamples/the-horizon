# Deployment Guide

This guide covers deploying The Horizon to Vercel and other platforms, with a focus on configuring the admin interface and GitHub integration.

## Prerequisites

- **Node.js**: Version 18.x or higher (20.x recommended)
- **npm**: Version 10.x or higher
- GitHub repository with your code
- GitHub Personal Access Token with appropriate scopes
- Strong admin password (minimum 16 characters recommended)

## Current Version Requirements

The Horizon v0.1.1 has been updated with security patches:
- **Next.js**: 14.2.33 (upgraded from 14.2.15)
- **React**: 18.3.1
- **TypeScript**: 5.6.3
- **Node.js**: 18.x or higher

See [roadmap.md](./roadmap.md) for detailed security update information.

## Vercel Deployment

### 1. Initial Setup

1. **Push your code to GitHub** (if not already done)
   ```bash
   git push origin main
   ```

2. **Import project to Vercel**
   - Visit [vercel.com/new](https://vercel.com/new)
   - Select your GitHub repository
   - Click "Import"

### 2. Environment Variables

Configure the following environment variables in Vercel:

#### Required for Admin Interface

| Variable | Description | Example |
|----------|-------------|---------|
| `ADMIN_PASSWORD` | Password for admin access. Use a strong password with at least 16 characters. | `MySecureP@ssw0rd!2024` |
| `SESSION_SECRET` | Secret for signing session tokens (independent of password). Generate with `openssl rand -base64 32` | `aB3dEf...` |
| `GITHUB_TOKEN` | Personal access token for GitHub API | `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `GITHUB_OWNER` | Repository owner (username or org) | `AgentFoundryExamples` |
| `GITHUB_REPO` | Repository name | `the-horizon` |
| `GITHUB_BRANCH` | Target branch for commits | `main` |

#### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |

**Note on SESSION_SECRET**: If not provided, the system will fall back to using `ADMIN_PASSWORD` as the session secret (not recommended for production). For better security, always set a separate `SESSION_SECRET`.

### 3. Configure Environment Variables in Vercel

1. Go to your project in Vercel
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:
   - Click "Add" for each variable
   - Enter the name and value
   - Select environment(s): Production, Preview, Development
   - Click "Save"

### 4. Deploy

Click **Deploy** to trigger the first deployment. Vercel will:
- Build your application
- Deploy to a production URL
- Make it available at `your-project.vercel.app`

## GitHub Personal Access Token

The admin interface requires a GitHub Personal Access Token to commit changes back to your repository.

### Creating a Token

GitHub now recommends using fine-grained personal access tokens for better security.

**Option 1: Fine-Grained Token (Recommended)**

1. Go to [GitHub Settings → Developer settings → Personal access tokens → Fine-grained tokens](https://github.com/settings/personal-access-tokens/new)

2. Fill in the form:
   - **Token name**: "The Horizon Admin Interface"
   - **Expiration**: Choose based on your security policy (90 days recommended)
   - **Repository access**: Select "Only select repositories" and choose your repository
   - **Permissions**: Under "Repository permissions", set:
     - ✅ `Contents` - Read and write access (for committing files)
     - ✅ `Pull requests` - Read and write access (for creating PRs)
     - ✅ `Metadata` - Read-only (automatically selected)

3. Click **Generate token**

4. **Copy the token immediately** - you won't be able to see it again!

5. Add it to your Vercel environment variables as `GITHUB_TOKEN`

**Option 2: Classic Token (Legacy)**

1. Go to [GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)](https://github.com/settings/tokens/new)

2. Fill in the form:
   - **Note**: "The Horizon Admin Interface"
   - **Expiration**: Choose based on your security policy (90 days recommended)
   - **Scopes**: Select the following:
     - ✅ `repo` - Full control of private repositories
       - Includes: `repo:status`, `repo_deployment`, `public_repo`, `repo:invite`, `security_events`

3. Click **Generate token**

4. **Copy the token immediately** - you won't be able to see it again!

5. Add it to your Vercel environment variables as `GITHUB_TOKEN`

### Token Security

⚠️ **Important Security Notes**:

- Never commit tokens to source code
- Store tokens only in environment variables
- Rotate tokens regularly (every 90 days recommended)
- Use the minimum required scopes
- Revoke tokens immediately if compromised

## Password Security

Your `ADMIN_PASSWORD` protects access to the content management interface.

### Generating a Strong Password

Use one of these methods:

**Option 1: OpenSSL** (Mac/Linux)
```bash
openssl rand -base64 32
```

**Option 2: Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Option 3: Password Manager**
- Use 1Password, LastPass, or similar
- Generate a password with at least 16 characters
- Include uppercase, lowercase, numbers, and symbols

### Password Requirements

- Minimum 16 characters (recommended: 32+)
- Mix of uppercase and lowercase letters
- Include numbers and special characters
- Don't use common words or patterns
- Don't reuse passwords from other services

### Security Features

The admin interface includes multiple layers of security protection:

**Timing-Safe Password Validation**
- Uses constant-time comparison to prevent timing attacks
- Password hashes are compared with `timingSafeEqual` to avoid leaking password length
- Web Crypto API ensures Edge Runtime compatibility

**Signed Session Tokens**
- Session cookies use cryptographically signed random tokens with SHA-256 (Web Crypto API)
- Prevents session forgery by validating signatures on every request
- Tokens are validated in middleware on every protected route
- Uses dedicated SESSION_SECRET (or falls back to ADMIN_PASSWORD)
- Changing SESSION_SECRET invalidates all existing sessions
- Compatible with Edge Runtime for serverless deployments

**Rate Limiting**
- Maximum 5 failed login attempts per IP address
- 15-minute lockout period after exceeding limit
- Automatic reset on successful login
- Helps prevent brute force attacks
- **Limitations**: In-memory storage (resets on server restart, not suitable for multi-instance deployments)

**Sanitized Error Logging**
- No tokens or sensitive data exposed in error messages
- Generic error responses prevent information leakage
- Detailed errors logged server-side only

**Edge Runtime Support**
- All authentication functions use Web Crypto API
- Compatible with serverless Edge deployments on Vercel and other platforms
- No Node.js-specific crypto dependencies

## How Admin Changes Work

Understanding the two-step workflow helps troubleshoot issues:

> **Note**: This workflow was restored in v0.1.2 (ISS-4) after critical fixes to the save and commit operations. Previous versions had issues with disk persistence that prevented proper content updates. See [docs/roadmap.md](./roadmap.md) for complete fix details.

```mermaid
graph TD
    A[Admin Edits in Browser] --> B[Step 1: Save to Disk]
    B --> C[PATCH /api/admin/universe]
    C --> D[Validate & Write to universe.json]
    D --> E{Success?}
    E -->|No| F[Error: Check Logs]
    E -->|Yes| G[Changes Saved Locally]
    G --> H[Step 2: Commit to GitHub]
    H --> I[Enter Commit Message]
    I --> J{Create PR?}
    J -->|Yes| K[POST /api/admin/universe]
    K --> L[GitHub API: Create Branch]
    L --> M[GitHub API: Commit File]
    M --> N[GitHub API: Create PR]
    N --> O[Manual Review & Merge]
    O --> P[Vercel Redeploys Automatically]
    J -->|No| Q[POST /api/admin/universe]
    Q --> R[GitHub API: Commit to Main]
    R --> P
    P --> S[Changes Live on Site]
```

### Two-Step Save Workflow

The admin interface uses a **two-step workflow** for safety and flexibility:

**Step 1: Save to Disk (PATCH /api/admin/universe)**
1. Admin makes changes in the browser
2. Clicks "💾 Save to Disk"
3. System validates the universe data
4. Writes changes to `public/universe/universe.json`
5. Returns success with new hash for optimistic locking
6. **Changes are persisted locally but NOT yet in GitHub**

**Step 2: Commit to GitHub (POST /api/admin/universe)**
1. Admin enters a commit message
2. Chooses to create a PR or commit directly
3. System reads the saved file from disk
4. Validates the content again
5. Pushes to GitHub via API

**Why Two Steps?**
- **Safety**: Validate changes before they reach version control
- **Iteration**: Make multiple edits and save incrementally
- **Review**: Create PRs for team review before merging
- **Recovery**: Disk-saved changes persist even if session ends
- **Testing**: Test changes locally before committing

### Logging and Debugging

The admin save workflow includes comprehensive logging for troubleshooting:

**Server Logs** (visible in server console or deployment logs):
```
[GET /api/admin/universe] Request received - fetching universe data
[GET /api/admin/universe] Loaded local file, galaxies: 2
[PATCH /api/admin/universe] Request received - saving to disk
[PATCH /api/admin/universe] Payload parsed - galaxies: 2
[PATCH /api/admin/universe] Validating universe data...
[PATCH /api/admin/universe] Validation passed
[persistUniverseToFile] Persisting to: public/universe/universe.json
[persistUniverseToFile] Serialized universe, size: 5578 bytes
[persistUniverseToFile] Success - file persisted
[PATCH /api/admin/universe] Success - new hash: a1b2c3d4...
[POST /api/admin/universe] Request received - committing to GitHub
[POST /api/admin/universe] Reading from file: public/universe/universe.json
[POST /api/admin/universe] File read successfully, size: 5578 bytes
[POST /api/admin/universe] GitHub push successful
```

**Log Filtering**: Use grep to filter logs by operation:
```bash
# View all admin save operations
grep "\[PATCH /api/admin/universe\]" logs.txt

# View all GitHub commit operations
grep "\[POST /api/admin/universe\]" logs.txt

# View file persistence operations
grep "\[persistUniverseToFile\]" logs.txt
```

### Commit Workflow Options

**Option 1: Pull Request (Recommended)**
1. Admin makes changes in the interface
2. Clicks "💾 Save to Disk" to persist locally
3. Enters commit message and checks "Create Pull Request"
4. Clicks "🔀 Create PR"
5. System creates a new branch (e.g., `admin-edit-1234567890`)
6. Commits changes to the new branch
7. Opens a Pull Request
8. Team reviews PR
9. PR is merged
10. Vercel automatically redeploys

**Option 2: Direct Commit**
1. Admin makes changes in the interface
2. Clicks "💾 Save to Disk" to persist locally
3. Enters commit message (leave "Create PR" unchecked)
4. Clicks "✓ Commit to GitHub"
5. System commits directly to main branch
6. Vercel automatically redeploys

## Automatic Redeployment

Vercel watches your GitHub repository for changes:

- **Push to main**: Triggers production deployment
- **Push to other branch**: Triggers preview deployment
- **Pull Request**: Creates a preview deployment with unique URL

No manual redeployment needed - it's completely automatic!

## Verification Steps

After deployment, verify everything works:

### 1. Check the Main Site

1. Visit your production URL
2. Verify the universe loads
3. Navigate through galaxies and planets
4. Check that all content displays correctly

### 2. Test Admin Access

1. Navigate to `/admin`
2. Should redirect to `/admin/login`
3. Enter your `ADMIN_PASSWORD`
4. Should redirect to admin dashboard
5. Verify stats are displayed correctly

### 3. Test Admin Save Workflow

#### Step 1: Save to Disk
1. Click "Edit" on a galaxy
2. Make a small change (e.g., update description)
3. Click "Save Changes" in the editor
4. Click "💾 Save to Disk" in the main interface
5. Verify success message appears
6. **Verify locally**: Check that `public/universe/universe.json` has been updated
   ```bash
   # In development
   cat public/universe/universe.json | grep "your-change"
   ```

#### Step 2: Commit to GitHub
1. Enter a commit message (e.g., "Update galaxy description")
2. Check "Create Pull Request" (recommended)
3. Click "🔀 Create PR" (or "✓ Commit to GitHub" if not creating PR)
4. Verify success message with PR URL appears

### 4. Verify GitHub Integration

1. Go to your GitHub repository
2. Check for the new branch (e.g., `admin-edit-1234567890`)
3. Check for the new Pull Request
4. Review the changes in the PR - verify `public/universe/universe.json` was updated
5. Merge the PR
6. Wait for Vercel to redeploy (usually 1-3 minutes)
7. Verify changes appear on the production site

### 5. Monitor Logs

**In Development**:
Watch the server console for log messages:
```
[PATCH /api/admin/universe] Request received - saving to disk
[persistUniverseToFile] Success - file persisted
[POST /api/admin/universe] GitHub push successful
```

**In Production (Vercel)**:
1. Go to your Vercel project
2. Click on "Deployments"
3. Click on the most recent deployment
4. Click "View Function Logs"
5. Filter for `/api/admin/universe` to see save/commit operations

**Common Log Messages**:
- `Authentication failed`: Check ADMIN_PASSWORD
- `Validation failed`: Fix validation errors in form
- `No saved data found`: Must save to disk before committing
- `GitHub push failed`: Check GITHUB_TOKEN and permissions

## Troubleshooting

### Admin Save Workflow Issues

**Symptom**: "Failed to save changes" error

**Solutions**:
1. **Check server logs** for detailed error messages:
   - Development: Check terminal running `npm run dev`
   - Production: Check Vercel function logs
2. **Look for specific log messages**:
   - `[PATCH /api/admin/universe] Validation failed`: Fix validation errors displayed in UI
   - `[persistUniverseToFile] Error`: Check file permissions or disk space
   - `path traversal not allowed`: Don't modify UNIVERSE_DATA_PATH
3. **Verify file permissions**: Ensure server can write to `public/universe/` directory
4. **Check disk space**: Ensure adequate space for writing files
5. **Try again**: Temporary file system issues may resolve on retry

**Symptom**: Changes saved but not appearing after commit

**Solutions**:
1. **Verify two-step process**: Must save to disk BEFORE committing
2. **Check commit logs**:
   ```
   [POST /api/admin/universe] No saved data found
   ```
   This means you didn't save to disk first - click "💾 Save to Disk"
3. **Verify file was written**: Check `public/universe/universe.json` locally
4. **Check GitHub**: Verify commit or PR was created
5. **Wait for deployment**: Vercel takes 1-3 minutes to redeploy

**Symptom**: "Conflict detected" error when saving

**Solutions**:
- Another admin modified the file concurrently
- Click browser refresh to load latest version
- Reapply your changes
- Save again
- This is expected behavior (optimistic locking)

### Admin Login Fails

**Symptom**: "Invalid password" error even with correct password

**Solutions**:
- Verify `ADMIN_PASSWORD` is set in Vercel environment variables
- Check for extra spaces or newlines in the password
- Ensure password is not the default `CHANGE_ME_USE_STRONG_PASSWORD_MIN_16_CHARS`
- Redeploy after changing environment variables

### Too Many Login Attempts

**Symptom**: "Too many login attempts. Please try again in X minutes."

**Solutions**:
- This is rate limiting protection after 5 failed attempts
- Wait 15 minutes for the lockout to expire
- Verify you're using the correct password
- If locked out frequently, check for automation or bots
- Rate limiting resets on server restart (in development)

### Session Expired

**Symptom**: Redirected to login page while working in admin

**Solutions**:
- Sessions expire after 24 hours
- Log in again to create a new session
- Session cookies are signed and validated on each request
- Browser restart or cookie clearing will require re-login

### GitHub API Errors

**Symptom**: "Authentication failed" or "Permission denied"

**Solutions**:
- Verify `GITHUB_TOKEN` is valid and not expired
- Check token has appropriate permissions (`Contents: Read & write` for fine-grained tokens, or `repo` scope for classic tokens)
- Ensure token belongs to a user with write access to the repository
- Regenerate token if compromised

### "Content has been modified by another user"

**Symptom**: Save fails with concurrent edit warning

**Solutions**:
- This is expected behavior (optimistic locking)
- Refresh the page to load latest content
- Reapply your changes
- Use PR workflow to avoid conflicts

### Changes Don't Appear After Commit

**Symptom**: Changes committed successfully but not visible on site

**Solutions**:
- Check Vercel deployment logs
- Verify commit was made to correct branch
- Wait a few minutes for redeployment
- Clear browser cache
- Check if change was actually committed to GitHub

### Rate Limit Errors

**Symptom**: "GitHub API rate limit exceeded"

**Solutions**:
- Wait for rate limit to reset (usually 1 hour)
- Use authenticated token (higher rate limit)
- Reduce frequency of saves
- Consider upgrading GitHub account

## Alternative Deployment Platforms

While Vercel is recommended, The Horizon can be deployed to any platform supporting Next.js:

### Netlify

1. Connect GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Add environment variables
5. Deploy

### AWS Amplify

1. Connect GitHub repository
2. Use Next.js build settings
3. Add environment variables
4. Deploy

### Self-Hosted

```bash
# Build the application
npm run build

# Start production server
npm start
```

Set environment variables using `.env.local` or system environment variables.

## Security Best Practices

1. **Use Strong Passwords**
   - Minimum 16 characters
   - Random generation recommended
   - Store in password manager

2. **Rotate Credentials Regularly**
   - Change admin password every 90 days
   - Regenerate GitHub token every 90 days
   - Update Vercel environment variables

3. **Limit Access**
   - Only share admin password with authorized users
   - Use PR workflow for review process
   - Monitor GitHub repository for unauthorized changes

4. **Monitor Activity**
   - Review GitHub commit history regularly
   - Check Vercel deployment logs
   - Set up GitHub notifications for repository changes

5. **Backup Data**
   - Git history serves as backup
   - Consider periodic exports of universe.json
   - Test restore process

## Maintenance

### Regular Tasks

- **Weekly**: Review recent commits and PRs
- **Monthly**: Check for dependency updates
- **Quarterly**: Rotate passwords and tokens
- **Annually**: Security audit

### Updating Dependencies

**Security First**: Always run `npm audit` after updating dependencies and before deploying.

```bash
# Check for security vulnerabilities
npm audit

# Check for available updates
npm outdated

# Update patch/minor versions automatically
npm update

# Update major versions (carefully, test thoroughly)
npm install package@latest

# After updates, verify everything works
npm test
npm run build
npm run lint
```

**Recent Security Updates (v0.1.1)**:
- Next.js upgraded from 14.2.15 → 14.2.33 (critical security fixes)
- eslint-config-next upgraded from 14.2.15 → 14.2.33
- Added npm overrides for glob vulnerability mitigation
- All tests passing, zero npm audit vulnerabilities

When updating dependencies:
1. Always check for breaking changes in package changelogs
2. Run full test suite after updates
3. Test admin interface functionality
4. Verify build succeeds without errors
5. Check for any new peer dependency warnings

## Support

For issues or questions:

- Check [GitHub Issues](https://github.com/AgentFoundryExamples/the-horizon/issues)
- Review [Next.js Documentation](https://nextjs.org/docs)
- Review [Vercel Documentation](https://vercel.com/docs)

## Additional Resources

- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [GitHub Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [Universe Schema Documentation](./universe-schema.md)
