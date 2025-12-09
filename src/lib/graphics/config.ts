/**
 * Graphics Configuration System
 * 
 * Provides a structured, centralized configuration surface for all rendering systems.
 * Supports per-view overrides, designer-friendly defaults, and runtime validation.
 */

/**
 * Hover label configuration for interactive elements
 */
export interface HoverLabelConfig {
  /**
   * Whether hover labels are enabled
   * @default true
   */
  enabled?: boolean;
  
  /**
   * Font size in pixels
   * @range 10-24
   * @default 14
   */
  fontSize?: number;
  
  /**
   * Label background opacity
   * @range 0-1
   * @default 0.85
   */
  backgroundOpacity?: number;
  
  /**
   * Distance threshold for label visibility in world units
   * @range 0-100
   * @default 50
   */
  visibilityDistance?: number;
  
  /**
   * Delay before showing label in milliseconds
   * @range 0-1000
   * @default 200
   */
  showDelay?: number;
}

/**
 * Texture preset reference for planet materials
 */
export interface TexturePreset {
  /**
   * Unique identifier for the texture preset
   * Must match one of the predefined preset names
   */
  name: string;
  
  /**
   * Optional path override for base texture
   */
  baseTexturePath?: string;
  
  /**
   * Optional path override for normal map
   */
  normalMapPath?: string;
  
  /**
   * Optional path override for specular map
   */
  specularMapPath?: string;
}

/**
 * Universe-level graphics settings
 * Global configurations that affect the entire scene
 */
export interface UniverseConfig {
  /**
   * Global scale multiplier for all objects
   * @range 0.1-5.0
   * @default 1.0
   */
  globalScaleMultiplier?: number;
  
  /**
   * Background star field density
   * @range 0-1
   * @default 0.5
   */
  backgroundStarDensity?: number;
  
  /**
   * Enable low-power/mobile optimization mode
   * Reduces particle counts, disables expensive effects
   * @default false
   */
  lowPowerMode?: boolean;
  
  /**
   * Fallback quality level when auto-detection fails
   * @range 1-3 (1=low, 2=medium, 3=high)
   * @default 2
   */
  fallbackQuality?: number;
  
  /**
   * Enable anti-aliasing
   * @default true
   */
  antiAliasing?: boolean;
  
  /**
   * Shadow quality level
   * @range 0-2 (0=off, 1=low, 2=high)
   * @default 1
   */
  shadowQuality?: number;
}

/**
 * Galaxy view specific settings
 */
export interface GalaxyViewConfig {
  /**
   * Galaxy particle opacity
   * @range 0-1
   * @default 0.7
   */
  galaxyOpacity?: number;
  
  /**
   * Star brightness multiplier
   * @range 0.1-3.0
   * @default 1.0
   */
  starBrightness?: number;
  
  /**
   * Star density (number of particles)
   * @range 0.1-2.0
   * @default 1.0
   */
  starDensity?: number;
  
  /**
   * Rotation speed multiplier for galaxy animation
   * @range 0-5.0
   * @default 1.0
   */
  rotationSpeed?: number;
  
  /**
   * Camera zoom level multiplier
   * @range 0.5-2.0
   * @default 1.0
   */
  cameraZoom?: number;
  
  /**
   * Hover label configuration for galaxies
   */
  hoverLabels?: HoverLabelConfig;
}

/**
 * Solar system view specific settings
 */
export interface SolarSystemViewConfig {
  /**
   * Orbit path stroke width
   * @range 0.5-5.0
   * @default 1.5
   */
  orbitStrokeWidth?: number;
  
  /**
   * Planet scale multiplier within solar system
   * @range 0.1-3.0
   * @default 1.0
   */
  planetScaleMultiplier?: number;
  
  /**
   * Orbit animation speed
   * @range 0-10.0
   * @default 1.0
   */
  orbitAnimationSpeed?: number;
  
  /**
   * Star glow intensity
   * @range 0-2.0
   * @default 1.0
   */
  starGlowIntensity?: number;
  
  /**
   * Distance between orbital planes
   * @range 0.5-3.0
   * @default 1.0
   */
  orbitalSpacing?: number;
  
  /**
   * Camera distance multiplier
   * @range 0.5-2.0
   * @default 1.0
   */
  cameraDistance?: number;
  
  /**
   * Hover label configuration for planets in solar system
   */
  hoverLabels?: HoverLabelConfig;
}

/**
 * Planet view specific settings
 */
