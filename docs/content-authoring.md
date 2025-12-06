# Content Authoring Guide

This guide covers how to create and manage markdown content for planets and moons in The Horizon universe explorer.

## Admin Workflow: Save vs Commit

The admin interface uses a two-step workflow to ensure content changes are safe and reviewable. This separation provides better control and reliability for managing universe content.

> **Note**: This workflow was restored and stabilized in v0.1.2 (ISS-4). Previous versions had issues with the disk save operation that prevented proper persistence of universe data. See [docs/roadmap.md](./roadmap.md) for complete fix details and troubleshooting steps.

### Admin Editor Layout

The admin markdown editor has been designed to provide a spacious editing experience:

- **Full-Width Layout**: The editor expands to fill the full width of its container
- **Flexible Height**: The editor adjusts its height dynamically (minimum 600px, maximum based on viewport)
- **Side-by-Side Panels**: On desktop, the markdown editor and preview pane are displayed side by side for easy comparison
- **Responsive Design**: On mobile devices (< 768px width), the panels stack vertically for optimal viewing
- **Scrollable Content**: Long markdown documents scroll within the editor and preview panes, keeping controls accessible

The editor provides a comfortable workspace for creating and editing content while maintaining a clear preview of how the markdown will render.

### Two-Step Workflow Overview

```mermaid
graph LR
    A[Edit Content] --> B[Save to Disk]
    B --> C{Test Locally}
    C -->|Looks Good| D[Commit to GitHub]
    C -->|Need Changes| A
    D --> E{Create PR?}
    E -->|Yes| F[Review & Merge]
    E -->|No| G[Direct Commit]
    F --> H[Changes Live]
    G --> H
```

### Step 1: Save to Disk

When you edit universe content (galaxies, solar systems, planets, or moons), your changes are initially stored only in the browser's memory. To persist these changes:

1. **Make your edits** in the admin interface
2. **Click "Save Changes"** within the specific editor (galaxy, solar system, planet, or moon)
3. **Click "💾 Save to Disk"** in the main admin interface
4. **Verify success**: Look for the green success message "Changes saved to disk successfully"

**What happens**:
- Changes are validated to prevent corrupted data
- Data is written to `public/universe/universe.json` on the server
- A new hash is generated for optimistic locking (prevents concurrent edit conflicts)
- Changes are now persisted locally but **not yet committed to version control**

**API Endpoint**: `PATCH /api/admin/universe`

**Server Logs**:
```
[PATCH /api/admin/universe] Request received - saving to disk
[PATCH /api/admin/universe] Payload parsed - galaxies: 2
[PATCH /api/admin/universe] Validating universe data...
[PATCH /api/admin/universe] Validation passed
[persistUniverseToFile] Persisting to: public/universe/universe.json
[persistUniverseToFile] Success - file persisted
[PATCH /api/admin/universe] Success - new hash: a1b2c3d4...
```

**Manual Verification**:
```bash
# Check that the file was updated
cat public/universe/universe.json | grep "your-change-text"

# Check file modification time
ls -lh public/universe/universe.json
```

### Step 2: Commit to GitHub

After you've saved your changes and verified they work correctly:

1. **Enter a descriptive commit message** explaining your changes
2. **Choose commit type**:
   - ✅ Check "Create Pull Request" (recommended for review)
   - ⬜ Leave unchecked to commit directly to main branch
3. **Click the appropriate button**:
   - "🔀 Create PR" if creating a pull request
   - "✓ Commit to GitHub" if committing directly
4. **Verify success**: Look for success message with optional PR URL

**What happens**:
- System reads the saved file from `public/universe/universe.json`
- Data is validated again before committing
- Content is pushed to GitHub via API
- If PR selected: creates branch, commits file, opens PR
- If direct commit: commits directly to main branch
- Vercel automatically redeploys when PR is merged or commit is pushed

**API Endpoint**: `POST /api/admin/universe`

**Server Logs**:
```
[POST /api/admin/universe] Request received - committing to GitHub
[POST /api/admin/universe] Reading from file: public/universe/universe.json
[POST /api/admin/universe] File read successfully, size: 5578 bytes
[POST /api/admin/universe] Validating persisted data...
[POST /api/admin/universe] Validation passed
[POST /api/admin/universe] Pushing to GitHub...
[POST /api/admin/universe] GitHub push successful: sha: a1b2c3d4, prUrl: https://...
```

