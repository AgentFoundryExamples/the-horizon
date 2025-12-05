# Universe Data Schema

This document describes the data structure used to define the universe in The Horizon application.

## Overview

The universe is stored as a JSON file at `public/universe/universe.json` and follows a hierarchical structure:

```
Universe
└── Galaxies[]
    ├── Stars[] (free-floating)
    └── SolarSystems[]
        ├── MainStar
        └── Planets[]
            └── Moons[]
```

## Data Structure

### Universe

The root object containing all universe data.

```typescript
interface Universe {
  galaxies: Galaxy[];
}
```

**Fields:**
- `galaxies` (required): Array of Galaxy objects

### Galaxy

Represents a galaxy containing stars and solar systems.

```typescript
interface Galaxy {
  id: string;
  name: string;
  description: string;
  theme: string;
  particleColor: string;
  stars: Star[];
  solarSystems: SolarSystem[];
}
```

**Fields:**
- `id` (required): Unique identifier (kebab-case recommended). If empty or whitespace, will be auto-generated from the name.
- `name` (required): Display name. Cannot be empty.
- `description` (required): Description of the galaxy. Cannot be empty.
- `theme` (required): Visual theme identifier (e.g., "blue-white", "purple-white"). Cannot be empty.
- `particleColor` (required): Hex color code for particle effects (e.g., "#4A90E2"). Cannot be empty.
- `stars` (required): Array of free-floating Star objects (can be empty array)
- `solarSystems` (required): Array of SolarSystem objects (can be empty array)

**ID Generation:**
- If the `id` field is empty, whitespace, or not provided, it will be automatically generated from the `name` field
- Auto-generated IDs are converted to kebab-case (lowercase with hyphens)
- Unicode characters are normalized (e.g., "Café" → "cafe", "São Paulo" → "sao-paulo")
- Special characters are removed (e.g., "Galaxy #42!" → "galaxy-42")
- Multiple spaces are collapsed to single hyphens

### Star

Represents a star, either free-floating or a main star of a solar system.

```typescript
interface Star {
  id: string;
  name: string;
  theme: string;
}
```

**Fields:**
- `id` (required): Unique identifier
- `name` (required): Display name
- `theme` (required): Star classification theme (e.g., "yellow-dwarf", "red-giant")

### SolarSystem

Represents a solar system with a main star and orbiting planets.

```typescript
interface SolarSystem {
  id: string;
  name: string;
  theme: string;
  mainStar: Star;
  planets: Planet[];
}
```

**Fields:**
- `id` (required): Unique identifier
- `name` (required): Display name
- `theme` (required): Visual theme
- `mainStar` (required): The central Star object
- `planets` (required): Array of Planet objects

### Planet

Represents a planet orbiting a star.

```typescript
interface Planet {
  id: string;
  name: string;
  theme: string;
  summary: string;
  contentMarkdown: string;
  moons: Moon[];
}
```

**Fields:**
- `id` (required): Unique identifier
- `name` (required): Display name
- `theme` (required): Visual theme (e.g., "blue-green", "red", "earth-like")
- `summary` (required): Brief description (1-2 sentences)
- `contentMarkdown` (required): Full content in Markdown format
- `moons` (required): Array of Moon objects (can be empty)

### Moon

Represents a moon orbiting a planet.

```typescript
interface Moon {
  id: string;
  name: string;
  contentMarkdown: string;
}
```

**Fields:**
- `id` (required): Unique identifier
- `name` (required): Display name
- `contentMarkdown` (required): Full content in Markdown format

## Content Guidelines

### Markdown Content

All `contentMarkdown` fields support full Markdown syntax including:
- Headers (`#`, `##`, `###`)
- **Bold** and *italic* text
- Lists (ordered and unordered)
- Links
- Code blocks
- Blockquotes

**Best Practices:**
1. Start with a level 1 header (`#`) containing the object's name
2. Use level 2 headers (`##`) for main sections
3. Keep content informative and engaging
4. Include scientific or fictional details as appropriate
5. Aim for 200-500 words for planets, 100-200 words for moons

### Naming Conventions

