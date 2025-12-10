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
 * Core data models for the Horizon universe
 * Describes the hierarchical structure: Universe > Galaxy > SolarSystem > Planet > Moon
 * and independent Stars
 */

/**
 * Hash tracking for admin editor optimistic locking
 * 
 * The admin editor maintains two separate hashes to prevent false conflicts:
 * 
 * - gitBaseHash: The immutable GitHub baseline hash that serves as the comparison target
 *   for commit operations. This hash only updates after a successful commit to GitHub
 *   or when explicitly refreshing from GitHub. It is never modified by local save operations.
 * 
 * - localDiskHash: The current hash of the local file on disk. This updates after each
 *   save-to-disk operation and is used to detect concurrent local modifications.
 * 
 * This dual-hash approach ensures that:
 * 1. Local saves don't interfere with GitHub baseline tracking
 * 2. Commits use the correct baseline for optimistic locking
 * 3. Concurrent edits by multiple admins can be detected
 * 4. The workflow remains: edit → save to disk → commit to GitHub
 */
export interface AdminHashTracking {
  /**
   * GitHub baseline hash - immutable until successful commit or explicit refresh
   * Used for GitHub API operations and optimistic locking against remote changes
   */
  gitBaseHash: string;
  
  /**
   * Local disk file hash - updates after each save to disk
   * Used for detecting concurrent local modifications
   */
  localDiskHash: string;
}

/**
 * Visual theme configuration for celestial bodies (planets/moons)
 * Controls rendering appearance including textures, materials, and effects
 */
export interface CelestialVisualTheme {
  /**
   * Preset theme type (e.g., 'rocky', 'gasGiant', 'icy', 'volcanic', 'earth-like')
   * Used to select default visual parameters when custom values not provided
   */
  preset?: string;
  
  /**
   * URL or path to diffuse texture (main surface color/pattern)
   * Falls back to solid color from theme if not provided
   */
  diffuseTexture?: string | undefined;
  
  /**
   * URL or path to normal map texture (surface detail/bumps)
   * Enhances visual depth without geometry complexity
   */
  normalTexture?: string | undefined;
  
  /**
   * URL or path to specular/roughness map (reflectivity)
   * Controls how light reflects off the surface
   */
  specularTexture?: string | undefined;
  
  /**
   * Hex color for theme-colored glow/border effect
   * Default: derived from main theme color
   */
  glowColor?: string;
  
  /**
   * Intensity of glow effect (0-1, default: 0.3)
   * Higher values create more prominent halos
   */
  glowIntensity?: number;
  
  /**
   * Rotation speed multiplier (default: 1.0)
   * Controls texture/rotation animation speed
   */
  rotationSpeed?: number;
}

export interface Moon {
  id: string;
  name: string;
  contentMarkdown: string;
  publishedDate?: string; // ISO 8601 date string (optional)
  tags?: string[]; // Array of tags for categorization (optional)
  featuredImage?: string; // URL or path to featured image (optional)
  visualTheme?: CelestialVisualTheme; // Visual rendering configuration (optional)
}

export interface Planet {
  id: string;
  name: string;
  theme: string;
  summary: string;
  contentMarkdown: string;
  moons: Moon[];
  publishedDate?: string; // ISO 8601 date string (optional)
  author?: string; // Content author name (optional)
  tags?: string[]; // Array of tags for categorization (optional)
  externalLinks?: ExternalLink[]; // Links to related resources (optional)
  featuredImage?: string; // URL or path to featured image (optional)
  layoutConfig?: PlanetLayoutConfig; // Layout customization (optional)
  visualTheme?: CelestialVisualTheme; // Visual rendering configuration (optional)
}

export interface ExternalLink {
  title: string;
  url: string;
  description?: string;
}

/**
 * Layout configuration for Planet Viewer
 * Controls the positioning and scale of the 3D planet render and content panel
 * All values are clamped to safe ranges to prevent layout breaking
 */
export interface PlanetLayoutConfig {
  /**
   * Width percentage of the planet visualization column (left side)
   * Range: 20-50 (default: 30)
   * At 30%, planet takes left 30% and content takes remaining 70%
   */
  planetColumnWidth?: number;
  
  /**
   * Scale multiplier for the 3D planet render
   * Range: 0.5-2.0 (default: 1.0)
   * Controls the size of the planet sphere in the visualization
   */
  planetRenderScale?: number;
  
  /**
   * Horizontal position offset for planet (-50 to 50, default: 0)
   * Adjusts planet position within its column (0 = centered)
   */
  planetOffsetX?: number;
  
