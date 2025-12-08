# Visual Scene Controls and Animation Tuning

This document describes the 3D scene controls, camera animations, and performance optimizations in The Horizon application.

## Planet Surface Layout

### Overview - Blog-Quality Reading Experience

Planet detail pages have been redesigned to deliver a premium blog-quality reading experience. The layout clearly separates the 3D visualization from the content, eliminating overlap and providing a polished, professional presentation suitable for long-form content.

**Key Improvements in Latest Version:**
- Rich metadata display (published date, author, tags)
- Featured image support for visual impact
- External links section for related resources
- Enhanced typography with blog-optimized font sizes and line heights
- Production-ready CSS with design system variables
- Improved spacing and visual hierarchy
- Better mobile experience with natural page scrolling

> **Note**: This layout was initially aligned in v0.1.2 (ISS-5) and significantly enhanced with blog-quality features in the current release. The redesign prioritizes content readability while maintaining the immersive 3D visualization. See [docs/roadmap.md](./roadmap.md) for version history.

### Layout Structure

The planet surface view consists of two main areas with clear visual separation:

```
┌────────────────────────────────────────────────────────┐
│  ┌──────────┐  ┌─────────────────────────────────────┐ │
│  │          │  │ TITLE                                │ │
│  │  Planet  │  │ Subtitle                             │ │
│  │   3D     │  │ 📅 Date  👤 Author  🏷️ Tags          │ │
│  │  Visual  │  │ ────────────────────────────────────│ │
│  │          │  │ [Featured Image]                     │ │
│  │          │  │                                      │ │
│  │ [label]  │  │ Markdown content with blog-optimized │ │
│  │          │  │ typography, headings, images, lists  │ │
│  │          │  │ ...                                  │ │
│  │          │  │                                      │ │
│  │          │  │ Related Resources:                   │ │
│  │          │  │ → External Link 1                    │ │
│  │          │  │ → External Link 2                    │ │
│  │          │  │                                      │ │
│  │          │  │ Moons: [Moon 1] [Moon 2]             │ │
│  └──────────┘  └─────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
   30% width             70% width
   (max 400px)          (max 800px)
```

#### Left Column - 3D Planet Visualization
- **Width**: 30% of viewport, max 400px, min 280px
- **Content**: Interactive 3D planet with rotating visualization
- **Planet Size**: Radius 1.5 units for proportional display
- **Position**: Positioned at (-3, 0, 0) in absolute world coordinates
- **Camera Setup**: Positioned to frame the planet on the left side
  - Camera position: 2 units right, 8 units in front of the planet
  - Look-at point: 1 unit right of planet center
  - Ensures planet is visible on the left with content on the right
- **Label**: Planet name displayed below visualization with backdrop blur effect
- **Styling**: Semi-transparent dark background with blue border
- **Visual Role**: Provides context and immersion without interfering with reading

#### Right Column - Blog-Quality Content Area  
- **Width**: 70% of viewport, max 800px
- **Background**: Nearly opaque black (rgba(0, 0, 0, 0.9)) with rounded corners
- **Shadow**: Elevated card effect with 8px shadow
- **Padding**: 3rem (48px) for generous whitespace
- **Scrolling**: Smooth vertical scroll with custom styled scrollbar

**Content Sections (in order):**

1. **Header Section**:
   - **Title**: 2.75rem (44px) on desktop, bold weight (700)
   - **Subtitle**: 1.25rem (20px), secondary gray color
   - **Metadata Row**: Date, author, and tags with icons
   - **Bottom border**: 2px separator for clear section break

2. **Featured Image** (if present):
   - Full-width responsive image
   - Rounded corners with shadow
   - Automatically hidden if not provided

3. **Markdown Body**:
   - **Base font size**: 1.125rem (18px) for comfortable reading
   - **Opening paragraph**: 1.25rem (20px) for emphasis
   - **Line height**: 1.75 for optimal readability
   - **Max line length**: 70 characters to prevent eye strain
   - **Headings**: H2 with underlines, H3-H4 for subsections
   - **Code blocks**: Dark background with syntax highlighting
   - **Blockquotes**: Blue left border with light background tint
   - **Lists**: Blue bullet markers with generous spacing
   - **Images**: Responsive with shadows and rounded corners
   - **Links**: Blue with underline offset, hover transitions

4. **External Links Section** (if present):
   - **Title**: "Related Resources" with 1.375rem heading
   - **Link Cards**: Hover effect with transform and color change
   - **Icons**: External link icon on the right
   - **Layout**: Vertical stack for easy scanning

5. **Moon Navigation** (if viewing planet):
   - **Title**: "Moons" section heading
   - **Buttons**: Vertical list of moon buttons with hover effects
   - **Styling**: Semi-transparent with blue border on hover
   - **Touch targets**: 44px minimum (WCAG AA compliant)

6. **Back Button** (if viewing moon):
   - Blue primary color with white text
   - Centered with arrow icon
   - Hover effect: lift and shadow

### Responsive Behavior

The layout adapts elegantly to different screen sizes while maintaining the blog-quality reading experience:

#### Desktop (> 1024px)
- **Layout**: Two-column with 30/70 width split
- **Planet visual**: 30% width, max 400px, min 280px
- **Content**: 70% width, max 800px
- **Gap**: 2rem (32px) between columns
- **Padding**: 2rem (32px) around container
- **Typography**: Full size (title 2.75rem, body 1.125rem)
- **External links**: Horizontal layout with full descriptions

#### Tablet (≤ 1024px)
- **Layout**: Two-column with 35/65 width split
- **Planet visual**: 35% width for better visibility
- **Content**: max-width 650px
- **Gap**: 1.5rem (24px)
- **Padding**: 1.5rem (24px)
- **Typography**: Slightly reduced (title 2.25rem)
- **Touch targets**: 48px minimum for better tap accuracy

#### Mobile (≤ 768px)
- **Layout**: **Single column** (stacked vertically)
- **Planet visual**: On top, min-height 200px, order: 1
- **Content**: Below, full width, order: 2
- **Gap**: 1rem (16px)
- **Padding**: 1rem (16px)
- **Scrolling**: Natural page scroll (no nested scrollbars)
- **Typography**: Responsive (title 1.875rem, body 1rem)
- **External links**: Vertical stack, descriptions below titles
- **Metadata**: Vertical layout for better spacing

#### Small Mobile (≤ 480px)
- **Padding**: Reduced to 0.75rem (12px) around container
- **Content padding**: 1rem (16px)
- **Typography**: Further reduced (title 1.625rem)
- **Touch targets**: 52px minimum for thumb-friendly interaction
- **Metadata**: Fully vertical with increased gap
- **External links**: Compact padding

#### Key Responsive Features

**Progressive Enhancement:**
- Desktop users get the full two-column experience
- Tablet users see slightly larger planet for better visibility
- Mobile users get optimized single-column for vertical scrolling
- Small mobile gets maximum space efficiency

**Typography Scaling:**
- Uses `clamp()` for fluid typography
- Title: `clamp(1.35rem, 3.5vw, 2.75rem)` - scales smoothly
- Body: Fixed at comfortable sizes per breakpoint
- Opening paragraph always larger for visual hierarchy

**Touch-Friendly:**
- All buttons meet WCAG 2.1 Level AA touch target sizes
- Hover effects replaced with tap feedback on mobile
- Adequate spacing between interactive elements
- No accidental taps due to small targets

**Scroll Behavior:**
- Desktop: Content column scrolls independently
- Mobile: Page scrolls naturally (prevents nested scrollbars)
- Smooth scrolling enabled for better UX
- Scroll position preserved when navigating moons

### Accessibility Features

The blog-quality layout maintains rigorous accessibility standards:

#### Touch Targets (WCAG 2.1 Level AA)
All interactive elements meet or exceed minimum touch target sizes:
- **Desktop**: 44px minimum height
- **Tablet**: 48px minimum height  
- **Mobile**: 52px minimum height
- **Buttons**: Padding ensures comfortable interaction
- **Links**: Adequate spacing prevents accidental clicks

#### Color Contrast (WCAG 2.1 Level AAA)
The design supports both color schemes with exceptional contrast:

**Dark Mode (default)**:
- Content background: rgba(0, 0, 0, 0.9) - nearly opaque black
- Primary text: #FFFFFF (white) - 21:1 contrast ratio
- Secondary text: #AAAAAA (light gray) - 11.7:1 contrast ratio
- Muted text: #888888 (gray) - 7.4:1 contrast ratio
- Blue accent: #4A90E2 - 4.58:1 on black background
- **Result**: Exceeds WCAG AAA requirements

**Light Mode** (via `prefers-color-scheme: light`):
- Content background: rgba(255, 255, 255, 0.95) - nearly opaque white
- Primary text: #000000 (black) - 21:1 contrast ratio
- Blue accent: #2C5AA0 (darker) - better contrast on white
- All elements maintain AAA compliance in light mode

#### Keyboard Navigation
- **Tab order**: Logical flow from title → content → metadata → external links → moons
- **Focus indicators**: 3px solid blue outline with 2px offset
- **Skip links**: Implicit through semantic HTML structure
- **Button activation**: Enter and Space keys work correctly
- **Link interaction**: Standard browser keyboard shortcuts supported

#### Screen Reader Support
- **Semantic HTML**: Proper heading hierarchy (H1 → H2 → H3)
- **ARIA labels**: Metadata icons have descriptive labels
- **Alt text**: All images require descriptive alt attributes
- **Link context**: External link descriptions provide context
- **List semantics**: Moon navigation uses proper list structure

