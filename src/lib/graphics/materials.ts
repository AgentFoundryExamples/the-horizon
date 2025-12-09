/**
 * Planet Material System
 * 
 * Provides utilities for creating pseudo-PBR materials with rim lighting,
 * atmospheric effects, and configurable shading for planet rendering.
 * Includes fallback modes for low-power devices.
 */

import * as THREE from 'three';
import { PlanetMaterial, PlanetViewConfig } from './config';

/**
 * Device capability detection result
 */
export interface DeviceCapabilities {
  isLowPower: boolean;
  supportsWebGL: boolean;
  maxTextureSize: number;
  supportsFloatTextures: boolean;
}

/**
 * Detect device capabilities for rendering optimization
 */
export function detectDeviceCapabilities(): DeviceCapabilities {
  // Check if WebGL is available
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  
  if (!gl) {
    return {
      isLowPower: true,
      supportsWebGL: false,
      maxTextureSize: 512,
      supportsFloatTextures: false,
    };
  }

  // Type guard for WebGL context
  const glContext = gl as WebGLRenderingContext;
  
  // Detect low-power mode via various heuristics
  const isLowPower = 
    // Mobile device detection
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    // Hardware concurrency (fewer cores = likely mobile)
    (navigator.hardwareConcurrency !== undefined && navigator.hardwareConcurrency <= 4) ||
    false;

  // Get max texture size
  const maxTextureSize = glContext.getParameter(glContext.MAX_TEXTURE_SIZE) as number;

  // Check for float texture support
  const floatTextureExt = 
    glContext.getExtension('OES_texture_float') ||
    glContext.getExtension('OES_texture_half_float');

  return {
    isLowPower,
    supportsWebGL: true,
    maxTextureSize,
    supportsFloatTextures: !!floatTextureExt,
  };
}

/**
 * Custom shader material for pseudo-PBR planets with rim lighting
 * and atmospheric glow
 */
export interface PlanetShaderMaterialOptions {
  material: PlanetMaterial;
  config: PlanetViewConfig;
  enableAtmosphere?: boolean;
  enableRimLighting?: boolean;
  lowPowerMode?: boolean;
}

/**
 * Vertex shader for planet material
 */
const planetVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  varying vec3 vViewPosition;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    vPosition = position;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

/**
 * Fragment shader for planet material with rim lighting and atmospheric glow
 */
