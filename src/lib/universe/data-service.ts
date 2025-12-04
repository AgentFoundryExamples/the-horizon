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
 * Loads and validates universe data
 * Returns sanitized data even if validation fails (with warnings logged)
 */
export async function loadUniverse(): Promise<Universe> {
  if (cachedUniverse) {
    return cachedUniverse;
  }

  try {
    // Try static import first
    let data: Universe = universeData as Universe;

    // Fallback to fetch if static import fails or in certain environments
    if (!data || !data.galaxies) {
      const response = await fetch('/universe/universe.json');
      if (!response.ok) {
        throw new Error(`Failed to load universe data: ${response.statusText}`);
      }
      data = await response.json();
    }

    // Validate the data structure
    const validation = validateUniverse(data);
    if (!validation.valid) {
      validationErrors = validation.errors;
      console.warn('Universe data validation warnings:', validation.errors);
    }

    // Sanitize the data to provide defaults for missing content
    cachedUniverse = sanitizeUniverse(data);
    return cachedUniverse;
  } catch (error) {
    console.error('Failed to load universe data:', error);
    
    // Return empty but valid universe structure as fallback
    cachedUniverse = { galaxies: [] };
    return cachedUniverse;
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