#### Reduced Motion
Respects `prefers-reduced-motion` setting across the board:
- All animations set to 0.01ms duration
- Transforms and transitions disabled
- Hover effects still work (color/opacity changes)
- Full functionality maintained without motion
- No parallax or auto-scrolling effects

#### Font and Text
- **Readable sizes**: 18px base font exceeds 16px minimum
- **Line height**: 1.75 for body text (optimal for extended reading)
- **Line length**: Max 70 characters per line prevents eye strain
- **Font stack**: System fonts for best rendering across platforms
- **Letter spacing**: Negative for headings, neutral for body
- **Responsive text**: Scales appropriately on all devices

### Edge Cases

The redesigned layout handles various edge cases gracefully:

#### Camera Positioning Across Viewports
The camera positioning system ensures the planet remains visible:
- **Desktop**: Planet at (-3, 0, 0), camera at (planetPos.x + 2, planetPos.y, planetPos.z + 8)
- **Tablet/Mobile**: Same 3D positioning, CSS handles responsive layout
- **High-DPI displays**: Resolution-independent positioning scales correctly
- **Zoom levels**: Planet remains framed due to relative positioning

#### Missing Metadata
All metadata fields are optional and handled gracefully:
- **No publishedDate**: Date row doesn't render, no gap
- **No author**: Author section omitted, layout adjusts
- **No tags**: Tag section hidden, no empty space
- **No featuredImage**: Header flows directly to content
- **No externalLinks**: Related Resources section doesn't render
- **Partial metadata**: Only provided fields display

#### Planets Without Markdown
When a planet lacks `contentMarkdown`:
- Fallback message: "# [Planet Name]\n\nNo content available."
- Layout remains consistent and professional
- Metadata still displays if present
- Moon navigation still available
- No broken or empty sections

#### Featured Image Edge Cases
- **Invalid URL**: Image fails gracefully (browser broken image)
- **Slow loading**: Space reserved, content doesn't jump
- **Missing file**: No visual gap, content flows naturally
- **Very tall images**: Respects max-width, maintains aspect ratio
- **No image**: Section doesn't render, no empty space

#### External Links Edge Cases
- **No links**: Related Resources section hidden
- **Many links (8+)**: Still displays, but recommended limit is 5
- **Long titles**: Wrap naturally within link cards
- **Long descriptions**: Wrap to multiple lines on mobile
- **Invalid URLs**: Browser handles (will show error on click)

#### Extremely Long Content
For very long markdown documents (1500+ words):
- Content scrolls smoothly within column
- Performance maintained via optimized React rendering
- Scroll position preserved when navigating to/from moons
- Custom scrollbar prevents native browser bars
- Consider breaking 3000+ word content into multiple planets

#### Long Titles and Headings
Long titles wrap naturally without breaking layout:
- `word-wrap: break-word` prevents overflow
- `overflow-wrap: break-word` handles long words
- Responsive font sizing prevents tiny text on mobile
- No horizontal scrollbars appear
- Title hierarchy maintained

#### No Moons
When a planet has no moons or `moons: []`:
- Moon navigation section completely hidden
- No "No moons available" message
- Content area remains properly sized
- Layout balanced without empty footer section
- Users navigate back via breadcrumb or back button

#### Moon-Specific Content
When viewing a moon from a planet:
- Moon's `contentMarkdown` displays
- Planet's metadata inherited (author, external links)
- Moon can have own `publishedDate`, `tags`, `featuredImage`
- Back button displays: "← Back to [Planet Name]"
- Breadcrumb updates to show moon in hierarchy

#### Mobile Portrait vs Landscape
- **Portrait**: Single column, optimal for scrolling
- **Landscape**: Still single column for consistency
- **Large landscape tablets**: May show two columns (> 1024px width)
- **Rotation**: Layout adapts instantly without page reload

#### SSR/Hydration
Server-rendered markup matches client layout perfectly:
- Camera position set during client-side useEffect
- No layout shift or content jump on hydration
- Transition state properly initialized
- Content overlay renders consistently
- Metadata displays immediately (no flash of missing content)

### Customization

#### Adjusting Column Widths

Edit `src/styles/planet.css`:

```css
/* Wider planet visual */
.planet-visual-column {
  flex: 0 0 35%;  /* Instead of 30% */
  max-width: 450px;  /* Instead of 400px */
}

/* Narrower content */
.planet-content-column {
  max-width: 700px;  /* Instead of 800px */
}
```

#### Changing Planet Position

The planet is positioned using the `PLANET_SURFACE_POSITION` constant (default: `(-3, 0, 0)`) in absolute world coordinates, which places it on the left side of the view. The camera is positioned to frame the planet properly using `PLANET_CAMERA_OFFSET` and `PLANET_CAMERA_LOOKAT_OFFSET`.

Edit `src/components/UniverseScene.tsx` to adjust planet position:

```typescript
// At the top of the file, update the constants:

// Further left
const PLANET_SURFACE_POSITION = new THREE.Vector3(-4, 0, 0);

// More centered
const PLANET_SURFACE_POSITION = new THREE.Vector3(-2, 0, 0);

// Right side
const PLANET_SURFACE_POSITION = new THREE.Vector3(3, 0, 0);
```

**Camera Offset Configuration:**

```typescript
// Camera position relative to planet (all as THREE.Vector3)
const PLANET_CAMERA_OFFSET = new THREE.Vector3(2, 0, 8);

// Look-at point relative to planet
const PLANET_CAMERA_LOOKAT_OFFSET = new THREE.Vector3(1, 0, 0);
```

The camera is positioned:
- `PLANET_CAMERA_OFFSET.x` (2) units to the right of the planet
- `PLANET_CAMERA_OFFSET.z` (8) units in front of the planet
- Looking at a point `PLANET_CAMERA_LOOKAT_OFFSET.x` (1) unit to the right of the planet center

This ensures the planet appears on the left side of the screen with the content overlay on the right.

#### Modifying Planet Size

Edit `src/components/PlanetSurface.tsx`:

```typescript
// Larger planet
<sphereGeometry args={[2, 32, 32]} />  // Instead of 1.5

// Smaller planet
<sphereGeometry args={[1, 32, 32]} />
```

#### Adjusting Content Width

Edit `src/styles/planet.css`:

```css
/* Wider content for more generous reading */
.planet-content-column {
  max-width: 900px;  /* Instead of 800px */
}

/* Narrower for tighter focus */
.planet-content-column {
  max-width: 650px;
}
```

### Performance Considerations

The planet surface layout is optimized for performance:

#### Minimal Re-renders
- Content only updates when planet/moon changes
- 3D scene uses memoized components
- CSS transitions use GPU acceleration

#### Efficient Scrolling
- Content body uses native scrolling
- Smooth scrolling via CSS
- No JavaScript scroll handlers

#### Mobile Optimization
- Single column reduces complexity
- Smaller planet radius (fewer polygons)
- Conditional rendering based on viewport

### Testing Guidelines

When testing planet page layout:

1. **Desktop**: Verify two-column layout with proper spacing
2. **Tablet**: Check 35/65 split and touch targets
3. **Mobile**: Confirm single column stacking
4. **Long content**: Test scrolling in content body
5. **No markdown**: Verify fallback message displays
6. **Dark/light mode**: Check contrast in both schemes
7. **Keyboard**: Tab through all interactive elements
8. **Screen reader**: Verify logical reading order

### Content Authoring Guidelines

When creating planet content:

#### Optimal Content Length
- **Minimum**: 200-300 words for meaningful content
- **Optimal**: 500-800 words for engaging narratives
- **Maximum**: No strict limit, content scrolls

