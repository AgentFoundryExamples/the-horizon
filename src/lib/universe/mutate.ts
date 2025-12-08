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
 * Universe data mutation utilities
 * Provides functions to create, update, and delete universe entities
 */

import {
  Universe,
  Galaxy,
  SolarSystem,
  Planet,
  Moon,
  Star,
  validateUniverse,
  validateGalaxy,
  validateSolarSystem,
  validatePlanet,
  validateMoon,
  validateStar,
} from './types';

/**
 * Generates a unique ID based on name (kebab-case)
 * Handles unicode characters by normalizing them
 * 
 * Note: Unicode normalization uses NFD decomposition and removes combining marks.
 * This handles most Latin-script diacritics (é→e, ñ→n) but has limitations:
 * - Ligatures (æ, œ) are removed entirely
 * - Emoji and symbols are removed
 * - CJK characters (Chinese, Japanese, Korean) are removed
 * For non-Latin scripts, consider providing explicit IDs.
 */
export function generateId(name: string): string {
  const trimmedName = name?.trim();
  if (!trimmedName) {
    return '';
  }
  
  // Normalize unicode characters (e.g., é -> e, ñ -> n)
  const normalized = trimmedName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  
  return normalized
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, ''); // Remove leading and trailing hyphens
}

/**
 * Generates a unique ID that doesn't collide with existing IDs in the universe
 * If the base ID exists, appends a numeric suffix (-2, -3, etc.)
 */
export function generateUniqueId(baseName: string, universe: Universe, type: 'galaxy' | 'solarSystem' | 'planet' | 'moon' | 'star'): string {
  let id = generateId(baseName);
  
  // If base ID is empty, use a timestamp-based fallback
  if (!id) {
    id = `${type}-${Date.now()}`;
  }
  
  // Use helper to ensure uniqueness
  return ensureUniqueIdWithSuffix(id, universe, type);
}

/**
 * Checks if an ID exists in the universe
 */
export function isIdUnique(universe: Universe, id: string, type: 'galaxy' | 'solarSystem' | 'planet' | 'moon' | 'star'): boolean {
  const allIds = getAllIds(universe, type);
  return !allIds.includes(id);
}

/**
 * Gets all IDs of a specific type in the universe
 */
export function getAllIds(universe: Universe, type: 'galaxy' | 'solarSystem' | 'planet' | 'moon' | 'star'): string[] {
  const ids: string[] = [];

  universe.galaxies.forEach((galaxy) => {
    if (type === 'galaxy') ids.push(galaxy.id);
    
    galaxy.stars?.forEach((star) => {
      if (type === 'star') ids.push(star.id);
    });

    galaxy.solarSystems?.forEach((solarSystem) => {
      if (type === 'solarSystem') ids.push(solarSystem.id);
      if (type === 'star') ids.push(solarSystem.mainStar.id);

      solarSystem.planets?.forEach((planet) => {
        if (type === 'planet') ids.push(planet.id);

        planet.moons?.forEach((moon) => {
          if (type === 'moon') ids.push(moon.id);
        });
      });
    });
  });

  return ids;
}

// Galaxy mutations

/**
 * Helper function to ensure unique ID by appending suffix if needed
 */
function ensureUniqueIdWithSuffix(baseId: string, universe: Universe, type: 'galaxy' | 'solarSystem' | 'planet' | 'moon' | 'star'): string {
  if (isIdUnique(universe, baseId, type)) {
    return baseId;
  }
  
  // Add numeric suffix to make it unique
  let counter = 2;
  let uniqueId = `${baseId}-${counter}`;
  while (!isIdUnique(universe, uniqueId, type)) {
    counter++;
    uniqueId = `${baseId}-${counter}`;
  }
  return uniqueId;
}

/**
 * Ensures a galaxy has a valid ID, auto-generating from name if needed
 * Also provides default values for optional fields
 * Can optionally check for ID uniqueness in a universe context
 * @throws Error if galaxy.name is missing or empty
 */
export function ensureGalaxyId(galaxy: Galaxy, universe?: Universe): Galaxy {
  if (!galaxy.name || !galaxy.name.trim()) {
    throw new Error('Galaxy name is required');
  }
  
  const id = galaxy.id?.trim();
  let generatedId = id || generateId(galaxy.name);
  
  // If ID is empty or invalid, use timestamp-based fallback
  if (!generatedId) {
    generatedId = `galaxy-${Date.now()}`;
  }
  
  // If universe is provided, ensure ID is unique
  if (universe) {
    generatedId = ensureUniqueIdWithSuffix(generatedId, universe, 'galaxy');
  }
  
  return {
    ...galaxy,
    id: generatedId,
    // Ensure arrays are initialized
    stars: galaxy.stars || [],
    solarSystems: galaxy.solarSystems || [],
  };
}