export interface PlanetViewConfig {
  /**
   * 3D planet render scale
   * @range 0.5-2.0
   * @default 1.0
   */
  planetRenderScale?: number;
  
  /**
   * Planet rotation speed
   * @range 0-5.0
   * @default 1.0
   */
  rotationSpeed?: number;
  
  /**
   * Atmospheric glow intensity
   * @range 0-2.0
   * @default 1.0
   */
  atmosphereGlow?: number;
  
  /**
   * Cloud layer opacity (if applicable)
   * @range 0-1
   * @default 0.6
   */
  cloudOpacity?: number;
  
  /**
   * Lighting intensity
   * @range 0.1-3.0
   * @default 1.0
   */
  lightingIntensity?: number;
  
  /**
   * Enable rim lighting effect
   * @default true
   */
  rimLighting?: boolean;
  
  /**
   * Hover label configuration for moons
   */
  hoverLabels?: HoverLabelConfig;
}

/**
 * Planet material preset definition
 * Describes visual characteristics for different planet types
 */
export interface PlanetMaterial {
  /**
   * Unique preset identifier
   */
  id: string;
  
  /**
   * Human-readable name
   */
  name: string;
  
  /**
   * Description of the material characteristics
   */
  description: string;
  
  /**
   * Base color in hex format
   */
  baseColor: string;
  
  /**
   * Rim light color in hex format
   */
  rimColor?: string;
  
  /**
   * Rim light intensity
   * @range 0-2.0
   * @default 0.5
   */
  rimIntensity?: number;
  
  /**
   * Atmospheric glow color
   */
  atmosphereColor?: string;
  
  /**
   * Atmospheric glow intensity
   * @range 0-2.0
   * @default 0.3
   */
  atmosphereIntensity?: number;
  
  /**
   * Enable toon/cel-shading effect
   * @default false
   */
  toonShading?: boolean;
  
  /**
   * Texture preset reference
   */
  texturePreset?: TexturePreset;
  
  /**
   * Surface roughness
   * @range 0-1
   * @default 0.5
   */
  roughness?: number;
  
  /**
   * Metallic property
   * @range 0-1
   * @default 0.0
   */
  metallic?: number;
  
  /**
   * Enable noise/procedural detail
   * @default true
   */
  proceduralNoise?: boolean;
}

/**
 * Complete graphics configuration
 * Top-level interface containing all view-specific settings
 */
export interface GraphicsConfig {
  /**
   * Configuration version for compatibility checking
   */
  version: string;
  
  /**
   * Universe-wide settings
   */
  universe: UniverseConfig;
  
  /**
   * Galaxy view settings
   */
  galaxyView: GalaxyViewConfig;
  
  /**
   * Solar system view settings
   */
  solarSystemView: SolarSystemViewConfig;
  
  /**
   * Planet view settings
   */
  planetView: PlanetViewConfig;
  
  /**
   * Named planet material presets
   */
  planetMaterials: Record<string, PlanetMaterial>;
}

/**
 * Validation result type
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Clamp a number to a range
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Validate and sanitize a numeric value within a range
 */
function validateNumber(
  value: number | undefined,
  defaultValue: number,
  min: number,
  max: number,
  fieldName: string,
  errors: string[],
  warnings: string[]
): number {
  if (value === undefined) {
    return defaultValue;
  }
  
  if (typeof value !== 'number' || isNaN(value)) {
    errors.push(`${fieldName}: must be a valid number`);
    return defaultValue;
  }
  
  if (value < min || value > max) {
    warnings.push(`${fieldName}: value ${value} outside range [${min}, ${max}], clamping to safe value`);
    return clamp(value, min, max);
  }
  
  return value;
}

/**
 * Validate HoverLabelConfig
 */
function validateHoverLabelConfig(
  config: HoverLabelConfig | undefined,
  context: string,
  errors: string[],
  warnings: string[]
): HoverLabelConfig {
  const defaults: Required<HoverLabelConfig> = {
    enabled: true,
    fontSize: 14,
    backgroundOpacity: 0.85,
    visibilityDistance: 50,
    showDelay: 200,
  };
  
  if (!config) {
    return defaults;
  }
  
  return {
    enabled: config.enabled ?? defaults.enabled,
    fontSize: validateNumber(config.fontSize, defaults.fontSize, 10, 24, `${context}.fontSize`, errors, warnings),
    backgroundOpacity: validateNumber(config.backgroundOpacity, defaults.backgroundOpacity, 0, 1, `${context}.backgroundOpacity`, errors, warnings),
    visibilityDistance: validateNumber(config.visibilityDistance, defaults.visibilityDistance, 0, 100, `${context}.visibilityDistance`, errors, warnings),
    showDelay: validateNumber(config.showDelay, defaults.showDelay, 0, 1000, `${context}.showDelay`, errors, warnings),
  };
}