**Manual Verification**:
```bash
# Check your GitHub repository
# - Look for new branch (admin-edit-timestamp)
# - Look for new PR or commit
# - Verify changes in public/universe/universe.json
```

### Why Two Steps?

This workflow provides several benefits:

- **Safety**: Validate changes before they reach version control
- **Iteration**: Make multiple edits and save incrementally without cluttering Git history
- **Testing**: Test your changes locally in the running application before committing
- **Review**: Create PRs for team review before merging to main
- **Recovery**: Disk-saved changes persist even if your browser session ends
- **Rollback**: Easy to discard local changes before committing

### Common Scenarios

**Scenario 1: Quick Fix**
```
1. Edit galaxy description
2. Save to disk
3. Verify change in UI
4. Commit directly to main
```

**Scenario 2: Major Content Update**
```
1. Edit multiple galaxies and planets
2. Save to disk after each major edit
3. Test navigation and content display
4. Create PR for team review
5. Address feedback if needed
6. Merge PR when approved
```

**Scenario 3: Experimental Changes**
```
1. Edit content experimentally
2. Save to disk
3. Preview changes locally
4. If not satisfied: refresh page to discard
5. If satisfied: commit to GitHub
```

### Error Handling

The admin interface validates all changes before saving and provides detailed error messages:

#### Validation Errors

If your universe data is invalid (e.g., missing required fields), you'll see clear error messages:

- **Required fields** are marked with an asterisk (*) in the form
- **Inline validation messages** appear below fields that fail validation
- **Fix all validation errors** before the form can be submitted
- **Server-side validation** also runs when saving to catch any issues

**Example Error Messages**:
```
Validation failed: Galaxy name is required, Galaxy description is required
```

**Server Logs**:
```
[PATCH /api/admin/universe] Validation failed: Galaxy[0]: Galaxy name is required
```

#### Disk Write Failures

If the server can't write to disk, you'll receive actionable error messages:

**Common Causes**:
- Insufficient disk space
- File permissions issues
- File system errors

**Error Message Example**:
```
Failed to save universe data to disk
Error: ENOSPC: no space left on device
```

**Server Logs**:
```
[persistUniverseToFile] Error: Error: ENOSPC: no space left on device
```

**Resolution**:
- Check available disk space
- Verify file permissions on `public/universe/` directory
- Check server logs for detailed error information
- Contact system administrator if permissions issue

#### Concurrent Edit Conflicts

If another admin modifies the same data while you're editing, optimistic locking prevents data loss:

**What Happens**:
1. System detects hash mismatch (file changed since you loaded it)
2. Returns 409 Conflict error
3. Your in-memory edits are preserved

**Error Message**:
```
Conflict detected: The file has been modified by another user. Please refresh and try again.
```

**Server Logs**:
```
[PATCH /api/admin/universe] Conflict detected - hash mismatch
```

**Resolution**:
1. Copy your changes to a safe location (if needed)
2. Refresh the page to load the latest version
3. Reapply your changes
4. Save again

**Prevention**: Use Pull Requests for collaborative editing to review changes before merging

#### Authentication Failures

If your session expires or authentication fails:

**Error Message**:
```
Unauthorized
```

**Server Logs**:
```
[PATCH /api/admin/universe] Authentication failed
```

**Resolution**:
1. You'll be automatically redirected to `/admin/login`
2. Log in again with your admin password
3. Your unsaved changes will be lost - the page will reload

**Prevention**: Save frequently to avoid losing work if your session expires

## Adding Galaxies

When creating a new galaxy through the admin interface:

1. **Click "Add Galaxy"** in the Universe Dashboard
2. **Fill in Required Fields** (marked with *):
   - **Name**: Display name for the galaxy (e.g., "Andromeda Galaxy")
   - **Description**: Brief description of the galaxy (required, cannot be empty)
   - **Theme**: Visual theme identifier (e.g., "blue-white", "purple-white")
   - **Particle Color**: Hex color code for particle effects (e.g., "#4A90E2")

3. **Optional Fields**:
   - **ID**: Unique identifier (kebab-case). If left empty, it will be auto-generated from the name
     - Example: "Andromeda Galaxy" → "andromeda-galaxy"
     - Unicode names are normalized: "Café Galaxy" → "cafe-galaxy"

