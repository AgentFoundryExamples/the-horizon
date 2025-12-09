/**
 * Starfield Generator
 * 
 * Creates config-driven background starfields with:
 * - Density, brightness distribution, parallax drift
 * - Color variance and animation speed multipliers
 * - Low-power overrides and frame budget clamping
 * - Graceful fallback when shaders fail
 */

import * as THREE from 'three';
import type { UniverseConfig, GalaxyViewConfig } from './config';

/**
 * Starfield configuration derived from GraphicsConfig
 */
export interface StarfieldConfig {
  /** Number of stars to generate (clamped for performance) */
  density: number;
  /** Brightness variation range [min, max] */
  brightnessRange: [number, number];
  /** Parallax drift speed multiplier */
  parallaxSpeed: number;
  /** Color temperature variance (0 = no variance, 1 = full spectrum) */
  colorVariance: number;
  /** Animation speed multiplier */
  animationSpeed: number;
  /** Enable parallax drift animation */
  enableParallax: boolean;
  /** Size variation range [min, max] */
  sizeRange: [number, number];
  /** Distribution radius for star placement */
  distributionRadius: number;
  /** Low power mode (reduces quality) */
  lowPowerMode: boolean;
}

/**
 * Starfield instance data
 */
export interface StarfieldData {
  geometry: THREE.BufferGeometry;
  material: THREE.PointsMaterial | THREE.ShaderMaterial;
  positions: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
  velocities: Float32Array; // For parallax drift
  originalPositions: Float32Array; // For resetting
  config: StarfieldConfig;
  fallbackMode: boolean;
  shaderError?: string; // Optional error message if shader compilation failed
}

// Performance constants
const MAX_STARS = 10000; // Hard limit to maintain <16ms frame budget
const MIN_STARS = 100;
const DEFAULT_STARS = 2000;

// Rendering constants
const POINT_SIZE_SCALE = 300.0; // Scale factor for point size calculation
const SIZE_RANGE_NORMAL: [number, number] = [0.5, 3.0];
const SIZE_RANGE_LOW_POWER: [number, number] = [0.5, 1.5];

// Color temperature palette (K to RGB approximation)
const COLOR_TEMPERATURES = {
  cool: new THREE.Color(0.7, 0.8, 1.0),      // Blue-white
  neutral: new THREE.Color(1.0, 1.0, 1.0),   // White
  warm: new THREE.Color(1.0, 0.9, 0.7),      // Yellow-white
  hot: new THREE.Color(1.0, 0.7, 0.5),       // Orange
};

/**
 * Vertex shader for starfield with parallax
 */
const starfieldVertexShader = `
  attribute float size;
  attribute vec3 customColor;
  attribute float brightness;
  
  varying vec3 vColor;
  varying float vBrightness;
  
  void main() {
    vColor = customColor;
    vBrightness = brightness;
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

/**
 * Fragment shader for starfield with smooth falloff
 */
const starfieldFragmentShader = `
  varying vec3 vColor;
  varying float vBrightness;
  
  void main() {
    // Circular star shape with smooth edges
    float r = distance(gl_PointCoord, vec2(0.5, 0.5));
    if (r > 0.5) discard;
    
    // Smooth falloff from center
    float alpha = 1.0 - smoothstep(0.0, 0.5, r);
    alpha = pow(alpha, 2.0) * vBrightness;
    
    gl_FragColor = vec4(vColor, alpha);
  }