/**
 * Validate TexturePreset
 * Texture preset names are arbitrary strings referencing texture assets
 * Optional validation against a whitelist if provided
 */
function validateTexturePreset(
  preset: TexturePreset | undefined,
  validPresetNames: string[],
  context: string,
  errors: string[],
  warnings: string[]
): TexturePreset | undefined {
  if (!preset) {
    return undefined;
  }
  
  if (!preset.name || typeof preset.name !== 'string') {
    errors.push(`${context}: texture preset must have a valid name`);
    return undefined;
  }
  
  // Only validate against whitelist if it's explicitly provided and non-empty
  // Texture preset names can be arbitrary strings referencing texture files
  if (validPresetNames.length > 0 && !validPresetNames.includes(preset.name)) {
    warnings.push(`${context}: texture preset name "${preset.name}" is not in the provided whitelist: ${validPresetNames.join(', ')}`);
  }
  
  return preset;
}

/**
 * Validate UniverseConfig
 */
function validateUniverseConfig(
  config: UniverseConfig | undefined,
  errors: string[],
  warnings: string[]
): UniverseConfig {
  const defaults: Required<UniverseConfig> = {
    globalScaleMultiplier: 1.0,
    backgroundStarDensity: 0.5,
    lowPowerMode: false,
    fallbackQuality: 2,
    antiAliasing: true,
    shadowQuality: 1,
  };
  
  if (!config) {
    return defaults;
  }
  
  return {
    globalScaleMultiplier: validateNumber(config.globalScaleMultiplier, defaults.globalScaleMultiplier, 0.1, 5.0, 'universe.globalScaleMultiplier', errors, warnings),
    backgroundStarDensity: validateNumber(config.backgroundStarDensity, defaults.backgroundStarDensity, 0, 1, 'universe.backgroundStarDensity', errors, warnings),
    lowPowerMode: config.lowPowerMode ?? defaults.lowPowerMode,
    fallbackQuality: Math.round(validateNumber(config.fallbackQuality, defaults.fallbackQuality, 1, 3, 'universe.fallbackQuality', errors, warnings)),
    antiAliasing: config.antiAliasing ?? defaults.antiAliasing,
    shadowQuality: Math.round(validateNumber(config.shadowQuality, defaults.shadowQuality, 0, 2, 'universe.shadowQuality', errors, warnings)),
  };
}

/**
 * Validate GalaxyViewConfig
 */
function validateGalaxyViewConfig(
  config: GalaxyViewConfig | undefined,
  errors: string[],
  warnings: string[]
): GalaxyViewConfig {
  const defaults = {
    galaxyOpacity: 0.7,
    starBrightness: 1.0,
    starDensity: 1.0,
    rotationSpeed: 1.0,
    cameraZoom: 1.0,
  };
  
  if (!config) {
    return {
      ...defaults,
      hoverLabels: validateHoverLabelConfig(undefined, 'galaxyView.hoverLabels', errors, warnings),
    };
  }
  
  return {
    galaxyOpacity: validateNumber(config.galaxyOpacity, defaults.galaxyOpacity, 0, 1, 'galaxyView.galaxyOpacity', errors, warnings),
    starBrightness: validateNumber(config.starBrightness, defaults.starBrightness, 0.1, 3.0, 'galaxyView.starBrightness', errors, warnings),
    starDensity: validateNumber(config.starDensity, defaults.starDensity, 0.1, 2.0, 'galaxyView.starDensity', errors, warnings),
    rotationSpeed: validateNumber(config.rotationSpeed, defaults.rotationSpeed, 0, 5.0, 'galaxyView.rotationSpeed', errors, warnings),
    cameraZoom: validateNumber(config.cameraZoom, defaults.cameraZoom, 0.5, 2.0, 'galaxyView.cameraZoom', errors, warnings),
    hoverLabels: validateHoverLabelConfig(config.hoverLabels, 'galaxyView.hoverLabels', errors, warnings),
  };
}

/**
 * Validate SolarSystemViewConfig
 */