const planetFragmentShader = `
  uniform vec3 baseColor;
  uniform vec3 rimColor;
  uniform float rimIntensity;
  uniform vec3 atmosphereColor;
  uniform float atmosphereIntensity;
  uniform float roughness;
  uniform float metallic;
  uniform bool enableRimLighting;
  uniform bool enableAtmosphere;
  uniform bool toonShading;
  uniform vec3 lightDirection;
  uniform float lightingIntensity;
  
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  varying vec3 vViewPosition;

  // Simple noise function for procedural detail
  float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  // Toon shading quantization
  float toonify(float value, int steps) {
    if (steps <= 0) return value;
    return floor(value * float(steps)) / float(steps);
  }

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    vec3 lightDir = normalize(lightDirection);
    
    // Basic diffuse lighting with Lambertian reflectance
    float diffuse = max(dot(normal, lightDir), 0.0);
    
    // Apply toon shading if enabled
    if (toonShading) {
      diffuse = toonify(diffuse, 3);
    }
    
    // Rim lighting calculation (Fresnel-like effect)
    float rimAmount = 0.0;
    if (enableRimLighting) {
      rimAmount = 1.0 - max(dot(viewDir, normal), 0.0);
      rimAmount = pow(rimAmount, 3.0) * rimIntensity;
    }
    
    // Atmospheric glow (edge-based transparency effect)
    float atmosphereAmount = 0.0;
    if (enableAtmosphere) {
      atmosphereAmount = pow(1.0 - max(dot(viewDir, normal), 0.0), 2.0);
      atmosphereAmount *= atmosphereIntensity;
    }
    
    // Add subtle procedural noise for surface variation
    float noiseValue = noise(vUv * 10.0) * 0.05;
    
    // Combine lighting components
    vec3 color = baseColor * (diffuse * lightingIntensity + 0.2); // 0.2 = ambient
    color += noiseValue;
    
    // Add rim lighting
    color += rimColor * rimAmount;
    
    // Add atmospheric glow
    color += atmosphereColor * atmosphereAmount;
    
    // Simple roughness simulation (affects specular highlights)
    float specular = 0.0;
    if (roughness < 0.5) {
      vec3 halfDir = normalize(lightDir + viewDir);
      specular = pow(max(dot(normal, halfDir), 0.0), 32.0) * (1.0 - roughness);
    }
    color += vec3(specular);
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

/**
 * Create a shader material for a planet based on PlanetMaterial preset
 */
export function createPlanetShaderMaterial(
  options: PlanetShaderMaterialOptions
): THREE.ShaderMaterial {
  const { material, config, enableAtmosphere = true, enableRimLighting = true, lowPowerMode = false } = options;

  // Use simpler shading in low-power mode
  const effectiveRimLighting = lowPowerMode ? false : (enableRimLighting && (config.rimLighting ?? true));
  const effectiveAtmosphere = lowPowerMode ? false : enableAtmosphere;

  return new THREE.ShaderMaterial({
    uniforms: {
      baseColor: { value: new THREE.Color(material.baseColor) },
      rimColor: { value: new THREE.Color(material.rimColor || material.baseColor) },
      rimIntensity: { value: material.rimIntensity ?? 0.5 },
      atmosphereColor: { value: new THREE.Color(material.atmosphereColor || material.baseColor) },
      atmosphereIntensity: { value: (material.atmosphereIntensity ?? 0.3) * (config.atmosphereGlow ?? 1.0) },
      roughness: { value: material.roughness ?? 0.5 },
      metallic: { value: material.metallic ?? 0.0 },
      enableRimLighting: { value: effectiveRimLighting },
      enableAtmosphere: { value: effectiveAtmosphere },
      toonShading: { value: material.toonShading ?? false },
      lightDirection: { value: new THREE.Vector3(1, 1, 1).normalize() },
      lightingIntensity: { value: config.lightingIntensity ?? 1.0 },
    },
    vertexShader: planetVertexShader,
    fragmentShader: planetFragmentShader,
  });
}

/**
 * Create a simple fallback material for low-power devices
 * Uses basic MeshStandardMaterial without custom shaders
 */
export function createFallbackMaterial(
  material: PlanetMaterial,
  config: PlanetViewConfig
): THREE.MeshStandardMaterial {
  const materialOptions: THREE.MeshStandardMaterialParameters = {
    color: new THREE.Color(material.baseColor),
    roughness: material.roughness ?? 0.5,
    metalness: material.metallic ?? 0.0,
  };

  // Only add emissive properties if rim color is defined
  if (material.rimColor) {
    materialOptions.emissive = new THREE.Color(material.rimColor);
    materialOptions.emissiveIntensity = 0.2;
  }

  return new THREE.MeshStandardMaterial(materialOptions);
}

/**
 * Create an atmospheric glow shell around a planet
 * Returns a mesh that should be added as a child of the planet mesh
 */
export function createAtmosphereShell(
  material: PlanetMaterial,
  planetRadius: number,
  config: PlanetViewConfig
): THREE.Mesh | null {
  if (!material.atmosphereColor || !material.atmosphereIntensity) {
    return null;
  }

  const atmosphereGlow = config.atmosphereGlow ?? 1.0;
  if (atmosphereGlow <= 0) {
    return null;
  }

  const atmosphereScale = 1.15; // 15% larger than planet
  const geometry = new THREE.SphereGeometry(planetRadius * atmosphereScale, 32, 32);
  
  const atmosphereMaterial = new THREE.ShaderMaterial({
    uniforms: {
      atmosphereColor: { value: new THREE.Color(material.atmosphereColor) },
      intensity: { value: (material.atmosphereIntensity ?? 0.3) * atmosphereGlow },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 atmosphereColor;
      uniform float intensity;
      
      varying vec3 vNormal;
      varying vec3 vPosition;
      
      void main() {
        vec3 viewDir = normalize(-vPosition);
        float edgeFactor = 1.0 - max(dot(viewDir, vNormal), 0.0);
        float alpha = pow(edgeFactor, 2.0) * intensity;
        
        gl_FragColor = vec4(atmosphereColor, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
  });

  return new THREE.Mesh(geometry, atmosphereMaterial);
}

/**
 * Apply material to a planet mesh based on device capabilities
 * Returns the material that was applied and optional atmosphere shell
 */
export function applyPlanetMaterial(
  mesh: THREE.Mesh,
  material: PlanetMaterial,
  config: PlanetViewConfig,
  capabilities: DeviceCapabilities,
  lowPowerModeOverride?: boolean
): { material: THREE.Material; atmosphereShell: THREE.Mesh | null } {
  const lowPowerMode = lowPowerModeOverride ?? capabilities.isLowPower;

  let planetMaterial: THREE.Material;
  let atmosphereShell: THREE.Mesh | null = null;

  if (lowPowerMode || !capabilities.supportsWebGL) {
    // Use fallback material for low-power devices
    planetMaterial = createFallbackMaterial(material, config);
  } else {
    // Use full shader material
    planetMaterial = createPlanetShaderMaterial({
      material,
      config,
      enableAtmosphere: true,
      enableRimLighting: config.rimLighting ?? true,
      lowPowerMode: false,
    });

    // Create atmosphere shell for enhanced effect
    if (config.atmosphereGlow && (config.atmosphereGlow ?? 1.0) > 0) {
      atmosphereShell = createAtmosphereShell(material, 1.0, config);
    }
  }

  mesh.material = planetMaterial;

  return { material: planetMaterial, atmosphereShell };
}

/**
 * Map planet theme string to PlanetMaterial preset ID
 * Provides backwards compatibility with existing theme strings
 */
export function mapThemeToMaterialPreset(theme: string): string {
  const themeMap: Record<string, string> = {
    'blue-green': 'oceanic',
    'earth-like': 'rocky',
    'red': 'volcanic',
    'ice': 'ice-world',
    'gas': 'gas-giant',
  };

  return themeMap[theme] || 'rocky';
}

/**
 * Clone a PlanetMaterial to prevent reference mutation when used by multiple planets
 */
export function clonePlanetMaterial(material: PlanetMaterial): PlanetMaterial {
  return {
    ...material,
    texturePreset: material.texturePreset ? { ...material.texturePreset } : undefined,
  };
}

/**
 * Validate that animation multipliers are within safe ranges
 * Clamps values to prevent physics glitches
 */
export function clampAnimationMultiplier(value: number | undefined, defaultValue: number = 1.0): number {
  if (value === undefined) return defaultValue;
  // Clamp to reasonable range [0, 10] to prevent physics issues
  return Math.max(0, Math.min(10, value));
}