export function createGalaxy(universe: Universe, galaxy: Galaxy): Universe {
  // Ensure galaxy has a valid ID
  const galaxyWithId = ensureGalaxyId(galaxy);
  
  const validation = validateGalaxy(galaxyWithId, 'New Galaxy');
  if (!validation.valid) {
    throw new Error(`Invalid galaxy: ${validation.errors.join(', ')}`);
  }

  if (!isIdUnique(universe, galaxyWithId.id, 'galaxy')) {
    throw new Error(`Galaxy ID '${galaxyWithId.id}' already exists`);
  }

  return {
    ...universe,
    galaxies: [...universe.galaxies, galaxyWithId],
  };
}

export function updateGalaxy(universe: Universe, galaxyId: string, updates: Partial<Galaxy>): Universe {
  const galaxyIndex = universe.galaxies.findIndex((g) => g.id === galaxyId);
  if (galaxyIndex === -1) {
    throw new Error(`Galaxy '${galaxyId}' not found`);
  }

  const updatedGalaxy = { ...universe.galaxies[galaxyIndex], ...updates };
  const validation = validateGalaxy(updatedGalaxy, 'Updated Galaxy');
  if (!validation.valid) {
    throw new Error(`Invalid galaxy: ${validation.errors.join(', ')}`);
  }

  const newGalaxies = [...universe.galaxies];
  newGalaxies[galaxyIndex] = updatedGalaxy;

  return {
    ...universe,
    galaxies: newGalaxies,
  };
}

export function deleteGalaxy(universe: Universe, galaxyId: string): Universe {
  const galaxyIndex = universe.galaxies.findIndex((g) => g.id === galaxyId);
  if (galaxyIndex === -1) {
    throw new Error(`Galaxy '${galaxyId}' not found`);
  }

  return {
    ...universe,
    galaxies: universe.galaxies.filter((g) => g.id !== galaxyId),
  };
}

// Solar System mutations

export function createSolarSystem(universe: Universe, galaxyId: string, solarSystem: SolarSystem): Universe {
  const validation = validateSolarSystem(solarSystem, 'New Solar System');
  if (!validation.valid) {
    throw new Error(`Invalid solar system: ${validation.errors.join(', ')}`);
  }

  if (!isIdUnique(universe, solarSystem.id, 'solarSystem')) {
    throw new Error(`Solar System ID '${solarSystem.id}' already exists`);
  }

  const galaxyIndex = universe.galaxies.findIndex((g) => g.id === galaxyId);
  if (galaxyIndex === -1) {
    throw new Error(`Galaxy '${galaxyId}' not found`);
  }

  const newGalaxies = [...universe.galaxies];
  newGalaxies[galaxyIndex] = {
    ...newGalaxies[galaxyIndex],
    solarSystems: [...(newGalaxies[galaxyIndex].solarSystems || []), solarSystem],
  };

  return {
    ...universe,
    galaxies: newGalaxies,
  };
}

export function updateSolarSystem(universe: Universe, galaxyId: string, solarSystemId: string, updates: Partial<SolarSystem>): Universe {
  const galaxyIndex = universe.galaxies.findIndex((g) => g.id === galaxyId);
  if (galaxyIndex === -1) {
    throw new Error(`Galaxy '${galaxyId}' not found`);
  }

  const galaxy = universe.galaxies[galaxyIndex];
  const systemIndex = galaxy.solarSystems?.findIndex((s) => s.id === solarSystemId) ?? -1;
  if (systemIndex === -1) {
    throw new Error(`Solar System '${solarSystemId}' not found in galaxy '${galaxyId}'`);
  }

  const updatedSystem = { ...galaxy.solarSystems![systemIndex], ...updates };
  const validation = validateSolarSystem(updatedSystem, 'Updated Solar System');
  if (!validation.valid) {
    throw new Error(`Invalid solar system: ${validation.errors.join(', ')}`);
  }

  const newSolarSystems = [...galaxy.solarSystems!];
  newSolarSystems[systemIndex] = updatedSystem;

  const newGalaxies = [...universe.galaxies];
  newGalaxies[galaxyIndex] = {
    ...galaxy,
    solarSystems: newSolarSystems,
  };

  return {
    ...universe,
    galaxies: newGalaxies,
  };
}