function validateSolarSystemViewConfig(
  config: SolarSystemViewConfig | undefined,
  errors: string[],
  warnings: string[]
): SolarSystemViewConfig {
  const defaults = {
    orbitStrokeWidth: 1.5,
    planetScaleMultiplier: 1.0,
    orbitAnimationSpeed: 1.0,
    starGlowIntensity: 1.0,
    orbitalSpacing: 1.0,
    cameraDistance: 1.0,
  };
  
  if (!config) {
    return {
      ...defaults,
      hoverLabels: validateHoverLabelConfig(undefined, 'solarSystemView.hoverLabels', errors, warnings),
    };
  }
  
  return {
    orbitStrokeWidth: validateNumber(config.orbitStrokeWidth, defaults.orbitStrokeWidth, 0.5, 5.0, 'solarSystemView.orbitStrokeWidth', errors, warnings),
    planetScaleMultiplier: validateNumber(config.planetScaleMultiplier, defaults.planetScaleMultiplier, 0.1, 3.0, 'solarSystemView.planetScaleMultiplier', errors, warnings),
    orbitAnimationSpeed: validateNumber(config.orbitAnimationSpeed, defaults.orbitAnimationSpeed, 0, 10.0, 'solarSystemView.orbitAnimationSpeed', errors, warnings),
    starGlowIntensity: validateNumber(config.starGlowIntensity, defaults.starGlowIntensity, 0, 2.0, 'solarSystemView.starGlowIntensity', errors, warnings),
    orbitalSpacing: validateNumber(config.orbitalSpacing, defaults.orbitalSpacing, 0.5, 3.0, 'solarSystemView.orbitalSpacing', errors, warnings),
    cameraDistance: validateNumber(config.cameraDistance, defaults.cameraDistance, 0.5, 2.0, 'solarSystemView.cameraDistance', errors, warnings),
    hoverLabels: validateHoverLabelConfig(config.hoverLabels, 'solarSystemView.hoverLabels', errors, warnings),
  };
}

/**
 * Validate PlanetViewConfig
 */
function validatePlanetViewConfig(
  config: PlanetViewConfig | undefined,
  errors: string[],
  warnings: string[]
): PlanetViewConfig {
  const defaults = {
    planetRenderScale: 1.0,
    rotationSpeed: 1.0,
    atmosphereGlow: 1.0,
    cloudOpacity: 0.6,
    lightingIntensity: 1.0,
    rimLighting: true,
  };
  
  if (!config) {
    return {
      ...defaults,
      hoverLabels: validateHoverLabelConfig(undefined, 'planetView.hoverLabels', errors, warnings),
    };
  }
  
  return {
    planetRenderScale: validateNumber(config.planetRenderScale, defaults.planetRenderScale, 0.5, 2.0, 'planetView.planetRenderScale', errors, warnings),
    rotationSpeed: validateNumber(config.rotationSpeed, defaults.rotationSpeed, 0, 5.0, 'planetView.rotationSpeed', errors, warnings),
    atmosphereGlow: validateNumber(config.atmosphereGlow, defaults.atmosphereGlow, 0, 2.0, 'planetView.atmosphereGlow', errors, warnings),
    cloudOpacity: validateNumber(config.cloudOpacity, defaults.cloudOpacity, 0, 1, 'planetView.cloudOpacity', errors, warnings),
    lightingIntensity: validateNumber(config.lightingIntensity, defaults.lightingIntensity, 0.1, 3.0, 'planetView.lightingIntensity', errors, warnings),
    rimLighting: config.rimLighting ?? defaults.rimLighting,
    hoverLabels: validateHoverLabelConfig(config.hoverLabels, 'planetView.hoverLabels', errors, warnings),
  };
}

/**
 * Validate PlanetMaterial
 * Returns both validation result and sanitized material with clamped numeric values
 */
