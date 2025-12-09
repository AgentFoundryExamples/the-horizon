# Manual Testing Guide

This guide helps reviewers manually test The Horizon application, with a primary focus on the admin interface and content management workflows.

## Prerequisites

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000`

3. Set required environment variables in `.env.local`:
   ```
   ADMIN_PASSWORD=your-test-password
   SESSION_SECRET=your-session-secret
   GITHUB_TOKEN=ghp_your_github_token (optional for local save testing)
   GITHUB_OWNER=your-github-username (optional for local save testing)
   GITHUB_REPO=the-horizon (optional for local save testing)
   GITHUB_BRANCH=main (optional for local save testing)
   ```

**Note**: You can test the admin save-to-disk workflow without GitHub credentials. GitHub credentials are only required for the commit step.

## Admin Workflow Test Scenarios

These scenarios specifically test the two-step admin save/commit workflow that is central to content management.

### Scenario 1: Creating a New Galaxy (Full Workflow)

**Purpose**: Validate the complete galaxy creation and save workflow

**Steps**:
1. Navigate to `/admin` and log in with your admin password
   - ✅ Expected: Successfully logged in and redirected to dashboard
2. Click "+ Add New Galaxy" button
   - ✅ Expected: Galaxy editor modal opens with three tabs visible
3. Fill in the "Basic Info" tab:
   - Name: "Test Galaxy Alpha"
   - Description: "A test galaxy for validation"
   - Theme: "blue-white"
   - Particle Color: "#4A90E2" (or use color picker)
   - ✅ Expected: ID field auto-populates as "test-galaxy-alpha"
   - ✅ Expected: No validation errors shown
4. Click "Save Changes"
   - ✅ Expected: Modal closes automatically
   - ✅ Expected: Green toast notification: "Galaxy 'Test Galaxy Alpha' updated successfully..."
   - ✅ Expected: New galaxy appears in dashboard card list
5. Scroll to "💾 Save Changes" section
6. Click "💾 Save to Disk"
   - ✅ Expected: Button shows "Saving..." with spinner
   - ✅ Expected: Green notification: "Changes saved successfully!"
   - ✅ Expected: Toast auto-closes after 5 seconds

**File System Verification**:
```bash
# Check that the file was updated
cat public/universe/universe.json | grep "Test Galaxy Alpha"
# Should show the new galaxy data

