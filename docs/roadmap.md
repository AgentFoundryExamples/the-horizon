# Roadmap

This document outlines the current state of The Horizon, what has been shipped, known limitations, and planned future enhancements.

## Current Release: v0.1.3 (December 2025)

This release enhances the visual experience with improved galaxy scaling for better screen presence and refined camera positioning for optimal viewing across different scenarios.

**Galaxy Scale Enhancements (PR #58):**
- **Increased Galaxy Sizes**: Minimum radius 4→6 units (+50%), maximum radius 15→22 units (+47%)
  - Sparse universes (1-2 galaxies) get dramatic visual presence for improved focus
  - Crowded universes (50+ galaxies) maintain high visibility and clickability
  - Base radius adjusted 8→12 units (+50%) for proportional balance
- **Grid Spacing Update**: Increased from 30 to 50 units to accommodate larger galaxies
  - Prevents overlap even at maximum galaxy size (22 units radius, 44 units diameter)
  - Provides adequate whitespace for visual clarity and distinct click targets
  - Runtime validation ensures spacing sufficiency in development mode
- **Camera Position Adjustments**: Enhanced framing for new galaxy scales
  - Universe view: (0, 50, 100) → (0, 60, 130) for better perspective
  - Galaxy view: (0, 20, 40) → (0, 25, 50) for improved composition
  - OrbitControls ranges: minDistance 20→30, maxDistance 200→250
- **Performance**: ~5-10% GPU time increase from larger screen coverage
  - Frame rate targets maintained: 60 FPS desktop, 30+ FPS mobile
  - Particle count per galaxy unchanged (2000 particles)
  - Adaptive quality reduces animation intensity if FPS drops below 30

**Documentation Updates:**
- Added comprehensive galaxy scale configuration guide in visuals.md
- Documented edge cases: lower-end GPUs, extreme zoom, collision/selection logic
- Enhanced testing guidelines for galaxy scaling behavior
- Clarified camera positioning and framing logic for new scales
- Added performance considerations and optimization strategies

**Why Larger Scales:**
The previous scale (MIN: 4, MAX: 15) lacked visual impact for sparse universes and made galaxies feel distant. The new scale:
- Provides "wow factor" for 1-2 galaxy scenarios with dominant visual presence
- Improves clickability in crowded universes (50+) with larger minimum size
- Reduces GPU strain at distance by increasing minimum scale
- Better showcases particle effects and rotation animations

**Testing:**
- All 164 unit tests passing with updated scale constants
- Visual regression testing across 1, 5, 10, and 50+ galaxy scenarios
- Performance benchmarks show acceptable frame rates on target devices
- Grid spacing validation prevents overlap in all tested configurations

### Previous Release: v0.1.2 (December 2025)

This release includes three critical UX fixes that restore and enhance key workflows, plus comprehensive documentation updates. These fixes addressed fundamental usability issues preventing effective content management and exploration.

**Critical Fixes Shipped:**
- **Admin Save Flow Restoration (ISS-4)**: Fixed broken two-step save/commit workflow that was failing to persist universe data to disk and GitHub. Added comprehensive logging for troubleshooting.
- **Planet Layout Alignment (ISS-5)**: Corrected planet surface layout to consistent 30/70 split with proper camera positioning and responsive behavior across all devices.
- **Hover Label Standardization (ISS-6)**: Unified all tooltips across scenes using shared constants, improved readability (1rem font), and ensured consistent positioning above objects.

**Why Larger Changes Were Acceptable:**
These fixes required broader changes than typical patches because they addressed critical, user-blocking issues:
- Admin workflow was completely broken, preventing any content updates via the UI
- Inconsistent layouts created confusion and poor UX across different viewport sizes  
- Tooltip variations caused accessibility violations and readability problems across scenes

The larger scope was necessary and acceptable because:
- Users could not perform core workflows (content editing) without the admin fix
- Inconsistent layouts damaged trust and usability across different devices
- Accessibility violations needed immediate resolution to meet standards
- Partial fixes would have left the application in a worse state

**Documentation Synchronization:**
- Updated content-authoring.md with complete admin save/commit workflow, troubleshooting steps, and logging details
- Enhanced visuals.md with planet layout specifications, tooltip constants, and responsive behavior guidelines
- Synchronized deployment.md with admin workflow monitoring, log filtering, and verification steps
- Clarified roadmap.md to distinguish completed fixes from planned enhancements

### ✅ Shipped Features

#### Core Data & Schema
- [x] Hierarchical universe data structure (Universe → Galaxies → Solar Systems → Planets → Moons)
- [x] Well-defined JSON schema with TypeScript type definitions
- [x] Runtime validation with helpful error messages
- [x] Support for free-floating stars and organized solar systems
- [x] Comprehensive schema documentation

#### 3D Visualization & Navigation
- [x] Interactive 3D universe scene with shader-based particle galaxies
- [x] Multi-layer exploration: universe → galaxy → solar system → planet surface
- [x] Cinematic camera transitions with spline-based paths
- [x] Keplerian orbital mechanics for realistic planetary motion
- [x] Moon navigation with seamless transitions
- [x] GPU-accelerated rendering with instanced meshes
- [x] Performance optimizations (LOD, shader-based particles)
- [x] Accessibility features (keyboard navigation, reduced motion support)

#### Content Management
- [x] Rich markdown content support for planets and moons
- [x] React Markdown renderer with content sanitization
- [x] Password-protected admin interface (`/admin`)
- [x] Full CRUD operations for all universe entities
- [x] Built-in markdown editor with live preview
- [x] Real-time schema validation
- [x] Optimistic locking for concurrent edit protection

#### GitHub Integration
- [x] Automated commit workflow from admin interface
- [x] Pull request creation for review workflow
- [x] Direct commit to main branch option
- [x] GitHub API integration with proper error handling
- [x] Automatic Vercel redeployment on commit

#### Security
- [x] Timing-safe password authentication (Web Crypto API)
- [x] Signed session tokens with HMAC-SHA256 (Web Crypto API)
- [x] Separate SESSION_SECRET for enhanced security
- [x] Rate limiting (5 attempts per 15 minutes)
- [x] Sanitized error logging (no token exposure)
- [x] XSS prevention in markdown content
- [x] Edge Runtime compatible for serverless deployments

#### Developer Experience
- [x] Comprehensive test coverage (164 tests, 9 suites)
- [x] TypeScript with full type safety
- [x] ESLint configuration
- [x] Hot module replacement in development
- [x] Next.js 14.2.33 with App Router and security patches
- [x] Detailed documentation for deployment and usage
- [x] Edge Runtime compatible authentication

## Known Limitations

### Procedural Generation
- ⏳ **Not yet implemented**: Automated generation of planets, stars, and solar systems
- Current: All universe content is manually authored in JSON
- Future: Procedural generation system for creating diverse, realistic celestial bodies

### Binary Star Systems
- ⏳ **Not yet implemented**: Solar systems with multiple stars
- Current: Each solar system has exactly one main star
- Future: Support for binary, trinary, and multi-star systems with complex orbital mechanics

### Admin Interface Constraints
- **In-memory rate limiting**: Resets on server restart, not suitable for multi-instance deployments
- **GitHub API rate limits**: 5,000 requests per hour for authenticated users
- **No revision history UI**: Must use GitHub directly to view historical changes
- **No undo/redo**: Changes must be reverted through GitHub or manual editing
- **No bulk operations**: Each entity must be edited individually

### Vercel Deployment Considerations
- **Environment variables**: Must be configured manually in Vercel dashboard
- **GitHub token expiration**: Tokens expire and must be rotated (90-day recommendation)
- **Build time**: Larger universe datasets may impact build times
- **Serverless function limits**: Admin API routes subject to 10-second timeout

### 3D Scene Limitations
- **Mobile performance**: May require optimization for lower-end devices
- **Large datasets**: Performance may degrade with 100+ galaxies or 1000+ planets
- **Texture quality**: Current textures are procedurally generated, not high-resolution assets
- **Lighting**: Basic lighting model, not physically accurate

## Upcoming Priorities (Nice-to-Have)

### Short Term (Next 1-3 Months)

#### Enhanced Admin Features
- [ ] Bulk import/export functionality
- [ ] Search and filter in admin interface
- [ ] Undo/redo support
- [ ] Revision history viewer
- [ ] Image upload support for planet textures
- [ ] Mobile-optimized admin interface

#### Content Improvements
- [ ] More diverse planet themes and visuals
- [ ] Enhanced particle effects for different galaxy types
- [ ] Asteroid belts and comet visualization
- [ ] Planetary rings for gas giants
- [ ] Background star field improvements

#### Performance Optimizations
- [ ] Mobile performance improvements
- [ ] Progressive loading for large datasets
- [ ] Texture atlasing for better GPU utilization
- [ ] Memory optimization for long sessions

### Medium Term (3-6 Months)

#### Procedural Generation System
- [ ] Procedural planet generator with realistic parameters
- [ ] Procedural star system generator
- [ ] Procedural galaxy generator
- [ ] Customizable generation parameters
- [ ] Seed-based reproducible generation
- [ ] Mix of hand-crafted and procedural content

#### Binary Star Systems
- [ ] Support for binary star systems in schema
- [ ] Binary orbit calculations and visualization
- [ ] Multi-star system editor in admin interface
- [ ] Circumbinary planets (planets orbiting multiple stars)
- [ ] Complex lighting from multiple stars

#### Advanced 3D Features
- [ ] Realistic atmospheric scattering
- [ ] Day/night cycles on planets
- [ ] Cloud layers for terrestrial planets
- [ ] Dynamic shadows
- [ ] Enhanced particle systems

### Long Term (6+ Months)

#### Database Integration
- [ ] Database backend for dynamic content (optional)
- [ ] User-generated content support
- [ ] API endpoints for external integrations
- [ ] Real-time collaborative editing
- [ ] Content versioning and rollback

#### Advanced Features
- [ ] Space station and structure placement
- [ ] Custom orbital paths and trajectories
- [ ] Time controls (speed up/slow down orbits)
- [ ] Educational overlays and information panels
- [ ] Tour/walkthrough system
- [ ] VR support

#### Analytics & Community
- [ ] Usage analytics and metrics
- [ ] Popular content tracking
- [ ] Community content sharing
- [ ] Content moderation tools
- [ ] Social features (favorites, comments)

## Deployment Verification Checklist

Before deploying a new version, complete these verification steps:

### Pre-Deployment
- [ ] All tests pass locally (`npm test`)
- [ ] Project builds without errors (`npm run build`)
- [ ] TypeScript type checking passes (`npm run type-check`)
- [ ] ESLint passes with no errors (`npm run lint`)
- [ ] Dependencies are up to date with no critical vulnerabilities
- [ ] Environment variables are documented
- [ ] `universe.json` validates against schema

### Initial Deployment
- [ ] Push code to GitHub repository
- [ ] Configure Vercel project (or alternative platform)
- [ ] Set all required environment variables:
  - [ ] `ADMIN_PASSWORD` (strong, 16+ characters)
  - [ ] `SESSION_SECRET` (generated with `openssl rand -base64 32`)
  - [ ] `GITHUB_TOKEN` (a fine-grained token with `Contents: Read & write` permissions for this repository)
  - [ ] `GITHUB_OWNER`
  - [ ] `GITHUB_REPO`
  - [ ] `GITHUB_BRANCH`
- [ ] Trigger initial deployment
- [ ] Verify deployment completes successfully

### Post-Deployment Verification
- [ ] Main site loads at production URL
- [ ] Universe scene renders correctly
- [ ] Navigate through galaxies, solar systems, planets
- [ ] Planet markdown content displays properly
- [ ] Moon navigation works
- [ ] Admin login page accessible at `/admin`
- [ ] Admin authentication works with correct password
- [ ] Admin dashboard displays universe statistics
- [ ] Edit galaxy/solar system/planet/moon works
- [ ] Markdown preview renders correctly
- [ ] Save changes works
- [ ] GitHub PR creation works
- [ ] GitHub direct commit works (if used)
- [ ] Verify PR/commit appears on GitHub
- [ ] Merge PR (if created)
- [ ] Verify automatic redeployment triggers
- [ ] Verify changes appear on production site

### Security Verification
- [ ] Admin login fails with incorrect password
- [ ] Rate limiting works after 5 failed attempts
- [ ] Session expires after 24 hours
- [ ] Session tokens are signed and validated
- [ ] No tokens or secrets in client-side code
- [ ] No tokens or secrets in error messages
- [ ] HTTPS enforced in production
- [ ] Markdown content is sanitized (no XSS)

### Performance Verification
- [ ] Page load time < 3 seconds
- [ ] 3D scene renders at 60 FPS on desktop
- [ ] 3D scene renders at 30+ FPS on mobile
- [ ] No console errors in browser
- [ ] No memory leaks during extended use
- [ ] Smooth camera transitions
- [ ] Responsive to user interactions

### Documentation Verification
- [ ] README.md is up to date
- [ ] Changelog reflects current version
- [ ] Deployment guide is accurate
- [ ] Schema documentation matches implementation
- [ ] Environment variables are documented
- [ ] Troubleshooting guide is current

## Version History

### v0.1.3 - Galaxy Scale and Visual Improvements (December 2025)

**Galaxy Scale Enhancements:**
- Increased minimum galaxy radius from 4 to 6 units (+50%)
- Increased maximum galaxy radius from 15 to 22 units (+47%)
- Adjusted base radius from 8 to 12 units (+50%) for balance
- Updated grid spacing from 30 to 50 units to prevent overlap
- Enhanced camera positions: universe (0, 60, 130), galaxy (0, 25, 50)
- OrbitControls ranges updated: minDistance 20→30, maxDistance 200→250
- Added runtime validation for grid spacing sufficiency

**Technical Improvements:**
- ~5-10% GPU time increase from larger screen coverage (acceptable)
- Frame rate targets maintained: 60 FPS desktop, 30+ FPS mobile
- Particle count unchanged (2000 per galaxy)
- Performance monitoring and adaptive quality thresholds in place

**Documentation:**
- Comprehensive galaxy scale configuration guide in visuals.md
- Edge case documentation: lower-end GPUs, extreme zoom, collision logic
- Enhanced testing guidelines for scale behavior
- Camera positioning and framing logic clarified
- Performance considerations and optimization strategies documented

**Rationale:**
Previous scale lacked visual impact for sparse universes. New scale provides:
- Dramatic presence for 1-2 galaxy scenarios
- Better clickability in crowded universes (50+)
- Reduced GPU strain at distance
- Enhanced showcase of particle effects and animations

### v0.1.2 - Critical UX Fixes and Documentation (December 2025)

**Critical Fixes:**
- **Admin Save Flow Restoration (ISS-4)**:
  - Fixed broken two-step save/commit workflow
  - Resolved `persistUniverseToFile` failures preventing disk writes
  - Ensured GitHub commit step correctly reads saved data
  - Added comprehensive logging: `[PATCH /api/admin/universe]`, `[POST /api/admin/universe]`, `[persistUniverseToFile]`
  - Manual verification steps added to deployment.md
- **Planet Layout Alignment (ISS-5)**:
  - Corrected planet surface to consistent 30/70 split (planet left, content right)
  - Fixed camera positioning with `PLANET_SURFACE_POSITION` and offset constants
  - Restored responsive behavior for tablet (35/65 split) and mobile (single column)
  - Enhanced accessibility with proper touch targets (44px desktop, 48px tablet, 52px mobile)
  - Layout specification documented in visuals.md
- **Hover Label Standardization (ISS-6)**:
  - Standardized all tooltips using shared constants in `src/lib/tooltip-constants.ts`
  - Increased font size from 0.875rem to 1rem for better readability
  - Positioned tooltips consistently above objects (offsetY: -40px)
  - Unified colors, padding, borders across all interactive elements
  - Created `SceneTooltip` component with distance-based scaling
  - Comprehensive tooltip guidelines added to visuals.md

**Context for Larger Changes:**
See "Why Larger Changes Were Acceptable" in the Current Release section above for detailed rationale on why these fixes required broader changes than typical patches.

**Documentation Synchronization:**
- content-authoring.md: Admin save/commit workflow with troubleshooting and logging
- visuals.md: Planet layout specs, tooltip constants, responsive behavior, verification steps
- deployment.md: Admin workflow monitoring, log filtering, two-step verification
- roadmap.md: Clarified completed fixes vs planned enhancements with historical context

### v0.1.1 - Security & Performance Update (December 2024)
- **Dependency Security Updates**:
  - Upgraded Next.js from 14.2.15 to 14.2.33 to address critical security vulnerabilities:
    - Fixed Authorization Bypass in Next.js Middleware (GHSA-f82v-jwr5-mffw, CVSS 9.1)
    - Fixed Cache Key Confusion for Image Optimization API Routes (GHSA-g5qg-72qw-gw5v, CVSS 6.2)
    - Fixed Improper Middleware Redirect Handling Leading to SSRF (GHSA-4342-x723-ch2f, CVSS 6.5)
    - Fixed Content Injection Vulnerability for Image Optimization (GHSA-xv57-4mr9-wg8v, CVSS 4.3)
    - Fixed Race Condition to Cache Poisoning (GHSA-qpjv-v59x-3qc4, CVSS 3.7)
    - Denial of Service (DoS) with Server Actions (GHSA-7m27-7ghc-44w9, CVSS 5.3)
    - Information exposure in dev server due to lack of origin verification (GHSA-3h52-269p-cp9r)
  - Upgraded eslint-config-next from 14.2.15 to 14.2.33
  - Added npm overrides to force glob@10.5.0 (fixes command injection vulnerability GHSA-5j98-mcp5-4vw2)
  - Zero npm audit vulnerabilities after upgrade
- **Authentication Improvements**:
  - Migrated authentication from Node.js crypto to Web Crypto API for Edge Runtime compatibility
  - Timing-safe password validation using Web Crypto API primitives
  - Session tokens signed with HMAC-SHA256 via Web Crypto API
  - Added SESSION_SECRET environment variable for enhanced security (falls back to ADMIN_PASSWORD if not set)
  - All 164 tests updated and passing with Web Crypto polyfills
- **UI & UX Enhancements**:
  - Added context-aware welcome message when exploring galaxies
  - Improved camera transitions and scene animations
  - Enhanced visual feedback for interactive labels/tooltips
  - Adjusted scene proportions for better visual hierarchy
- **Testing & Documentation**: 
  - All 164 unit tests passing, build verified, no breaking changes
  - Updated deployment guide with Edge Runtime security details
  - Enhanced roadmap with complete security update documentation
  - Added welcome message customization guide to content-authoring.md

### v0.1.0 - Initial Feature-Complete Release (December 2024)
- Universe schema with hierarchical data structure
- Immersive 3D traversal with cinematic camera work
- Planet and moon markdown content system
- Admin interface with GitHub integration
- Comprehensive testing and documentation
- Security hardening (authentication, rate limiting, sanitization)

### Future Versions
- **v0.2.0**: Enhanced admin features, mobile optimizations, bulk operations
- **v0.3.0**: Procedural generation system
- **v0.4.0**: Binary star systems
- **v0.5.0**: Advanced 3D features and effects
- **v1.0.0**: First stable release with all core features complete

## Updating Universe Data

### Method 1: Admin Interface (Recommended)
1. Navigate to `/admin` and log in
2. Click "Edit" on the entity you want to modify
3. Make changes in the editor
4. Review changes in the preview pane
5. Write a descriptive commit message
6. Choose "Create Pull Request" for review workflow
7. Or "Commit to GitHub" for immediate deployment
8. Vercel will automatically redeploy within 1-2 minutes

### Method 2: Manual Editing
1. Clone the repository locally
2. Edit `public/universe/universe.json` following the schema
3. Validate changes: `npm run dev` and check console for warnings
4. Test locally to ensure content renders correctly
5. Commit and push to GitHub
6. Create a pull request for review
7. Merge to main branch
8. Vercel redeploys automatically

### Method 3: GitHub Web Interface
1. Navigate to repository on GitHub
2. Click on `public/universe/universe.json`
3. Click "Edit this file" (pencil icon)
4. Make changes following the schema
5. Write a commit message
6. Choose "Create a new branch" and "Start a pull request"
7. Review and merge PR
8. Vercel redeploys automatically

### Validation Tips
- Always validate JSON syntax before committing
- Follow ID naming conventions (kebab-case)
- Ensure all required fields are present
- Include meaningful descriptions
- Test markdown content renders correctly
- Keep backup of universe.json before major changes

## Running Admin Workflow

### Initial Setup
1. Set up GitHub Personal Access Token (see deployment guide)
2. Configure environment variables in Vercel
3. Deploy application
4. Navigate to `/admin` in browser

### Daily Workflow
1. Log in to admin interface
2. Review current universe statistics
3. Make content changes as needed
4. Use PR workflow for significant changes
5. Use direct commit for minor fixes
6. Monitor GitHub repository for PRs
7. Review and merge changes
8. Verify changes appear on production site

### Best Practices
- **Use PRs for major changes**: Allows team review before going live
- **Write descriptive commit messages**: Helps track changes over time
- **Test locally first**: When possible, test changes locally before committing
- **Regular backups**: Keep periodic backups of universe.json
- **Monitor GitHub**: Watch for automated PRs and commits
- **Security**: Rotate passwords and tokens regularly (90-day cycle)

## Redeployment Process

### Automatic Redeployment (Vercel)
- **Trigger**: Any push to main branch or PR merge
- **Process**: 
  1. GitHub webhook notifies Vercel
  2. Vercel pulls latest code
  3. Runs `npm install`
  4. Runs `npm run build`
  5. Deploys new version
  6. Updates production URL
- **Duration**: Typically 1-2 minutes
- **No action required**: Completely automatic

### Manual Redeployment (Vercel)
1. Go to Vercel dashboard
2. Select your project
3. Click "Deployments" tab
4. Click "Redeploy" on any previous deployment
5. Or click "Deploy" on a specific branch

### Vercel CLI Redeployment
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy production
vercel --prod
```

### Self-Hosted Redeployment
```bash
# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Build application
npm run build

# Restart server
pm2 restart the-horizon
# or
systemctl restart the-horizon
```

## GitHub Scope Changes

If GitHub scopes need to change in the future:

### Current Required Scopes
- `repo` - Full repository access for commits and PRs

### If Additional Scopes Needed
1. Create new GitHub token with additional scopes
2. Update `GITHUB_TOKEN` environment variable in Vercel
3. Redeploy application
4. Test admin functionality
5. Update documentation

### Potential Future Scope Needs
- `workflow` - If triggering GitHub Actions becomes necessary
- `packages` - If publishing packages
- `user` - If adding user-specific features

## Vercel Constraints

### Current Constraints
- **Build Time**: 45-minute maximum
- **Serverless Functions**: 10-second timeout (Hobby), 60-second (Pro)
- **Memory**: 1024 MB per function
- **Deployment Size**: 100 MB maximum
- **Bandwidth**: Varies by plan
- **Environment Variables**: 4 KB per variable

### Mitigation Strategies
- Keep universe.json under 10 MB
- Optimize images and assets
- Use CDN for large static files
- Consider Pro plan for larger projects
- Monitor build times and sizes
- Use incremental static regeneration

### If Constraints Become Issues
1. **Large Datasets**: Consider database instead of JSON file
2. **Long API Routes**: Break into smaller functions
3. **Build Time**: Optimize dependencies, use caching
4. **File Size**: Use external CDN for assets
5. **Bandwidth**: Upgrade to Pro plan or use alternative platform

## Contributing to the Roadmap

Have ideas for future features? Here's how to contribute:

1. **Check Existing Issues**: Search GitHub issues for similar requests
2. **Open an Issue**: Create a new issue with the "enhancement" label
3. **Provide Details**: Explain the feature, use case, and benefits
4. **Discuss**: Engage with community feedback
5. **Submit PR**: For small features, submit a PR with implementation
6. **Documentation**: Update roadmap.md if feature is accepted

## Support and Resources

- **GitHub Issues**: [Report bugs and request features](https://github.com/AgentFoundryExamples/the-horizon/issues)
- **Deployment Guide**: [docs/deployment.md](./deployment.md)
- **Schema Docs**: [docs/universe-schema.md](./universe-schema.md)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)
- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)

---

*Last Updated: December 2025*  
*Version: 0.1.3*  
*Maintained by: Agent Foundry and John Brosnihan*
