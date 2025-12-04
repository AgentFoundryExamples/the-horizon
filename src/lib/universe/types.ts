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

export interface Moon {
  id: string;
  name: string;
  contentMarkdown: string;
}

export interface Planet {
  id: string;
  name: string;
  theme: string;
  summary: string;
  contentMarkdown: string;
  moons: Moon[];
}

export interface Star {
  id: string;
  name: string;
  theme: string;
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