# Check file modification time
ls -lh public/universe/universe.json
# Should show recent timestamp
```

**Server Log Verification**:
Look for these log messages in the terminal:
```
[PATCH /api/admin/universe] Request received - saving to disk
[PATCH /api/admin/universe] Payload parsed - galaxies: X
[PATCH /api/admin/universe] Validation passed
[persistUniverseToFile] Success - file persisted
[PATCH /api/admin/universe] Success - new hash: ...
```

### Scenario 2: Editing an Existing Galaxy

**Purpose**: Validate editing existing content preserves data integrity

**Steps**:
1. From the dashboard, click "Edit Galaxy" on an existing galaxy card
   - ✅ Expected: Modal opens with galaxy data pre-filled
   - ✅ Expected: Breadcrumb shows "All Galaxies > [Galaxy Name]"
2. Modify the description field
   - Change description to: "Updated description for testing"
   - ✅ Expected: Changes reflected immediately in the editor
3. Click "Save Changes"
   - ✅ Expected: Modal closes with success notification
4. Click "💾 Save to Disk"
   - ✅ Expected: Save completes successfully
5. Refresh the page
   - ✅ Expected: Changes persist and appear in the dashboard
6. Verify the file system:
   ```bash
   cat public/universe/universe.json | grep "Updated description for testing"
   ```
   - ✅ Expected: New description appears in the file

### Scenario 3: Adding a Solar System to a Galaxy

**Purpose**: Validate nested content creation workflow

**Steps**:
1. Edit an existing galaxy
2. Click the "Solar Systems" tab
   - ✅ Expected: List of existing systems or empty state
3. Click "+ Add Solar System"
   - ✅ Expected: New modal opens on top of galaxy modal
   - ✅ Expected: Breadcrumb shows "Back to Galaxy > [System Name]"
4. Fill in system information:
   - Name: "Test System Beta"
   - Description: "A test solar system"
   - Main star name: "Test Star"
   - ✅ Expected: ID auto-populates as "test-system-beta"
5. Click "Save Changes"
   - ✅ Expected: System modal closes automatically
   - ✅ Expected: Galaxy modal remains open
   - ✅ Expected: New system appears in systems list
6. Close galaxy modal
7. Click "💾 Save to Disk"
   - ✅ Expected: Save completes successfully

**Verification**:
```bash
cat public/universe/universe.json | grep -A 5 "Test System Beta"
# Should show the new solar system nested under the galaxy
```

### Scenario 4: Committing Changes to GitHub (with GitHub credentials)

**Purpose**: Validate the GitHub integration workflow and SHA refresh mechanism

**Prerequisites**: 
- GitHub credentials configured in `.env.local`
- Valid `GITHUB_TOKEN` with `repo` scope (and optionally `workflow` scope for PR-based workflows)

**Context**: This tests the stabilized admin GitHub persistence flow that prevents "file has changed" errors by fetching fresh SHA from GitHub before committing.

**Steps**:
1. Make some edits (follow Scenario 1 or 2)
2. Click "💾 Save to Disk" and verify success
3. **Verify disk file was updated**:
   ```bash
   # Check file modification time
   ls -lh public/universe/universe.json
   # Should show recent timestamp (within last minute)
   
   # Check file content
   cat public/universe/universe.json | grep "your-change-text"
   # Should show your changes
   ```
4. Scroll to "🔀 Commit to GitHub" section
5. Enter commit message: "Test: Admin workflow validation"
6. Check "Create Pull Request" checkbox
   - ✅ Expected: Checkbox is checked
7. Click "🔀 Create Pull Request"
   - ✅ Expected: Button shows "Committing..." with spinner
   - ✅ Expected: Green notification with PR URL
   - ✅ Expected: Message: "Pull request created successfully! PR: [URL]"
8. Click the PR URL in the notification
   - ✅ Expected: Opens GitHub PR page in new tab
   - ✅ Expected: PR shows the universe.json file changes
   - ✅ Expected: Commit message matches what you entered

**Server Log Verification**:
Look for these log messages in the terminal:
```
[POST /api/admin/universe] ========================================
[POST /api/admin/universe] Request received - committing to GitHub
[POST /api/admin/universe] Workflow: Step 2 of 2 (Step 1 was PATCH to save to disk)
[POST /api/admin/universe] Step 1: Reading from persisted file: public/universe/universe.json
[POST /api/admin/universe] File read successfully, size: XXXX bytes
[POST /api/admin/universe] Step 2: Validating persisted data...
[POST /api/admin/universe] Validation passed
[POST /api/admin/universe] Step 3: Checking for race conditions...
[POST /api/admin/universe] No race conditions detected
[POST /api/admin/universe] Step 4: Pushing to GitHub...
[pushUniverseChanges] Starting commit workflow
[pushUniverseChanges] Fetching current SHA from GitHub...
[pushUniverseChanges] Current GitHub SHA: abc12345...
[pushUniverseChanges] Creating branch and PR workflow...
[pushUniverseChanges] Branch created successfully
[pushUniverseChanges] Re-fetching SHA after branch creation...
[pushUniverseChanges] Fresh SHA after branch creation: abc12345...
[pushUniverseChanges] Committing to new branch...
[pushUniverseChanges] Commit successful, SHA: def67890...
[pushUniverseChanges] Creating pull request...
[pushUniverseChanges] Pull request created: https://...
[POST /api/admin/universe] SUCCESS: GitHub push successful
[POST /api/admin/universe] ========================================
```

**Key Points Being Tested**:
- ✅ Fresh SHA is fetched from GitHub before commit (prevents stale SHA errors)
- ✅ SHA is re-fetched after branch creation (for PR workflow)
- ✅ File content from disk is used as authoritative source
- ✅ Workflow logs are clear and grouped with separators
- ✅ Each step is logged with detailed context

### Scenario 5: Direct Commit to Main Branch (with GitHub credentials)

**Purpose**: Validate direct commit workflow (use with caution in production)

**Steps**:
1. Make some edits and save to disk
2. In "🔀 Commit to GitHub" section:
   - Enter commit message: "Test: Direct commit validation"
   - **Do NOT check** "Create Pull Request"
   - ✅ Expected: Button changes to "✓ Commit to Main Branch"
3. Click "✓ Commit to Main Branch"
   - ✅ Expected: Confirmation prompt (if implemented)
   - ✅ Expected: Green notification: "Changes committed successfully!"
4. Check GitHub repository:
   - Navigate to repository commits page
   - ✅ Expected: Recent commit with your message appears
   - ✅ Expected: universe.json file shows your changes

### Scenario 6: Validation Error Handling

**Purpose**: Verify that validation prevents invalid data from being saved

**Steps**:
1. Create a new galaxy
2. Fill in Name: "Test Galaxy"
3. **Leave Description empty**
4. **Leave Theme empty**
5. Click "Save Changes"
   - ✅ Expected: Red borders appear on empty required fields
   - ✅ Expected: Error messages below each invalid field
   - ✅ Expected: Modal stays open (does not close)
   - ✅ Expected: No success notification appears
6. Fill in missing fields
7. Click "Save Changes"
   - ✅ Expected: Modal closes successfully
   - ✅ Expected: Green success notification

### Scenario 7: Network Error Handling

**Purpose**: Verify graceful handling of network failures

**Steps**:
1. Open browser DevTools → Network tab
2. Set throttling to "Offline"
3. Make edits to a galaxy
4. Click "Save Changes" (modal closes - changes in memory)
5. Click "💾 Save to Disk"
   - ✅ Expected: Red notification appears
   - ✅ Expected: Message: "Network error: Unable to connect..."
   - ✅ Expected: Changes preserved in browser (not lost)
6. Set network back to "Online"
7. Click "💾 Save to Disk" again
   - ✅ Expected: Save succeeds with green notification

### Scenario 8: Concurrent Edit Conflict

**Purpose**: Verify optimistic locking prevents data corruption and that the SHA refresh mechanism works correctly

**Prerequisites**: Two browser windows or tabs

**Context**: This tests that the system correctly detects conflicts and that fresh SHA fetching prevents false positives.

**Steps**:
1. Open admin in two browser tabs (Tab A and Tab B)
2. In Tab A: Edit a galaxy and save to disk
   - ✅ Expected: Save succeeds
   - ✅ Expected: Server logs show new hash generated
3. In Tab B: Edit the SAME galaxy (don't refresh first)
4. In Tab B: Try to save to disk
   - ✅ Expected: Error notification: "Conflict detected: The file has been modified..."
   - ✅ Expected: Your edits preserved in Tab B
5. In Tab B: Refresh the page
6. In Tab B: Re-apply your changes and save
   - ✅ Expected: Save succeeds now
7. **Test GitHub commit with fresh SHA fetch**:
   - In Tab A: Click "Commit to GitHub"
   - ✅ Expected: Commit succeeds (fresh SHA is fetched before commit)
   - ✅ Expected: Server logs show SHA fetch: `[pushUniverseChanges] Fetching current SHA from GitHub...`
   - ✅ Expected: Server logs show: `[pushUniverseChanges] Current GitHub SHA: abc12345...`

**Server Logs**:
For Tab B conflict:
```
[PATCH /api/admin/universe] Conflict detected - hash mismatch
```

For Tab A successful commit with fresh SHA:
```
[POST /api/admin/universe] Step 4: Pushing to GitHub...
[pushUniverseChanges] Starting commit workflow
[pushUniverseChanges] Fetching current SHA from GitHub...
[pushUniverseChanges] Current GitHub SHA: abc12345...
[pushUniverseChanges] Optimistic lock verified - hash matches: def67890...
[pushUniverseChanges] Direct commit to main branch...
[pushUniverseChanges] Re-fetching SHA immediately before commit...
[pushUniverseChanges] Final SHA before commit: abc12345...
[pushUniverseChanges] Commit successful, SHA: ghi01234...
```

**What This Tests**:
- ✅ Optimistic locking prevents concurrent edits to disk
- ✅ Fresh SHA is fetched from GitHub before commit (not cached)
- ✅ SHA is re-fetched immediately before the commit operation
- ✅ This prevents "file has changed" errors from stale SHAs
- ✅ Detailed logging helps debug any issues

### Scenario 9: Authentication Timeout

**Purpose**: Verify session expiration handling

**Steps**:
1. Log in to admin interface
2. Make some edits (don't save)
3. Wait for session to expire (24 hours, or manually clear session cookie)
4. Try to save changes
   - ✅ Expected: Red notification: "Unauthorized. Please log in again."
   - ✅ Expected: After 2 seconds, redirect to `/admin/login`
   - ✅ Expected: Unsaved changes lost (expected behavior)
5. Log in again
   - ✅ Expected: Return to dashboard
   - ✅ Expected: Previously saved changes still present

**Manual Session Expiration**:
In browser DevTools → Application → Cookies:
- Delete the session cookie
- Try to save - should trigger auth error

### Scenario 10: Testing Without GitHub Credentials

**Purpose**: Verify local save workflow works without GitHub integration

**Prerequisites**: Remove or comment out GitHub credentials in `.env.local`:
```
# GITHUB_TOKEN=
# GITHUB_OWNER=
# GITHUB_REPO=
```

**Steps**:
1. Restart dev server
2. Log in to admin
3. Create or edit content
4. Click "💾 Save to Disk"
   - ✅ Expected: Save succeeds with green notification
5. Verify file system:
   ```bash
   cat public/universe/universe.json
   # Should show your changes
   ```
6. Try to commit to GitHub:
   - ✅ Expected: Error notification: "GitHub credentials not configured"
   - ✅ Expected: Clear message about missing environment variables

---

### Scenario 11: SHA Refresh Mechanism Verification

**Purpose**: Verify that the system fetches fresh SHA from GitHub before committing, preventing "file has changed" errors

**Prerequisites**: 
- GitHub credentials configured
- Access to server logs

**Context**: This scenario specifically tests the fix for the "file has changed" error that occurred when admins saved to disk then committed.

**Steps**:
1. Make changes in the admin interface
2. Click "💾 Save to Disk"
   - ✅ Expected: Disk save succeeds
   - ✅ Expected: Local file `public/universe/universe.json` is updated
3. **Wait 5 seconds** (simulate time passing between save and commit)
4. Click "🔀 Commit to GitHub" (or "Create Pull Request")
5. **Monitor server logs carefully**:
   ```
   [POST /api/admin/universe] Step 1: Reading from persisted file
   [POST /api/admin/universe] File is authoritative source for commit
   [POST /api/admin/universe] Step 4: Pushing to GitHub...
   [POST /api/admin/universe] Note: GitHub layer will fetch fresh SHA
   [pushUniverseChanges] Starting commit workflow
   [pushUniverseChanges] Fetching current SHA from GitHub...
   [pushUniverseChanges] Current GitHub SHA: abc12345...
   ```
6. Verify commit succeeds:
   - ✅ Expected: Commit or PR created successfully
   - ✅ Expected: NO "file has changed" error
   - ✅ Expected: Server logs show fresh SHA was fetched
   - ✅ Expected: GitHub repository shows the new commit/PR

**For PR Workflow**:
Additional log verification:
```
[pushUniverseChanges] Creating branch and PR workflow...
[pushUniverseChanges] Branch created successfully
[pushUniverseChanges] Re-fetching SHA after branch creation...
[pushUniverseChanges] Fresh SHA after branch creation: abc12345...
```

**For Direct Commit Workflow**:
Additional log verification:
```
[pushUniverseChanges] Direct commit to main branch...
[pushUniverseChanges] Re-fetching SHA immediately before commit...
[pushUniverseChanges] Final SHA before commit: abc12345...
```

**What This Tests**:
- ✅ Fresh SHA is fetched at START of commit operation
- ✅ For PR: SHA is re-fetched AFTER branch creation
- ✅ For direct commit: SHA is re-fetched RIGHT BEFORE commit
- ✅ File content from disk is used (not stale in-memory content)
- ✅ Multiple SHA refresh points prevent stale SHA errors
- ✅ Workflow completes successfully without "file has changed" errors

**Failure Scenario (if SHA refresh didn't work)**:
If the system used a stale SHA, you would see:
```
Error: SHA does not match (GitHub API error)
```
This should NOT happen with the stabilized flow.

### Scenario 12: Dual-Hash Model Verification

**Purpose**: Verify that the dual-hash model (gitBaseHash vs localDiskHash) works correctly to prevent conflicts and data loss

**Prerequisites**: 
- Admin access
- Browser DevTools (Network tab)

**Context**: The application uses two separate hashes:
- **gitBaseHash**: Tracks the last known state in GitHub (baseline for conflict detection during commits)
- **localDiskHash**: Tracks the current local file state (used for optimistic locking during saves)

This dual-hash model allows multiple local saves without requiring GitHub pushes, while still preventing conflicts when committing.

**Steps**:

1. **Initial Load - Both Hashes in Sync**
   - Navigate to `/admin`
   - Open browser DevTools → Network tab
   - Click any "Edit" button to open the editor
   - Check the initial props passed to the component
   - ✅ Expected: gitBaseHash === localDiskHash (both represent GitHub state)

2. **Save to Disk - localDiskHash Updates, gitBaseHash Preserved**
   - Make an edit to a galaxy/system/planet
   - Click "💾 Save to Disk"
   - Observe the PATCH request payload in DevTools Network tab:
     ```json
     {
       "universe": {...},
       "currentHash": "abc123..."  // This is localDiskHash
     }
     ```
   - Observe the PATCH response:
     ```json
     {
       "success": true,
       "hash": "def456..."  // New localDiskHash
     }
     ```
   - ✅ Expected: Response includes updated hash for local disk
   - ✅ Expected: gitBaseHash remains unchanged in client state
   - ✅ Expected: localDiskHash updates to new value

3. **Multiple Saves Without Commit**
   - Make another edit
   - Click "💾 Save to Disk" again
   - Repeat 2-3 times
   - ✅ Expected: Each save uses the previous localDiskHash for optimistic locking
   - ✅ Expected: gitBaseHash never changes (still points to GitHub baseline)
   - ✅ Expected: No "conflict" errors since each save builds on previous disk state

4. **Commit to GitHub - Uses gitBaseHash**
   - After multiple local saves, enter a commit message
   - Click "✓ Commit to Main Branch" (or "🔀 Create Pull Request")
   - Observe the POST request payload in DevTools Network tab:
     ```json
     {
       "commitMessage": "Your message",
       "createPR": false,
       "gitBaseHash": "abc123..."  // Original baseline, not latest localDiskHash
     }
     ```
   - ✅ Expected: POST uses gitBaseHash (GitHub baseline) for conflict detection
   - ✅ Expected: POST does NOT use localDiskHash
   - ✅ Expected: Commit succeeds and returns new SHA

5. **After Successful Commit - Both Hashes Sync Again**
   - Observe the POST response:
     ```json
     {
       "success": true,
       "hash": "xyz789..."  // New GitHub SHA
     }
     ```
   - Refresh the admin page
   - Check state after reload
   - ✅ Expected: Both gitBaseHash and localDiskHash update to new GitHub SHA
   - ✅ Expected: Hashes are in sync again after commit
   - ✅ Expected: Next save cycle starts from this new baseline

6. **Conflict Detection During Save**
   - Open admin in TWO browser tabs (Tab A and Tab B)
   - In Tab A: Make an edit and save to disk
   - In Tab B: Make a DIFFERENT edit (don't refresh)
   - In Tab B: Try to save to disk
   - ✅ Expected: Tab B gets 409 Conflict error
   - ✅ Expected: Error message: "Conflict detected: The file has been modified..."
   - ✅ Expected: Tab B's edits are preserved (not lost)
   - In Tab B: Refresh the page, re-apply edits, and save
   - ✅ Expected: Save succeeds after refresh

7. **Conflict Detection During Commit**
   - Open admin in TWO browser tabs
   - In Tab A: Make edits and save to disk
   - In Tab B: Make edits and save to disk (conflict at save time caught above)
   - Assume Tab A's save succeeds first
   - In Tab A: Commit to GitHub successfully
   - In Tab B: Try to commit (after Tab A's commit)
   - ✅ Expected: If GitHub HEAD changed, commit may succeed (uses fresh SHA)
   - ✅ Expected: System fetches fresh SHA before commit (see logs)
   - ✅ Expected: No false conflicts due to stale SHA caching

**Server Log Verification**:

For Save to Disk (PATCH):
```
[PATCH /api/admin/universe] Checking optimistic lock with hash: abc123...
[PATCH /api/admin/universe] Hash verification passed
[PATCH /api/admin/universe] Success - new local disk hash: def456...
```

For Commit to GitHub (POST):
```
[POST /api/admin/universe] Payload: {..., hasGitBaseHash: true}
[POST /api/admin/universe] Step 4: Pushing to GitHub...
[pushUniverseChanges] Fetching current SHA from GitHub...
```

**What This Tests**:
- ✅ Dual-hash model separates local and remote states
- ✅ Local saves update localDiskHash only
- ✅ Commits use gitBaseHash for baseline comparison
- ✅ Multiple saves without commits work correctly
- ✅ Conflicts detected at appropriate times (save vs commit)
- ✅ No false conflicts from stale hash caching
- ✅ Both hashes sync after successful commit

**Why This Matters**:
- Allows admins to save frequently without committing
- Prevents conflicts when multiple admins work simultaneously
- Ensures GitHub commits always use correct baseline for conflict detection
- Avoids "file has changed" errors from stale SHAs

---

### Scenario 13: Hover/Tooltip Removal Verification (v0.1.5)

**Purpose**: Verify that hover labels and tooltips have been removed from all celestial objects

**Prerequisites**: None (visual inspection only)

**Context**: v0.1.5 removed all hover labels and tooltip components to reduce visual clutter and improve performance.

**Steps**:
1. Navigate to the main universe view at `http://localhost:3000`
2. Hover over various galaxies
   - ✅ Expected: NO tooltip or label appears above/near the galaxy
   - ✅ Expected: Galaxy may have subtle visual feedback (shader effects) but no text overlay
