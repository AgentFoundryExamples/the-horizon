/**
 * Universe data loading service
 * Handles loading, caching, and providing typed access to universe data
 */

import type { Universe, Galaxy, SolarSystem, Planet, Moon, Star } from './types';
import { validateUniverse } from './types';

// Import the universe data statically
// JSON imports are handled differently in Jest vs runtime, so we need defensive code
import universeDataModule from '../../../public/universe/universe.json';

// Handle both default and named exports from JSON depending on environment
// This supports both Jest mocks and Next.js runtime imports
const universeData: Universe = 
  (universeDataModule as { default?: Universe } & Universe).default || 
  (universeDataModule as Universe);

/**
 * Cached universe data
 */
let cachedUniverse: Universe | null = null;
let validationErrors: string[] = [];

/**
 * Default placeholder content for missing markdown
 */
const PLACEHOLDER_CONTENT = '*Content coming soon...*';

/**
 * Ensures markdown content exists, providing a placeholder if missing
 */
function ensureMarkdownContent(content: string | undefined): string {
  if (!content || content.trim().length === 0) {
    return PLACEHOLDER_CONTENT;
  }
  return content;
}

/**
 * Sanitizes moon data to ensure markdown content exists
 */
function sanitizeMoon(moon: Moon): Moon {
  return {
    ...moon,
    contentMarkdown: ensureMarkdownContent(moon.contentMarkdown),
  };
}

/**
 * Sanitizes planet data to ensure markdown content exists
 */
function sanitizePlanet(planet: Planet): Planet {
  return {
    ...planet,
    contentMarkdown: ensureMarkdownContent(planet.contentMarkdown),
    moons: planet.moons ? planet.moons.map(sanitizeMoon) : [],
  };
}

/**
 * Sanitizes solar system data
 */
function sanitizeSolarSystem(solarSystem: SolarSystem): SolarSystem {
  return {
    ...solarSystem,
    planets: solarSystem.planets ? solarSystem.planets.map(sanitizePlanet) : [],
  };
}

/**
 * Sanitizes galaxy data
 */
function sanitizeGalaxy(galaxy: Galaxy): Galaxy {
  return {
    ...galaxy,
    stars: galaxy.stars || [],
    solarSystems: galaxy.solarSystems ? galaxy.solarSystems.map(sanitizeSolarSystem) : [],
  };
}

/**
 * Sanitizes universe data to handle missing content gracefully
 */
function sanitizeUniverse(universe: Universe): Universe {
  return {
    galaxies: universe.galaxies ? universe.galaxies.map(sanitizeGalaxy) : [],
  };
}

/**
 * Formats an error message from an unknown error type
 */
function formatErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Loads universe data from filesystem (Node.js environment)
 */
async function loadFromFilesystem(): Promise<Universe> {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    const filePath = path.join(process.cwd(), 'public', 'universe', 'universe.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    return JSON.parse(fileContents) as Universe;
  } catch (error) {
    throw new Error(`Failed to load universe data from filesystem: ${formatErrorMessage(error)}`);
  }
}

/**
 * Loads universe data from HTTP fetch (browser environment)
 */
async function loadFromFetch(): Promise<Universe> {
  try {
    const response = await fetch('/universe/universe.json');
    if (!response.ok) {
      throw new Error(`Failed to load universe data: ${response.statusText} (${response.status})`);
    }
    return await response.json() as Universe;
  } catch (error) {
    throw new Error(`Failed to fetch universe data: ${formatErrorMessage(error)}`);
  }
}

/**
 * Loads and validates universe data
 * Throws an error if data cannot be loaded, allowing callers to handle failures appropriately
 * 
 * @throws {Error} When universe data cannot be loaded or validated
 */