4. **Validation Feedback**:
   - Fields with errors show a red border and error message
   - Fix all errors before clicking "Save Changes"
   - The form prevents submission until all required fields are valid

5. **Save Process**:
   - Click "Save Changes" to save the galaxy to memory
   - Click "💾 Save to Disk" to persist changes locally
   - Click "✓ Commit to GitHub" when ready to publish

### Galaxy Validation Rules

- **Name**: Cannot be empty or whitespace-only
- **Description**: Cannot be empty or whitespace-only
- **Theme**: Cannot be empty or whitespace-only
- **Particle Color**: Cannot be empty; should be a valid hex color code
- **ID Uniqueness**: Galaxy IDs must be unique across all galaxies
- **Duplicate Names**: While duplicate names are allowed, they may cause confusion and are not recommended

### Edge Cases

- **Duplicate galaxy names**: The system will create unique IDs but won't prevent duplicate names. Consider using unique names for clarity.
- **Names with spaces or unicode**: These are handled correctly during ID generation (spaces → hyphens, unicode → normalized ASCII)
- **Empty fields**: Required fields cannot be empty; validation will prevent saving until all fields are filled


## Overview

Planets and moons in The Horizon use **markdown** to render rich, readable content. When users click on a planet, they land on its surface and see a scrollable markdown pane with:

- Headings, paragraphs, and lists
- Inline and fenced code blocks
- Images and links
- Blockquotes and tables (via GitHub-flavored markdown)

## Markdown Capabilities

### Supported Features

The markdown renderer supports:

- **Headings**: `# H1`, `## H2`, `### H3`, etc.
- **Paragraphs**: Regular text with automatic line spacing
- **Lists**: 
  - Unordered lists with `- item` or `* item`
  - Ordered lists with `1. item`
- **Inline Code**: `` `code` ``
- **Fenced Code Blocks**: 
  ```
  ```javascript
  console.log('Hello World');
  ```
  ```
- **Links**: `[text](url)`
- **Images**: `![alt text](url)`
- **Blockquotes**: `> quoted text`
- **Bold**: `**bold text**`
- **Italic**: `*italic text*`
- **Tables**: GitHub-flavored markdown tables
- **Strikethrough**: `~~strikethrough~~`

### Security

All markdown content is **sanitized** before rendering to prevent XSS attacks:
- `<script>` tags are removed
- Event handlers (`onclick`, `onerror`, etc.) are stripped
- Raw HTML is not rendered by default (React Markdown setting)

## Content Structure

### Planet Content

Each planet has a `contentMarkdown` field that should include:

1. **Title** (H1): Planet name
2. **Introduction**: Brief description
3. **Key Features** (H2): Bulleted list of notable characteristics
4. **Additional Sections**: History, geology, atmosphere, etc.

Example:
```markdown
# Earth

**Earth** is the third planet from the Sun and the only astronomical object known to harbor life.

## Key Features

- **Atmosphere**: Rich in nitrogen and oxygen
- **Life**: Diverse biosphere spanning millions of species
- **Climate**: Temperate zones supporting complex ecosystems

## History

Earth formed approximately 4.5 billion years ago...
```

### Moon Content

Moons have similar structure but shorter content:

```markdown
# Luna (The Moon)

**Luna**, commonly known as the Moon, is Earth's only natural satellite.

## Characteristics

- Diameter: 3,474 km
- Distance from Earth: ~384,400 km
- Orbital period: 27.3 days

## Exploration

The Moon was first visited by humans in 1969...
```

## Asset Management

### Images

To include images in markdown:

1. **Local Images**: Place in `public/universe/assets/` directory
   ```markdown
   ![Earth from space](/universe/assets/earth.jpg)
   ```

2. **External Images**: Use absolute URLs
   ```markdown
   ![Hubble image](https://example.com/image.jpg)
   ```

### Best Practices

- Use descriptive alt text for accessibility
- Optimize images (< 500KB recommended)
- Use WebP or modern formats when possible
- Provide fallback text if images fail to load

## Styling Guidelines

### Markdown Styling