3. Click on a galaxy to enter galaxy view
4. Hover over solar systems within the galaxy
   - ✅ Expected: NO tooltip or label appears
   - ✅ Expected: Solar systems remain interactive (clickable)
5. Click on a solar system to enter system view
6. Hover over planets orbiting the star
   - ✅ Expected: NO tooltip or label appears
   - ✅ Expected: Planets remain clickable
7. Click on a planet to land on its surface
8. Hover over moons in the skybox
   - ✅ Expected: NO tooltip or label appears
   - ✅ Expected: Moons remain clickable for navigation

**Visual Inspection**:
- Scene should feel cleaner without text overlays
- Object interactions should be direct and intuitive
- Cursor may change to indicate interactivity, but no text labels
- Focus should be on the 3D objects themselves, not UI overlays

**Performance Check**:
1. Open browser DevTools → Performance tab
2. Start recording
3. Move mouse rapidly over multiple objects
4. Stop recording
   - ✅ Expected: No tooltip-related rendering overhead
   - ✅ Expected: Smooth 60 FPS during mouse movement
   - ✅ Expected: No React component updates for hover states

**Code Verification** (optional):
```bash
# Verify tooltip components have been removed
cd src/components
ls -la | grep -i tooltip
# Should return no results

# Check for hover state cleanup in scene components
grep -r "setHovered" src/components/
# Should return minimal or no results

# Check for emissive highlighting cleanup
grep -r "emissive" src/components/ | grep -v "test"
# Should show only intentional emissive usage, not hover-based
```