export function deleteSolarSystem(universe: Universe, galaxyId: string, solarSystemId: string): Universe {
  const galaxyIndex = universe.galaxies.findIndex((g) => g.id === galaxyId);
  if (galaxyIndex === -1) {
    throw new Error(`Galaxy '${galaxyId}' not found`);
  }

  const newGalaxies = [...universe.galaxies];
  newGalaxies[galaxyIndex] = {
    ...newGalaxies[galaxyIndex],
    solarSystems: newGalaxies[galaxyIndex].solarSystems?.filter((s) => s.id !== solarSystemId) || [],
  };

  return {
    ...universe,
    galaxies: newGalaxies,
  };
}

// Planet mutations

export function createPlanet(universe: Universe, galaxyId: string, solarSystemId: string, planet: Planet): Universe {
  const validation = validatePlanet(planet, 'New Planet');
  if (!validation.valid) {
    throw new Error(`Invalid planet: ${validation.errors.join(', ')}`);
  }

  if (!isIdUnique(universe, planet.id, 'planet')) {
    throw new Error(`Planet ID '${planet.id}' already exists`);
  }

  const galaxyIndex = universe.galaxies.findIndex((g) => g.id === galaxyId);
  if (galaxyIndex === -1) {
    throw new Error(`Galaxy '${galaxyId}' not found`);
  }

  const galaxy = universe.galaxies[galaxyIndex];
  const systemIndex = galaxy.solarSystems?.findIndex((s) => s.id === solarSystemId) ?? -1;
  if (systemIndex === -1) {
    throw new Error(`Solar System '${solarSystemId}' not found in galaxy '${galaxyId}'`);
  }

  const newSolarSystems = [...galaxy.solarSystems!];
  newSolarSystems[systemIndex] = {
    ...newSolarSystems[systemIndex],
    planets: [...(newSolarSystems[systemIndex].planets || []), planet],
  };

  const newGalaxies = [...universe.galaxies];
  newGalaxies[galaxyIndex] = {
    ...galaxy,
    solarSystems: newSolarSystems,
  };

  return {
    ...universe,
    galaxies: newGalaxies,
  };
}

export function updatePlanet(universe: Universe, galaxyId: string, solarSystemId: string, planetId: string, updates: Partial<Planet>): Universe {
  const galaxyIndex = universe.galaxies.findIndex((g) => g.id === galaxyId);
  if (galaxyIndex === -1) {
    throw new Error(`Galaxy '${galaxyId}' not found`);
  }

  const galaxy = universe.galaxies[galaxyIndex];
  const systemIndex = galaxy.solarSystems?.findIndex((s) => s.id === solarSystemId) ?? -1;
  if (systemIndex === -1) {
    throw new Error(`Solar System '${solarSystemId}' not found in galaxy '${galaxyId}'`);
  }

  const solarSystem = galaxy.solarSystems![systemIndex];
  const planetIndex = solarSystem.planets?.findIndex((p) => p.id === planetId) ?? -1;
  if (planetIndex === -1) {
    throw new Error(`Planet '${planetId}' not found in solar system '${solarSystemId}'`);
  }

  const updatedPlanet = { ...solarSystem.planets![planetIndex], ...updates };
  const validation = validatePlanet(updatedPlanet, 'Updated Planet');
  if (!validation.valid) {
    throw new Error(`Invalid planet: ${validation.errors.join(', ')}`);
  }

  const newPlanets = [...solarSystem.planets!];
  newPlanets[planetIndex] = updatedPlanet;

  const newSolarSystems = [...galaxy.solarSystems!];
  newSolarSystems[systemIndex] = {
    ...solarSystem,
    planets: newPlanets,
  };

  const newGalaxies = [...universe.galaxies];
  newGalaxies[galaxyIndex] = {
    ...galaxy,
    solarSystems: newSolarSystems,
  };

  return {
    ...universe,
    galaxies: newGalaxies,
  };
}

export function deletePlanet(universe: Universe, galaxyId: string, solarSystemId: string, planetId: string): Universe {
  const galaxyIndex = universe.galaxies.findIndex((g) => g.id === galaxyId);
  if (galaxyIndex === -1) {
    throw new Error(`Galaxy '${galaxyId}' not found`);
  }

  const galaxy = universe.galaxies[galaxyIndex];
  const systemIndex = galaxy.solarSystems?.findIndex((s) => s.id === solarSystemId) ?? -1;
  if (systemIndex === -1) {
    throw new Error(`Solar System '${solarSystemId}' not found in galaxy '${galaxyId}'`);
  }

  const newSolarSystems = [...galaxy.solarSystems!];
  newSolarSystems[systemIndex] = {
    ...newSolarSystems[systemIndex],
    planets: newSolarSystems[systemIndex].planets?.filter((p) => p.id !== planetId) || [],
  };

  const newGalaxies = [...universe.galaxies];
  newGalaxies[galaxyIndex] = {
    ...galaxy,
    solarSystems: newSolarSystems,
  };

  return {
    ...universe,
    galaxies: newGalaxies,
  };
}

