/**
 * Tests for Planet Material System
 * Covers device detection, material creation, fallback mode, and edge cases
 */

import * as THREE from 'three';
import {
  detectDeviceCapabilities,
  createPlanetShaderMaterial,
  createFallbackMaterial,
  createAtmosphereShell,
  mapThemeToMaterialPreset,
  clonePlanetMaterial,
  clampAnimationMultiplier,
  DeviceCapabilities,
  PlanetShaderMaterialOptions,
} from '../materials';
import { PlanetMaterial, PlanetViewConfig } from '../config';
import { ROCKY_PLANET, ICE_WORLD } from '../presets';

// Mock DOM elements for device detection
const setupMockCanvas = (webglAvailable: boolean = true) => {
  // WebGL constants
  const MAX_TEXTURE_SIZE = 0x0D33;
  
  const mockGLContext = {
    MAX_TEXTURE_SIZE,
    getParameter: jest.fn((param: number) => {
      if (param === MAX_TEXTURE_SIZE) return 4096;
      return null;
    }),
    getExtension: jest.fn((name: string) => {
      if (name === 'OES_texture_float' || name === 'OES_texture_half_float') {
        return {};
      }
      return null;
    }),
  };
  
  const mockCanvas = {
    getContext: jest.fn((type: string) => {
      if (!webglAvailable) return null;
      return mockGLContext;
    }),
  };
  
  global.document.createElement = jest.fn(() => mockCanvas as any);
};

describe('Device Capability Detection', () => {
  beforeEach(() => {
    // Reset navigator mock
    Object.defineProperty(global.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      configurable: true,
    });
    Object.defineProperty(global.navigator, 'hardwareConcurrency', {
      value: 8,
      configurable: true,
    });
  });

  it('should detect WebGL availability', () => {
    setupMockCanvas(true);
    const capabilities = detectDeviceCapabilities();
    
    expect(capabilities.supportsWebGL).toBe(true);
  });

  it('should detect WebGL unavailability', () => {
    setupMockCanvas(false);
    const capabilities = detectDeviceCapabilities();
    
    expect(capabilities.supportsWebGL).toBe(false);
    expect(capabilities.isLowPower).toBe(true);
  });

  it('should detect mobile devices', () => {
    setupMockCanvas(true);
    Object.defineProperty(global.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      configurable: true,
    });
    
    const capabilities = detectDeviceCapabilities();
    
    expect(capabilities.isLowPower).toBe(true);
  });

  it('should detect low CPU core count', () => {
    setupMockCanvas(true);
    Object.defineProperty(global.navigator, 'hardwareConcurrency', {
      value: 2,
      configurable: true,
    });
    
    const capabilities = detectDeviceCapabilities();
    
    expect(capabilities.isLowPower).toBe(true);
  });

  it('should return correct max texture size', () => {
    setupMockCanvas(true);
    const capabilities = detectDeviceCapabilities();
    
    expect(capabilities.maxTextureSize).toBe(4096);
  });

  it('should detect float texture support', () => {
    setupMockCanvas(true);
    const capabilities = detectDeviceCapabilities();
    
    expect(capabilities.supportsFloatTextures).toBe(true);
  });
});

