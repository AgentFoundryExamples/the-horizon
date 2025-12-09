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
 * Galaxy Renderer
 * 
 * Provides layered galaxy rendering with:
 * - Shader-based spirals or sprite clouds
 * - Noise layers, glow, volumetric/nebula overlays
 * - Texture theme presets (neon, molten, etc.)
 * - Optional bloom/scattering with graceful degradation
 */

import * as THREE from 'three';
import type { GalaxyViewConfig } from './config';

/**
 * Galaxy texture theme presets
 */
export type GalaxyTheme = 'neon' | 'molten' | 'ethereal' | 'classic' | 'dark-matter';

/**
 * Galaxy rendering configuration
 */
export interface GalaxyRenderConfig {
  /** Number of particles in the galaxy */
  particleCount: number;
  /** Galaxy radius */
  radius: number;
  /** Galaxy core size (inner bright region) */
  coreRadius: number;
  /** Number of spiral arms */
  armCount: number;
  /** Spiral arm tightness */
  spiralTightness: number;
  /** Rotation speed multiplier */
  rotationSpeed: number;
  /** Overall opacity */
  opacity: number;
  /** Theme preset */
  theme: GalaxyTheme;
  /** Enable glow layers */
  enableGlow: boolean;
  /** Enable nebula overlay */
  enableNebula: boolean;
  /** Enable bloom/scattering */
  enableBloom: boolean;
  /** Noise intensity for variation */
  noiseIntensity: number;
  /** Motion blur intensity */
  motionBlur: number;
  /** Low power mode */
  lowPowerMode: boolean;
}

/**
 * Galaxy theme color configurations
 */
const GALAXY_THEMES: Record<GalaxyTheme, {
  coreColor: THREE.Color;
  armColor: THREE.Color;
  glowColor: THREE.Color;
  nebulaColor: THREE.Color;
}> = {
  neon: {
    coreColor: new THREE.Color(0.0, 1.0, 1.0),      // Cyan
    armColor: new THREE.Color(1.0, 0.0, 1.0),       // Magenta
    glowColor: new THREE.Color(0.5, 0.0, 1.0),      // Purple
    nebulaColor: new THREE.Color(0.0, 0.5, 1.0),    // Blue
  },
  molten: {
    coreColor: new THREE.Color(1.0, 1.0, 0.8),      // White-yellow
    armColor: new THREE.Color(1.0, 0.4, 0.0),       // Orange
    glowColor: new THREE.Color(1.0, 0.2, 0.0),      // Red-orange
    nebulaColor: new THREE.Color(0.6, 0.1, 0.0),    // Dark red
  },
  ethereal: {
    coreColor: new THREE.Color(1.0, 1.0, 1.0),      // White
    armColor: new THREE.Color(0.7, 0.9, 1.0),       // Light blue
    glowColor: new THREE.Color(0.9, 0.8, 1.0),      // Lavender
    nebulaColor: new THREE.Color(0.5, 0.7, 0.9),    // Soft blue
  },
  classic: {
    coreColor: new THREE.Color(1.0, 1.0, 0.9),      // Warm white
    armColor: new THREE.Color(0.6, 0.7, 1.0),       // Blue-white
    glowColor: new THREE.Color(0.8, 0.8, 1.0),      // Cool white
    nebulaColor: new THREE.Color(0.4, 0.5, 0.7),    // Dust blue
  },
  'dark-matter': {
    coreColor: new THREE.Color(0.5, 0.0, 0.5),      // Deep purple
    armColor: new THREE.Color(0.2, 0.0, 0.4),       // Dark purple
    glowColor: new THREE.Color(0.3, 0.0, 0.5),      // Violet
    nebulaColor: new THREE.Color(0.1, 0.0, 0.2),    // Very dark purple
  },
};

/**
 * Galaxy layer data
 */
export interface GalaxyLayer {
  geometry: THREE.BufferGeometry;
  material: THREE.PointsMaterial | THREE.ShaderMaterial;
  positions: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
  alphas: Float32Array;
  velocities: Float32Array; // For rotation animation
  layerType: 'core' | 'arms' | 'glow' | 'nebula';
}

/**
 * Complete galaxy render data
 */
export interface GalaxyData {
  layers: GalaxyLayer[];
  config: GalaxyRenderConfig;
  fallbackMode: boolean;
  shaderError?: string; // Optional error message if shader compilation failed
}

// Performance constants
const MAX_GALAXY_PARTICLES = 15000;
const MIN_GALAXY_PARTICLES = 500;

// Rendering constants
const POINT_SIZE_SCALE = 300.0; // Scale factor for point size calculation