**What This Tests**:
- ✅ Tooltip components completely removed from codebase
- ✅ Hover states cleaned up from scene components
- ✅ Objects remain interactive without visual label clutter
- ✅ Performance improved without tooltip rendering overhead
- ✅ User experience is more direct and less cluttered

---

### Scenario 14: Hover Label Functionality (v0.1.7 - ISS-1)

**Purpose**: Verify that hover labels render correctly using Drei Html component without crashes

**Prerequisites**: None (visual and functional inspection)

**Context**: v0.1.7 stabilized hover labels by migrating to Drei's Html component, preventing crashes that occurred when DOM elements were rendered directly in the Canvas.

**Steps**:

1. **Universe View - Galaxy Hover**
   - Navigate to `http://localhost:3000`
   - Hover mouse over any galaxy particle cloud
   - ✅ Expected: Hover label appears above the galaxy with name and metadata
   - ✅ Expected: Label displays with hologram styling (translucent, glowing border)
   - ✅ Expected: NO console errors about "Div is not part of THREE namespace"
   - ✅ Expected: Label follows galaxy as camera moves/orbits
   - Move mouse away from galaxy
   - ✅ Expected: Label fades out smoothly

2. **Galaxy View - Solar System and Star Hover**
   - Click on a galaxy to enter galaxy view
   - Hover over a central star (solar system)
   - ✅ Expected: Label shows system name and planet count
   - ✅ Expected: Label positioned above the star
   - Hover over a free-floating star
   - ✅ Expected: Label shows star name
   - Move mouse between multiple objects
   - ✅ Expected: Labels switch smoothly, one at a time

