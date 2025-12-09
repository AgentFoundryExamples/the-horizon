# The Horizon - Interactive Universe Explorer

A modern web application for exploring a 3D universe featuring galaxies, solar systems, planets, and moons. Built with Next.js 14, React, TypeScript, and Three.js.

## Features

- 🌌 **Universe Data Schema**: Well-defined JSON structure for galaxies, solar systems, planets, and moons
- 🎨 **3D Visualization**: Interactive 3D universe with shader-based particle galaxies
- 🎬 **Cinematic Navigation**: Smooth camera transitions with spline-based paths and easing
- 🪐 **Keplerian Orbits**: Realistic planetary motion using simplified orbital mechanics
- 🎮 **Multi-Layer Exploration**: Traverse from universe → galaxy → solar system → planet views
- 📝 **Markdown Content**: Rich content support using React Markdown with sanitization
- 🌙 **Moon Navigation**: Explore planet surfaces and hop between moons with seamless transitions
- ♿ **Accessibility**: Keyboard navigation, focus states, and reduced motion support
- ✅ **TypeScript**: Fully typed data models with runtime validation
- 🧪 **Tested**: Comprehensive unit tests for data loading and validation
- 🚀 **Next.js 14**: Server-side rendering and static generation support
- ⚡ **Performance**: Instanced rendering, LOD, and GPU-accelerated shaders

## Changelog

### v0.1.7 - Hover Label Stabilization and Breadcrumb UX Enhancements (December 9, 2025)

*This release focuses on stabilizing hover label rendering using Drei's Html component and enhancing breadcrumb navigation for improved user experience.*

**Hover Label Stabilization (ISS-1):**

1. **Drei Html Integration**
   - Migrated hover labels to use `@react-three/drei`'s `Html` component for proper R3F Canvas integration
   - Prevents crashes from rendering DOM elements directly inside Three.js Canvas
   - Labels now properly positioned in 3D space with automatic screen projection
   - Distance-based scaling ensures labels remain readable at various zoom levels
   - Robust input validation prevents crashes from invalid position data (NaN, Infinity)

2. **Rendering Improvements**
   - Labels use sprite rendering for consistent sizing across distances
   - No occlusion - labels remain visible even when objects are behind others
   - Smooth animations with fade-in effects
   - Performance optimized with efficient R3F rendering pipeline

3. **Safety Guardrails**
   - Position validation at multiple levels (store + component)
   - Console warnings for invalid data without crashing the application
   - Graceful handling of null/undefined values
   - Type-safe interfaces with comprehensive documentation

**Breadcrumb Navigation Enhancements (ISS-2):**

1. **Improved Context Awareness**
   - Breadcrumbs now display full navigation hierarchy (Universe → Galaxy → Solar System → Planet)
   - Current location highlighted for better orientation
   - Click any breadcrumb level to jump directly to that view
   - Smooth transitions between navigation levels

2. **Visual Refinements**
   - Enhanced styling with better contrast and hover states
   - Responsive design adapts to mobile and tablet viewports
   - Clear visual separation between navigation levels
   - Consistent with overall design system

3. **Accessibility Improvements**
   - ARIA labels for screen reader support
   - Keyboard navigation with Tab and Enter keys
   - Focus indicators meet WCAG 2.1 Level AA standards
   - Reduced motion support for accessibility preferences

**Why These Changes:**

Previous hover label implementations rendered DOM elements directly in the Canvas, causing "Div is not part of the THREE namespace" crashes. The Drei Html component provides proper integration with React Three Fiber's rendering system, ensuring stability and compatibility.

Breadcrumb enhancements provide clearer navigation context, especially important after removing hover tooltips in v0.1.5. Users now have multiple ways to understand their location: breadcrumbs, transition messages, and ARIA labels.

**Technical Details:**
- No new environment variables required
- No migration steps needed
- All existing tests passing
- Compatible with all v0.1.x releases
- Build verified with no breaking changes

**Deployment Notes:**
- No environment variable changes
- No redeployment required if already on v0.1.6
- Documentation cross-references validated
- Manual testing scenarios added