// Pseudo-random noise coefficients for shader
const NOISE_COEFF_1 = 12.9898;
const NOISE_COEFF_2 = 78.233;
const NOISE_COEFF_3 = 45.5432;
const NOISE_MULTIPLIER = 43758.5453;

/**
 * Galaxy vertex shader with noise and rotation
 */
const galaxyVertexShader = `
  attribute float size;
  attribute vec3 customColor;
  attribute float alpha;
  
  varying vec3 vColor;
  varying float vAlpha;
  
  uniform float time;
  uniform float rotationSpeed;
  
  // Simple 3D noise function using pseudo-random coefficients
  float noise3D(vec3 p) {
    return fract(sin(dot(p, vec3(${NOISE_COEFF_1}, ${NOISE_COEFF_2}, ${NOISE_COEFF_3}))) * ${NOISE_MULTIPLIER});
  }
  
  void main() {
    vColor = customColor;
    vAlpha = alpha;
    
    // Apply rotation
    vec3 rotatedPos = position;
    float angle = time * rotationSpeed;
    float s = sin(angle);
    float c = cos(angle);
    rotatedPos.x = position.x * c - position.z * s;
    rotatedPos.z = position.x * s + position.z * c;
    
    // Add subtle noise-based variation
    float noiseVal = noise3D(position * 0.1 + time * 0.1);
    rotatedPos += vec3(noiseVal - 0.5) * 0.5;
    
    vec4 mvPosition = modelViewMatrix * vec4(rotatedPos, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

/**
 * Galaxy fragment shader with glow effect
 */
const galaxyFragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;
  
  void main() {
    float r = distance(gl_PointCoord, vec2(0.5, 0.5));
    if (r > 0.5) discard;
    
    // Soft glow falloff
    float alpha = 1.0 - smoothstep(0.0, 0.5, r);
    alpha = pow(alpha, 1.5) * vAlpha;
    
    gl_FragColor = vec4(vColor, alpha);
  }
`;

/**
 * Create galaxy configuration from GalaxyViewConfig
 */
export function createGalaxyRenderConfig(
  galaxyViewConfig: GalaxyViewConfig,
  theme: GalaxyTheme = 'classic',
  lowPowerMode: boolean = false
): GalaxyRenderConfig {
  const opacity = galaxyViewConfig.galaxyOpacity ?? 0.7;
  const rotationSpeed = galaxyViewConfig.rotationSpeed ?? 1.0;
  const starDensity = galaxyViewConfig.starDensity ?? 1.0;
  
  let particleCount = Math.floor(3000 * starDensity);
  
  if (lowPowerMode) {
    particleCount = Math.floor(particleCount * 0.5);
  }
  
  particleCount = Math.max(MIN_GALAXY_PARTICLES, Math.min(MAX_GALAXY_PARTICLES, particleCount));
  
  return {
    particleCount,
    radius: 20,
    coreRadius: 3,
    armCount: 3,
    spiralTightness: 0.5,
    rotationSpeed: rotationSpeed * 0.05,
    opacity,
    theme,
    enableGlow: !lowPowerMode,
    enableNebula: !lowPowerMode,
    enableBloom: !lowPowerMode,
    noiseIntensity: 0.3,
    motionBlur: 0.0,
    lowPowerMode,
  };
}

/**
 * Generate spiral arm particle positions
 */
function generateSpiralPositions(
  count: number,
  config: GalaxyRenderConfig,
  armIndex: number
): Float32Array {
  const positions = new Float32Array(count * 3);
  const armAngleOffset = (armIndex * Math.PI * 2) / config.armCount;
  
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    
    // Radial distance with bias toward middle
    const radiusRatio = Math.pow(Math.random(), 0.6);
    const radius = config.coreRadius + radiusRatio * (config.radius - config.coreRadius);
    
    // Spiral angle
    const spiralAngle = armAngleOffset + radius * config.spiralTightness;
    
    // Add some randomness perpendicular to spiral
    const randomSpread = (Math.random() - 0.5) * 2.0;
    const randomHeight = (Math.random() - 0.5) * 0.5 * radius;
    
    positions[i3] = Math.cos(spiralAngle) * radius + randomSpread;
    positions[i3 + 1] = randomHeight;
    positions[i3 + 2] = Math.sin(spiralAngle) * radius + randomSpread;
  }
  
  return positions;
}

/**
 * Generate galaxy core positions
 */
function generateCorePositions(count: number, config: GalaxyRenderConfig): Float32Array {
  const positions = new Float32Array(count * 3);
  
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    
    // Dense spherical core
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = Math.pow(Math.random(), 1.5) * config.coreRadius;
    
    positions[i3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i3 + 2] = r * Math.cos(phi);
  }
  
  return positions;
}