describe('Shader Material Creation', () => {
  const mockConfig: PlanetViewConfig = {
    planetRenderScale: 1.0,
    rotationSpeed: 1.0,
    atmosphereGlow: 1.0,
    cloudOpacity: 0.6,
    lightingIntensity: 1.0,
    rimLighting: true,
  };

  it('should create shader material with all features enabled', () => {
    const options: PlanetShaderMaterialOptions = {
      material: ROCKY_PLANET,
      config: mockConfig,
      enableAtmosphere: true,
      enableRimLighting: true,
      lowPowerMode: false,
    };

    const material = createPlanetShaderMaterial(options);

    expect(material).toBeInstanceOf(THREE.ShaderMaterial);
    expect(material.uniforms.baseColor.value).toBeInstanceOf(THREE.Color);
    expect(material.uniforms.enableRimLighting.value).toBe(true);
    expect(material.uniforms.enableAtmosphere.value).toBe(true);
    expect(material.uniforms.toonShading.value).toBe(false);
  });

  it('should disable effects in low power mode', () => {
    const options: PlanetShaderMaterialOptions = {
      material: ROCKY_PLANET,
      config: mockConfig,
      enableAtmosphere: true,
      enableRimLighting: true,
      lowPowerMode: true,
    };

    const material = createPlanetShaderMaterial(options);

    expect(material.uniforms.enableRimLighting.value).toBe(false);
    expect(material.uniforms.enableAtmosphere.value).toBe(false);
  });

  it('should apply toon shading when enabled in material', () => {
    const toonMaterial: PlanetMaterial = {
      ...ROCKY_PLANET,
      toonShading: true,
    };

    const options: PlanetShaderMaterialOptions = {
      material: toonMaterial,
      config: mockConfig,
    };

    const material = createPlanetShaderMaterial(options);

    expect(material.uniforms.toonShading.value).toBe(true);
  });

  it('should apply lighting intensity from config', () => {
    const configWithIntensity: PlanetViewConfig = {
      ...mockConfig,
      lightingIntensity: 1.5,
    };

    const options: PlanetShaderMaterialOptions = {
      material: ROCKY_PLANET,
      config: configWithIntensity,
    };

    const material = createPlanetShaderMaterial(options);

    expect(material.uniforms.lightingIntensity.value).toBe(1.5);
  });

  it('should multiply atmosphere intensity with config glow', () => {
    const configWithGlow: PlanetViewConfig = {
      ...mockConfig,
      atmosphereGlow: 1.5,
    };

    const materialWithAtmosphere: PlanetMaterial = {
      ...ROCKY_PLANET,
      atmosphereIntensity: 0.5,
    };

    const options: PlanetShaderMaterialOptions = {
      material: materialWithAtmosphere,
      config: configWithGlow,
    };

    const material = createPlanetShaderMaterial(options);

    expect(material.uniforms.atmosphereIntensity.value).toBe(0.75); // 0.5 * 1.5
  });
});

describe('Fallback Material Creation', () => {
  const mockConfig: PlanetViewConfig = {
    planetRenderScale: 1.0,
    rotationSpeed: 1.0,
    atmosphereGlow: 1.0,
    cloudOpacity: 0.6,
    lightingIntensity: 1.0,
    rimLighting: true,
  };

  it('should create basic standard material', () => {
    const material = createFallbackMaterial(ROCKY_PLANET, mockConfig);

    expect(material).toBeInstanceOf(THREE.MeshStandardMaterial);
    expect(material.roughness).toBe(0.8);
    expect(material.metalness).toBe(0.1);
  });

  it('should apply rim color as emissive when available', () => {
    const material = createFallbackMaterial(ROCKY_PLANET, mockConfig);

    expect(material.emissive).toBeInstanceOf(THREE.Color);
    expect(material.emissiveIntensity).toBe(0.2);
  });

  it('should handle material without rim color', () => {
    const noRimMaterial: PlanetMaterial = {
      ...ROCKY_PLANET,
      rimColor: undefined,
    };

    const material = createFallbackMaterial(noRimMaterial, mockConfig);

    // THREE.MeshStandardMaterial defaults emissive to black (0x000000)
    expect(material.emissive.getHex()).toBe(0x000000);
    // Default emissiveIntensity is 1, but since emissive is black, it has no visual effect
    expect(material.emissiveIntensity).toBe(1);
  });
});