// Moon mutations

export function createMoon(universe: Universe, galaxyId: string, solarSystemId: string, planetId: string, moon: Moon): Universe {
  const validation = validateMoon(moon, 'New Moon');
  if (!validation.valid) {
    throw new Error(`Invalid moon: ${validation.errors.join(', ')}`);
  }

  if (!isIdUnique(universe, moon.id, 'moon')) {
    throw new Error(`Moon ID '${moon.id}' already exists`);
  }

  const galaxyIndex = universe.galaxies.findIndex((g) => g.id === galaxyId);
  if (galaxyIndex === -1) {
    throw new Error(`Galaxy '${galaxyId}' not found`);
  }

  const galaxy = universe.galaxies[galaxyIndex];
  const systemIndex = galaxy.solarSystems?.findIndex((s) => s.id === solarSystemId) ?? -1;
  if (systemIndex === -1) {
    throw new Error(`Solar System '${solarSystemId}' not found in galaxy '${galaxyId}'`);
  }

  const solarSystem = galaxy.solarSystems![systemIndex];
  const planetIndex = solarSystem.planets?.findIndex((p) => p.id === planetId) ?? -1;
  if (planetIndex === -1) {
    throw new Error(`Planet '${planetId}' not found in solar system '${solarSystemId}'`);
  }

  const newPlanets = [...solarSystem.planets!];
  newPlanets[planetIndex] = {
    ...newPlanets[planetIndex],
    moons: [...(newPlanets[planetIndex].moons || []), moon],
  };

  const newSolarSystems = [...galaxy.solarSystems!];
  newSolarSystems[systemIndex] = {
    ...solarSystem,
    planets: newPlanets,
  };

  const newGalaxies = [...universe.galaxies];
  newGalaxies[galaxyIndex] = {
    ...galaxy,
    solarSystems: newSolarSystems,
  };

  return {
    ...universe,
    galaxies: newGalaxies,
  };
}

export function updateMoon(universe: Universe, galaxyId: string, solarSystemId: string, planetId: string, moonId: string, updates: Partial<Moon>): Universe {
  const galaxyIndex = universe.galaxies.findIndex((g) => g.id === galaxyId);
  if (galaxyIndex === -1) {
    throw new Error(`Galaxy '${galaxyId}' not found`);
  }

  const galaxy = universe.galaxies[galaxyIndex];
  const systemIndex = galaxy.solarSystems?.findIndex((s) => s.id === solarSystemId) ?? -1;
  if (systemIndex === -1) {
    throw new Error(`Solar System '${solarSystemId}' not found in galaxy '${galaxyId}'`);
  }

  const solarSystem = galaxy.solarSystems![systemIndex];
  const planetIndex = solarSystem.planets?.findIndex((p) => p.id === planetId) ?? -1;
  if (planetIndex === -1) {
    throw new Error(`Planet '${planetId}' not found in solar system '${solarSystemId}'`);
  }

  const planet = solarSystem.planets![planetIndex];
  const moonIndex = planet.moons?.findIndex((m) => m.id === moonId) ?? -1;
  if (moonIndex === -1) {
    throw new Error(`Moon '${moonId}' not found in planet '${planetId}'`);
  }

  const updatedMoon = { ...planet.moons![moonIndex], ...updates };
  const validation = validateMoon(updatedMoon, 'Updated Moon');
  if (!validation.valid) {
    throw new Error(`Invalid moon: ${validation.errors.join(', ')}`);
  }

  const newMoons = [...planet.moons!];
  newMoons[moonIndex] = updatedMoon;

  const newPlanets = [...solarSystem.planets!];
  newPlanets[planetIndex] = {
    ...planet,
    moons: newMoons,
  };

  const newSolarSystems = [...galaxy.solarSystems!];
  newSolarSystems[systemIndex] = {
    ...solarSystem,
    planets: newPlanets,
  };

  const newGalaxies = [...universe.galaxies];
  newGalaxies[galaxyIndex] = {
    ...galaxy,
    solarSystems: newSolarSystems,
  };

  return {
    ...universe,
    galaxies: newGalaxies,
  };
}