  /**
   * Vertical position offset for planet (-50 to 50, default: 0)
   * Adjusts planet position within its column (0 = centered)
   */
  planetOffsetY?: number;
  
  /**
   * Content panel padding in rem units
   * Range: 1-4 (default: 2)
   */
  contentPadding?: number;
  
  /**
   * Maximum width of content column in pixels
   * Range: 600-1200 (default: 800)
   */
  contentMaxWidth?: number;
}

/**
 * Halo and visual configuration for stars
 * Controls rendering of star surfaces, halos, and lighting effects
 */
export interface StarHaloConfig {
  /**
   * Halo intensity/strength (0-100, default: 50)
   * Controls prominence of the glow/halo around the star
   */
  haloIntensity?: number;
  
  /**
   * URL or path to star surface texture
   * Adds detail to the star sphere (e.g., solar flares, spots)
   */
  texture?: string | undefined;
  
  /**
   * Hex color for star and halo (default: from theme)
   * Overrides theme-based coloring if provided
   */
  color?: string;
  
  /**
   * Halo radius multiplier (default: 1.5)
   * Controls size of glow relative to star radius
   */
  haloRadius?: number;
}

export interface Star {
  id: string;
  name: string;
  theme: string;
  haloConfig?: StarHaloConfig; // Visual halo configuration (optional)
}

export interface SolarSystem {
  id: string;
  name: string;
  theme: string;
  mainStar: Star;
  planets: Planet[];
}

export interface Galaxy {
  id: string;
  name: string;
  description: string;
  theme: string;
  particleColor: string;
  stars: Star[];
  solarSystems: SolarSystem[];
  /**
   * Optional manual radius override for this galaxy
   * If specified, this galaxy will render at this fixed size
   * regardless of the total galaxy count
   */
  manualRadius?: number;
}

export interface Universe {
  galaxies: Galaxy[];
}

/**
 * Validation result type
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates that required markdown content exists
 */
export function validateMarkdownContent(content: string | undefined, fieldName: string): string[] {
  const errors: string[] = [];
  if (!content || content.trim().length === 0) {
    errors.push(`${fieldName} is required and cannot be empty`);
  }
  return errors;
}

/**
 * Validates a Moon object
 */
export function validateMoon(moon: Moon, context: string): ValidationResult {
  const errors: string[] = [];
  
  if (!moon.id || moon.id.trim().length === 0) {
    errors.push(`${context}: Moon id is required`);
  }
  
  if (!moon.name || moon.name.trim().length === 0) {
    errors.push(`${context}: Moon name is required`);
  }
  
  errors.push(...validateMarkdownContent(moon.contentMarkdown, `${context}: Moon contentMarkdown`));
  
  return { valid: errors.length === 0, errors };
}

/**
 * Validates an external link object
 */