describe('Atmosphere Shell Creation', () => {
  const mockConfig: PlanetViewConfig = {
    planetRenderScale: 1.0,
    rotationSpeed: 1.0,
    atmosphereGlow: 1.5,
    cloudOpacity: 0.6,
    lightingIntensity: 1.0,
    rimLighting: true,
  };

  it('should create atmosphere shell with valid material', () => {
    const shell = createAtmosphereShell(ROCKY_PLANET, 1.0, mockConfig);

    expect(shell).toBeInstanceOf(THREE.Mesh);
    expect(shell?.geometry).toBeInstanceOf(THREE.SphereGeometry);
    expect(shell?.material).toBeInstanceOf(THREE.ShaderMaterial);
  });

  it('should return null when atmosphere color is missing', () => {
    const noAtmosphereMaterial: PlanetMaterial = {
      ...ROCKY_PLANET,
      atmosphereColor: undefined,
    };

    const shell = createAtmosphereShell(noAtmosphereMaterial, 1.0, mockConfig);

    expect(shell).toBeNull();
  });

  it('should return null when atmosphere intensity is zero', () => {
    const zeroIntensityMaterial: PlanetMaterial = {
      ...ROCKY_PLANET,
      atmosphereIntensity: 0,
    };

    const shell = createAtmosphereShell(zeroIntensityMaterial, 1.0, mockConfig);

    expect(shell).toBeNull();
  });

  it('should scale atmosphere shell correctly', () => {
    const shell = createAtmosphereShell(ROCKY_PLANET, 2.0, mockConfig);

    expect(shell).not.toBeNull();
    // Atmosphere should be 15% larger than planet
    const geometry = shell?.geometry as THREE.SphereGeometry;
    expect(geometry.parameters.radius).toBe(2.3); // 2.0 * 1.15
  });

  it('should multiply atmosphere intensity with config glow', () => {
    const shell = createAtmosphereShell(ROCKY_PLANET, 1.0, mockConfig);

    expect(shell).not.toBeNull();
    const material = shell?.material as THREE.ShaderMaterial;
    const expectedIntensity = (ROCKY_PLANET.atmosphereIntensity ?? 0.3) * 1.5;
    expect(material.uniforms.intensity.value).toBe(expectedIntensity);
  });
});

describe('Theme to Material Preset Mapping', () => {
  it('should map blue-green to oceanic', () => {
    expect(mapThemeToMaterialPreset('blue-green')).toBe('oceanic');
  });

  it('should map earth-like to rocky', () => {
    expect(mapThemeToMaterialPreset('earth-like')).toBe('rocky');
  });

  it('should map red to volcanic', () => {
    expect(mapThemeToMaterialPreset('red')).toBe('volcanic');
  });

  it('should map ice to ice-world', () => {
    expect(mapThemeToMaterialPreset('ice')).toBe('ice-world');
  });

  it('should map gas to gas-giant', () => {
    expect(mapThemeToMaterialPreset('gas')).toBe('gas-giant');
  });

  it('should default to rocky for unknown themes', () => {
    expect(mapThemeToMaterialPreset('unknown-theme')).toBe('rocky');
  });
});

describe('Material Cloning', () => {
  it('should create independent copy of material', () => {
    const original = ROCKY_PLANET;
    const cloned = clonePlanetMaterial(original);

    expect(cloned).not.toBe(original);
    expect(cloned.id).toBe(original.id);
    expect(cloned.baseColor).toBe(original.baseColor);
  });

  it('should clone texture preset', () => {
    const original = ROCKY_PLANET;
    const cloned = clonePlanetMaterial(original);

    if (original.texturePreset && cloned.texturePreset) {
      expect(cloned.texturePreset).not.toBe(original.texturePreset);
      expect(cloned.texturePreset.name).toBe(original.texturePreset.name);
    }
  });

  it('should handle material without texture preset', () => {
    const noTexture: PlanetMaterial = {
      ...ROCKY_PLANET,
      texturePreset: undefined,
    };

    const cloned = clonePlanetMaterial(noTexture);

    expect(cloned.texturePreset).toBeUndefined();
  });

  it('should prevent reference mutation', () => {
    const original = clonePlanetMaterial(ICE_WORLD);
    const cloned = clonePlanetMaterial(ICE_WORLD);

    // Modify cloned material
    (cloned as any).baseColor = '#FF0000';

    // Original should be unchanged
    expect(original.baseColor).toBe(ICE_WORLD.baseColor);
    expect(cloned.baseColor).toBe('#FF0000');
  });
});