The rendered markdown automatically includes:
- Responsive font sizes
- Proper spacing between elements
- Code syntax highlighting
- Link colors matching the theme (#4A90E2)

### Custom Styling

If you need custom styles, you can:
1. Modify `src/styles/planet.css`
2. Add inline styles via HTML (use sparingly)
3. Use CSS classes in the markdown renderer

## Content Guidelines

### Writing Style

- **Concise**: Users view content in a sidebar; keep it scannable
- **Structured**: Use headings to organize information
- **Visual**: Include images and code examples where relevant
- **Accessible**: Provide alt text and descriptive links

### Length Recommendations

- **Planets**: 300-800 words
- **Moons**: 100-300 words
- **Code Examples**: Keep under 20 lines

### Frontmatter (Optional)

While not currently implemented, you can prepare for frontmatter support:

```markdown
---
title: Earth
author: John Doe
date: 2024-12-01
tags: [terrestrial, habitable, third-planet]
---

# Earth

Content here...
```

## Edge Cases

### Missing Content

If a planet lacks `contentMarkdown`:
- A default heading will show using the planet name
- Users will still see the planet's name and summary

### Planets Without Moons

If a planet has no moons:
- The moon navigation UI is automatically hidden
- Users can still navigate back using the breadcrumb or back button

### Long Documents

For very long markdown documents:
- Content remains scrollable
- Performance is maintained via optimized rendering
- Consider breaking into multiple moons for better UX

## Example Data Structure

### In `universe.json`

```json
{
  "id": "earth",
  "name": "Earth",
  "theme": "blue-green",
  "summary": "The third planet from Sol and the only known world to harbor life.",
  "contentMarkdown": "# Earth\n\n**Earth** is the third planet...",
  "moons": [
    {
      "id": "luna",
      "name": "Luna",
      "contentMarkdown": "# Luna\n\n**Luna**, commonly known as the Moon..."
    }
  ]
}
```

## Accessibility Considerations

### Keyboard Navigation

- All buttons and links are keyboard accessible
- Use Tab to navigate, Enter to activate
- Focus states are clearly visible

### Reduced Motion

- Users with `prefers-reduced-motion` enabled see minimal animations
- Camera transitions are still smooth but much faster
- Ensure content is readable without relying on animations

### Screen Readers

- Semantic HTML is used throughout
- Headings follow proper hierarchy (H1 → H2 → H3)
- Images have alt text
- Links have descriptive text

## Testing Your Content

Before committing changes:

1. **Validate JSON**: Ensure `universe.json` is valid
   ```bash
   npm run dev
   # Check browser console for errors
   ```

2. **Check Markdown**: Preview in a markdown editor

3. **Test Accessibility**:
   - Navigate with keyboard only
   - Enable reduced motion in OS settings
   - Test with a screen reader

4. **Verify Images**: Ensure all image paths are correct

## Common Issues

### Images Not Loading

- Check file path (case-sensitive)
- Verify file exists in `public/` directory
- Use absolute paths from root: `/universe/assets/image.jpg`

### Markdown Not Rendering

- Escape special characters if needed
- Check for unmatched code fences
- Validate JSON syntax in `universe.json`

### Styling Issues

- Review `src/styles/planet.css`
- Check for conflicting styles
- Test in multiple browsers

## Additional Resources

- [Markdown Guide](https://www.markdownguide.org/)
- [GitHub Flavored Markdown](https://github.github.com/gfm/)
- [React Markdown Documentation](https://github.com/remarkjs/react-markdown)
- [Universe Schema Documentation](./universe-schema.md)

## Welcome Message Customization

The Horizon welcome message appears on the universe landing page when users first visit. This provides branding and navigation guidance.

### Location

The welcome message is rendered by the `WelcomeMessage` component in `src/components/WelcomeMessage.tsx` and is displayed on the main universe landing page (`src/app/page.tsx`). It appears at the top center of the screen when users first load the application.

### Customizing Content

To change the welcome message text, edit `src/components/WelcomeMessage.tsx`:

```typescript
<h2>Welcome to the Horizon</h2>
<p>Click a galaxy to explore</p>
```

### Styling

The welcome message uses responsive typography with `clamp()` for fluid scaling:
- Heading: `clamp(1.5rem, 4vw, 2.5rem)` - scales from 1.5rem to 2.5rem
- Body: `clamp(0.8rem, 1.8vw, 1rem)` - scales from 0.8rem to 1rem

The message is positioned at the top center of the screen:
- Position: `absolute` with `top: 2rem` and `left: 50%`
- Transform: `translateX(-50%)` for centering
- Padding: `1rem 2rem` for compact appearance

To adjust styling:
```typescript
// Change colors
color: '#4A90E2',  // Heading color
color: '#CCCCCC',  // Body text

// Adjust sizing
maxWidth: '90%',   // Maximum width (responsive)
width: 'auto',     // Auto width for compact display
padding: '1rem 2rem', // Compact spacing
```

Responsive adjustments are defined in `src/app/globals.css`:
```css
@media (max-width: 768px) {
  .welcome-message {
    padding: 0.75rem 1.5rem !important;
    top: 1rem !important;
  }
}

@media (max-width: 480px) {
  .welcome-message {
    padding: 0.5rem 1rem !important;
    top: 0.5rem !important;
    max-width: 95% !important;
  }
}
```

### Localization

To support multiple languages, you can:

1. **Add language prop**:
```typescript
interface WelcomeMessageProps {
  locale?: string;
}
```

2. **Create translation map**:
```typescript
const translations = {
  en: {
    title: 'Welcome to the Horizon',
    instruction: 'Click a galaxy to explore'
  },
  es: {
    title: 'Bienvenido al Horizonte',
    instruction: 'Haz clic en una galaxia para explorar'
  }
};
```

3. **Use translations**:
```typescript
const t = translations[locale || 'en'];
<h2>{t.title}</h2>
```

### Accessibility

The welcome message includes:
- `role="complementary"` - identifies as supporting content
- `aria-label="Welcome message"` - screen reader label
- `pointerEvents: 'none'` - doesn't block interaction with the scene
- Responsive text sizing for readability on all devices

### Display Behavior

The message appears:
- On the universe landing page when the app first loads
- At the top center, providing context without obscuring the 3D scene
- With compact styling to minimize visual footprint
- Only on the main landing page, not on galaxy detail views

This ensures the welcome message provides context for first-time visitors without being intrusive during exploration.

## Contributing

When adding new content:

1. Follow the existing style and structure
2. Test thoroughly before committing
3. Update this guide if adding new features
4. Consider accessibility in all changes

## Hover Labels and Tooltips

The Horizon uses a standardized hover label system for all interactive celestial objects. When users hover over galaxies, stars, planets, or moons, consistent tooltips appear above the objects.

### For Content Authors

As a content author, you generally don't need to configure tooltips directly - they are automatically applied to all celestial objects. However, understanding the system helps when:

- **Creating new object types**: Follow the patterns in existing components
- **Debugging display issues**: Tooltips use object names from `universe.json`
- **Requesting features**: Understand what's configurable vs. fixed

### Tooltip Behavior

**What appears in tooltips:**
- **Galaxies**: Name + number of solar systems
- **Stars**: Solar system name
- **Planets**: Planet name + number of moons (if any)
- **Moons**: Moon name

**How they appear:**
- Positioned 40 pixels above the object
- Consistent font size (1rem/16px) for readability
- White text on dark background (21:1 contrast ratio)
- Blue border for objects, gold border for stars

### Best Practices for Object Names

Since object names appear in tooltips, follow these guidelines:

1. **Keep names concise**: Tooltips have a 300px max width, but shorter is better
2. **Use proper capitalization**: "Andromeda Galaxy" not "andromeda galaxy"
3. **Avoid special characters**: Stick to alphanumeric and basic punctuation
4. **Be descriptive but brief**: "HD 189733 b" is better than "The Hot Jupiter Orbiting HD 189733"

**Example good names:**
- "Milky Way"
- "Alpha Centauri"
- "Earth"
- "Europa"

**Example names to avoid:**
- "The Really Amazing Super Duper Galaxy That Has Lots Of Stars" (too long)
- "galaxy-001" (not descriptive)
- "M@rx Pl@n3t" (special characters)

### Technical Details

For developers implementing new object types, tooltips are standardized via:

```typescript
import SceneTooltip from '@/components/SceneTooltip';
import { TOOLTIP_POSITIONING } from '@/lib/tooltip-constants';

<SceneTooltip
  visible={isHovered}
  worldPosition={objectPosition}
  distanceFactor={TOOLTIP_POSITIONING.DISTANCE_FACTOR_MEDIUM}
  content={object.name}
/>
```

See [visuals.md](./visuals.md#standardized-hover-label-system) for complete technical documentation.

---

**Need Help?** Open an issue on GitHub or check the main [README](../README.md) for contact information.