/**
 * Generate nebula cloud positions (more diffuse)
 */
function generateNebulaPositions(count: number, config: GalaxyRenderConfig): Float32Array {
  const positions = new Float32Array(count * 3);
  
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    
    // Large, diffuse distribution
    const theta = Math.random() * Math.PI * 2;
    const radius = config.radius * (0.5 + Math.random() * 0.8);
    const height = (Math.random() - 0.5) * config.radius * 0.4;
    
    positions[i3] = Math.cos(theta) * radius;
    positions[i3 + 1] = height;
    positions[i3 + 2] = Math.sin(theta) * radius;
  }
  
  return positions;
}

/**
 * Generate colors for galaxy layer
 */
function generateLayerColors(
  count: number,
  baseColor: THREE.Color,
  variance: number
): Float32Array {
  const colors = new Float32Array(count * 3);
  
  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const color = baseColor.clone();
    
    // Add color variance
    if (variance > 0) {
      const vary = (Math.random() - 0.5) * variance;
      color.r = Math.max(0, Math.min(1, color.r + vary));
      color.g = Math.max(0, Math.min(1, color.g + vary));
      color.b = Math.max(0, Math.min(1, color.b + vary));
    }
    
    colors[i3] = color.r;
    colors[i3 + 1] = color.g;
    colors[i3 + 2] = color.b;
  }
  
  return colors;
}

/**
 * Generate particle sizes
 */
function generateLayerSizes(
  count: number,
  sizeRange: [number, number]
): Float32Array {
  const sizes = new Float32Array(count);
  
  for (let i = 0; i < count; i++) {
    const power = Math.pow(Math.random(), 2.0);
    sizes[i] = sizeRange[0] + power * (sizeRange[1] - sizeRange[0]);
  }
  
  return sizes;
}

/**
 * Generate alpha values
 */
function generateLayerAlphas(
  count: number,
  baseAlpha: number,
  variance: number
): Float32Array {
  const alphas = new Float32Array(count);
  
  for (let i = 0; i < count; i++) {
    const vary = (Math.random() - 0.5) * variance;
    alphas[i] = Math.max(0, Math.min(1, baseAlpha + vary));
  }
  
  return alphas;
}

/**
 * Create galaxy shader material
 */
function createGalaxyShaderMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: galaxyVertexShader,
    fragmentShader: galaxyFragmentShader,
    uniforms: {
      time: { value: 0 },
      rotationSpeed: { value: 1.0 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

/**
 * Create fallback material
 */
function createGalaxyFallbackMaterial(color: THREE.Color, opacity: number): THREE.PointsMaterial {
  return new THREE.PointsMaterial({
    color,
    size: 2.0,
    transparent: true,
    opacity,
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

/**
 * Create a single galaxy layer
 */
function createGalaxyLayer(
  layerType: 'core' | 'arms' | 'glow' | 'nebula',
  config: GalaxyRenderConfig,
  armIndex?: number
): GalaxyLayer {
  const theme = GALAXY_THEMES[config.theme];
  let positions: Float32Array;
  let color: THREE.Color;
  let sizeRange: [number, number];
  let baseAlpha: number;
  let particleCount: number;
  
  switch (layerType) {
    case 'core':
      particleCount = Math.floor(config.particleCount * 0.15);
      positions = generateCorePositions(particleCount, config);
      color = theme.coreColor;
      sizeRange = [2.0, 4.0];
      baseAlpha = config.opacity * 0.9;
      break;
      
    case 'arms':
      particleCount = Math.floor(config.particleCount * 0.6);
      positions = generateSpiralPositions(particleCount, config, armIndex ?? 0);
      color = theme.armColor;
      sizeRange = [1.0, 3.0];
      baseAlpha = config.opacity * 0.7;
      break;
      
    case 'glow':
      particleCount = Math.floor(config.particleCount * 0.15);
      positions = generateSpiralPositions(particleCount, config, armIndex ?? 0);
      color = theme.glowColor;
      sizeRange = [3.0, 6.0];
      baseAlpha = config.opacity * 0.4;
      break;
      
    case 'nebula':
      particleCount = Math.floor(config.particleCount * 0.1);
      positions = generateNebulaPositions(particleCount, config);
      color = theme.nebulaColor;
      sizeRange = [4.0, 8.0];
      baseAlpha = config.opacity * 0.3;
      break;
  }
  
  const colors = generateLayerColors(particleCount, color, config.noiseIntensity);
  const sizes = generateLayerSizes(particleCount, sizeRange);
  const alphas = generateLayerAlphas(particleCount, baseAlpha, 0.2);
  const velocities = new Float32Array(particleCount); // Angular velocities for rotation
  
  // Generate rotation velocities (faster near core)
  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    const radius = Math.sqrt(
      positions[i3] * positions[i3] +
      positions[i3 + 2] * positions[i3 + 2]
    );
    // Inverse relationship: closer = faster
    velocities[i] = 1.0 / (radius + 1.0);
  }
  
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
  
  let material: THREE.ShaderMaterial | THREE.PointsMaterial;
  
  try {
    material = createGalaxyShaderMaterial();
    material.uniforms.rotationSpeed.value = config.rotationSpeed;
  } catch (error) {
    console.warn('Galaxy shader compilation failed, using fallback', error);
    material = createGalaxyFallbackMaterial(color, baseAlpha);
  }
  
  return {
    geometry,
    material,
    positions: positions.slice(),
    colors,
    sizes,
    alphas,
    velocities,
    layerType,
  };
}

/**
 * Generate complete galaxy with all layers
 */
export function generateGalaxy(config: GalaxyRenderConfig): GalaxyData {
  const layers: GalaxyLayer[] = [];
  let fallbackMode = false;
  let shaderError: string | undefined;
  
  try {
    // Always create core
    layers.push(createGalaxyLayer('core', config));
    
    // Create spiral arms
    for (let i = 0; i < config.armCount; i++) {
      layers.push(createGalaxyLayer('arms', config, i));
      
      // Add glow layers if enabled
      if (config.enableGlow) {
        layers.push(createGalaxyLayer('glow', config, i));
      }
    }
    
    // Add nebula if enabled
    if (config.enableNebula) {
      layers.push(createGalaxyLayer('nebula', config));
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.warn('Galaxy generation encountered errors, some layers may be missing', error);
    fallbackMode = true;
    shaderError = `Galaxy layer generation failed: ${errorMsg}`;
  }
  
  return {
    layers,
    config,
    fallbackMode,
    shaderError,
  };
}

/**
 * Update galaxy animation
 * 
 * @param galaxy - Galaxy data to animate
 * @param time - Current time in seconds
 */
export function updateGalaxy(galaxy: GalaxyData, time: number): void {
  for (const layer of galaxy.layers) {
    if ('uniforms' in layer.material && layer.material.uniforms.time) {
      layer.material.uniforms.time.value = time;
    }
  }
}

/**
 * Update galaxy opacity
 * Supports smooth transitions including full hide at opacity=0
 * 
 * @param galaxy - Galaxy data
 * @param opacity - New opacity value (0-1)
 */
export function setGalaxyOpacity(galaxy: GalaxyData, opacity: number): void {
  const clampedOpacity = Math.max(0, Math.min(1, opacity));
  
  for (const layer of galaxy.layers) {
    // Update material opacity
    if (layer.material.transparent) {
      layer.material.opacity = clampedOpacity;
      layer.material.visible = clampedOpacity > 0;
    }
    
    // Update per-particle alphas if shader material
    if ('uniforms' in layer.material) {
      const alphas = layer.geometry.attributes.alpha.array as Float32Array;
      const baseAlphas = layer.alphas; // Store original alphas
      
      for (let i = 0; i < alphas.length; i++) {
        alphas[i] = baseAlphas[i] * clampedOpacity;
      }
      
      layer.geometry.attributes.alpha.needsUpdate = true;
    }
  }
  
  galaxy.config.opacity = clampedOpacity;
}

/**
 * Dispose galaxy resources
 */
export function disposeGalaxy(galaxy: GalaxyData): void {
  for (const layer of galaxy.layers) {
    layer.geometry.dispose();
    if ('dispose' in layer.material) {
      layer.material.dispose();
    }
  }
}

/**
 * Get available galaxy themes
 */
export function getGalaxyThemes(): GalaxyTheme[] {
  return Object.keys(GALAXY_THEMES) as GalaxyTheme[];
}

/**
 * Check if galaxy configuration is within performance limits
 */
export function validateGalaxyConfig(config: GalaxyRenderConfig): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  let valid = true;
  
  if (config.particleCount > MAX_GALAXY_PARTICLES) {
    warnings.push(`Particle count ${config.particleCount} exceeds maximum ${MAX_GALAXY_PARTICLES}`);
    valid = false;
  }
  
  if (config.opacity < 0 || config.opacity > 1) {
    warnings.push(`Opacity ${config.opacity} out of range [0, 1]`);
    valid = false;
  }
  
  if (config.rotationSpeed < 0 || config.rotationSpeed > 10) {
    warnings.push(`Rotation speed ${config.rotationSpeed} out of safe range [0, 10]`);
  }
  
  return { valid, warnings };
}