describe('Animation Multiplier Clamping', () => {
  it('should return default value when undefined', () => {
    expect(clampAnimationMultiplier(undefined, 1.5)).toBe(1.5);
  });

  it('should return default 1.0 when no default specified', () => {
    expect(clampAnimationMultiplier(undefined)).toBe(1.0);
  });

  it('should pass through valid values', () => {
    expect(clampAnimationMultiplier(2.5)).toBe(2.5);
    expect(clampAnimationMultiplier(5.0)).toBe(5.0);
  });

  it('should clamp negative values to 0', () => {
    expect(clampAnimationMultiplier(-1.0)).toBe(0);
  });

  it('should clamp values above 10', () => {
    expect(clampAnimationMultiplier(15.0)).toBe(10);
    expect(clampAnimationMultiplier(100.0)).toBe(10);
  });

  it('should allow zero', () => {
    expect(clampAnimationMultiplier(0)).toBe(0);
  });

  it('should allow exactly 10', () => {
    expect(clampAnimationMultiplier(10)).toBe(10);
  });
});

describe('Edge Cases', () => {
  describe('Small Planets', () => {
    it('should handle very small planet radius', () => {
      const mockConfig: PlanetViewConfig = {
        planetRenderScale: 0.5,
        rotationSpeed: 1.0,
        atmosphereGlow: 1.0,
        lightingIntensity: 1.0,
        rimLighting: true,
      };

      const shell = createAtmosphereShell(ROCKY_PLANET, 0.1, mockConfig);

      expect(shell).not.toBeNull();
      const geometry = shell?.geometry as THREE.SphereGeometry;
      expect(geometry.parameters.radius).toBeCloseTo(0.115, 3);
    });
  });

  describe('Multiple Planets with Same Preset', () => {
    it('should create independent materials via cloning', () => {
      const material1 = clonePlanetMaterial(ROCKY_PLANET);
      const material2 = clonePlanetMaterial(ROCKY_PLANET);

      // Modify first material
      (material1 as any).rimIntensity = 2.0;

      // Second material should be unaffected
      expect(material2.rimIntensity).toBe(ROCKY_PLANET.rimIntensity);
    });
  });

  describe('Extreme Animation Multipliers', () => {
    it('should prevent physics glitches with extreme speeds', () => {
      const extremeSpeed = clampAnimationMultiplier(1000);
      expect(extremeSpeed).toBe(10);
    });

    it('should handle negative speeds gracefully', () => {
      const negativeSpeed = clampAnimationMultiplier(-50);
      expect(negativeSpeed).toBe(0);
    });
  });

  describe('Missing Material Properties', () => {
    it('should handle missing optional rim lighting properties', () => {
      const minimalMaterial: PlanetMaterial = {
        id: 'minimal',
        name: 'Minimal',
        description: 'Test',
        baseColor: '#FFFFFF',
      };

      const mockConfig: PlanetViewConfig = {
        planetRenderScale: 1.0,
        rotationSpeed: 1.0,
        lightingIntensity: 1.0,
        rimLighting: true,
      };

      const options: PlanetShaderMaterialOptions = {
        material: minimalMaterial,
        config: mockConfig,
      };

      const shaderMaterial = createPlanetShaderMaterial(options);
      expect(shaderMaterial).toBeInstanceOf(THREE.ShaderMaterial);
      expect(shaderMaterial.uniforms.rimIntensity.value).toBe(0.5); // Default
    });
  });
});