#### Formatting Best Practices
- Use headings (##, ###) to break up sections
- Keep paragraphs to 3-4 sentences
- Use lists for key features or facts
- Include images with descriptive alt text
- Avoid extremely wide tables (800px max)

#### Line Length Considerations
The 800px max-width ensures optimal line length:
- At 16px font: ~80-90 characters per line
- Meets readability guidelines (45-75 characters)
- Comfortable reading without head movement

## Galaxy Scale Configuration

### Overview

The Horizon implements automatic galaxy scaling that adapts to the total number of galaxies in the universe. This ensures sparse universes feel immersive with large, detailed galaxies, while crowded universes remain readable with appropriately sized representations.

### Dynamic Scaling Behavior

The galaxy rendering system automatically adjusts galaxy sizes based on total count:

- **Sparse (1-2 galaxies)**: Galaxies render at maximum size (radius 15 units) to fill the canvas and provide an immersive experience
- **Moderate (3-25 galaxies)**: Sizes interpolate smoothly using logarithmic scaling to prevent jarring transitions
- **Crowded (50+ galaxies)**: Galaxies render at minimum size (radius 4 units) to maintain clickability and prevent visual clutter

### Galaxy Scale Constants

Located in `GALAXY_SCALE` in `src/lib/universe/scale-constants.ts`:

```typescript
GALAXY_SCALE = {
  MIN_RADIUS: 6,              // Minimum galaxy radius (50+ galaxies) - increased for better visibility
  MAX_RADIUS: 22,             // Maximum galaxy radius (1-2 galaxies) - increased for improved focus
  BASE_RADIUS: 12,            // Reference size for default case - adjusted proportionally
  MIN_SIZE_THRESHOLD: 50,     // Count at which MIN_RADIUS applies
  MAX_SIZE_THRESHOLD: 2,      // Count at which MAX_RADIUS applies
  SMOOTHING_FACTOR: 0.8,      // Controls transition smoothness (0-1)
  RADIUS_RATIO: 0.2,          // minRadius = maxRadius * RADIUS_RATIO (20%)
}
```

**Recent Changes (Galaxy Scale Adjustment):**
- `MIN_RADIUS` increased from 4 to 6 units (+50%) for better visibility in crowded universes
- `MAX_RADIUS` increased from 15 to 22 units (+47%) for improved focus and screen presence
- `BASE_RADIUS` increased from 8 to 12 units (+50%) to maintain proportional balance
- Grid spacing increased from 30 to 50 units to prevent overlap with larger galaxies
- Camera positions adjusted to accommodate larger scale:
  - Universe view: position (0, 50, 100) → (0, 60, 130)
  - Galaxy view: position (0, 20, 40) → (0, 25, 50)
  - Galaxy focus uses: `calculateFocusPosition(galaxyPos, distance=35, angle=40°)`
- OrbitControls ranges updated: minDistance 20 → 30, maxDistance 200 → 250
- Added runtime validation in development mode to warn if grid spacing is insufficient

**Performance Note**: Larger galaxies use the same particle count but occupy more screen space. Initial estimates suggest ~5-10% increase in GPU time from increased screen coverage. Target frame rates: 60 FPS desktop, 30 FPS mobile. Monitor frame rates on lower-end devices if increasing beyond these values.

**Why These Values:**

- `MIN_RADIUS` of 6 units ensures galaxies remain highly visible and clickable even in very crowded universes (approximately 300-350px diameter at default zoom, well exceeding WCAG touch target requirements)
- `MAX_RADIUS` of 22 units provides dramatic visual presence for sparse universes, allowing users to appreciate detail without overwhelming the canvas
- `BASE_RADIUS` of 12 units serves as a balanced middle ground for reference scenarios
- `SMOOTHING_FACTOR` of 0.8 reduces sudden size changes when galaxies are added or removed (lower values = smoother transitions)
- `RADIUS_RATIO` of 0.2 maintains proper particle distribution in spiral galaxies (minRadius is always 20% of maxRadius)
- Thresholds at 2 and 50 galaxies define clear boundaries for maximum and minimum sizes

**Configuration Tuning Guide:**

To further adjust galaxy scale for your needs:

1. **Increase overall size**: Raise `MIN_RADIUS` and `MAX_RADIUS` proportionally
   ```typescript
   MIN_RADIUS: 8,    // +33% from current
   MAX_RADIUS: 28,   // +27% from current
   ```
   **Important**: Update grid spacing to > 2× `MAX_RADIUS` to prevent overlap

2. **Make transitions smoother**: Increase `SMOOTHING_FACTOR`
   ```typescript
   SMOOTHING_FACTOR: 0.9,  // Slower, more gradual changes
   ```

3. **Adjust size thresholds**: Change when min/max sizes apply
   ```typescript
   MAX_SIZE_THRESHOLD: 3,   // Max size for up to 3 galaxies
   MIN_SIZE_THRESHOLD: 40,  // Min size starts at 40 galaxies
   ```

4. **Update supporting configuration**: When changing `MAX_RADIUS`, adjust:
   - Grid spacing in `UniverseScene.tsx`: Set to at least `2 × MAX_RADIUS + 6`
   - Camera positions in `camera.ts`: Increase universe view Z by `(newMax - 22) × 5`
   - OrbitControls max distance: Increase proportionally to maintain zoom range
   - Runtime validation will warn in development if spacing becomes insufficient

### Galaxy Size Calculation

The `calculateGalaxyScale()` function computes galaxy radius based on total count:

```typescript
function calculateGalaxyScale(galaxyCount: number): { 
  minRadius: number; 
  maxRadius: number;
}
```

**Algorithm:**

1. **Edge cases**: Zero galaxies return base size; counts ≤2 return maximum size
2. **Logarithmic interpolation**: Uses natural logarithm to smooth transitions
3. **Smoothing application**: Applies power function to reduce jarring changes
4. **Ratio maintenance**: minRadius is always `RADIUS_RATIO` (20%) of maxRadius for proper particle distribution

**Examples:**

```typescript
calculateGalaxyScale(1)   // { minRadius: 4.4, maxRadius: 22.0 }
calculateGalaxyScale(5)   // { minRadius: 3.2, maxRadius: 16.1 }
calculateGalaxyScale(10)  // { minRadius: 2.5, maxRadius: 12.7 }
calculateGalaxyScale(50)  // { minRadius: 1.2, maxRadius: 6.0 }
calculateGalaxyScale(100) // { minRadius: 1.2, maxRadius: 6.0 }
```

### Manual Size Overrides

Featured galaxies can have fixed sizes independent of the global count-based scaling:

```typescript
// In Galaxy type definition
interface Galaxy {
  // ...other fields
  manualRadius?: number;  // Optional fixed radius override
}
```

**Usage:**

```typescript
const galaxy = {
  id: 'featured-galaxy',
  name: 'Andromeda',
  manualRadius: 12,  // Always renders at radius 12, regardless of count
  // ...other fields
};
```

The `calculateGalaxyScaleWithOverride()` function handles this:

```typescript
calculateGalaxyScaleWithOverride(galaxyCount: 50, manualRadius: 12)
// Returns: { minRadius: 2.4, maxRadius: 12 }
// Ignores galaxyCount when manualRadius is set
```

**When to use manual overrides:**

- Featured or "hero" galaxies that should always be prominent
- Tutorial galaxies that need consistent sizing across play sessions
- Galaxies with special significance in the narrative
- Testing and debugging scenarios

### Smoothing and Transitions

The scaling system prevents jarring visual changes through several mechanisms:

#### Logarithmic Scaling

Instead of linear interpolation, the system uses natural logarithm:

```typescript
const logCount = Math.log(galaxyCount);
const t = (logCount - logMin) / (logMax - logMin);
```

This means:
- Adding galaxy #6 to a 5-galaxy universe: ~10% size change
- Adding galaxy #51 to a 50-galaxy universe: ~1% size change

#### Power Smoothing

The interpolation factor is raised to the smoothing power:

```typescript
const smoothT = Math.pow(t, SMOOTHING_FACTOR);
```

With `SMOOTHING_FACTOR = 0.8`:
- Changes are more gradual across the middle range
- Size transitions feel natural and predictable
- Avoids sudden "jumps" when galaxies are added/removed

#### Testing Transitions

To verify smooth scaling, test consecutive counts:

```bash
# Run in browser console
for (let i = 1; i <= 20; i++) {
  const scale = calculateGalaxyScale(i);
  console.log(`${i} galaxies: ${scale.maxRadius.toFixed(2)} units`);
}
```

Expected output shows gradual decrease:
```
1 galaxies: 22.00 units
2 galaxies: 22.00 units
3 galaxies: 18.92 units
4 galaxies: 17.27 units
5 galaxies: 16.07 units
6 galaxies: 15.16 units
...
```

### Performance Considerations

The dynamic scaling system is designed for performance:

#### Calculation Efficiency

- **Memoization**: Galaxy scale is calculated once per render when count changes
- **O(1) complexity**: Logarithm and power operations are constant time
- **No re-renders**: Scale changes don't trigger particle regeneration (handled in useMemo)

```typescript
// In GalaxyParticles component
const galaxyScale = useMemo(() => {
  return calculateGalaxyScaleWithOverride(galaxyCount, galaxy.manualRadius);
}, [galaxyCount, galaxy.manualRadius]);
```

#### Frame Rate Targets

With dynamic scaling, the system maintains:

- **Desktop**: 60 FPS with 20+ galaxies
- **Mobile**: 30+ FPS with 10+ galaxies
- **Low-end**: 30 FPS minimum with adaptive particle counts

#### Memory Usage

Galaxy scaling doesn't increase memory footprint:
- Particle buffers are pre-allocated based on solar system count
- Position calculations use the same Float32Array regardless of scale
- No additional textures or geometries are created

### Customization Guide

#### Adjusting Size Range

To make galaxies generally larger or smaller:

```typescript
// Larger galaxies across all counts (example values)
GALAXY_SCALE = {
  MIN_RADIUS: 8,    // Instead of 6
  MAX_RADIUS: 28,   // Instead of 22
  // ...
}
```

**Note**: When increasing `MAX_RADIUS`, also update:
- Grid spacing in `UniverseScene.tsx` (must be > 2× `MAX_RADIUS`)
- Camera default position Z-coordinate (increase proportionally)
- OrbitControls `maxDistance` to allow adequate zoom-out

#### Changing Transition Speed

To make size changes more or less gradual:

```typescript
// Smoother transitions (slower change)
SMOOTHING_FACTOR: 0.9,  // Instead of 0.8

// Sharper transitions (faster response)
SMOOTHING_FACTOR: 0.6,
```

#### Adjusting Thresholds

To change when min/max sizes apply:

```typescript
// Maximum size for up to 5 galaxies
MAX_SIZE_THRESHOLD: 5,  // Instead of 2

// Minimum size kicks in earlier
MIN_SIZE_THRESHOLD: 30,  // Instead of 50
```

#### Customizing Particle Distribution

Galaxy particles are distributed in a spiral pattern with dynamic radius:

```typescript
// In UniverseScene.tsx, GalaxyParticles component
const radius = Math.random() * (galaxyScale.maxRadius - galaxyScale.minRadius) 
             + galaxyScale.minRadius;
```

To create denser centers:

```typescript
// Use power function to concentrate particles toward center
const t = Math.random();
const radius = Math.pow(t, 1.5) * (maxRadius - minRadius) + minRadius;
```

To create sparser centers:

```typescript
// Use inverse power function
const t = Math.random();
const radius = Math.pow(t, 0.5) * (maxRadius - minRadius) + minRadius;
```

### Edge Cases

#### Single Galaxy Universe

- Uses maximum size (22 units) for dramatic presence and improved focus
- Centered on canvas with ample whitespace
- Rotation and particle effects fully visible
- Camera positioned at optimal distance for framing

#### Zero Galaxies

- Returns base size for fallback rendering
- Prevents errors if data loading fails
- Maintains UI layout stability

#### Very Large Catalogs (100+)

- Applies minimum size floor (6 units)
- Galaxies remain highly clickable (300-350px diameter at default zoom)
- Grid layout spacing (50 units) adjusts to prevent overlap
- Performance remains stable with efficient rendering
- Increased scale reduces strain on GPU fragment shader at distance

#### Lower-end GPUs and Performance

With increased galaxy scale, performance considerations:
- **Particle count remains constant**: Same particle density, just larger spatial distribution
- **Fill rate impact**: Larger galaxies cover more pixels; may impact integrated GPUs
- **Frame rate targets**: Desktop 60 FPS (10+ galaxies), Mobile 30+ FPS (5+ galaxies)
- **Adaptive quality**: Animation intensity automatically reduces if FPS drops below 30
- **Render budget**: Larger galaxies take ~5-10% more GPU time due to increased screen coverage
- **Optimization tip**: Consider reducing BASE_PARTICLE_COUNT from 2000 to 1500 on low-end devices

#### Extreme Zoom Levels

The increased scale improves behavior at extreme magnifications:
- **Floating-point precision**: Larger objects reduce jitter at high zoom (positions are further from origin)
- **Clipping prevention**: Updated minDistance (30) and maxDistance (250) prevent near/far plane issues
- **Camera framing**: Larger galaxies remain properly framed across full zoom range
- **Detail visibility**: Particle spread more apparent at close range with larger scale

#### Collision/Selection Logic

Galaxy selection remains robust with increased scale:
- **Hit detection**: Three.js raycasting automatically handles larger bounding volumes
- **Click accuracy**: Larger targets improve accessibility (50% increase in area)
- **Grid separation**: 50-unit spacing prevents overlapping hitboxes (max diameter 44 units)
- **Scene edges**: Galaxies near viewport edges remain fully selectable
- **Z-fighting**: Increased spacing (30 → 50) eliminates depth conflicts between adjacent galaxies
- **Touch targets**: Minimum galaxy size (6 units) exceeds WCAG requirements even at maximum zoom-out

#### Very Large Catalogs (100+)

- Applies minimum size floor (6 units)
- Galaxies remain highly clickable (300-350px diameter at default zoom)
- Grid layout spacing (50 units) automatically adjusts to prevent overlap
- Performance remains stable with efficient rendering
- Increased minimum scale reduces GPU strain at distance

#### Mixed Manual Overrides

- Featured galaxies can be larger than automatic scale
- Other galaxies use count-based scaling normally
- No visual conflicts or z-fighting due to adequate spacing
- Manual overrides don't affect other galaxies' sizes
- Grid spacing accommodates maximum of automatic and manual sizes

### Integration with Grid Layout

Galaxy positions are calculated independently of scale:

```typescript
// In SceneContent, UniverseScene.tsx
const spacing = 30;  // Fixed spacing in Three.js units
const cols = Math.ceil(Math.sqrt(galaxies.length));

galaxies.forEach((galaxy, index) => {
  const col = index % cols;
  const row = Math.floor(index / cols);
  positions.set(
    galaxy.id,
    new THREE.Vector3(
      (col - (cols - 1) / 2) * spacing,
      0,
      (row - Math.floor(galaxies.length / cols) / 2) * spacing
    )
  );
});
```

The 50-unit spacing ensures:
- Galaxies don't overlap even at maximum size (22 units radius, 44 units diameter)
- Adequate whitespace for visual clarity
- Click targets remain distinct
- Tooltips have room to display

To adjust spacing for different size ranges:

```typescript
// Dynamic spacing based on maximum possible galaxy size
const maxPossibleRadius = calculateGalaxyScale(galaxies.length).maxRadius;
const spacing = Math.max(50, maxPossibleRadius * 2.5);
```

### Testing Galaxy Scaling

#### Unit Tests

Comprehensive tests cover all scenarios:

```bash
npm test -- scale-constants.test.ts
```

Key test cases:
- Single galaxy returns maximum size
- 50+ galaxies return minimum size
- Smooth interpolation between thresholds
- Manual overrides work correctly
- Logarithmic scaling prevents jarring transitions
- Performance remains fast (< 0.01ms per calculation)

#### Visual Testing

To manually verify galaxy scaling:

1. **Test with 1 galaxy**: Should fill canvas nicely
2. **Add galaxies incrementally**: Watch sizes decrease smoothly
3. **Test with 50+ galaxies**: All should be small but clickable
4. **Test manual override**: Featured galaxy stays large
5. **Performance**: Monitor FPS in dev tools (target: 60 FPS desktop)

#### Browser Console Testing

```javascript
// Test scale calculation
const { calculateGalaxyScale } = require('./src/lib/universe/scale-constants');

console.table([
  { count: 1, ...calculateGalaxyScale(1) },
  { count: 5, ...calculateGalaxyScale(5) },
  { count: 10, ...calculateGalaxyScale(10) },
  { count: 50, ...calculateGalaxyScale(50) },
]);
```

### Documentation Updates

When modifying galaxy scaling:

1. **Update constants**: Document any changes to `GALAXY_SCALE` values
2. **Update tests**: Ensure test expectations match new behavior
3. **Update this doc**: Keep examples and screenshots current
4. **Update schema docs**: If adding new Galaxy properties

## Solar System Scale Configuration

### Overview

The solar system rendering uses carefully calibrated scale constants to ensure planets are easily clickable and meet accessibility guidelines while maintaining visual appeal. All constants are defined in `src/lib/universe/scale-constants.ts`.

### Planet Size Constants

Located in `PLANET_SCALE`:

```typescript
PLANET_SCALE = {
  MIN_SIZE: 0.8,           // Minimum radius (ensures ~44-50px tap target)
  MAX_SIZE: 1.8,           // Maximum radius (prevents visual dominance)
  BASE_SIZE: 1.0,          // Reserved for future use (not currently used)
  MOON_MULTIPLIER: 0.1,    // Size increase per moon
  MOON_SIZE_RATIO: 0.4,    // Moon size as ratio of minimum planet size
}
```

**Why These Values:**
- `MIN_SIZE` of 0.8 Three.js units translates to approximately 44-50 CSS pixels at default zoom, meeting WCAG 2.1 Level AA touch target requirements (44×44px minimum)
  - Note: This conversion assumes default Three.js camera settings and viewport size. Changes to camera FOV, position, or viewport dimensions may affect actual CSS pixel size.
- `MAX_SIZE` prevents large planets from obscuring other UI elements or smaller planets
- `BASE_SIZE` is reserved for potential future use (currently not used in calculations)
- `MOON_MULTIPLIER` creates visual variety: planets with more moons appear slightly larger
- `MOON_SIZE_RATIO` of 0.4 means moons are 40% the size of the minimum planet, maintaining visual hierarchy

**Planet Size Calculation:**

The `calculatePlanetSize()` function computes planet radius based on moon count:
```typescript
function calculatePlanetSize(moonCount: number): number {
  const sizeWithMoons = MIN_SIZE + (moonCount * MOON_MULTIPLIER);
  return Math.min(MAX_SIZE, sizeWithMoons);
}
```

Examples:
- 0 moons: 0.8 units (minimum size)
- 3 moons: 1.1 units (0.8 + 0.3)
- 10 moons: 1.8 units (capped at maximum)

**Moon Size Calculation:**

The `calculateMoonSize()` function provides consistent moon sizing:
```typescript
function calculateMoonSize(): number {
  return MIN_SIZE * MOON_SIZE_RATIO;  // 0.32 units
}
```

**Customizing Planet Sizes:**

To make all planets larger:
```typescript
MIN_SIZE: 1.0,  // Instead of 0.8
MAX_SIZE: 2.2,  // Instead of 1.8
```

To reduce size variance between planets:
```typescript
MOON_MULTIPLIER: 0.05,  // Instead of 0.1
```

To adjust moon-to-planet size ratio:
```typescript
MOON_SIZE_RATIO: 0.5,  // Instead of 0.4 (larger moons)
```

### Orbital Spacing Constants

Located in `ORBITAL_SPACING`:

```typescript
ORBITAL_SPACING = {
  BASE_RADIUS: 4.0,                    // First planet's orbital radius
  RADIUS_INCREMENT: 3.0,               // Spacing between orbits
  MIN_SEPARATION: 2.0,                 // Minimum safe distance
  MAX_ECCENTRICITY: 0.05,              // Orbit ellipticity (0 = circle)
  MAX_INCLINATION: 0.15,               // Orbital tilt in radians
  ADAPTIVE_SPACING_THRESHOLD: 8,       // Planet count for adaptive spacing
}
```

**Why These Values:**
- `BASE_RADIUS` of 4.0 provides clear separation from the central star (radius 1.2)
- `RADIUS_INCREMENT` of 3.0 ensures planets don't overlap even with maximum sizes
- `MAX_ECCENTRICITY` of 0.05 keeps orbits nearly circular for predictable spacing (was 0.1 for more elliptical orbits)
- `MAX_INCLINATION` of 0.15 radians (~8.6 degrees) adds 3D depth without causing z-fighting
- `ADAPTIVE_SPACING_THRESHOLD` of 8 planets triggers proportional spacing increase for larger systems

**Adaptive Spacing for Many Planets:**

The `calculateSafeSpacing()` function automatically increases spacing when you have more than the threshold:
```typescript
function calculateSafeSpacing(planetCount: number): number {
  const densityFactor = Math.max(1.0, planetCount / ADAPTIVE_SPACING_THRESHOLD);
  return RADIUS_INCREMENT * densityFactor;
}
```

For example (with threshold = 8):
- 4 planets: uses standard 3.0 spacing
- 8 planets: uses 3.0 spacing (threshold)
- 12 planets: uses 4.5 spacing (1.5× standard)
- 16 planets: uses 6.0 spacing (2× standard)

**Customizing Orbital Spacing:**

For tighter orbits (more compact view):
```typescript
BASE_RADIUS: 3.0,       // Instead of 4.0
RADIUS_INCREMENT: 2.5,   // Instead of 3.0
```

To adjust when adaptive spacing kicks in:
```typescript
ADAPTIVE_SPACING_THRESHOLD: 10,  // Instead of 8
```

For more elliptical orbits (more dramatic):
```typescript
MAX_ECCENTRICITY: 0.1,   // Instead of 0.05
```

For flatter orbital plane:
```typescript
MAX_INCLINATION: 0.05,   // Instead of 0.15 (~3 degrees)
```

### Star Configuration

Located in `STAR_SCALE`:

```typescript
STAR_SCALE = {
  RADIUS: 1.2,           // Central star size
  LIGHT_INTENSITY: 2.5,  // Brightness of star light
  LIGHT_DISTANCE: 30,    // How far light reaches
}
```

**Customizing Star Appearance:**

For a larger, brighter star:
```typescript
RADIUS: 1.5,
LIGHT_INTENSITY: 3.0,
```

For a smaller, dimmer star:
```typescript
RADIUS: 0.8,
LIGHT_INTENSITY: 1.5,
```

### Accessibility Features

#### Touch Target Compliance

All interactive elements meet or exceed WCAG 2.1 Level AA requirements:
- **3D Planets**: Minimum 0.8 Three.js units ≈ 44-50px at default zoom
- **UI Buttons**: Minimum 44px height (CSS), with increased sizes on mobile:
  - Tablets (≤768px): 48px minimum
  - Mobile (≤480px): 52px minimum

#### Responsive Behavior

The scale system adapts to different screen sizes:
- Desktop: Full detail with all planets visible
- Tablet: Slightly larger touch targets for easier interaction
- Mobile: Maximum touch target sizes for finger-friendly navigation
- High zoom: Planets scale proportionally, maintaining tap target size

#### Reduced Motion Support

Users with `prefers-reduced-motion` enabled experience:
- Instant transitions (0.01ms) instead of animated movements
- Static planet positions maintain all interactive functionality
- No impact on layout or spacing calculations

### Edge Case Handling

#### Many Planets (8+)

The system automatically adjusts spacing to prevent crowding:
```typescript
// For a solar system with 12 planets:
const spacing = calculateSafeSpacing(12);
// Returns: 3.75 (1.5× standard spacing)
```

#### Small Screens

CSS media queries ensure usability:
```css
@media (max-width: 768px) {
  .moon-nav-button {
    min-height: 48px;  /* Larger than desktop */
  }
}
```

#### High Planet Counts (10+)

Even with many planets, the orbital spacing algorithm ensures:
- No visual overlap between adjacent planets
- Z-fighting prevention through proper inclination limits
- Consistent frame rates through efficient rendering

#### Persisted Layout Data

If upgrading from a previous version:
- Old size values are ignored; new constants apply immediately
- No migration required - calculations are deterministic based on planet properties
- Cached Three.js objects automatically recreate with new sizes

### Testing Your Changes

After modifying constants, verify:

1. **Tap Target Size**: Use browser dev tools to measure planet click areas
   ```javascript
   // In browser console:
   const planetMesh = scene.children.find(/* your planet */);
   const boundingBox = new THREE.Box3().setFromObject(planetMesh);
   console.log('Planet size:', boundingBox.getSize(new THREE.Vector3()));
   ```

2. **Orbital Spacing**: Verify no overlaps with many planets
   ```bash
   # Create test solar system with 12+ planets
   # Visually inspect for overlaps at various zoom levels
   ```

3. **Performance**: Monitor frame rate with many planets
   ```javascript
   // Check FPS in dev tools performance panel
   // Target: 60 FPS desktop, 30 FPS mobile
   ```

4. **Accessibility**: Test with real devices
   - Touch interaction on tablets and phones
   - Keyboard navigation (focus indicators visible)
   - Screen reader compatibility (buttons properly labeled)

### Performance Considerations

Current scale values are optimized for:
- **Desktop**: 60 FPS with 10+ planets
- **Mobile**: 30+ FPS with 8+ planets
- **Low-end devices**: Graceful degradation (planets still clickable)

If you need to support more planets or lower-end devices:
- Reduce `LIGHT_DISTANCE` to lower light calculation overhead
- Consider implementing level-of-detail (LOD) for distant planets
- Use simpler sphere geometry (fewer segments) for distant objects

## Scene Architecture

The application uses a multi-layer traversal system with three focus levels:

```mermaid
graph TD
    A[Universe View] -->|Click Galaxy| B[Galaxy View]
    B -->|Click Solar System| C[Solar System View]
    C -->|Back Button| B
    B -->|Back Button| A
```

### Focus Levels

1. **Universe View**: Shows all galaxies as shader-based particle clouds arranged in a grid
2. **Galaxy View**: Shows a single galaxy's solar systems and free-floating stars with orbital mechanics
3. **Solar System View**: (Future) Detailed view of planets and moons

## Transition Indicator

The transition indicator provides visual feedback during navigation between different focus levels. The indicator appears centered on the screen with themed messaging that reinforces the travel narrative.

### Behavior

- **Visibility**: Only renders during active transitions (when `isTransitioning` state is `true`)
- **Position**: Fixed center of viewport (50% top, 50% left with transform centering)
- **Duration**: Visible throughout the camera animation (default 1.5 seconds)
- **Auto-dismiss**: Automatically fades out when transition completes

### Themed Messages

The indicator displays contextual messages based on the destination:

- **Galaxy level**: "Warping to galaxy..."
- **Solar System level**: "Traveling to system..."
- **Planet level**: "Landing on surface..."
- **Default**: "Traveling..."

### Styling

The indicator uses a semi-transparent dark background with blue accent border:

```css
.transition-indicator {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 1.5rem 2.5rem;
  background-color: rgba(0, 0, 0, 0.85);
  border: 2px solid rgba(74, 144, 226, 0.6);
  border-radius: 12px;
  backdrop-filter: blur(8px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  z-index: 1000;
}
```

#### Customizing Appearance

To customize the indicator appearance, edit the inline styles in `src/components/SceneHUD.tsx`:

**Change colors:**
```typescript
backgroundColor: 'rgba(0, 0, 0, 0.9)',  // Darker background
border: '2px solid rgba(255, 100, 100, 0.6)',  // Red border
```

**Adjust size:**
```typescript
padding: '2rem 3rem',  // Larger padding
fontSize: '1.5rem',    // Larger text
```

**Modify position:**
```typescript
top: '40%',  // Position higher on screen
```

### Animation

The indicator includes two animations:

1. **Fade In**: Smooth entrance with scale effect (0.2s)
2. **Spinner**: Rotating loading indicator (1s loop)

```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

### Accessibility

The transition indicator includes comprehensive accessibility features:

#### Screen Reader Support

```html
<div
  className="transition-indicator"
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
```

- **`role="status"`**: Indicates this is a status message
- **`aria-live="polite"`**: Screen readers announce changes when user is idle
- **`aria-atomic="true"`**: Full message is read (not just changes)

#### Reduced Motion Support

Users with `prefers-reduced-motion` enabled experience:

- **No entrance animation** (instant appearance)
- **Static spinner** (no rotation animation)
- **Uniform border** for static visual indicator

```css
@media (prefers-reduced-motion: reduce) {
  .transition-indicator {
    animation: none;
  }
  
  .transition-indicator-spinner {
    animation: none;
    border-color: rgba(74, 144, 226, 0.6);
  }
}
```

#### Keyboard Navigation

The indicator is non-interactive (`pointer-events: none`) and does not trap keyboard focus, ensuring navigation controls remain accessible during transitions.

### Edge Cases

The indicator handles various edge cases gracefully:

#### Rapid Consecutive Transitions

When users click multiple destinations rapidly, the navigation store queues transitions. The indicator:
- Remains visible throughout the queue
- Updates message for each queued transition
- Never flickers or shows overlapping indicators

#### Server-Side Rendering

On initial server render, `isTransitioning` is `false` by default, so the indicator is not rendered. It only appears for client-side navigation transitions.

#### Route Errors

If a transition fails or is cancelled:
1. Camera animator completion callback still fires
2. `finishTransition()` sets `isTransitioning` to `false`
3. Indicator gracefully hides via conditional rendering

#### Performance

The indicator uses:
- **Fixed positioning** (no layout reflow)
- **CSS transforms** for smooth GPU-accelerated animations
- **Conditional rendering** (completely removed from DOM when not transitioning)

### Customization Examples

#### Change Message Logic

Edit `getTransitionMessage()` in `src/components/SceneHUD.tsx`:

```typescript
const getTransitionMessage = (focusLevel: FocusLevel): string => {
  if (focusLevel === 'galaxy') return '🚀 Jumping to lightspeed...';
  if (focusLevel === 'solar-system') return '🌟 Entering system...';
  if (focusLevel === 'planet') return '🛸 Approaching surface...';
  return '✨ Traveling...';
};
```

#### Add Custom Styling Classes

Create custom styles in `src/app/globals.css`:

```css
.transition-indicator.custom-theme {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: 2px solid #ffffff;
}
```

Then add the class in SceneHUD.tsx:
```typescript
className="transition-indicator custom-theme"
```

#### Disable Backdrop Blur

For better performance on low-end devices:
```typescript
backdropFilter: 'none',  // Remove blur effect
```

### Testing

To test the transition indicator:

1. **Visual appearance**: Click any galaxy/solar system/planet
2. **Accessibility**: Enable screen reader and verify announcements
3. **Reduced motion**: Enable in OS settings and verify static animation
4. **Edge cases**: Rapidly click multiple destinations to test queueing

### Future Enhancements

Potential improvements for the transition indicator:

1. **Progress bar**: Show completion percentage during long transitions
2. **Destination preview**: Display target name or thumbnail
3. **Sound effects**: Audio cue for immersive experience
4. **Custom transitions**: Different animations for forward vs backward navigation
5. **Loading states**: Integrate with data loading for async content

## Welcome Message

The welcome message provides friendly branding and guidance when users first arrive at the universe view, helping orient them to the experience.

> **Note**: As of ISS-XX, the welcome message scope has been clarified and documented. It only appears on the universe view (main page), not on deeper navigation levels, ensuring clear visual hierarchy and preventing overlay clutter.

### Purpose

- **Branding**: Establishes "The Horizon" identity at the initial entry point
- **Guidance**: Provides clear instructions for getting started ("Click a galaxy to explore")
- **Context**: Welcomes users to the experience without blocking content

### Behavior

- **Visibility**: Only renders on the universe view (src/app/page.tsx)
- **Position**: Top-center of viewport (non-blocking, pointer-events disabled)
- **Display Duration**: Remains visible throughout universe-level exploration
- **Scope**: Does NOT appear when navigating to galaxy, solar system, or planet views

### Conditional Rendering

The welcome message is only imported and rendered in `src/app/page.tsx`:

```typescript
import WelcomeMessage from '@/components/WelcomeMessage';

export default async function HomePage() {
  const galaxies = await getGalaxies();

  return (
    <main>
      <WelcomeMessage />
      <UniverseScene galaxies={galaxies} />
      <SceneHUD galaxies={galaxies} />
    </main>
  );
}
```

This ensures:
- **Universe view**: Welcome message appears at top to orient users
- **Galaxy/system/planet views**: No welcome message overlay (clean, focused UI)
- **Navigation clarity**: Message only shows at the "entry point" of the experience
- **Visual hierarchy**: Deeper views have dedicated HUD elements (breadcrumbs, back button)

### Why Universe View Only?

The welcome message is intentionally scoped to only the universe view for several UX reasons:

1. **First Impressions**: The universe view is the entry point - users need context
2. **Avoid Redundancy**: Once users navigate deeper, they understand the interface
3. **Prevent Clutter**: Galaxy/system/planet views already have tooltips, HUD, and content overlays
4. **Progressive Disclosure**: Information is revealed as users progress, not repeated
5. **Focus**: Deeper views should focus on the celestial content, not app branding

### Routing Architecture

The application uses Next.js App Router with distinct routes:

- `/` (page.tsx) - Universe view with WelcomeMessage ✅
- `/galaxy/[id]` - Static galaxy detail pages (no 3D scene, no WelcomeMessage)
- In-scene navigation uses Zustand store to manage focus levels within the 3D canvas

The WelcomeMessage component is **not** conditionally rendered based on `focusLevel` state. Instead, it's statically included in the universe page, which is the only page that renders the 3D UniverseScene component.

### Styling

```typescript
{
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  padding: '2rem',
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  border: '2px solid rgba(74, 144, 226, 0.5)',
  borderRadius: '12px',
  backdropFilter: 'blur(8px)',
  pointerEvents: 'none',  // Non-interactive
  zIndex: 50,  // Below transition indicator (z-index: 1000)
}
```

### Responsive Typography

Uses CSS `clamp()` for fluid text scaling:

```typescript
// Heading
fontSize: 'clamp(1.5rem, 4vw, 2.5rem)'  // 1.5rem → 2.5rem

// Body text
fontSize: 'clamp(0.9rem, 2vw, 1.1rem)'  // 0.9rem → 1.1rem

// Instructions
fontSize: 'clamp(0.8rem, 1.8vw, 1rem)'  // 0.8rem → 1rem
```

This ensures readability across:
- **Mobile** (320px+): Smaller text, still legible
- **Tablet** (768px+): Medium text
- **Desktop** (1024px+): Full-size text

### Accessibility

#### Screen Reader Support

```html
<div
  className="welcome-message"
  role="complementary"
  aria-label="Welcome message"
>
```

- **`role="complementary"`**: Identifies as supporting content
- **`aria-label`**: Provides context for screen readers
- **`pointerEvents: 'none'`**: Doesn't trap focus or block interaction

#### Keyboard Navigation

The message is purely informational:
- No interactive elements to tab to
- Doesn't interfere with scene navigation controls
- Back button remains accessible via keyboard

#### Reduced Motion Support

The welcome message has no animations, making it inherently compatible with `prefers-reduced-motion`. It appears and disappears instantly based on navigation state.

### Customization

#### Change Message Content

Edit `src/components/WelcomeMessage.tsx`:

```typescript
<h2>Welcome to {customBrandName}</h2>
<p>Exploring the wonders of {galaxyName}</p>
<p>Your journey through the cosmos begins here</p>
```

#### Adjust Positioning

```typescript
// Move to top-center
top: '20%',
left: '50%',

// Move to bottom-left
top: 'auto',
bottom: '2rem',
left: '2rem',
transform: 'none',
```

#### Change Colors

```typescript
// Warmer theme
backgroundColor: 'rgba(40, 20, 0, 0.8)',
border: '2px solid rgba(255, 165, 0, 0.5)',
color: '#FFA500',
```

#### Adjust Size

```typescript
// Larger message
maxWidth: '95%',
width: '700px',
padding: '3rem',
```

### Edge Cases

#### Long Galaxy Names

Long galaxy names wrap naturally:
```css
word-wrap: break-word;
overflow-wrap: break-word;
```

Galaxy name example:
- Short: "Andromeda"
- Long: "Messier 87 Supergiant Elliptical Galaxy" (wraps on mobile)

#### Small Screens (< 480px)

On very small devices:
- `maxWidth: '90%'` prevents overflow
- `clamp()` typography ensures minimum readability
- Padding adjusts for touch-friendly spacing

#### SSR Hydration

Initial server render:
- `focusLevel === 'universe'` (default state)
- Welcome message not rendered
- No hydration mismatch on client load

#### Rapid Navigation

If user clicks through galaxies quickly:
- Message updates with new galaxy name
- No flickering (re-renders are efficient)
- Transition indicator (z-index: 1000) appears above message (z-index: 50)

### Testing

To test the welcome message:

1. **Navigation**: Click a galaxy particle to see the message appear
2. **Content**: Verify galaxy name displays correctly
3. **Responsiveness**: Resize browser window to test text scaling
4. **Accessibility**: Use screen reader to verify `aria-label`
5. **Non-blocking**: Verify you can still use back button and scene controls

### Performance

The welcome message has minimal performance impact:
- **Conditional rendering**: Only renders when needed
- **No animations**: Static display (no RAF loop)
- **Simple DOM**: Single div with text nodes
- **No images**: Pure CSS styling

### Integration Points

The welcome message integrates with:

1. **Navigation Store** (`src/lib/store.ts`):
   - Reads `focusLevel` to determine visibility
   - Reads `focusedGalaxyId` to find galaxy data

2. **UniverseScene** (`src/components/UniverseScene.tsx`):
   - Conditionally renders `<WelcomeMessage />` component
   - Passes `galaxyName` prop from `focusedGalaxy.name`

3. **Scene Hierarchy**:
   ```
   <div> (scene container)
     <Canvas> (3D scene)
     <WelcomeMessage /> (if galaxy view)
     <PlanetSurfaceOverlay /> (if planet view)
   </div>
   ```

### Migration Notes

This replaces the previous bottom-right info overlay that appeared globally:

**Before** (global disclaimer in `src/app/page.tsx`):
```typescript
// Appeared on universe view only
<div style={{ position: 'absolute', bottom: '1rem', right: '1rem' }}>
  <h3>The Horizon</h3>
  <p>Click on galaxies to explore...</p>
</div>
```

**After** (contextual welcome in galaxy view):
```typescript
// Appears on galaxy view only
{focusLevel === 'galaxy' && focusedGalaxy && (
  <WelcomeMessage galaxyName={focusedGalaxy.name} />
)}
```

**Benefits of new approach**:
- Contextual: Appears when exploring a specific galaxy
- Non-intrusive: Centered, semi-transparent, doesn't cover controls
- Responsive: Better text scaling and mobile support
- Accessible: Proper ARIA attributes and semantic HTML

## Camera System

### Camera Animations

Camera transitions use spline-based paths with easing functions for smooth, cinematic movement:

- **Duration**: 1.5 seconds (1500ms) by default
- **Easing**: Cubic ease-in-out for natural acceleration/deceleration
- **Path**: Catmull-Rom spline with elevated midpoint for dramatic arc

#### Animation Configuration

Located in `src/lib/camera.ts`:

```typescript
export const DEFAULT_ANIMATION_CONFIG: AnimationConfig = {
  duration: 1500, // milliseconds
  easing: easeInOutCubic,
};
```

To adjust animation speed, modify the `duration` value. Lower values create faster transitions; higher values create slower, more dramatic movements.

#### Available Easing Functions

- `easeInOutCubic`: Smooth acceleration and deceleration (default)
- `easeInOutQuint`: Even smoother with more gradual transitions
- `lerp`: Linear interpolation (no easing)

### Camera Constraints

To prevent disorientation and maintain scene boundaries:

- **Minimum Distance**: 5 units from focus point
- **Maximum Distance**: 200 units from origin
- **Polar Angle**: Limited to 90° (prevents going below the "floor")
- **Controls**: Disabled during transitions to prevent conflicts

### Default Camera Positions

```typescript
universe: {
  position: new THREE.Vector3(0, 50, 100),
  lookAt: new THREE.Vector3(0, 0, 0),
}

galaxy: {
  position: new THREE.Vector3(0, 20, 40),
  lookAt: new THREE.Vector3(0, 0, 0),
}

solarSystem: {
  position: new THREE.Vector3(0, 10, 25),
  lookAt: new THREE.Vector3(0, 0, 0),
}
```

## Scene Controls

### Universe View Controls

- **Mouse Drag**: Orbit around the scene
- **Mouse Wheel**: Zoom in/out
- **Click Galaxy**: Focus and transition to galaxy detail view
- **Damping**: Smooth camera movement with dampingFactor of 0.05

### Navigation Controls

- **Back Button**: Returns to previous focus level with reversed animation
- **Breadcrumb**: Shows current navigation path
- **Transition Queue**: Prevents glitches by queuing rapid clicks

## Performance Optimizations

### Instancing

Solar system planets use instanced rendering for performance:

- Single draw call for multiple planets
- Efficient memory usage
- Scalable to hundreds of objects

### Particle Systems

Galaxy particle clouds use custom shaders:

- GPU-accelerated rendering
- 2,000+ particles per galaxy
- Additive blending for glow effect
- Depth write disabled for correct transparency

#### Particle Shader Features

**Vertex Shader**:
- Size attenuation based on distance
- Custom color per particle
- Efficient attribute passing

**Fragment Shader**:
- Circular particle shape with soft edges
- Alpha gradient for smooth falloff
- Discard for non-circular fragments

### Level of Detail (LOD)

Future enhancement: dynamically adjust particle count based on:
- Distance from camera
- Number of galaxies in view
- Frame rate performance

### Batching

Galaxy positions are pre-calculated and memoized:
- Prevents recalculation on every render
- Grid layout for predictable spacing
- Map-based lookup for O(1) access

## Animation Tuning Guide

### Adjusting Transition Speed

Edit `src/lib/camera.ts`:

```typescript
// Faster transitions (1 second)
duration: 1000

// Slower, more cinematic (2.5 seconds)
duration: 2500
```

### Changing Easing Curve

Edit the easing function in `DEFAULT_ANIMATION_CONFIG`:

```typescript
// Gentler easing
easing: easeInOutQuint

// Linear (no easing)
easing: (t) => t
```

### Modifying Camera Paths

To adjust the camera arc height, edit `createCameraPath` in `src/lib/camera.ts`:

```typescript
// Higher arc (more dramatic)
createCameraPath(start, end, 15)

// Lower arc (more direct)
createCameraPath(start, end, 5)
```

### Galaxy Rotation Speed

Edit the rotation multiplier in `UniverseScene.tsx`:

```typescript
// Slower rotation
meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.02;

// Faster rotation
meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.1;
```

## Orbital Mechanics

### Keplerian Orbits

Planets follow simplified Keplerian orbital mechanics:

- **Semi-major axis**: Increases with planet index (2 + index * 1.5)
- **Eccentricity**: Random 0-0.1 for slight elliptical orbits
- **Inclination**: Random ±0.2 radians for 3D variation
- **Orbit speed**: Approximates Kepler's third law (v ∝ 1/a²)

### Customizing Orbits

Edit `PlanetInstance` in `GalaxyView.tsx`:

```typescript
// Wider orbital spacing
const semiMajorAxis = 3 + index * 2.0;

// More circular orbits
const eccentricity = Math.random() * 0.05;

// Flatter orbital plane
const inclination = (Math.random() - 0.5) * 0.1;
```

## Shader Customization

### Galaxy Particle Colors

Edit the color variation in `UniverseScene.tsx`:

```typescript
// More color variation
mixedColor.lerp(new THREE.Color('#FFFFFF'), Math.random() * 0.5);

// Darker particles
mixedColor.lerp(new THREE.Color('#000000'), Math.random() * 0.2);
```

### Particle Size Distribution

```typescript
// Larger particles
sizes[i] = Math.random() * 4 + 2;

// More uniform size
sizes[i] = 2.5;
```

## Performance Considerations

### Frame Rate Targets

- **Desktop**: 60 FPS with 10+ galaxies
- **Mobile**: 30 FPS with 5+ galaxies
- **Low-end**: Graceful degradation with reduced particle counts

### Memory Management

- Geometries and materials are reused where possible
- Particle buffers are created once and updated in place
- Scene graph is kept shallow to minimize traversal cost

### Optimization Checklist

- [ ] Use instancing for repeated objects
- [ ] Disable depth write for transparent objects
- [ ] Use shader materials for effects
- [ ] Limit point light count
- [ ] Pre-calculate positions when possible
- [ ] Use object pooling for temporary objects
- [ ] Throttle expensive operations (raycasting, etc.)

## Troubleshooting

### Low Frame Rate

1. Reduce particle count per galaxy
2. Disable orbit damping
3. Reduce planet count or orbital complexity
4. Use simpler shaders

### Camera Jitter

1. Increase damping factor
2. Disable controls during transitions
3. Use smoother easing functions

### Transition Glitches

1. Check transition queue logic
2. Ensure `isTransitioning` flag is properly set
3. Verify camera animator completion callbacks

### Visual Artifacts

1. Adjust particle shader alpha blending
2. Check depth buffer settings
3. Verify material transparency flags
4. Ensure proper render order

## Galaxy Animations

The Horizon features dynamic galaxy animations that enhance the visual experience while maintaining accessibility and performance.

### Animation System

#### Animation Configuration

Animations are controlled through a centralized configuration system defined in `src/lib/animation.ts`:

```typescript
interface AnimationConfig {
  rotation: boolean;           // Enable rotation animations
  rotationSpeed: number;       // Rotation speed multiplier (0-1)
  parallax: boolean;           // Enable parallax effects
  particleDrift: boolean;      // Enable particle drift
  driftSpeed: number;          // Particle drift speed multiplier (0-1)
  intensity: number;           // Overall animation intensity (0-1)
}
```

Default configuration:
```typescript
{
  rotation: true,
  rotationSpeed: 1.0,
  parallax: true,
  particleDrift: true,
  driftSpeed: 1.0,
  intensity: 1.0,
}
```

#### Prefers-Reduced-Motion Support

The application automatically detects and respects the user's `prefers-reduced-motion` setting:

```typescript
const prefersReducedMotion = usePrefersReducedMotion();
const animationConfig = getAnimationConfig(DEFAULT_ANIMATION_CONFIG, prefersReducedMotion);
```

When reduced motion is preferred, all animations are disabled:
- `rotation`: false
- `rotationSpeed`: 0
- `parallax`: false
- `particleDrift`: false
- `driftSpeed`: 0
- `intensity`: 0

#### Performance-Based Animation Adjustment

The system includes automatic performance monitoring and intensity adjustment:

```typescript
function calculateAnimationIntensity(fps: number, targetFps: number = 60): number
```

Behavior:
- **FPS ≥ 60**: Full intensity (1.0)
- **30 < FPS < 60**: Gradual reduction proportional to FPS
- **FPS ≤ 30**: Minimum intensity (0.3)

This ensures smooth performance on low-power devices by dynamically reducing animation complexity.

#### Animation Types

##### 1. Galaxy Rotation

Gentle rotation of galaxies around the Y-axis:

```typescript
// GalaxyView.tsx
groupRef.current.rotation.y += 0.001 * animationConfig.rotationSpeed * animationConfig.intensity;
```

Customization:
```typescript
// Faster rotation
rotation.y += 0.002 * animationConfig.rotationSpeed * animationConfig.intensity;

// Slower rotation
rotation.y += 0.0005 * animationConfig.rotationSpeed * animationConfig.intensity;
```

##### 2. Particle Drift

Subtle circular drift animation for background particles:

```typescript
// Applied to particle positions in animation loop
for (let i = 0; i < positions.length; i += 3) {
  positions[i] = originalX + Math.sin(time * 0.1 + i) * 0.01 * animationConfig.driftSpeed;
  positions[i + 2] = originalZ + Math.cos(time * 0.1 + i) * 0.01 * animationConfig.driftSpeed;
}
```

This creates a gentle "breathing" effect in galaxy particle clouds.

##### 3. Star Pulsing

Free-floating stars pulse gently:

```typescript
// StarInstance in GalaxyView.tsx
const scale = 1 + Math.sin(state.clock.getElapsedTime() * 2) * 0.1 * animationConfig.intensity;
meshRef.current.scale.setScalar(scale);
```

##### 4. Galaxy Particle Cloud Rotation

Galaxy particle clouds in universe view rotate:

```typescript
// UniverseScene.tsx
meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.05 * animationConfig.rotationSpeed * animationConfig.intensity;
```

#### Cleanup and Memory Management

All animations properly clean up on component unmount to prevent memory leaks:

```typescript
useEffect(() => {
  let rafId: number;
  
  const animate = () => {
    // Animation logic
    rafId = requestAnimationFrame(animate);
  };
  
  animate();
  
  return () => {
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
  };
}, []);
```

### Hover Labels and Tooltips - Removed

> **Note**: As of this release, hover labels and tooltip overlays have been intentionally removed from all 3D scenes based on user feedback.

#### Removal Rationale

Hover labels and tooltip components were removed to:

1. **Reduce Visual Clutter**: Users reported that hover labels were distracting during exploration, especially in dense galaxy clusters or when multiple objects were nearby.

2. **Simplify Rendering Pipeline**: Removing tooltips reduces DOM churn and decreases bundle size by eliminating:
   - `SceneTooltip` component (~3KB)
   - `Tooltip` component (~8KB)
   - `tooltip-constants` module (~2KB)
   - Associated CSS styles (~1.5KB)
   - Test files (~15KB)

3. **Improve Performance**: Fewer DOM nodes and event listeners reduce memory usage and improve frame rates, particularly on lower-end devices.

4. **Streamline User Experience**: Users can focus on the visual exploration without UI overlays obscuring celestial objects.

#### Alternative Context Cues

While hover labels are removed, context remains available through:

- **Scene HUD**: Breadcrumb navigation shows current location (Universe → Galaxy → Solar System → Planet)
- **Object Selection**: Clicking on celestial objects navigates to their detail view where full information is available
- **ARIA Labels**: Screen readers still announce object names through accessible labels on interactive elements
- **Visual Hierarchy**: Clear visual distinction between different celestial object types (galaxies, stars, planets)
- **Transition Messages**: "Warping to galaxy...", "Traveling to system...", etc. provide context during navigation

#### Future Reconsideration Criteria

Hover labels may be reconsidered in future releases if:

1. **User Research** demonstrates a clear need for on-hover context (e.g., through user testing, accessibility audits, or feature requests)

2. **Performance Improvements** make tooltip rendering negligible (e.g., through WebGL-based labels, canvas rendering, or more efficient DOM updates)

3. **Accessibility Requirements** necessitate hover labels to meet WCAG guidelines (current alternative cues are designed to maintain WCAG 2.1 Level AA compliance)

4. **Configurable UI** allows users to toggle tooltips on/off based on preference

5. **Focused Use Cases** emerge where tooltips add value without distraction (e.g., educational mode, guided tours, admin editing)

#### Migration Notes

For developers extending or customizing The Horizon:

- **Removed Components**: `SceneTooltip`, `Tooltip`, and `tooltip-constants` are no longer available
- **Removed CSS Classes**: `.scene-tooltip`, `.star-tooltip`, and related responsive variants
- **Hover State Handling**: Objects still detect hover events for emissive highlighting and cursor changes, but no longer render tooltips
- **Object Identification**: Use navigation state and breadcrumb HUD for current context instead of hover labels

### Admin Editor Integration

#### Animation Preview in GalaxyEditor

The Galaxy Editor includes an animation preview toggle:

```typescript
<label>
  <input
    type="checkbox"
    checked={showAnimationPreview}
    onChange={(e) => setShowAnimationPreview(e.target.checked)}
  />
  Preview animations (respects prefers-reduced-motion)
</label>
```

This allows content authors to preview animations while editing galaxy properties without affecting the user-facing behavior.

### Performance Considerations

#### Frame Rate Targets

- **Desktop**: 60 FPS with all animations enabled
- **Mobile**: 30+ FPS with adaptive intensity
- **Low-end**: 30 FPS minimum with reduced animations

#### Optimization Strategies

1. **Conditional Rendering**: Tooltips only render when visible
2. **RequestAnimationFrame**: Proper cleanup prevents memory leaks
3. **GPU Acceleration**: CSS transforms for smooth animations
4. **Batch Updates**: Particle updates batched per frame
5. **Distance Culling**: Tooltips scale with camera distance

#### Performance Monitoring

Use the browser's Performance panel to measure:

```javascript
// Monitor FPS
const measureFps = () => {
  frameCount++;
  const elapsed = currentTime - lastTime;
  if (elapsed >= 1000) {
    const currentFps = Math.round((frameCount * 1000) / elapsed);
    console.log('FPS:', currentFps);
  }
};
```

Expected results:
- Universe view (multiple galaxies): 50-60 FPS
- Galaxy view (detailed): 55-60 FPS
- With reduced motion: 60 FPS (static)

### Accessibility Features

#### Keyboard Navigation

- Tab through interactive elements
- Focus indicators visible
- Tooltips appear on focus
- ARIA attributes for screen readers

#### Screen Reader Support

Tooltips include proper ARIA attributes:

```html
<div
  role="tooltip"
  aria-live="polite"
  className="tooltip-content"
>
  {content}
</div>
```

#### Color Contrast

All tooltip text meets WCAG 2.1 Level AA contrast requirements:
- Text: #FFFFFF on rgba(0, 0, 0, 0.9) = 21:1 contrast ratio
- Border: rgba(74, 144, 226, 0.5) provides visual delineation

### Testing Animations and Tooltips

#### Manual Testing Checklist

- [ ] Hover over galaxies shows name and system count
- [ ] Hover over solar systems shows system name
- [ ] Hover over planets shows planet name with highlight
- [ ] Hover over stars shows star name
- [ ] Tooltips dismiss when pointer moves away
- [ ] Tooltips work with keyboard focus
- [ ] Touch devices can tap to toggle tooltips
- [ ] Animations respect prefers-reduced-motion
- [ ] No animation frame leaks on unmount
- [ ] Performance stays above 30 FPS on mobile

#### Automated Tests

Tests are located in:
- `src/components/__tests__/Tooltip.test.tsx`
- `src/lib/__tests__/animation.test.ts`

Run tests:
```bash
npm test -- Tooltip.test
npm test -- animation.test
```

#### Performance Testing

1. Open Chrome DevTools > Performance
2. Start recording
3. Navigate through different views
4. Stop recording after 10 seconds
5. Verify:
   - FPS > 30 consistently
   - No long tasks > 50ms
   - No memory leaks
   - Clean unmount (no warnings)

### Customization Guide

#### Adjusting Animation Speed

Edit `src/lib/animation.ts`:

```typescript
// Slower animations
{
  rotationSpeed: 0.5,  // Half speed
  driftSpeed: 0.5,     // Half speed
  intensity: 0.7,      // 70% intensity
}
```

#### Customizing Tooltip Appearance

Edit inline styles in component files or create a shared tooltip component:

```typescript
// Different color theme
{
  background: 'rgba(40, 20, 60, 0.95)',
  border: '2px solid rgba(138, 43, 226, 0.7)',
  color: '#E0BBE4',
}
```

#### Adding New Animation Types

1. Add to `AnimationConfig` interface in `src/lib/animation.ts`
2. Update `DEFAULT_ANIMATION_CONFIG` with default value
3. Handle in `getAnimationConfig` for reduced motion
4. Apply in component using `useFrame` hook

Example:

```typescript
// 1. Add to config
interface AnimationConfig {
  // ...existing fields
  scaleOscillation: boolean;
  scaleAmplitude: number;
}

// 2. In component
useFrame((state) => {
  if (animationConfig.scaleOscillation) {
    const scale = 1 + Math.sin(state.clock.getElapsedTime()) * animationConfig.scaleAmplitude;
    meshRef.current.scale.setScalar(scale);
  }
});
```

### Edge Cases and Solutions

#### Multiple Overlapping Tooltips

Solution: Only one tooltip visible at a time per component using state management:

```typescript
const [hovered, setHovered] = useState<number | null>(null);
// Only show tooltip when hovered === specific index
```

#### Tooltip Positioning at Screen Edge

Solution: `Html` component from `@react-three/drei` automatically handles positioning and scaling with `distanceFactor`.

#### Animation Performance Degradation

Solution: Automatic intensity reduction based on FPS monitoring:

```typescript
const { fps, intensity } = useAnimationPerformance();
// intensity automatically reduces if FPS drops
```

#### Memory Leaks from Animation Frames

Solution: Always clean up in useEffect:

```typescript
useEffect(() => {
  return () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (rafId) cancelAnimationFrame(rafId);
  };
}, []);
```

## Future Enhancements

1. **Dynamic LOD**: Adjust quality based on performance metrics
2. **Fog Effects**: Distance-based atmospheric fog
3. **Bloom**: Post-processing for star glow
4. **Motion Trails**: Particle trails during camera movement
5. **Ambient Occlusion**: Enhanced depth perception
6. **VR Support**: Immersive exploration mode

## Hover Labels and Tooltips - Historical Note

> **Note**: The Standardized Hover Label System was removed in this release. Hover labels and tooltip overlays were intentionally removed from all 3D scenes based on user feedback.

The previous system included:
- `SceneTooltip` component for 3D scene tooltips
- `Tooltip` component for 2D UI tooltips
- Shared tooltip constants for consistent styling
- Comprehensive documentation and test coverage

**Removal Rationale**: See the "Hover Labels and Tooltips - Removed" section under "Galaxy Animations" for detailed information on why tooltips were removed, alternative context cues, and future reconsideration criteria.

**Migration**: For developers extending or customizing The Horizon, tooltip components and constants are no longer available. Use navigation state and the breadcrumb HUD for context instead.

## References

- [React Three Fiber Documentation](https://docs.pmnd.rs/react-three-fiber)
- [Three.js Fundamentals](https://threejs.org/manual/)
- [Keplerian Orbital Elements](https://en.wikipedia.org/wiki/Orbital_elements)
- [Easing Functions](https://easings.net/)
- [WCAG 2.1 Contrast Requirements](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [@react-three/drei Html Component](https://github.com/pmndrs/drei#html)