3. **Solar System View - Planet Hover**
   - Click on a solar system to enter system view
   - Hover over an orbiting planet
   - ✅ Expected: Label appears with planet name
   - ✅ Expected: Label follows planet during orbital motion
   - ✅ Expected: Label scales appropriately with distance
   - Wait for planet to orbit behind another object
   - ✅ Expected: Label remains visible (no occlusion)

4. **Planet Surface - Moon Hover**
   - Click on a planet to land on surface
   - Hover over moons in the skybox
   - ✅ Expected: Labels appear for each moon
   - ✅ Expected: Touch-friendly behavior (tap to show label)

**Desktop Testing:**
1. Open browser DevTools → Console
2. Perform all hover actions above
3. ✅ Expected: Zero console errors or warnings
4. ✅ Expected: No "Div is not part of THREE namespace" errors
5. ✅ Expected: No "Invalid position data" warnings (unless intentionally testing edge cases)

**Mobile/Touch Testing:**
1. Open site on mobile device or use browser DevTools device emulation
2. Tap on a galaxy
   - ✅ Expected: Label appears on first tap
   - ✅ Expected: Navigation occurs on second tap
3. Tap elsewhere to dismiss label
   - ✅ Expected: Label fades out

**Performance Verification:**
1. Open browser DevTools → Performance tab
2. Start recording
3. Hover rapidly over multiple celestial objects
4. Stop recording
5. ✅ Expected: Consistent 60 FPS (or 30+ FPS on mobile)
6. ✅ Expected: No frame drops during label rendering
7. ✅ Expected: Smooth animations throughout

**Edge Case Testing:**

**Test: Rapid hover on/off**
- Move mouse quickly over and away from objects
- ✅ Expected: Labels appear/disappear smoothly
- ✅ Expected: No flickering or glitches
- ✅ Expected: No memory leaks

**Test: Invalid position data (optional developer/QA scenario)**
- **Note**: This test is optional and requires code modification. Skip if not performing deep validation testing.
- **Setup**: Temporarily modify hover state to inject test data with `NaN` or `Infinity` coordinates
- **How to test**: 
  1. Open `src/lib/hover-store.ts` or relevant component
  2. Inject test object: `setHoveredObject({ id: 'test', name: 'Test', type: 'galaxy', position: new THREE.Vector3(NaN, 0, 0) })`
  3. Check browser console for validation warnings
- **Expected behavior**:
  - ✅ Console warning logged about invalid position data
  - ✅ Application continues without crash
  - ✅ Label does not render for invalid object
- **Cleanup**: Remove test code after validation

**Browser Console Verification:**
Look for these patterns (should NOT appear):
```
❌ "Div is not part of the THREE namespace"
❌ "Cannot read property of undefined"
❌ Uncaught TypeError related to hover labels
```

Should see (if verbose logging enabled):
```
✅ Label visibility toggled
✅ Hover object set: [object name]
```

**Accessibility Testing:**

1. **Screen Reader Test**
   - Enable screen reader (NVDA, JAWS, VoiceOver)
   - Hover over objects
   - ✅ Expected: Screen reader announces label content
   - ✅ Expected: ARIA live region updates

2. **Keyboard Navigation**
   - Tab to label visibility toggle button (if present in HUD)
   - Press Enter or Space
   - ✅ Expected: Labels toggle on/off
   - ✅ Expected: Setting persists across navigation

3. **Reduced Motion**
   - Enable "Reduce motion" in OS settings
   - Hover over objects
   - ✅ Expected: Labels appear instantly (no fade animation)
   - ✅ Expected: Full functionality maintained

**What This Tests:**
- ✅ Drei Html component correctly integrated
- ✅ No Canvas crashes from DOM element rendering
- ✅ Position validation prevents invalid data crashes
- ✅ Labels render efficiently without performance impact
- ✅ Touch and desktop interactions work correctly
- ✅ Accessibility features function properly
- ✅ Edge cases handled gracefully