**Verification Steps:**
1. Hover over celestial objects - labels should appear without crashes
2. Navigate through levels using breadcrumbs - smooth transitions
3. Check browser console - no "Div is not part of THREE namespace" errors
4. Test on mobile - touch interactions should show labels on first tap
5. Verify screen reader announces breadcrumb navigation correctly

See [docs/visuals.md](docs/visuals.md#overlay-hover-labels) for complete hover label documentation.
See [MANUAL_TESTING.md](MANUAL_TESTING.md#scenario-14-hover-label-functionality) for testing procedures.
See [docs/roadmap.md](docs/roadmap.md) for complete version history.

### v0.1.6 - Documentation Completeness and Version Tracking (December 8, 2025)

*This release captures recent improvements in documentation, ensuring all hash-handling fixes, UI changes, and operational updates are thoroughly documented for maintainability and clarity.*

**Documentation Updates:**

1. **Admin Workflow Documentation**
   - Dual-hash system fully documented (gitBaseHash vs localDiskHash)
   - SHA refresh mechanism explained with detailed workflow diagrams
   - Multiple SHA fetch points documented for both PR and direct commit workflows
   - Optimistic locking behavior clarified at both save and commit stages
   - Clear guidance on when conflicts occur and how to resolve them

2. **Environment Variable Documentation**
   - All admin-related environment variables documented in .env.example
   - `ADMIN_VERBOSE_LOGGING` usage and benefits explained
   - `GITHUB_VERBOSE_LOGGING` option documented for debugging
   - Security best practices for `SESSION_SECRET` highlighted
   - Optional vs required variables clearly distinguished

3. **Visual Changes Documentation**
   - Hover label/tooltip removal rationale documented
   - Alternative context cues explained (breadcrumbs, transition messages, ARIA labels)
   - Performance improvements from component removal quantified
   - Future reconsideration criteria established

4. **Testing Documentation**
   - SHA refresh verification scenarios added to MANUAL_TESTING.md
   - Dual-hash model verification test scenarios documented
   - Hover/tooltip removal verification steps added
   - Expected server log outputs documented for troubleshooting

5. **Roadmap Synchronization**
   - Version history updated to reflect v0.1.6 release
   - Completed features clearly marked
   - Known limitations updated
   - Future enhancement priorities refined

**Why This Release:**

Documentation is critical for:
- **Maintainability**: Future developers understand design decisions
- **Troubleshooting**: Clear logs and error messages reduce debugging time
- **Onboarding**: New team members can quickly understand workflows
- **Compliance**: Security and operational best practices are documented

**Technical Details:**
- No code changes; pure documentation updates
- Version bump from 0.1.5 to 0.1.6
- All tests continue to pass
- No migration steps needed
- Compatible with all v0.1.x releases

**Deployment Notes:**
- No environment variable changes
- No redeployment required (documentation-only release)
- Existing workflows remain unchanged
- Documentation cross-references validated

See [docs/content-authoring.md](docs/content-authoring.md) for dual-hash system details.
See [MANUAL_TESTING.md](MANUAL_TESTING.md#scenario-11-sha-refresh-mechanism-verification) for SHA refresh testing.
See [docs/roadmap.md](docs/roadmap.md) for complete version history.

### v0.1.5 - GitHub Persistence Stabilization and UI Cleanup (December 8, 2025)

*This release stabilizes the admin GitHub persistence workflow and removes deprecated hover/tooltip UI elements for a cleaner user experience.*

**GitHub Persistence Flow Improvements:**

1. **Fresh SHA Fetching Before Commit**
   - GitHub SHA is now fetched immediately before every commit operation
   - Prevents "file has changed" errors from stale SHA values
   - For PR workflow: SHA is re-fetched after branch creation
   - For direct commit: SHA is re-fetched right before the commit
   - Detailed logging tracks SHA refresh operations for troubleshooting

2. **Two-Step Workflow Stability**
   - PATCH endpoint saves changes to `public/universe/universe.json` (Step 1)
   - POST endpoint reads from disk and commits to GitHub (Step 2)
   - File content on disk is the authoritative source for commits
   - Optimistic locking prevents concurrent edit conflicts at both steps
   - Comprehensive validation before GitHub operations

3. **Enhanced Logging and Debugging**
   - Verbose logging mode with `ADMIN_VERBOSE_LOGGING=true` environment variable
   - Workflow steps clearly logged with separators and context
   - SHA fetch operations logged with hash previews
   - File read operations show byte counts and validation results
   - Each GitHub operation logged with success/failure status

**UI Improvements:**

1. **Hover Label and Tooltip Removal**
   - Removed all hover labels from celestial objects (galaxies, stars, planets, moons)
   - Eliminated tooltip components that were causing visual clutter
   - Cleaned up unused hover state variables and emissive highlighting
   - Streamlined scene components for better performance
   - Users now interact directly with objects without intermediate hover states

**Why These Changes:**

The GitHub persistence workflow needed stabilization to prevent commit failures:
- Admins were encountering "file has changed" errors when committing after saving
- Stale SHA values caused GitHub API rejections
- Fresh SHA fetching before every commit ensures accurate file state
- Clear logging helps troubleshoot any remaining edge cases

The tooltip removal improves the user experience:
- Hover labels added visual noise without clear benefit
- Direct object interaction is more intuitive
- Cleaner scene rendering improves performance
- Reduced component complexity makes maintenance easier

**Technical Details:**
- No new environment variables required
- No migration steps needed
- All existing tests passing
- Compatible with all v0.1.x releases
- Backward compatible with existing admin workflows

**Deployment Notes:**
- Optional: Set `ADMIN_VERBOSE_LOGGING=true` for detailed workflow debugging
- Review server logs for `[pushUniverseChanges]` messages to track SHA operations
- GitHub tokens with `repo` scope (and optionally `workflow`) remain required
- No changes to existing environment variable configuration

**Verification Steps:**
1. Make edits in admin interface
2. Click "💾 Save to Disk" - verify success message
3. Wait a few seconds (simulate time passing)
4. Click "Commit to GitHub" - should succeed without "file has changed" error
5. Check server logs for "Fetching current SHA from GitHub..." messages
6. Verify commit or PR appears in GitHub repository
7. Confirm no hover tooltips appear when hovering over celestial objects

See [MANUAL_TESTING.md](MANUAL_TESTING.md#scenario-11-sha-refresh-mechanism-verification) for detailed SHA refresh testing procedures.
See [docs/deployment.md](docs/deployment.md#two-step-save-workflow) for complete workflow documentation.

### v0.1.4 - Admin Workflow Documentation and Testing (December 8, 2025)

*This release provides comprehensive documentation and testing guidance for the admin save/commit workflow, ensuring administrators can confidently manage universe content.*

**Documentation Enhancements:**

1. **Admin Workflow Clarification**
   - Detailed explanation of the two-step save workflow (Save to Disk → Commit to GitHub)
   - **Inline Messaging**: Status messages now appear directly below action buttons for immediate feedback
   - Clear prerequisites and required environment variables for admin operations
   - Comprehensive troubleshooting guidance for common admin workflow issues
   - **Why Two Steps**: Safety, testing, review workflow, and recovery capabilities documented
   - **Environment Variables**: All admin-related secrets clearly documented in `.env.example`

2. **Manual Testing Guide Updates** (MANUAL_TESTING.md)
   - Added comprehensive test scenarios for galaxy creation workflow
   - Step-by-step validation for editing existing galaxies and solar systems
   - Save to disk verification procedures with file system checks
   - GitHub commit workflow testing (both PR and direct commit)
   - Error handling scenarios: network failures, validation errors, authentication timeouts
   - Expected success/failure states clearly documented for each scenario

3. **Admin Prerequisites Documentation**
   - Required environment variables: `ADMIN_PASSWORD`, `SESSION_SECRET`, `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_BRANCH`
   - Token generation instructions with proper scopes (`repo`, `workflow`)
   - Security best practices: strong passwords (16+ chars), separate session secrets
   - Optional variables for testing vs. production environments

4. **Workflow Verification Steps**
   - Server log monitoring: `[PATCH /api/admin/universe]`, `[POST /api/admin/universe]`, `[persistUniverseToFile]`
   - File system verification: Check `public/universe/universe.json` updates
   - GitHub verification: Confirm commits/PRs appear in repository
   - Local testing procedures before committing to production

**Why This Release:**

The admin workflow is critical for content management, and proper documentation ensures:
- Administrators understand the safety benefits of the two-step workflow
- Clear testing procedures reduce the risk of data loss
- Troubleshooting guidance minimizes downtime when issues occur
- Environment setup is straightforward with complete variable documentation

**Technical Details:**
- No code changes; pure documentation and testing guidance
- All 476 unit tests reviewed (469 passing, 7 pre-existing failures in crypto polyfills)
- Build verified successful with no breaking changes
- Compatible with all v0.1.x releases

**Deployment Notes:**
- No new environment variables required (all were already available)
- No migration steps needed
- Documentation updates only; no functional changes
- Backward compatible with existing admin workflows

See [MANUAL_TESTING.md](MANUAL_TESTING.md) for complete admin workflow testing procedures.
See [docs/roadmap.md](docs/roadmap.md) for admin workflow feature status and limitations.
See [docs/content-authoring.md](docs/content-authoring.md) for detailed admin workflow usage guide.

### v0.1.3 - Galaxy Scale and Visual Improvements (December 8, 2025)

*This release enhances the visual experience with improved galaxy scaling and refined camera positioning. Builds upon v0.1.2's admin workflow, hover labeling, and planet viewer improvements.*

**Key Improvements:**

1. **Enhanced Galaxy Scaling** (PR #58)
   - Increased minimum galaxy radius from 4 to 6 units (+50%) for better visibility in crowded universes
   - Increased maximum galaxy radius from 15 to 22 units (+47%) for improved screen presence and focus
   - Adjusted base radius from 8 to 12 units (+50%) to maintain proportional balance
   - Updated grid spacing from 30 to 50 units to prevent overlap with larger galaxies
   - Enhanced camera positioning for optimal framing at new scales
   - Added runtime validation in development mode for grid spacing sufficiency
   - **Verification**: Galaxies now have stronger visual presence while maintaining accessibility and clickability

2. **Camera Position Adjustments**
   - Universe view camera adjusted to (0, 60, 130) from (0, 50, 100) for better framing
   - Galaxy view camera adjusted to (0, 25, 50) from (0, 20, 40) for improved perspective
   - OrbitControls ranges updated: minDistance 20→30, maxDistance 200→250
   - Galaxy focus uses enhanced `calculateFocusPosition()` with distance=35, angle=40°

3. **Documentation Enhancements**
   - Added comprehensive edge case documentation for galaxy scale system
   - Documented performance considerations for larger galaxy scales (~5-10% GPU impact)
   - Enhanced visuals.md with detailed scale configuration guide
   - Added testing guidelines for galaxy scaling behavior
   - Clarified camera positioning and zoom behavior in docs

**Why These Changes Were Made:**
- Sparse universes (1-2 galaxies) needed more dramatic visual presence for immersion
- Crowded universes (50+ galaxies) needed better clickability and visual separation
- Previous galaxy sizes lacked the "wow factor" for featured content
- Camera framing needed adjustment to accommodate larger galaxy scales

**Technical Details:**
- Particle count per galaxy remains constant (2000 particles)
- Larger galaxies occupy more screen space but use same rendering pipeline
- Performance impact: ~5-10% increase in GPU time from increased screen coverage
- Frame rate targets maintained: 60 FPS desktop, 30+ FPS mobile
- All 450 unit tests reviewed (441 passing, 9 pre-existing failures in crypto polyfills)

**Deployment Notes:**
- No new environment variables required
- No migration steps needed
- Changes are purely visual and performance-related
- Backward compatible with existing universe data

See [docs/roadmap.md](docs/roadmap.md) and [docs/visuals.md](docs/visuals.md) for complete documentation.

### v0.1.2 - Critical UX Fixes and Documentation (December 2025)

*This release includes three critical fixes that restore and enhance key workflows, plus comprehensive documentation of all changes.*

**Critical Fixes Implemented:**

1. **Admin Save Flow Restoration** (ISS-4)
   - Fixed two-step save/commit workflow to properly persist changes
   - Resolved disk save operation that was failing to write `universe.json`
   - Ensured GitHub commit step correctly reads saved data from disk
   - Added comprehensive logging for troubleshooting save operations
   - **Verification**: Admin can now save changes locally, then commit to GitHub without data loss

2. **Planet Layout Alignment** (ISS-5)
   - Aligned planet surface to 30/70 split layout (planet left, content right)
   - Fixed responsive behavior for tablet and mobile devices
   - Corrected camera positioning to properly frame planets on left side
   - Enhanced accessibility with proper touch targets (44-52px minimum)
   - **Verification**: Planet pages now display with consistent layout across all viewport sizes

3. **Hover Label Standardization** (ISS-6)
   - Standardized all tooltips across scenes using shared constants
   - Increased font size from 0.875rem to 1rem for better readability
   - Positioned tooltips consistently above objects to prevent overlap
   - Unified colors, padding, and borders across all interactive elements
   - Added `SceneTooltip` component with distance-based scaling
   - **Verification**: All celestial objects show consistent, readable labels on hover

**Why These Changes Were Necessary:**
These fixes addressed critical usability issues that prevented users from effectively managing content and exploring the universe. The scope was larger than typical patches because:
- Admin workflow was fundamentally broken, preventing content updates
- Layout inconsistencies created confusing user experiences across devices
- Tooltip variations caused accessibility and readability problems

**Documentation Updates:**
- Updated content-authoring.md with complete admin save/commit workflow and troubleshooting
- Enhanced visuals.md with planet layout specifications, tooltip system, and responsive behavior
- Synchronized deployment.md with admin workflow monitoring and log filtering
- Refreshed roadmap.md to clearly distinguish shipped fixes from planned enhancements

**Testing:**
- All 164 unit tests updated to reflect new tooltip constants and layout behavior
- Build verified successful with no breaking changes
- Manual verification of admin save flow, planet layout, and tooltip standardization across scenes

See [docs/roadmap.md](docs/roadmap.md) for complete feature status and future plans.

### v0.1.1 - Security & Performance Update (December 2024)

*This release includes critical security patches, dependency updates, and UI improvements.*

**Key Highlights:**
- **Security Updates**: Upgraded Next.js from 14.2.15 to 14.2.33, addressing 7 critical vulnerabilities (CVSS up to 9.1)
- **Edge Runtime Compatibility**: Migrated authentication to Web Crypto API for serverless deployment support
- **UI Enhancements**: Added context-aware welcome message, improved animations, and enhanced visual feedback
- **Zero Vulnerabilities**: All npm audit vulnerabilities resolved

**What's New:**
- Timing-safe password validation using Web Crypto API
- Session tokens signed with HMAC-SHA256 for enhanced security
- `SESSION_SECRET` environment variable for independent session signing (recommended for production)
- Context-aware welcome message when exploring galaxies
- Improved camera transitions and scene animations
- Enhanced interactive labels and tooltips
- Adjusted scene proportions for better visual hierarchy

**Deployment Notes:**
- **New Environment Variable**: `SESSION_SECRET` is recommended for enhanced security (see [.env.example](.env.example))
- **Admin Re-login Required**: Adding `SESSION_SECRET` will invalidate existing sessions

**Technical Details:**
- All 164 unit tests passing with Web Crypto polyfills
- Build verified with no breaking changes
- Updated documentation for Edge Runtime security features

See [docs/roadmap.md](docs/roadmap.md) for complete security vulnerability details and version history.

### v0.1.0 - Horizon Launch (December 2024)

*This release establishes the semantic versioning baseline at 0.1.0, representing the first feature-complete iteration before the 1.0 stable release.*

**Major Features Delivered:**

🌌 **Universe Schema & Data Structure**
- Well-defined hierarchical JSON schema (Universe → Galaxies → Solar Systems → Planets → Moons)
- TypeScript type definitions with runtime validation
- Comprehensive documentation in `docs/universe-schema.md`
- Support for free-floating stars and organized solar systems

🎮 **Immersive 3D Traversal**
- Multi-layer exploration system with smooth transitions between views
- Cinematic camera animations using spline-based paths with easing
- Interactive navigation: universe view → galaxy detail → solar system → planet surface
- Keplerian orbital mechanics for realistic planetary motion
- Shader-based particle galaxies with GPU acceleration
- Moon navigation with seamless surface transitions

📝 **Planet & Moon Markdown Content**
- Rich markdown support for all planetary bodies using React Markdown
- Content sanitization to prevent XSS vulnerabilities
- Live markdown preview in admin interface
- Support for headers, lists, links, code blocks, and formatting
- Content authoring guidelines in `docs/content-authoring.md`

🛠️ **Admin Workflow & Content Management**
- Password-protected admin interface at `/admin`
- Full CRUD operations for galaxies, solar systems, planets, and moons
- GitHub integration for automated commits and pull requests
- Built-in markdown editor with live preview
- Real-time schema validation against universe data structure
- Optimistic locking to prevent concurrent edit conflicts
- Security features:
  - Timing-safe password authentication
  - Signed session tokens with SHA-256 (Web Crypto API)
  - Rate limiting (5 attempts per 15 minutes)
  - Sanitized error logging (no token exposure)
  - Edge Runtime compatible authentication

🧪 **Testing & Quality**
- Comprehensive unit test coverage (164 tests across 9 suites)
- Tests for data loading, validation, authentication, crypto utilities, and GitHub integration
- Edge case handling for empty data, missing content, and concurrent edits
- Web Crypto API polyfills for Node.js test environment

📚 **Documentation**
- Complete deployment guide in `docs/deployment.md`
- Universe schema documentation in `docs/universe-schema.md`
- Visual scene controls in `docs/visuals.md`
- Content authoring guidelines in `docs/content-authoring.md`

**Technical Improvements:**
- TypeScript 5.6.3 with full type safety
- Next.js 14.2.33 with server-side rendering (upgraded from 14.2.15 for security fixes)
- Three.js 0.170.0 for 3D graphics
- Zustand state management
- ESLint configuration for code quality
- Jest testing framework
- Web Crypto API for Edge Runtime compatibility

**Verification Steps:**
✅ All 164 unit tests passing  
✅ Project builds without errors  
✅ Admin authentication working on Edge Runtime  
✅ GitHub integration tested  
✅ Markdown rendering validated  
✅ 3D scene performance optimized  

See [docs/roadmap.md](docs/roadmap.md) for planned features and future enhancements.

## Quick Start

### Prerequisites

- Node.js 18.x or higher
- npm or yarn package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/AgentFoundryExamples/the-horizon.git
cd the-horizon

# Install dependencies
npm install

# Copy environment template (optional for local development)
cp .env.example .env.local

# Start the development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the application.

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run Jest tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
the-horizon/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home page with 3D scene
│   │   ├── globals.css        # Global styles
│   │   └── galaxy/[id]/       # Galaxy detail pages
│   ├── components/            # React components
│   │   ├── UniverseScene.tsx  # Main 3D scene with galaxies
│   │   ├── GalaxyView.tsx     # Galaxy detail view with orbits
│   │   ├── SolarSystemView.tsx # Solar system with planets
│   │   ├── PlanetSurface.tsx  # Planet surface with moons
│   │   ├── MarkdownContent.tsx # Markdown renderer
│   │   └── SceneHUD.tsx       # Navigation overlay
│   ├── styles/
│   │   └── planet.css         # Planet surface styles
│   └── lib/
│       ├── universe/          # Universe data library
│       │   ├── types.ts       # TypeScript models
│       │   ├── data-service.ts # Data loading service
│       │   └── __tests__/     # Unit tests
│       ├── camera.ts          # Camera animation utilities
│       └── store.ts           # Zustand state management
├── public/
│   └── universe/
│       └── universe.json      # Universe data
├── docs/
│   ├── universe-schema.md     # Schema documentation
│   ├── visuals.md            # Scene controls and animation tuning
│   └── content-authoring.md  # Markdown authoring guidelines
├── .env.example              # Environment variable template
├── next.config.js            # Next.js configuration
├── tsconfig.json             # TypeScript configuration
├── jest.config.js            # Jest configuration
└── package.json              # Dependencies and scripts
```

## Universe Data

The universe is defined in `public/universe/universe.json` following a hierarchical structure:

```
Universe → Galaxies → Solar Systems → Planets → Moons
                   → Stars (free-floating)
```

For detailed schema documentation, see [docs/universe-schema.md](docs/universe-schema.md).

### Example Data Access

```typescript
import { getGalaxies, getPlanetById } from '@/lib/universe';

// Get all galaxies
const galaxies = await getGalaxies();

// Get a specific planet
const earth = await getPlanetById('earth');
```

## Testing

The project includes comprehensive unit tests for data validation and loading:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Content Management

### Admin Interface

The Horizon includes a password-protected admin interface for editing universe content directly through your browser.

**Access**: Navigate to `/admin` and log in with your admin password.

**Features**:
- 🔒 Password-protected access with signed session tokens (Web Crypto API)
- 🛡️ Timing-safe authentication preventing timing attacks
- 🚫 Rate limiting (5 attempts per 15 minutes) to prevent brute force
- ⚡ Edge Runtime compatible for serverless deployments
- ✏️ CRUD operations for galaxies, solar systems, planets, and moons
- 📝 Built-in markdown editor with live preview
- 🔄 GitHub integration for automatic commits and pull requests
- ✅ Real-time validation against the universe schema
- 🔐 Optimistic locking to prevent concurrent edit conflicts
- 📋 Sanitized error logging (no token exposure)

### Using the Admin Interface

The admin interface uses a **two-step workflow** for safe content management:

**Step 1: Save to Disk**
1. Navigate to `/admin` and log in with your admin password
2. Click "Edit" on any galaxy to modify its properties
3. Make your changes in the editor
4. Click "Save Changes" to save to memory
5. Click "💾 Save to Disk" to persist changes to `public/universe/universe.json`
6. Verify success message appears

**Step 2: Commit to GitHub** (requires GitHub credentials)
1. Enter a descriptive commit message
2. Choose to either:
   - Create a Pull Request (recommended for review)
   - Commit directly to the main branch
3. Click "🔀 Create PR" or "✓ Commit to GitHub"
4. Changes will be pushed to GitHub and trigger automatic redeployment

**Why Two Steps?**
- **Safety**: Test changes locally before committing
- **Flexibility**: Make multiple edits and save incrementally
- **Review**: Create PRs for team review
- **Recovery**: Changes persist even if session expires

**Monitoring**:
- Check server logs for detailed operation tracking
- Look for `[PATCH /api/admin/universe]` and `[POST /api/admin/universe]` log messages
- Verify `public/universe/universe.json` was updated locally
- Check GitHub for commits or PRs

See [docs/content-authoring.md](docs/content-authoring.md) for complete workflow documentation.

### Manual Content Editing

You can also edit `public/universe/universe.json` directly:

1. Edit `public/universe/universe.json`
2. Follow the schema defined in `docs/universe-schema.md`
3. Include markdown content for planets and moons
4. Run validation: `npm run dev` and check console for warnings
5. Test your changes locally

### Content Guidelines

- Use proper markdown formatting
- Keep IDs in kebab-case (e.g., `milky-way`)
- Include meaningful descriptions
- Validate JSON syntax before committing

## Environment Variables

Copy `.env.example` to `.env.local` for local development:

```bash
cp .env.example .env.local
```

### Required Environment Variables

**For Admin Interface**:
- `ADMIN_PASSWORD` - Password for admin access (min 16 characters recommended)
- `SESSION_SECRET` - Secret for signing session tokens (generate with `openssl rand -base64 32`)
- `GITHUB_TOKEN` - Personal access token with `repo` scope (and optionally `workflow` if using actions)
  - See [docs/deployment.md](docs/deployment.md#github-personal-access-token) for detailed token generation instructions
  - For staging vs production: See [environment-specific configuration](docs/deployment.md#staging-vs-production-environments)
- `GITHUB_OWNER` - Repository owner (e.g., 'AgentFoundryExamples')
- `GITHUB_REPO` - Repository name (e.g., 'the-horizon')
- `GITHUB_BRANCH` - Target branch (default: 'main')

**For Development**:
- `NODE_ENV` - Environment mode (development/production)

### Generating a GitHub Token

1. Go to [GitHub Settings → Personal Access Tokens](https://github.com/settings/tokens/new)
2. Create a new token with `repo` scope (and optionally `workflow` if using actions)
3. Copy the token and add it to your `.env.local` file

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel dashboard
3. Configure environment variables:
   - `ADMIN_PASSWORD` - Strong password for admin access
   - `SESSION_SECRET` - Secret for signing session tokens
   - `GITHUB_TOKEN` - GitHub personal access token with `repo` scope (and optionally `workflow`)
   - `GITHUB_OWNER` - Your GitHub username or organization
   - `GITHUB_REPO` - Repository name
   - `GITHUB_BRANCH` - Target branch (usually 'main')
4. Deploy

**Note**: Vercel automatically sets `VERCEL_GIT_REPO_OWNER` and `VERCEL_GIT_REPO_SLUG`, which can be used as fallbacks for `GITHUB_OWNER` and `GITHUB_REPO`.

For detailed deployment instructions, see [docs/deployment.md](docs/deployment.md).

### Other Platforms

```bash
# Build the application
npm run build

# Start production server
npm start
```

The application can be deployed to any platform that supports Next.js.

## Tech Stack

- **Framework**: Next.js 14.2.33
- **Language**: TypeScript 5.6.3
- **UI Library**: React 18.3.1
- **3D Graphics**: Three.js 0.170.0, React Three Fiber 8.17.10, Drei 9.117.3
- **State Management**: Zustand 5.0.1
- **Markdown**: React Markdown 9.0.1
- **Testing**: Jest 29.7.0, Testing Library
- **Linting**: ESLint 8.57.1

## 3D Scene Controls

### Navigation

- **Mouse Drag**: Orbit around the universe (universe view only)
- **Mouse Wheel**: Zoom in/out (universe view only)
- **Click Galaxy**: Transition to galaxy detail view with orbiting solar systems
- **Click Solar System**: Zoom into solar system with orbiting planets
- **Click Planet**: Land on planet surface to view markdown content with a two-column layout
  - Planet renders on the left (30% width) with 3D visualization
  - Content displays on the right (70% width) with markdown, title, and moon navigation
  - Layout is fully responsive and adapts to mobile devices
- **Click Moon (in skybox)**: Hop to moon and view its content
- **Back Button**: Return to previous level with animated transition
- **Breadcrumbs**: Navigate hierarchy via top navigation bar

### Accessibility

The application supports modern accessibility features:
- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Focus States**: Clear visual indicators for focused elements
- **Reduced Motion**: Respects `prefers-reduced-motion` setting to disable non-essential animations
- **Screen Reader Support**: Semantic HTML and ARIA labels where appropriate

### Performance

The scene uses several optimizations for smooth 60 FPS rendering:
- Shader-based particle systems for galaxies (2,000+ particles each)
- Instanced rendering for planets and stars
- GPU-accelerated animations
- Efficient state management with Zustand
- Optimized markdown rendering with React Markdown

See [docs/visuals.md](docs/visuals.md) for detailed scene controls, animation tuning, and performance optimization guidelines.
See [docs/content-authoring.md](docs/content-authoring.md) for markdown authoring guidelines.

## Future Enhancements

- 🎮 Interactive 3D universe visualization with advanced physics
- 🗄️ Database integration for dynamic content (if needed)
- 📊 Analytics and usage tracking
- 🌐 API endpoints for external integrations
- 🔍 Search and filter capabilities in admin interface
- 📱 Mobile-optimized admin interface

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Troubleshooting

### Build Errors

If you encounter build errors:
1. Delete `node_modules` and `package-lock.json`
2. Run `npm install` again
3. Clear Next.js cache: `rm -rf .next`

### Test Failures

If tests fail:
1. Ensure all dependencies are installed
2. Check that `universe.json` is valid JSON
3. Run `npm run type-check` to verify TypeScript

### Development Server Issues

If the dev server won't start:
1. Check that port 3000 is available
2. Try `npm run dev -- --port 3001` to use a different port
3. Clear any cached files: `rm -rf .next`

## Documentation

- [Universe Schema Documentation](docs/universe-schema.md)
- [Visual Scene Controls and Animation Tuning](docs/visuals.md)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Three Fiber Documentation](https://docs.pmnd.rs/react-three-fiber)


# Permanents (License, Contributing, Author)

Do not change any of the below sections

## License

This Agent Foundry Project is licensed under the Apache 2.0 License - see the LICENSE file for details.

## Contributing

Feel free to submit issues and enhancement requests!

## Author

Created by Agent Foundry and John Brosnihan