`;

/**
 * Create starfield configuration from GraphicsConfig
 */
export function createStarfieldConfig(
  universeConfig: UniverseConfig,
  galaxyViewConfig?: GalaxyViewConfig
): StarfieldConfig {
  const baseDensity = universeConfig.backgroundStarDensity ?? 0.5;
  const starDensityMultiplier = galaxyViewConfig?.starDensity ?? 1.0;
  const starBrightnessMultiplier = galaxyViewConfig?.starBrightness ?? 1.0;
  const lowPowerMode = universeConfig.lowPowerMode ?? false;
  
  // Calculate final density with all multipliers
  let density = DEFAULT_STARS * baseDensity * starDensityMultiplier;
  
  // Apply low power mode reduction
  if (lowPowerMode) {
    density *= 0.5;
  }
  
  // Clamp to performance limits
  density = Math.max(MIN_STARS, Math.min(MAX_STARS, Math.floor(density)));
  
  return {
    density,
    brightnessRange: [0.3 * starBrightnessMultiplier, 1.0 * starBrightnessMultiplier],
    parallaxSpeed: 0.05, // Subtle movement
    colorVariance: 0.3,  // Some color variation
    animationSpeed: 1.0,
    enableParallax: !lowPowerMode,
    sizeRange: lowPowerMode ? SIZE_RANGE_LOW_POWER : SIZE_RANGE_NORMAL,
    distributionRadius: 500, // Large sphere around scene
    lowPowerMode,
  };
}

/**
 * Generate star positions with realistic distribution
 */
function generateStarPositions(count: number, radius: number): Float32Array {
  const positions = new Float32Array(count * 3);
  
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    
    // Spherical distribution with some clustering
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = radius * (0.5 + Math.random() * 0.5); // Bias toward outer shell
    
    positions[i3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = r * Math.cos(phi);
  }
  
  return positions;
}

/**
 * Generate star colors with temperature variation
 */
function generateStarColors(count: number, colorVariance: number): Float32Array {
  const colors = new Float32Array(count * 3);
  
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    
    // Select base color temperature
    let color: THREE.Color;
    const tempRand = Math.random();
    
    if (tempRand < 0.1) {
      color = COLOR_TEMPERATURES.cool.clone();
    } else if (tempRand < 0.8) {
      color = COLOR_TEMPERATURES.neutral.clone();
    } else if (tempRand < 0.95) {
      color = COLOR_TEMPERATURES.warm.clone();
    } else {
      color = COLOR_TEMPERATURES.hot.clone();
    }
    
    // Apply variance
    if (colorVariance > 0) {
      const variance = (Math.random() - 0.5) * colorVariance;
      color.r = Math.max(0, Math.min(1, color.r + variance));
      color.g = Math.max(0, Math.min(1, color.g + variance));
      color.b = Math.max(0, Math.min(1, color.b + variance));
    }
    
    colors[i3] = color.r;
    colors[i3 + 1] = color.g;
    colors[i3 + 2] = color.b;
  }
  
  return colors;
}

/**
 * Generate star sizes with power-law distribution
 * (Most stars small, few stars large)
 */
function generateStarSizes(count: number, sizeRange: [number, number]): Float32Array {
  const sizes = new Float32Array(count);
  
  for (let i = 0; i < count; i++) {
    // Power-law distribution: most stars are small
    const power = Math.pow(Math.random(), 2.0);
    sizes[i] = sizeRange[0] + power * (sizeRange[1] - sizeRange[0]);
  }
  
  return sizes;
}

/**
 * Generate star brightness values
 */
function generateStarBrightness(count: number, brightnessRange: [number, number]): Float32Array {
  const brightness = new Float32Array(count);
  
  for (let i = 0; i < count; i++) {
    // Power-law distribution: most stars are dim
    const power = Math.pow(Math.random(), 1.5);
    brightness[i] = brightnessRange[0] + power * (brightnessRange[1] - brightnessRange[0]);
  }
  
  return brightness;
}

/**
 * Generate parallax velocities for drift animation
 */
function generateParallaxVelocities(count: number): Float32Array {
  const velocities = new Float32Array(count * 3);
  
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    
    // Small random velocities for subtle drift
    velocities[i3] = (Math.random() - 0.5) * 0.02;
    velocities[i3 + 1] = (Math.random() - 0.5) * 0.02;
    velocities[i3 + 2] = (Math.random() - 0.5) * 0.02;
  }
  
  return velocities;
}

/**
 * Create starfield shader material
 */
function createStarfieldShaderMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: starfieldVertexShader,
    fragmentShader: starfieldFragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

/**
 * Create fallback material for when shaders fail
 */
function createFallbackMaterial(): THREE.PointsMaterial {
  return new THREE.PointsMaterial({
    color: 0xffffff,
    size: 1.5,
    transparent: true,
    opacity: 0.6,
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

/**
 * Generate complete starfield data
 */
export function generateStarfield(config: StarfieldConfig): StarfieldData {
  const { density, brightnessRange, colorVariance, sizeRange, distributionRadius, lowPowerMode } = config;
  
  // Generate star attributes
  const positions = generateStarPositions(density, distributionRadius);
  const colors = generateStarColors(density, colorVariance);
  const sizes = generateStarSizes(density, sizeRange);
  const brightness = generateStarBrightness(density, brightnessRange);
  const velocities = generateParallaxVelocities(density);
  
  // Create geometry
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('brightness', new THREE.BufferAttribute(brightness, 1));
  
  // Try shader material first, fallback to simple material if it fails
  let material: THREE.ShaderMaterial | THREE.PointsMaterial;
  let fallbackMode = false;
  let shaderError: string | undefined;
  
  try {
    material = createStarfieldShaderMaterial();
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.warn('Starfield shader compilation failed, using fallback material', error);
    material = createFallbackMaterial();
    fallbackMode = true;
    shaderError = `Shader compilation failed: ${errorMsg}`;
  }
  
  return {
    geometry,
    material,
    positions: positions.slice(), // Copy for animation
    colors,
    sizes,
    velocities,
    originalPositions: positions.slice(), // Store original for reset
    config,
    fallbackMode,
    shaderError,
  };
}

/**
 * Update starfield animation
 * Call this in animation frame loop
 * 
 * @param starfield - Starfield data to animate
 * @param deltaTime - Time since last frame in seconds
 * @param isPaused - Whether camera transitions are active (pauses parallax)
 */
export function updateStarfield(
  starfield: StarfieldData,
  deltaTime: number,
  isPaused: boolean = false
): void {
  // Skip parallax if paused or disabled
  if (isPaused || !starfield.config.enableParallax || starfield.fallbackMode) {
    return;
  }
  
  const positions = starfield.geometry.attributes.position.array as Float32Array;
  const velocities = starfield.velocities;
  const originalPositions = starfield.originalPositions;
  const speed = starfield.config.parallaxSpeed * starfield.config.animationSpeed;
  
  // Apply parallax drift
  for (let i = 0; i < positions.length; i += 3) {
    positions[i] += velocities[i] * speed * deltaTime;
    positions[i + 1] += velocities[i + 1] * speed * deltaTime;
    positions[i + 2] += velocities[i + 2] * speed * deltaTime;
    
    // Smooth wrapping: gradually pull particles back toward origin when they drift too far
    // This avoids visual discontinuities from hard resets
    const dx = positions[i] - originalPositions[i];
    const dy = positions[i + 1] - originalPositions[i + 1];
    const dz = positions[i + 2] - originalPositions[i + 2];
    const distSq = dx * dx + dy * dy + dz * dz;
    
    if (distSq > 10000) { // ~100 units from original
      // Instead of hard reset, smoothly interpolate back toward original position
      const t = 0.1; // Interpolation factor (adjust for smoother/faster return)
      positions[i] = positions[i] * (1 - t) + originalPositions[i] * t;
      positions[i + 1] = positions[i + 1] * (1 - t) + originalPositions[i + 1] * t;
      positions[i + 2] = positions[i + 2] * (1 - t) + originalPositions[i + 2] * t;
    }
  }
  
  starfield.geometry.attributes.position.needsUpdate = true;
}

/**
 * Dispose starfield resources
 */
export function disposeStarfield(starfield: StarfieldData): void {
  starfield.geometry.dispose();
  if ('dispose' in starfield.material) {
    starfield.material.dispose();
  }
}

/**
 * Check if current device can handle requested star density
 * Returns recommended density if current is too high
 */
export function validateStarfieldDensity(requestedDensity: number): {
  density: number;
  clamped: boolean;
  reason?: string;
} {
  if (requestedDensity <= MAX_STARS) {
    return { density: requestedDensity, clamped: false };
  }
  
  return {
    density: MAX_STARS,
    clamped: true,
    reason: `Density clamped to ${MAX_STARS} stars to maintain <16ms frame budget`,
  };
}