**Known Limitations (Documented):**
- Only one object can be hovered at a time (by design)
- Labels don't persist when mouse moves away (not "pinnable")
- Performance may vary on low-end devices < 30 FPS

---

### Scenario 15: Breadcrumb Navigation (v0.1.7 - ISS-2)

**Purpose**: Verify breadcrumb navigation displays correctly and enables intuitive navigation between hierarchy levels

**Prerequisites**: Universe data with at least one galaxy containing solar systems and planets

**Context**: v0.1.7 enhanced breadcrumb navigation with improved styling, accessibility, and context awareness after tooltip removal in v0.1.5.

**Steps**:

1. **Universe View - Initial State**
   - Navigate to `http://localhost:3000`
   - Look at the top of the viewport
   - ✅ Expected: Breadcrumb shows "Universe" (or is minimal/hidden)
   - ✅ Expected: No navigation links (already at top level)

2. **Galaxy View - First Level Navigation**
   - Click on any galaxy to enter galaxy view
   - Observe breadcrumb update
   - ✅ Expected: Breadcrumb shows "Universe → [Galaxy Name]"
   - ✅ Expected: "Universe" is a clickable link
   - ✅ Expected: "[Galaxy Name]" is highlighted (current location)
   - ✅ Expected: Arrow separator (→) between levels
   - Hover over "Universe" link
   - ✅ Expected: Hover state visible (color change, underline)

3. **Solar System View - Second Level Navigation**
   - Click on a solar system within the galaxy
   - Observe breadcrumb update
   - ✅ Expected: Breadcrumb shows "Universe → [Galaxy] → [Solar System]"
   - ✅ Expected: "Universe" and "[Galaxy]" are clickable links
   - ✅ Expected: "[Solar System]" is highlighted (current)
   - ✅ Expected: Smooth transition animation during navigation

4. **Planet Surface - Third Level Navigation**
   - Click on a planet to land on its surface
   - Observe breadcrumb update
   - ✅ Expected: Breadcrumb shows "Universe → [Galaxy] → [System] → [Planet]"
   - ✅ Expected: All previous levels are clickable
   - ✅ Expected: "[Planet]" is highlighted

5. **Moon View - Fourth Level (if applicable)**
   - Click on a moon from planet surface
   - Observe breadcrumb update
   - ✅ Expected: Breadcrumb shows full path including moon
   - ✅ Expected: Path may truncate on small screens

**Click Navigation Testing:**

1. From Planet Surface, click "[Galaxy]" in breadcrumb
   - ✅ Expected: Navigate back to galaxy view
   - ✅ Expected: Smooth camera transition
   - ✅ Expected: Breadcrumb updates to "Universe → [Galaxy]"

2. From Solar System View, click "Universe" in breadcrumb
   - ✅ Expected: Navigate to universe view
   - ✅ Expected: Camera zooms out to show all galaxies
   - ✅ Expected: Breadcrumb resets to minimal state

3. Rapid breadcrumb clicks
   - Click "[Galaxy]" then immediately click "Universe"
   - ✅ Expected: Navigation queues properly
   - ✅ Expected: No visual glitches
   - ✅ Expected: Final destination is universe view

**Responsive Design Testing:**

**Desktop (> 1024px):**
1. Full browser window
   - ✅ Expected: Full breadcrumb path visible
   - ✅ Expected: Generous spacing between levels
   - ✅ Expected: Hover effects clear and smooth

**Tablet (768px - 1024px):**
1. Resize browser to 800px wide
   - ✅ Expected: Breadcrumb may truncate long names with ellipsis
   - ✅ Expected: Touch-friendly hit targets (48px minimum)
   - ✅ Expected: All levels still accessible

**Mobile (< 768px):**
1. Resize browser to 375px wide (mobile)
   - ✅ Expected: Breadcrumb shows last 2-3 levels
   - ✅ Expected: Earlier levels indicated with "..."
   - ✅ Expected: Large touch targets (52px minimum)
   - ✅ Expected: Responsive font sizing

**Accessibility Testing:**

1. **Keyboard Navigation**
   - Tab through page elements
   - ✅ Expected: Breadcrumb links receive keyboard focus
   - ✅ Expected: Clear focus indicators (outline, highlight)
   - Press Enter on focused breadcrumb link
   - ✅ Expected: Navigation occurs
   - Press Escape
   - ✅ Expected: Focus returns to safe location

2. **Screen Reader Test**
   - Enable screen reader
   - Navigate to breadcrumb
   - ✅ Expected: Announced as "Breadcrumb navigation"
   - ✅ Expected: Each level announced with context
   - ✅ Expected: Current location indicated as "Current page"
   - Example: "Universe, link. Arrow. Andromeda Galaxy, link. Arrow. Solar System Alpha, current page."

3. **Reduced Motion**
   - Enable "Reduce motion" in OS settings
   - Click breadcrumb links to navigate
   - ✅ Expected: Navigation instant (no camera animation)
   - ✅ Expected: Breadcrumb updates immediately
   - ✅ Expected: Full functionality maintained

**Visual Styling Verification:**