export function deleteMoon(universe: Universe, galaxyId: string, solarSystemId: string, planetId: string, moonId: string): Universe {
  const galaxyIndex = universe.galaxies.findIndex((g) => g.id === galaxyId);
  if (galaxyIndex === -1) {
    throw new Error(`Galaxy '${galaxyId}' not found`);
  }

  const galaxy = universe.galaxies[galaxyIndex];
  const systemIndex = galaxy.solarSystems?.findIndex((s) => s.id === solarSystemId) ?? -1;
  if (systemIndex === -1) {
    throw new Error(`Solar System '${solarSystemId}' not found in galaxy '${galaxyId}'`);
  }

  const solarSystem = galaxy.solarSystems![systemIndex];
  const planetIndex = solarSystem.planets?.findIndex((p) => p.id === planetId) ?? -1;
  if (planetIndex === -1) {
    throw new Error(`Planet '${planetId}' not found in solar system '${solarSystemId}'`);
  }

  const newPlanets = [...solarSystem.planets!];
  newPlanets[planetIndex] = {
    ...newPlanets[planetIndex],
    moons: newPlanets[planetIndex].moons?.filter((m) => m.id !== moonId) || [],
  };

  const newSolarSystems = [...galaxy.solarSystems!];
  newSolarSystems[systemIndex] = {
    ...solarSystem,
    planets: newPlanets,
  };

  const newGalaxies = [...universe.galaxies];
  newGalaxies[galaxyIndex] = {
    ...galaxy,
    solarSystems: newSolarSystems,
  };

  return {
    ...universe,
    galaxies: newGalaxies,
  };
}

// Star mutations

export function createStar(universe: Universe, galaxyId: string, star: Star): Universe {
  const validation = validateStar(star, 'New Star');
  if (!validation.valid) {
    throw new Error(`Invalid star: ${validation.errors.join(', ')}`);
  }

  if (!isIdUnique(universe, star.id, 'star')) {
    throw new Error(`Star ID '${star.id}' already exists`);
  }

  const galaxyIndex = universe.galaxies.findIndex((g) => g.id === galaxyId);
  if (galaxyIndex === -1) {
    throw new Error(`Galaxy '${galaxyId}' not found`);
  }

  const newGalaxies = [...universe.galaxies];
  newGalaxies[galaxyIndex] = {
    ...newGalaxies[galaxyIndex],
    stars: [...(newGalaxies[galaxyIndex].stars || []), star],
  };

  return {
    ...universe,
    galaxies: newGalaxies,
  };
}

export function updateStar(universe: Universe, galaxyId: string, starId: string, updates: Partial<Star>): Universe {
  const galaxyIndex = universe.galaxies.findIndex((g) => g.id === galaxyId);
  if (galaxyIndex === -1) {
    throw new Error(`Galaxy '${galaxyId}' not found`);
  }

  const galaxy = universe.galaxies[galaxyIndex];
  const starIndex = galaxy.stars?.findIndex((s) => s.id === starId) ?? -1;
  if (starIndex === -1) {
    throw new Error(`Star '${starId}' not found in galaxy '${galaxyId}'`);
  }

  const updatedStar = { ...galaxy.stars![starIndex], ...updates };
  const validation = validateStar(updatedStar, 'Updated Star');
  if (!validation.valid) {
    throw new Error(`Invalid star: ${validation.errors.join(', ')}`);
  }

  const newStars = [...galaxy.stars!];
  newStars[starIndex] = updatedStar;

  const newGalaxies = [...universe.galaxies];
  newGalaxies[galaxyIndex] = {
    ...galaxy,
    stars: newStars,
  };

  return {
    ...universe,
    galaxies: newGalaxies,
  };
}

export function deleteStar(universe: Universe, galaxyId: string, starId: string): Universe {
  const galaxyIndex = universe.galaxies.findIndex((g) => g.id === galaxyId);
  if (galaxyIndex === -1) {
    throw new Error(`Galaxy '${galaxyId}' not found`);
  }

  const newGalaxies = [...universe.galaxies];
  newGalaxies[galaxyIndex] = {
    ...newGalaxies[galaxyIndex],
    stars: newGalaxies[galaxyIndex].stars?.filter((s) => s.id !== starId) || [],
  };

  return {
    ...universe,
    galaxies: newGalaxies,
  };
}

/**
 * Serializes universe to JSON string with pretty formatting
 */
export function serializeUniverse(universe: Universe): string {
  return JSON.stringify(universe, null, 2);
}

/**
 * Parses and validates universe JSON
 */
export function parseAndValidateUniverse(json: string): { universe: Universe; errors: string[] } {
  try {
    const universe = JSON.parse(json) as Universe;
    const validation = validateUniverse(universe);
    return {
      universe,
      errors: validation.errors,
    };
  } catch (error) {
    return {
      universe: { galaxies: [] },
      errors: [`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };
  }
}