export function validatePlanetMaterial(
  material: PlanetMaterial,
  validPresetNames: string[],
  errors: string[],
  warnings: string[]
): { result: ValidationResult; sanitizedMaterial: PlanetMaterial } {
  const materialErrors: string[] = [];
  const sanitized: PlanetMaterial = { ...material };

  if (!material.id || typeof material.id !== 'string') {
    materialErrors.push('PlanetMaterial.id is required and must be a string');
  }

  if (!material.name || typeof material.name !== 'string') {
    materialErrors.push('PlanetMaterial.name is required and must be a string');
  }

  if (!material.baseColor || typeof material.baseColor !== 'string') {
    materialErrors.push('PlanetMaterial.baseColor is required and must be a hex color');
  } else if (!/^#[0-9A-Fa-f]{6}$/.test(material.baseColor)) {
    materialErrors.push(`PlanetMaterial.baseColor "${material.baseColor}" must be a valid hex color (e.g., #FF0000)`);
  }

  if (material.rimColor && !/^#[0-9A-Fa-f]{6}$/.test(material.rimColor)) {
    materialErrors.push(`PlanetMaterial.rimColor "${material.rimColor}" must be a valid hex color`);
  }

  if (material.atmosphereColor && !/^#[0-9A-Fa-f]{6}$/.test(material.atmosphereColor)) {
    materialErrors.push(`PlanetMaterial.atmosphereColor "${material.atmosphereColor}" must be a valid hex color`);
  }

  sanitized.rimIntensity = validateNumber(material.rimIntensity, 0.5, 0, 2.0, 'PlanetMaterial.rimIntensity', materialErrors, warnings);
  sanitized.atmosphereIntensity = validateNumber(material.atmosphereIntensity, 0.3, 0, 2.0, 'PlanetMaterial.atmosphereIntensity', materialErrors, warnings);
  sanitized.roughness = validateNumber(material.roughness, 0.5, 0, 1, 'PlanetMaterial.roughness', materialErrors, warnings);
  sanitized.metallic = validateNumber(material.metallic, 0.0, 0, 1, 'PlanetMaterial.metallic', materialErrors, warnings);

  if (material.texturePreset) {
    sanitized.texturePreset = validateTexturePreset(material.texturePreset, [], 'PlanetMaterial.texturePreset', materialErrors, warnings);
  }

  errors.push(...materialErrors);

  return {
    result: {
      valid: materialErrors.length === 0,
      errors: materialErrors,
      warnings: [], // Note: warnings are pushed to the parent array
    },
    sanitizedMaterial: sanitized,
  };
}

/**
 * Validate complete GraphicsConfig
 * Applies defaults for missing values and validates ranges
 */
export function validateGraphicsConfig(config: Partial<GraphicsConfig>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validate version
  if (!config.version) {
    warnings.push('GraphicsConfig.version is missing, using default "1.0.0"');
  }
  
  // Validate each section
  validateUniverseConfig(config.universe, errors, warnings);
  validateGalaxyViewConfig(config.galaxyView, errors, warnings);
  validateSolarSystemViewConfig(config.solarSystemView, errors, warnings);
  validatePlanetViewConfig(config.planetView, errors, warnings);
  
  // Validate planet materials
  if (config.planetMaterials) {
    const materialNames = Object.keys(config.planetMaterials);
    for (const [id, material] of Object.entries(config.planetMaterials)) {
      if (material.id !== id) {
        errors.push(`PlanetMaterial key "${id}" does not match material.id "${material.id}"`);
      }
      validatePlanetMaterial(material, materialNames, errors, warnings);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Sanitize and apply defaults to GraphicsConfig
 * Returns a complete, valid config with all defaults applied
 */
export function sanitizeGraphicsConfig(config: Partial<GraphicsConfig> | undefined): GraphicsConfig {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!config) {
    config = {};
  }

  // Sanitize planet materials
  const sanitizedMaterials: Record<string, PlanetMaterial> = {};
  if (config.planetMaterials) {
    for (const [id, material] of Object.entries(config.planetMaterials)) {
      const { sanitizedMaterial } = validatePlanetMaterial(material, [], errors, warnings);
      sanitizedMaterials[id] = sanitizedMaterial;
    }
  }

  return {
    version: config.version || '1.0.0',
    universe: validateUniverseConfig(config.universe, errors, warnings),
    galaxyView: validateGalaxyViewConfig(config.galaxyView, errors, warnings),
    solarSystemView: validateSolarSystemViewConfig(config.solarSystemView, errors, warnings),
    planetView: validatePlanetViewConfig(config.planetView, errors, warnings),
    planetMaterials: sanitizedMaterials,
  };
}

/**
 * Serialize GraphicsConfig to JSON string
 */
export function serializeGraphicsConfig(config: GraphicsConfig): string {
  return JSON.stringify(config, null, 2);
}

/**
 * Deserialize GraphicsConfig from JSON string
 * Applies validation and defaults
 */
export function deserializeGraphicsConfig(json: string): {
  config: GraphicsConfig;
  validation: ValidationResult;
} {
  try {
    const parsed = JSON.parse(json);
    const validation = validateGraphicsConfig(parsed);
    const config = sanitizeGraphicsConfig(parsed);
    
    return { config, validation };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
    return {
      config: sanitizeGraphicsConfig(undefined),
      validation: {
        valid: false,
        errors: [`JSON parsing failed: ${errorMessage}`],
        warnings: ['Using default configuration due to parse error'],
      },
    };
  }
}