export function validateExternalLink(link: ExternalLink, context: string): ValidationResult {
  const errors: string[] = [];
  
  if (!link.title || link.title.trim().length === 0) {
    errors.push(`${context}: Link title is required`);
  }
  
  if (!link.url || link.url.trim().length === 0) {
    errors.push(`${context}: Link URL is required`);
  } else {
    // Validate URL format and protocol
    try {
      const url = new URL(link.url);
      if (!['http:', 'https:'].includes(url.protocol)) {
        errors.push(`${context}: Link URL must use http or https protocol`);
      }
    } catch (error: unknown) {
      errors.push(`${context}: Link URL is not a valid URL`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Checks for duplicate URLs in a list of external links
 */
export function checkDuplicateLinks(links: ExternalLink[], context: string): string[] {
  const errors: string[] = [];
  const seenUrls = new Map<string, number>();
  
  links.forEach((link, index) => {
    const normalizedUrl = link.url?.trim().toLowerCase();
    if (normalizedUrl) {
      const firstIndex = seenUrls.get(normalizedUrl);
      if (firstIndex !== undefined) {
        errors.push(`${context}: Duplicate URL at index ${index}: "${link.url}" (first seen at index ${firstIndex})`);
      } else {
        seenUrls.set(normalizedUrl, index);
      }
    }
  });
  
  return errors;
}

/**
 * Validates a Planet object
 */
export function validatePlanet(planet: Planet, context: string): ValidationResult {
  const errors: string[] = [];
  
  if (!planet.id || planet.id.trim().length === 0) {
    errors.push(`${context}: Planet id is required`);
  }
  
  if (!planet.name || planet.name.trim().length === 0) {
    errors.push(`${context}: Planet name is required`);
  }
  
  if (!planet.theme || planet.theme.trim().length === 0) {
    errors.push(`${context}: Planet theme is required`);
  }
  
  if (!planet.summary || planet.summary.trim().length === 0) {
    errors.push(`${context}: Planet summary is required`);
  }
  
  errors.push(...validateMarkdownContent(planet.contentMarkdown, `${context}: Planet contentMarkdown`));
  
  if (planet.moons) {
    planet.moons.forEach((moon, index) => {
      const moonValidation = validateMoon(moon, `${context} > Moon[${index}] (${moon.name || 'unnamed'})`);
      errors.push(...moonValidation.errors);
    });
  }
  
  // Validate external links if present
  if (planet.externalLinks && planet.externalLinks.length > 0) {
    planet.externalLinks.forEach((link, index) => {
      const linkValidation = validateExternalLink(link, `${context} > Link[${index}]`);
      errors.push(...linkValidation.errors);
    });
    
    // Check for duplicate URLs
    errors.push(...checkDuplicateLinks(planet.externalLinks, context));
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Validates a Star object
 */
export function validateStar(star: Star, context: string): ValidationResult {
  const errors: string[] = [];
  
  if (!star.id || star.id.trim().length === 0) {
    errors.push(`${context}: Star id is required`);
  }
  
  if (!star.name || star.name.trim().length === 0) {
    errors.push(`${context}: Star name is required`);
  }
  
  if (!star.theme || star.theme.trim().length === 0) {
    errors.push(`${context}: Star theme is required`);
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Validates a SolarSystem object
 */
export function validateSolarSystem(solarSystem: SolarSystem, context: string): ValidationResult {
  const errors: string[] = [];
  
  if (!solarSystem.id || solarSystem.id.trim().length === 0) {
    errors.push(`${context}: SolarSystem id is required`);
  }
  
  if (!solarSystem.name || solarSystem.name.trim().length === 0) {
    errors.push(`${context}: SolarSystem name is required`);
  }
  
  if (!solarSystem.theme || solarSystem.theme.trim().length === 0) {
    errors.push(`${context}: SolarSystem theme is required`);
  }
  
  if (!solarSystem.mainStar) {
    errors.push(`${context}: SolarSystem mainStar is required`);
  } else {
    const starValidation = validateStar(solarSystem.mainStar, `${context} > MainStar`);
    errors.push(...starValidation.errors);
  }
  
  if (solarSystem.planets) {
    solarSystem.planets.forEach((planet, index) => {
      const planetValidation = validatePlanet(planet, `${context} > Planet[${index}] (${planet.name || 'unnamed'})`);
      errors.push(...planetValidation.errors);
    });
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Validates a Galaxy object
 */
export function validateGalaxy(galaxy: Galaxy, context: string): ValidationResult {
  const errors: string[] = [];
  
  if (!galaxy.id || galaxy.id.trim().length === 0) {
    errors.push(`${context}: Galaxy id is required`);
  }
  
  if (!galaxy.name || galaxy.name.trim().length === 0) {
    errors.push(`${context}: Galaxy name is required`);
  }
  
  if (!galaxy.description || galaxy.description.trim().length === 0) {
    errors.push(`${context}: Galaxy description is required`);
  }
  
  if (!galaxy.theme || galaxy.theme.trim().length === 0) {
    errors.push(`${context}: Galaxy theme is required`);
  }
  
  if (!galaxy.particleColor || galaxy.particleColor.trim().length === 0) {
    errors.push(`${context}: Galaxy particleColor is required`);
  }
  
  if (galaxy.stars) {
    galaxy.stars.forEach((star, index) => {
      const starValidation = validateStar(star, `${context} > Star[${index}] (${star.name || 'unnamed'})`);
      errors.push(...starValidation.errors);
    });
  }
  
  if (galaxy.solarSystems) {
    galaxy.solarSystems.forEach((solarSystem, index) => {
      const solarSystemValidation = validateSolarSystem(solarSystem, `${context} > SolarSystem[${index}] (${solarSystem.name || 'unnamed'})`);
      errors.push(...solarSystemValidation.errors);
    });
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Validates the entire Universe object
 */
export function validateUniverse(universe: Universe): ValidationResult {
  const errors: string[] = [];
  
  if (!universe.galaxies) {
    errors.push('Universe must contain a galaxies array');
    return { valid: false, errors };
  }
  
  if (!Array.isArray(universe.galaxies)) {
    errors.push('Universe.galaxies must be an array');
    return { valid: false, errors };
  }
  
  universe.galaxies.forEach((galaxy, index) => {
    const galaxyValidation = validateGalaxy(galaxy, `Galaxy[${index}] (${galaxy.name || 'unnamed'})`);
    errors.push(...galaxyValidation.errors);
  });
  
  return { valid: errors.length === 0, errors };
}