- **IDs**: Use kebab-case (e.g., `milky-way`, `sol-system`, `kepler-442b`)
- **Names**: Use proper case (e.g., "Milky Way", "Sol System", "Kepler-442b")
- **Themes**: Use descriptive hyphenated names (e.g., `blue-white`, `yellow-dwarf`, `red-giant`)

### Theme Values

Themes are arbitrary string identifiers used for visual styling. Common themes:

**Galaxy Themes:**
- `blue-white` - Blue-white spiral galaxies
- `purple-white` - Purple-tinted galaxies
- `red-orange` - Red or orange galaxies

**Star Themes:**
- `yellow-dwarf` - Yellow main sequence stars (like our Sun)
- `red-giant` - Large red stars
- `blue-white` - Hot blue-white stars
- `orange-dwarf` - Orange main sequence stars

**Planet Themes:**
- `blue-green` - Earth-like water worlds
- `red` - Red, dusty planets
- `gas-giant` - Large gas planets
- `ice-world` - Ice-covered worlds
- `earth-like` - Potentially habitable worlds

## Validation

The application validates all universe data at runtime using the following rules:

1. **Required Fields**: All required fields must be present and non-empty (after trimming whitespace)
   - Galaxy: `name`, `description`, `theme`, `particleColor`
   - Solar System: `name`, `theme`, `mainStar`
   - Star: `name`, `theme`
   - Planet: `name`, `theme`, `summary`, `contentMarkdown`
   - Moon: `name`, `contentMarkdown`

2. **ID Validation**:
   - IDs must be unique within their scope (e.g., all galaxy IDs must be unique)
   - Empty or whitespace-only IDs will be auto-generated from the entity's name
   - Auto-generated IDs use kebab-case and handle unicode characters safely

3. **Array Validation**:
   - Arrays (galaxies, stars, solarSystems, planets, moons) must be valid arrays
   - Empty arrays are valid (e.g., a galaxy with no solar systems)

4. **Markdown Content**:
   - Markdown content fields must not be empty strings after trimming
   - Content is sanitized before rendering to prevent XSS attacks

5. **Color Codes**:
   - Color codes should be valid hex colors (e.g., "#4A90E2")
   - The format is not strictly validated but should follow hex color conventions

**Validation Errors:**
- Validation errors are descriptive and indicate which field and entity failed
- Client-side validation prevents submission of invalid data with inline error messages
- Server-side validation rejects invalid payloads with HTTP 400 Bad Request
- Validation errors include the field name and entity context (e.g., "Galaxy[0] (Milky Way): Galaxy name is required")

**Validation Warnings:**
- The application will log validation warnings to the console
- Missing markdown content will be replaced with placeholder text
- Empty arrays are valid (e.g., a galaxy with no solar systems)
- The app will render a fallback state if universe data cannot be loaded

## Edge Cases

### Empty Universe
```json
{
  "galaxies": []
}
```
Valid - displays a "No Galaxies Found" message

### Galaxy Without Content
```json
{
  "id": "empty-galaxy",
  "name": "Empty Galaxy",
  "description": "A lonely galaxy",
  "theme": "dark",
  "particleColor": "#000000",
  "stars": [],
  "solarSystems": []
}
```
Valid - galaxy will render with no stars or solar systems

### Missing Markdown Content
If `contentMarkdown` is empty or missing:
```json
{
  "id": "mystery-moon",
  "name": "Mystery Moon",
  "contentMarkdown": ""
}
```
The application will inject: `*Content coming soon...*`

## Example

See `public/universe/universe.json` for a complete example with:
- 2 galaxies (Milky Way and Andromeda)
- Multiple stars (free-floating and main stars)
- Solar systems with multiple planets
- Planets with moons
- Rich markdown content

## Updating Content

To add or modify universe content:

1. Edit `public/universe/universe.json`
2. Follow the schema structure above
3. Validate your JSON syntax (use a JSON validator)
4. Test locally with `npm run dev`
5. Check the browser console for validation warnings
6. Verify content renders correctly

## Future Considerations

The current schema is designed to support future enhancements:
- Admin UI for content management
- Database storage
- Real-time updates
- User-generated content
- Additional celestial objects (asteroids, comets, etc.)
- Orbital mechanics and physics data
- Interactive 3D coordinates and positioning
