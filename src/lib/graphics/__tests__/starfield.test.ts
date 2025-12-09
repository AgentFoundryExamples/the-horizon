/**
 * Unit tests for starfield generator
 */

import {
  createStarfieldConfig,
  generateStarfield,
  updateStarfield,
  disposeStarfield,
  validateStarfieldDensity,
  type StarfieldConfig,
} from '../starfield';
import type { UniverseConfig, GalaxyViewConfig } from '../config';

describe('Starfield Generator', () => {
  describe('createStarfieldConfig', () => {
    it('should create default config from universe settings', () => {
      const universeConfig: UniverseConfig = {
        backgroundStarDensity: 0.5,
        lowPowerMode: false,
      };
      
      const config = createStarfieldConfig(universeConfig);
      
      expect(config.density).toBeGreaterThan(0);
      expect(config.enableParallax).toBe(true);
      expect(config.lowPowerMode).toBe(false);
    });
    
    it('should apply star density multiplier from galaxy view config', () => {
      const universeConfig: UniverseConfig = {
        backgroundStarDensity: 0.5,
      };
      const galaxyViewConfig: GalaxyViewConfig = {
        starDensity: 2.0,
      };
      
      const config = createStarfieldConfig(universeConfig, galaxyViewConfig);
      
      // Should have more stars due to multiplier
      expect(config.density).toBeGreaterThan(1000);
    });
    
    it('should apply star brightness multiplier', () => {
      const universeConfig: UniverseConfig = {
        backgroundStarDensity: 0.5,
      };
      const galaxyViewConfig: GalaxyViewConfig = {
        starBrightness: 2.0,
      };
      
      const config = createStarfieldConfig(universeConfig, galaxyViewConfig);
      
      expect(config.brightnessRange[1]).toBe(2.0);
    });
    
    it('should reduce density in low power mode', () => {
      const universeConfigNormal: UniverseConfig = {
        backgroundStarDensity: 0.5,
        lowPowerMode: false,
      };
      const universeConfigLowPower: UniverseConfig = {
        backgroundStarDensity: 0.5,
        lowPowerMode: true,
      };
      
      const normalConfig = createStarfieldConfig(universeConfigNormal);
      const lowPowerConfig = createStarfieldConfig(universeConfigLowPower);
      
      expect(lowPowerConfig.density).toBeLessThan(normalConfig.density);
      expect(lowPowerConfig.enableParallax).toBe(false);
    });
    
    it('should clamp density to performance limits', () => {
      const universeConfig: UniverseConfig = {
        backgroundStarDensity: 10.0, // Very high
      };
      const galaxyViewConfig: GalaxyViewConfig = {
        starDensity: 10.0,
      };
      
      const config = createStarfieldConfig(universeConfig, galaxyViewConfig);
      
      // Should be clamped to MAX_STARS (10000)
      expect(config.density).toBeLessThanOrEqual(10000);
    });
  });
  
  describe('generateStarfield', () => {
    it('should generate starfield with correct particle count', () => {
      const config: StarfieldConfig = {
        density: 1000,
        brightnessRange: [0.3, 1.0],
        parallaxSpeed: 0.05,
        colorVariance: 0.3,
        animationSpeed: 1.0,
        enableParallax: true,
        sizeRange: [0.5, 3.0],
        distributionRadius: 500,
        lowPowerMode: false,
      };
      
      const starfield = generateStarfield(config);
      
      expect(starfield.geometry).toBeDefined();
      expect(starfield.material).toBeDefined();
      expect(starfield.positions.length).toBe(1000 * 3);
      expect(starfield.colors.length).toBe(1000 * 3);
      expect(starfield.sizes.length).toBe(1000);
      expect(starfield.velocities.length).toBe(1000 * 3);
      
      // Cleanup
      disposeStarfield(starfield);
    });
    
    it('should create shader material by default', () => {
      const config: StarfieldConfig = {
        density: 100,
        brightnessRange: [0.3, 1.0],
        parallaxSpeed: 0.05,
        colorVariance: 0.3,
        animationSpeed: 1.0,
        enableParallax: true,
        sizeRange: [0.5, 3.0],
        distributionRadius: 500,
        lowPowerMode: false,
      };
      
      const starfield = generateStarfield(config);
      
      expect(starfield.fallbackMode).toBe(false);
      expect(starfield.material.type).toBe('ShaderMaterial');
      
      disposeStarfield(starfield);
    });
    
    it('should store original positions for animation reset', () => {
      const config: StarfieldConfig = {
        density: 100,
        brightnessRange: [0.3, 1.0],
        parallaxSpeed: 0.05,
        colorVariance: 0.3,
        animationSpeed: 1.0,
        enableParallax: true,
        sizeRange: [0.5, 3.0],
        distributionRadius: 500,
        lowPowerMode: false,
      };
      
      const starfield = generateStarfield(config);
      
      expect(starfield.originalPositions.length).toBe(starfield.positions.length);
      expect(starfield.originalPositions).not.toBe(starfield.positions); // Should be copy
      
      disposeStarfield(starfield);
    });
  });
  
  describe('updateStarfield', () => {
    it('should update positions when parallax enabled and not paused', () => {
      const config: StarfieldConfig = {
        density: 10,
        brightnessRange: [0.3, 1.0],
        parallaxSpeed: 5.0, // Higher speed to make change noticeable
        colorVariance: 0.3,
        animationSpeed: 1.0,
        enableParallax: true,
        sizeRange: [0.5, 3.0],
        distributionRadius: 500,
        lowPowerMode: false,
      };
      
      const starfield = generateStarfield(config);
      const positions = starfield.geometry.attributes.position.array as Float32Array;
      const originalPositions = new Float32Array(positions);
      
      // Simulate one frame
      updateStarfield(starfield, 1.0, false); // Longer delta time
      
      // Positions in geometry should have changed
      let changed = false;
      for (let i = 0; i < positions.length; i++) {
        if (Math.abs(positions[i] - originalPositions[i]) > 0.001) {
          changed = true;
          break;
        }
      }
      expect(changed).toBe(true);
      
      disposeStarfield(starfield);
    });
    
    it('should not update positions when paused', () => {
      const config: StarfieldConfig = {
        density: 10,
        brightnessRange: [0.3, 1.0],
        parallaxSpeed: 0.05,
        colorVariance: 0.3,
        animationSpeed: 1.0,
        enableParallax: true,
        sizeRange: [0.5, 3.0],
        distributionRadius: 500,
        lowPowerMode: false,
      };
      
      const starfield = generateStarfield(config);
      const positions = starfield.geometry.attributes.position.array as Float32Array;
      const originalPositions = new Float32Array(positions);
      
      // Simulate one frame with pause
      updateStarfield(starfield, 0.016, true);
      
      // Positions should NOT have changed
      for (let i = 0; i < positions.length; i++) {
        expect(positions[i]).toBe(originalPositions[i]);
      }
      
      disposeStarfield(starfield);
    });
    
    it('should not update positions when parallax disabled', () => {
      const config: StarfieldConfig = {
        density: 10,
        brightnessRange: [0.3, 1.0],
        parallaxSpeed: 0.05,
        colorVariance: 0.3,
        animationSpeed: 1.0,
        enableParallax: false,
        sizeRange: [0.5, 3.0],
        distributionRadius: 500,
        lowPowerMode: false,
      };
      
      const starfield = generateStarfield(config);
      const positions = starfield.geometry.attributes.position.array as Float32Array;
      const originalPositions = new Float32Array(positions);
      
      updateStarfield(starfield, 0.016, false);
      
      // Positions should NOT have changed
      for (let i = 0; i < positions.length; i++) {
        expect(positions[i]).toBe(originalPositions[i]);
      }
      
      disposeStarfield(starfield);
    });
    
    it('should wrap positions that drift too far', () => {
      const config: StarfieldConfig = {
        density: 1,
        brightnessRange: [0.3, 1.0],
        parallaxSpeed: 100.0, // Very fast to trigger wrap
        colorVariance: 0.3,
        animationSpeed: 1.0,
        enableParallax: true,
        sizeRange: [0.5, 3.0],
        distributionRadius: 500,
        lowPowerMode: false,
      };
      
      const starfield = generateStarfield(config);
      const originalPositions = starfield.originalPositions.slice();
      
      // Simulate many frames to drift far
      for (let i = 0; i < 100; i++) {
        updateStarfield(starfield, 1.0, false);
      }
      
      // Position in geometry should be close to original due to wrapping
      const positions = starfield.geometry.attributes.position.array as Float32Array;
      const dx = positions[0] - originalPositions[0];
      const dy = positions[1] - originalPositions[1];
      const dz = positions[2] - originalPositions[2];
      const distSq = dx * dx + dy * dy + dz * dz;
      
      expect(distSq).toBeLessThan(10000); // Should wrap before exceeding ~100 units
      
      disposeStarfield(starfield);
    });
  });
  
  describe('validateStarfieldDensity', () => {
    it('should accept valid density', () => {
      const result = validateStarfieldDensity(5000);
      
      expect(result.density).toBe(5000);
      expect(result.clamped).toBe(false);
      expect(result.reason).toBeUndefined();
    });
    
    it('should clamp excessive density', () => {
      const result = validateStarfieldDensity(20000);
      
      expect(result.density).toBe(10000); // MAX_STARS
      expect(result.clamped).toBe(true);
      expect(result.reason).toContain('clamped');
    });
    
    it('should handle edge case at max', () => {
      const result = validateStarfieldDensity(10000);
      
      expect(result.density).toBe(10000);
      expect(result.clamped).toBe(false);
    });
  });
  
  describe('disposeStarfield', () => {
    it('should dispose geometry and material', () => {
      const config: StarfieldConfig = {
        density: 100,
        brightnessRange: [0.3, 1.0],
        parallaxSpeed: 0.05,
        colorVariance: 0.3,
        animationSpeed: 1.0,
        enableParallax: true,
        sizeRange: [0.5, 3.0],
        distributionRadius: 500,
        lowPowerMode: false,
      };
      
      const starfield = generateStarfield(config);
      
      // Spy on dispose methods
      const geometryDisposeSpy = jest.spyOn(starfield.geometry, 'dispose');
      const materialDisposeSpy = jest.spyOn(starfield.material as any, 'dispose');
      
      disposeStarfield(starfield);
      
      expect(geometryDisposeSpy).toHaveBeenCalled();
      expect(materialDisposeSpy).toHaveBeenCalled();
    });
  });
  
  describe('Star distribution', () => {
    it('should distribute stars in spherical pattern', () => {
      const config: StarfieldConfig = {
        density: 1000,
        brightnessRange: [0.3, 1.0],
        parallaxSpeed: 0.05,
        colorVariance: 0.3,
        animationSpeed: 1.0,
        enableParallax: true,
        sizeRange: [0.5, 3.0],
        distributionRadius: 100,
        lowPowerMode: false,
      };
      
      const starfield = generateStarfield(config);
      
      // Check that stars are distributed within radius
      for (let i = 0; i < starfield.positions.length; i += 3) {
        const x = starfield.positions[i];
        const y = starfield.positions[i + 1];
        const z = starfield.positions[i + 2];
        const dist = Math.sqrt(x * x + y * y + z * z);
        
        expect(dist).toBeLessThanOrEqual(config.distributionRadius);
        expect(dist).toBeGreaterThan(0);
      }
      
      disposeStarfield(starfield);
    });
  });
  
  describe('Color variance', () => {
    it('should generate varied colors when variance > 0', () => {
      const config: StarfieldConfig = {
        density: 100,
        brightnessRange: [0.3, 1.0],
        parallaxSpeed: 0.05,
        colorVariance: 0.5,
        animationSpeed: 1.0,
        enableParallax: true,
        sizeRange: [0.5, 3.0],
        distributionRadius: 500,
        lowPowerMode: false,
      };
      
      const starfield = generateStarfield(config);
      
      // Check that not all colors are identical
      const firstColor = [
        starfield.colors[0],
        starfield.colors[1],
        starfield.colors[2],
      ];
      
      let allSame = true;
      for (let i = 3; i < starfield.colors.length; i += 3) {
        if (
          starfield.colors[i] !== firstColor[0] ||
          starfield.colors[i + 1] !== firstColor[1] ||
          starfield.colors[i + 2] !== firstColor[2]
        ) {
          allSame = false;
          break;
        }
      }
      
      expect(allSame).toBe(false);
      
      disposeStarfield(starfield);
    });
  });
});
