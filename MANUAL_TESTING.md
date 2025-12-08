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

**Purpose**: Validate the GitHub integration workflow

**Prerequisites**: 
- GitHub credentials configured in `.env.local`
- Valid `GITHUB_TOKEN` with `repo` scope

**Steps**:
1. Make some edits (follow Scenario 1 or 2)
2. Click "💾 Save to Disk" and verify success
3. Scroll to "🔀 Commit to GitHub" section
4. Enter commit message: "Test: Admin workflow validation"
5. Check "Create Pull Request" checkbox
   - ✅ Expected: Checkbox is checked
6. Click "🔀 Create Pull Request"
   - ✅ Expected: Button shows "Committing..." with spinner
   - ✅ Expected: Green notification with PR URL
   - ✅ Expected: Message: "Pull request created successfully! PR: [URL]"
7. Click the PR URL in the notification
   - ✅ Expected: Opens GitHub PR page in new tab
   - ✅ Expected: PR shows the universe.json file changes
   - ✅ Expected: Commit message matches what you entered

**Server Log Verification**:
```
[POST /api/admin/universe] Request received - committing to GitHub
[POST /api/admin/universe] Reading from file: public/universe/universe.json
[POST /api/admin/universe] Validation passed
[POST /api/admin/universe] Pushing to GitHub...
[POST /api/admin/universe] GitHub push successful: sha: ..., prUrl: https://...
```

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

**Purpose**: Verify optimistic locking prevents data corruption

**Prerequisites**: Two browser windows or tabs

**Steps**:
1. Open admin in two browser tabs (Tab A and Tab B)
2. In Tab A: Edit a galaxy and save to disk
   - ✅ Expected: Save succeeds
3. In Tab B: Edit the SAME galaxy (don't refresh first)
4. In Tab B: Try to save to disk
   - ✅ Expected: Error notification: "Conflict detected: The file has been modified..."
   - ✅ Expected: Your edits preserved in Tab B
5. In Tab B: Refresh the page
6. In Tab B: Re-apply your changes and save
   - ✅ Expected: Save succeeds now

**Server Logs**:
```
[PATCH /api/admin/universe] Conflict detected - hash mismatch
```

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