export async function loadUniverse(): Promise<Universe> {
  if (cachedUniverse) {
    return cachedUniverse;
  }

  try {
    // Try static import first
    let data: Universe = universeData as Universe;

    // Fallback to dynamic loading if static import fails or in certain environments
    // Priority: filesystem (Node.js/SSR) > fetch (browser)
    if (!data || !data.galaxies) {
      const missingReason = !data ? 'data is null/undefined' : 'data.galaxies is missing';
      console.warn(`Static universe import invalid (${missingReason}), attempting dynamic load`);
      
      // Check if we're in a Node.js environment (SSR/SSG)
      if (typeof window === 'undefined') {
        data = await loadFromFilesystem();
      } else {
        // Browser environment
        data = await loadFromFetch();
      }
    }

    // Validate the data structure
    const validation = validateUniverse(data);
    if (!validation.valid) {
      validationErrors = validation.errors;
      console.error('Universe data validation failed:', validation.errors);
      throw new Error(`Universe data validation failed: ${validation.errors.join('; ')}`);
    }

    // Sanitize the data to provide defaults for missing content
    cachedUniverse = sanitizeUniverse(data);
    return cachedUniverse;
  } catch (error) {
    // Re-throw with context - let callers decide how to handle
    const errorMessage = formatErrorMessage(error);
    console.error('Critical error loading universe data:', errorMessage);
    
    // For graceful degradation in production, return empty universe
    // but log the error prominently for debugging
    if (process.env.NODE_ENV === 'production') {
      console.error('PRODUCTION ERROR: Returning empty universe as fallback');
      cachedUniverse = { galaxies: [] };
      return cachedUniverse;
    }
    
    // In development, throw the error to surface it immediately
    throw new Error(`Failed to load universe data: ${errorMessage}`);
  }
}

/**
 * Gets all galaxies
 */
export async function getGalaxies(): Promise<Galaxy[]> {
  const universe = await loadUniverse();
  return universe.galaxies || [];
}

/**
 * Gets a galaxy by ID
 */
export async function getGalaxyById(id: string): Promise<Galaxy | undefined> {
  const galaxies = await getGalaxies();
  return galaxies.find(g => g.id === id);
}

/**
 * Gets all solar systems across all galaxies
 */
export async function getAllSolarSystems(): Promise<SolarSystem[]> {
  const galaxies = await getGalaxies();
  return galaxies.flatMap(g => g.solarSystems || []);
}

/**
 * Gets a solar system by ID
 */
export async function getSolarSystemById(id: string): Promise<SolarSystem | undefined> {
  const solarSystems = await getAllSolarSystems();
  return solarSystems.find(s => s.id === id);
}

/**
 * Gets all planets across all solar systems
 */
export async function getAllPlanets(): Promise<Planet[]> {
  const solarSystems = await getAllSolarSystems();
  return solarSystems.flatMap(s => s.planets || []);
}

/**
 * Gets a planet by ID
 */
export async function getPlanetById(id: string): Promise<Planet | undefined> {
  const planets = await getAllPlanets();
  return planets.find(p => p.id === id);
}

/**
 * Gets all moons across all planets
 */
export async function getAllMoons(): Promise<Moon[]> {
  const planets = await getAllPlanets();
  return planets.flatMap(p => p.moons || []);
}

/**
 * Gets a moon by ID
 */
export async function getMoonById(id: string): Promise<Moon | undefined> {
  const moons = await getAllMoons();
  return moons.find(m => m.id === id);
}

/**
 * Gets all stars across all galaxies (both free-floating and main stars)
 */
export async function getAllStars(): Promise<Star[]> {
  const galaxies = await getGalaxies();
  const freeStars = galaxies.flatMap(g => g.stars || []);
  const mainStars = galaxies.flatMap(g => 
    (g.solarSystems || []).map(s => s.mainStar)
  );
  return [...freeStars, ...mainStars];
}

/**
 * Gets a star by ID
 */
export async function getStarById(id: string): Promise<Star | undefined> {
  const stars = await getAllStars();
  return stars.find(s => s.id === id);
}

/**
 * Returns any validation errors from the last load
 */
export function getValidationErrors(): string[] {
  return [...validationErrors];
}

/**
 * Clears the cache (useful for testing or hot-reloading)
 */
export function clearCache(): void {
  cachedUniverse = null;
  validationErrors = [];
}