1. **Styling Consistency**
   - Check breadcrumb appearance
   - ✅ Expected: Consistent with app design system
   - ✅ Expected: Semi-transparent dark background (rgba(0,0,0,0.8))
   - ✅ Expected: Blue accent color for links (#4A90E2)
   - ✅ Expected: White text for current location
   - ✅ Expected: Backdrop blur effect for depth

2. **Hover States**
   - Hover over each link
   - ✅ Expected: Color change visible
   - ✅ Expected: Underline appears
   - ✅ Expected: Smooth transition (0.2s)

**Integration with Other Features:**

1. **Transition Messages**
   - Click breadcrumb to navigate
   - ✅ Expected: Transition message appears ("Warping to galaxy...")
   - ✅ Expected: Breadcrumb and message update together
   - ✅ Expected: Both provide consistent context

2. **Back Button**
   - Use back button (if present) instead of breadcrumb
   - Navigate one level back
   - ✅ Expected: Breadcrumb updates correctly
   - ✅ Expected: Behavior consistent with breadcrumb navigation

**Edge Cases:**

**Test: Very long names**
1. Navigate to entity with long name (> 30 characters)
   - ✅ Expected: Text truncates with ellipsis on small screens
   - ✅ Expected: Full name visible on hover (tooltip or title attribute)
   - ✅ Expected: No horizontal scrolling

**Test: Deep hierarchy (5+ levels)**
1. If data supports deep nesting
   - ✅ Expected: Breadcrumb shows last 3 levels with "..." prefix
   - ✅ Expected: Clicking "..." shows dropdown or expands path (if implemented)

**Test: Direct URL navigation**
1. Manually navigate to `/galaxy/[id]` URL
   - ✅ Expected: Breadcrumb reconstructs correct path
   - ✅ Expected: Shows "Universe → [Galaxy Name]"

**Performance:**
1. Rapid navigation through levels
   - ✅ Expected: Breadcrumb updates smoothly
   - ✅ Expected: No lag or delayed rendering
   - ✅ Expected: Consistent 60 FPS

**What This Tests:**
- ✅ Breadcrumb displays correct navigation hierarchy
- ✅ Click navigation works for all levels
- ✅ Visual styling meets design system standards
- ✅ Responsive design adapts to all viewports
- ✅ Accessibility features function correctly
- ✅ Integration with transitions and other features
- ✅ Edge cases handled gracefully

**Known Enhancements (Future):**
- Copy current path to clipboard
- Dropdown history for recent locations
- Search from breadcrumb bar

---

## UI Component Test Scenarios

The following scenarios test the visual and interactive aspects of the admin interface.

### 1. Dashboard and Navigation

**Test:** View dashboard with existing content
- ✅ Expected: See stat cards showing galaxy/system/planet counts
- ✅ Expected: See content cards for each galaxy with hover effects
- ✅ Expected: Each card shows galaxy name, description, and metadata

**Test:** Empty state (if no galaxies exist)
- ✅ Expected: See "No galaxies yet" message
- ✅ Expected: See "+ Create First Galaxy" button
- ✅ Expected: Centered, helpful messaging

### 2. Creating a Galaxy

**Test:** Open galaxy creation modal
1. Click "+ Add New Galaxy" button
- ✅ Expected: Modal opens with full-screen overlay
- ✅ Expected: Modal title shows "Edit: [Galaxy Name]"
- ✅ Expected: Three tabs visible: Basic Info, Solar Systems, Background Stars

**Test:** Fill in galaxy information
1. Fill in Name field
- ✅ Expected: ID field auto-populates with kebab-case version
- ✅ Expected: No red borders if valid
2. Leave Description empty and click Save
- ✅ Expected: Red border appears on Description field
- ✅ Expected: Error message appears below field
- ✅ Expected: Save button may be disabled or shows validation error
3. Fill in all required fields correctly
4. Click "Save Changes"
- ✅ Expected: Modal closes automatically
- ✅ Expected: Green toast notification appears at top
- ✅ Expected: Message: "Galaxy '[Name]' updated successfully. Remember to save your changes!"
- ✅ Expected: New galaxy appears in dashboard card list

### 3. Editing Existing Galaxy

**Test:** Open galaxy editor
1. Click "Edit Galaxy" on any galaxy card
- ✅ Expected: Modal opens with galaxy data pre-filled
- ✅ Expected: Breadcrumb shows "All Galaxies > [Galaxy Name]"

**Test:** Navigate with breadcrumb
1. Click "All Galaxies" in breadcrumb
- ✅ Expected: Modal closes
- ✅ Expected: Return to dashboard view

**Test:** Use Escape key
1. Open galaxy editor
2. Press Escape key
- ✅ Expected: Modal closes
- ✅ Expected: Unsaved changes are discarded

### 4. Adding Solar Systems (Nested Modal)

**Test:** Create solar system within galaxy
1. Open galaxy editor
2. Click "Solar Systems" tab
3. Click "+ Add Solar System"
- ✅ Expected: New modal opens on top of galaxy modal
- ✅ Expected: Solar system editor appears
- ✅ Expected: Breadcrumb shows "Back to Galaxy > [System Name]"
4. Fill in system info and click "Save Changes"
- ✅ Expected: System modal closes automatically
- ✅ Expected: Galaxy modal remains open
- ✅ Expected: New system appears in systems list

### 5. Adding Planets (Double-Nested Modal)

**Test:** Create planet within solar system
1. Open galaxy editor → Solar Systems tab
2. Click "Edit System" on a system
3. In system modal, click "Planets" tab
4. Click "+ Add Planet"
- ✅ Expected: Planet modal opens
- ✅ Expected: Breadcrumb shows navigation path
5. Fill planet info, go to "Content" tab
- ✅ Expected: Side-by-side markdown editor and preview
- ✅ Expected: Character counter updates in real-time
6. Type markdown in editor
- ✅ Expected: Live preview renders markdown immediately
7. Click "Save Changes"
- ✅ Expected: Planet modal closes
- ✅ Expected: System modal still open
- ✅ Expected: Planet appears in planets list

### 6. Saving to Disk

**Test:** Persist changes locally
1. Make several edits (galaxy, system, planet)
2. Scroll to "💾 Save Changes" section
3. Click "💾 Save to Disk"
- ✅ Expected: Button shows "Saving..." with spinner
- ✅ Expected: Button disabled during save
- ✅ Expected: Green notification: "Changes saved successfully!"
- ✅ Expected: Toast auto-closes after 5 seconds

### 7. Committing to GitHub

**Test:** Commit without message
1. Leave "Commit Message" field empty
2. Try to click commit button
- ✅ Expected: Button is disabled
- ✅ Expected: Warning hint appears in yellow

**Test:** Commit with valid message
1. Enter commit message: "Test commit from manual testing"
2. Check "Create Pull Request" checkbox
3. Click "🔀 Create Pull Request"
- ✅ Expected: Button shows "Committing..." with spinner
- ✅ Expected: Green notification appears
- ✅ Expected: Message includes PR URL (if configured)
- ✅ Expected: Toast auto-closes after 5 seconds

### 8. Error Handling - Network Failure

**Test:** Simulate network failure
1. Open browser DevTools → Network tab
2. Set throttling to "Offline"
3. Make an edit and click "💾 Save to Disk"
- ✅ Expected: Red notification appears
- ✅ Expected: Message: "Network error: Unable to connect to the server..."
- ✅ Expected: Retry UI appears with guidance
- ✅ Expected: Modal stays open with edits preserved
4. Turn network back online
5. Click "💾 Save to Disk" again
- ✅ Expected: Save succeeds
- ✅ Expected: Green notification appears

### 9. Error Handling - Validation

**Test:** Submit invalid data
1. Create new galaxy
2. Fill Name: "Test Galaxy"
3. Leave Description empty
4. Leave Theme empty
5. Click "Save Changes"
- ✅ Expected: Red borders on empty required fields
- ✅ Expected: Error messages below each field
- ✅ Expected: Modal stays open
- ✅ Expected: No notification appears
6. Fix all errors
7. Click "Save Changes"
- ✅ Expected: Modal closes
- ✅ Expected: Green notification appears

### 10. Error Handling - Authentication

**Test:** Session timeout (if testable)
1. Wait for session to expire (or manually clear auth)
2. Try to save changes
- ✅ Expected: Red notification: "Unauthorized. Please log in again."
- ✅ Expected: After 2 seconds, redirect to /admin/login
- ✅ Expected: Can log back in and resume work

### 11. Modal Interactions

**Test:** Click backdrop to close
1. Open any modal
2. Click the dark area outside the modal
- ✅ Expected: Modal closes
- ✅ Expected: Return to previous view

**Test:** Multiple modals
1. Open galaxy editor (modal 1)
2. Open solar system editor (modal 2)
3. Close system modal with X button
- ✅ Expected: Only system modal closes
- ✅ Expected: Galaxy modal still visible
4. Close galaxy modal
- ✅ Expected: Return to dashboard

### 12. Content Cards

**Test:** Hover effects
1. Hover over any galaxy card
- ✅ Expected: Card highlights with blue tint
- ✅ Expected: Border changes color
- ✅ Expected: Smooth transition

**Test:** Empty states
1. Create galaxy with no solar systems
2. Open galaxy editor → Solar Systems tab
- ✅ Expected: See "No solar systems in this galaxy yet" message
- ✅ Expected: See helpful subtext
- ✅ Expected: Centered layout

### 13. Responsive Design

**Test:** Mobile view
1. Resize browser to mobile width (< 768px)
- ✅ Expected: Modal takes full screen width
- ✅ Expected: Editor panels stack vertically
- ✅ Expected: Buttons remain accessible
- ✅ Expected: Text remains readable

**Test:** Tablet view
1. Resize browser to tablet width (768px - 1024px)
- ✅ Expected: Modal uses 95% width
- ✅ Expected: Side-by-side editor still works
- ✅ Expected: All features accessible

### 14. Accessibility

**Test:** Keyboard navigation
1. Open modal
2. Press Tab repeatedly
- ✅ Expected: Focus moves through all interactive elements
- ✅ Expected: Focus visible (outline or highlight)
3. Press Escape
- ✅ Expected: Modal closes

**Test:** Screen reader (if available)
1. Enable screen reader
2. Navigate to modal
- ✅ Expected: Modal announced as "dialog"
- ✅ Expected: Title read correctly
- ✅ Expected: Close button has aria-label

### 15. Character Counter

**Test:** Markdown editor counter
1. Open planet editor → Content tab
2. Type in markdown editor
- ✅ Expected: Character counter updates in real-time
- ✅ Expected: Shows total character count
- ✅ Expected: No performance issues with large content

## Common Issues and Solutions

### Issue: Modal doesn't open
- **Check:** Browser console for JavaScript errors
- **Check:** React DevTools to verify state changes
- **Solution:** Refresh page and try again

### Issue: Save button disabled
- **Check:** All required fields filled
- **Check:** No validation errors visible
- **Solution:** Look for red borders and error messages

### Issue: Changes not persisting
- **Check:** "💾 Save to Disk" was clicked after edits
- **Check:** Green success notification appeared
- **Check:** `public/universe/universe.json` file was updated

### Issue: Network errors
- **Check:** Dev server is running (`npm run dev`)
- **Check:** No CORS errors in console
- **Check:** API routes are accessible at `/api/admin/*`

## Verification Checklist

After testing, verify:
- [ ] All modals open and close properly
- [ ] Auto-close works on successful save
- [ ] Notifications display correctly for all scenarios
- [ ] Breadcrumb navigation works at all levels
- [ ] Validation prevents invalid submissions
- [ ] Network errors preserve user edits
- [ ] Auth errors redirect properly
- [ ] Keyboard navigation works (Tab, Escape)
- [ ] Responsive design works on mobile/tablet
- [ ] Character counter updates correctly
- [ ] Content cards display and animate properly
- [ ] Empty states appear when appropriate

## Screenshots to Capture

For documentation purposes, capture:
1. Dashboard with multiple galaxies
2. Empty state (no galaxies)
3. Galaxy editor modal open
4. Nested modal (system editor over galaxy)
5. Markdown editor with live preview
6. Success notification
7. Error notification with validation
8. Network error with retry UI
9. Mobile view of modal
10. Breadcrumb navigation example

## Performance Notes

- Modal animations should be smooth (no jank)
- Character counter should not lag during typing
- Multiple modals should not slow down UI
- Toast notifications should fade in/out smoothly
- Content cards hover effects should be immediate
