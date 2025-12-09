/**
 * Unit tests for galaxy renderer
 */

import {
  createGalaxyRenderConfig,
  generateGalaxy,
  updateGalaxy,
  setGalaxyOpacity,
  disposeGalaxy,
  getGalaxyThemes,
  validateGalaxyConfig,
  type GalaxyRenderConfig,
  type GalaxyTheme,
} from '../galaxy';
import type { GalaxyViewConfig } from '../config';

describe('Galaxy Renderer', () => {
  describe('createGalaxyRenderConfig', () => {
    it('should create default config from galaxy view settings', () => {
      const galaxyViewConfig: GalaxyViewConfig = {
        galaxyOpacity: 0.7,
        rotationSpeed: 1.0,
        starDensity: 1.0,
      };
      
      const config = createGalaxyRenderConfig(galaxyViewConfig, 'classic', false);
      
      expect(config.particleCount).toBeGreaterThan(0);
      expect(config.opacity).toBe(0.7);
      expect(config.theme).toBe('classic');
      expect(config.enableGlow).toBe(true);
      expect(config.enableNebula).toBe(true);
    });
    
    it('should apply star density multiplier', () => {
      const galaxyViewConfigLow: GalaxyViewConfig = {
        starDensity: 0.5,
      };
      const galaxyViewConfigHigh: GalaxyViewConfig = {
        starDensity: 2.0,
      };
      
      const configLow = createGalaxyRenderConfig(galaxyViewConfigLow, 'classic', false);
      const configHigh = createGalaxyRenderConfig(galaxyViewConfigHigh, 'classic', false);
      
      expect(configHigh.particleCount).toBeGreaterThan(configLow.particleCount);
    });
    
    it('should disable effects in low power mode', () => {
      const galaxyViewConfig: GalaxyViewConfig = {
        starDensity: 1.0,
      };
      
      const config = createGalaxyRenderConfig(galaxyViewConfig, 'classic', true);
      
      expect(config.enableGlow).toBe(false);
      expect(config.enableNebula).toBe(false);
      expect(config.enableBloom).toBe(false);
      expect(config.particleCount).toBeLessThan(3000); // Reduced in low power mode
    });
    
    it('should clamp particle count to max', () => {
      const galaxyViewConfig: GalaxyViewConfig = {
        starDensity: 100.0, // Very high
      };
      
      const config = createGalaxyRenderConfig(galaxyViewConfig, 'classic', false);
      
      expect(config.particleCount).toBeLessThanOrEqual(15000); // MAX_GALAXY_PARTICLES
    });
  });
  
  describe('generateGalaxy', () => {
    it('should generate galaxy with core layer', () => {
      const config: GalaxyRenderConfig = {
        particleCount: 1000,
        radius: 20,
        coreRadius: 3,
        armCount: 3,
        spiralTightness: 0.5,
        rotationSpeed: 0.05,
        opacity: 0.7,
        theme: 'classic',
        enableGlow: false,
        enableNebula: false,
        enableBloom: false,
        noiseIntensity: 0.3,
        motionBlur: 0.0,
        lowPowerMode: false,
      };
      
      const galaxy = generateGalaxy(config);
      
      expect(galaxy.layers.length).toBeGreaterThan(0);
      expect(galaxy.layers.some(layer => layer.layerType === 'core')).toBe(true);
      expect(galaxy.fallbackMode).toBe(false);
      
      disposeGalaxy(galaxy);
    });
    
    it('should generate spiral arms', () => {
      const config: GalaxyRenderConfig = {
        particleCount: 1000,
        radius: 20,
        coreRadius: 3,
        armCount: 3,
        spiralTightness: 0.5,
        rotationSpeed: 0.05,
        opacity: 0.7,
        theme: 'classic',
        enableGlow: false,
        enableNebula: false,
        enableBloom: false,
        noiseIntensity: 0.3,
        motionBlur: 0.0,
        lowPowerMode: false,
      };
      
      const galaxy = generateGalaxy(config);
      
      const armLayers = galaxy.layers.filter(layer => layer.layerType === 'arms');
      expect(armLayers.length).toBe(config.armCount);
      
      disposeGalaxy(galaxy);
    });
    
    it('should generate glow layers when enabled', () => {
      const config: GalaxyRenderConfig = {
        particleCount: 1000,
        radius: 20,
        coreRadius: 3,
        armCount: 2,
        spiralTightness: 0.5,
        rotationSpeed: 0.05,
        opacity: 0.7,
        theme: 'classic',
        enableGlow: true,
        enableNebula: false,
        enableBloom: false,
        noiseIntensity: 0.3,
        motionBlur: 0.0,
        lowPowerMode: false,
      };
      
      const galaxy = generateGalaxy(config);
      
      const glowLayers = galaxy.layers.filter(layer => layer.layerType === 'glow');
      expect(glowLayers.length).toBe(config.armCount);
      
      disposeGalaxy(galaxy);
    });
    
    it('should not generate glow layers when disabled', () => {
      const config: GalaxyRenderConfig = {
        particleCount: 1000,
        radius: 20,
        coreRadius: 3,
        armCount: 2,
        spiralTightness: 0.5,
        rotationSpeed: 0.05,
        opacity: 0.7,
        theme: 'classic',
        enableGlow: false,
        enableNebula: false,
        enableBloom: false,
        noiseIntensity: 0.3,
        motionBlur: 0.0,
        lowPowerMode: false,
      };
      
      const galaxy = generateGalaxy(config);
      
      const glowLayers = galaxy.layers.filter(layer => layer.layerType === 'glow');
      expect(glowLayers.length).toBe(0);
      
      disposeGalaxy(galaxy);
    });
    
    it('should generate nebula layer when enabled', () => {
      const config: GalaxyRenderConfig = {
        particleCount: 1000,
        radius: 20,
        coreRadius: 3,
        armCount: 2,
        spiralTightness: 0.5,
        rotationSpeed: 0.05,
        opacity: 0.7,
        theme: 'classic',
        enableGlow: false,
        enableNebula: true,
        enableBloom: false,
        noiseIntensity: 0.3,
        motionBlur: 0.0,
        lowPowerMode: false,
      };
      
      const galaxy = generateGalaxy(config);
      
      expect(galaxy.layers.some(layer => layer.layerType === 'nebula')).toBe(true);
      
      disposeGalaxy(galaxy);
    });
    
    it('should use shader materials by default', () => {
      const config: GalaxyRenderConfig = {
        particleCount: 100,
        radius: 20,
        coreRadius: 3,
        armCount: 2,
        spiralTightness: 0.5,
        rotationSpeed: 0.05,
        opacity: 0.7,
        theme: 'classic',
        enableGlow: false,
        enableNebula: false,
        enableBloom: false,
        noiseIntensity: 0.3,
        motionBlur: 0.0,
        lowPowerMode: false,
      };
      
      const galaxy = generateGalaxy(config);
      
      expect(galaxy.fallbackMode).toBe(false);
      galaxy.layers.forEach(layer => {
        expect(layer.material.type).toBe('ShaderMaterial');
      });
      
      disposeGalaxy(galaxy);
    });
  });
  
  describe('updateGalaxy', () => {
    it('should update shader uniforms with time', () => {
      const config: GalaxyRenderConfig = {
        particleCount: 100,
        radius: 20,
        coreRadius: 3,
        armCount: 2,
        spiralTightness: 0.5,
        rotationSpeed: 0.05,
        opacity: 0.7,
        theme: 'classic',
        enableGlow: false,
        enableNebula: false,
        enableBloom: false,
        noiseIntensity: 0.3,
        motionBlur: 0.0,
        lowPowerMode: false,
      };
      
      const galaxy = generateGalaxy(config);
      
      updateGalaxy(galaxy, 1.5);
      
      galaxy.layers.forEach(layer => {
        if ('uniforms' in layer.material && layer.material.uniforms.time) {
          expect(layer.material.uniforms.time.value).toBe(1.5);
        }
      });
      
      disposeGalaxy(galaxy);
    });
  });
  
  describe('setGalaxyOpacity', () => {
    it('should update galaxy opacity', () => {
      const config: GalaxyRenderConfig = {
        particleCount: 100,
        radius: 20,
        coreRadius: 3,
        armCount: 2,
        spiralTightness: 0.5,
        rotationSpeed: 0.05,
        opacity: 0.7,
        theme: 'classic',
        enableGlow: false,
        enableNebula: false,
        enableBloom: false,
        noiseIntensity: 0.3,
        motionBlur: 0.0,
        lowPowerMode: false,
      };
      
      const galaxy = generateGalaxy(config);
      
      setGalaxyOpacity(galaxy, 0.5);
      
      expect(galaxy.config.opacity).toBe(0.5);
      galaxy.layers.forEach(layer => {
        expect(layer.material.opacity).toBe(0.5);
      });
      
      disposeGalaxy(galaxy);
    });
    
    it('should fully hide galaxy at opacity 0', () => {
      const config: GalaxyRenderConfig = {
        particleCount: 100,
        radius: 20,
        coreRadius: 3,
        armCount: 2,
        spiralTightness: 0.5,
        rotationSpeed: 0.05,
        opacity: 0.7,
        theme: 'classic',
        enableGlow: false,
        enableNebula: false,
        enableBloom: false,
        noiseIntensity: 0.3,
        motionBlur: 0.0,
        lowPowerMode: false,
      };
      
      const galaxy = generateGalaxy(config);
      
      setGalaxyOpacity(galaxy, 0.0);
      
      expect(galaxy.config.opacity).toBe(0.0);
      galaxy.layers.forEach(layer => {
        expect(layer.material.visible).toBe(false);
      });
      
      disposeGalaxy(galaxy);
    });
    
    it('should clamp opacity to valid range', () => {
      const config: GalaxyRenderConfig = {
        particleCount: 100,
        radius: 20,
        coreRadius: 3,
        armCount: 2,
        spiralTightness: 0.5,
        rotationSpeed: 0.05,
        opacity: 0.7,
        theme: 'classic',
        enableGlow: false,
        enableNebula: false,
        enableBloom: false,
        noiseIntensity: 0.3,
        motionBlur: 0.0,
        lowPowerMode: false,
      };
      
      const galaxy = generateGalaxy(config);
      
      setGalaxyOpacity(galaxy, 1.5); // Over max
      expect(galaxy.config.opacity).toBe(1.0);
      
      setGalaxyOpacity(galaxy, -0.5); // Under min
      expect(galaxy.config.opacity).toBe(0.0);
      
      disposeGalaxy(galaxy);
    });
  });
  
  describe('getGalaxyThemes', () => {
    it('should return available themes', () => {
      const themes = getGalaxyThemes();
      
      expect(themes.length).toBeGreaterThan(0);
      expect(themes).toContain('classic');
      expect(themes).toContain('neon');
      expect(themes).toContain('molten');
      expect(themes).toContain('ethereal');
      expect(themes).toContain('dark-matter');
    });
  });
  
  describe('validateGalaxyConfig', () => {
    it('should validate correct config', () => {
      const config: GalaxyRenderConfig = {
        particleCount: 1000,
        radius: 20,
        coreRadius: 3,
        armCount: 3,
        spiralTightness: 0.5,
        rotationSpeed: 1.0,
        opacity: 0.7,
        theme: 'classic',
        enableGlow: true,
        enableNebula: true,
        enableBloom: true,
        noiseIntensity: 0.3,
        motionBlur: 0.0,
        lowPowerMode: false,
      };
      
      const result = validateGalaxyConfig(config);
      
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBe(0);
    });
    
    it('should reject excessive particle count', () => {
      const config: GalaxyRenderConfig = {
        particleCount: 20000, // Over max
        radius: 20,
        coreRadius: 3,
        armCount: 3,
        spiralTightness: 0.5,
        rotationSpeed: 1.0,
        opacity: 0.7,
        theme: 'classic',
        enableGlow: true,
        enableNebula: true,
        enableBloom: true,
        noiseIntensity: 0.3,
        motionBlur: 0.0,
        lowPowerMode: false,
      };
      
      const result = validateGalaxyConfig(config);
      
      expect(result.valid).toBe(false);
      expect(result.warnings.some(w => w.includes('Particle count'))).toBe(true);
    });
    
    it('should reject invalid opacity', () => {
      const config: GalaxyRenderConfig = {
        particleCount: 1000,
        radius: 20,
        coreRadius: 3,
        armCount: 3,
        spiralTightness: 0.5,
        rotationSpeed: 1.0,
        opacity: 1.5, // Invalid
        theme: 'classic',
        enableGlow: true,
        enableNebula: true,
        enableBloom: true,
        noiseIntensity: 0.3,
        motionBlur: 0.0,
        lowPowerMode: false,
      };
      
      const result = validateGalaxyConfig(config);
      
      expect(result.valid).toBe(false);
      expect(result.warnings.some(w => w.includes('Opacity'))).toBe(true);
    });
    
    it('should warn about unsafe rotation speed', () => {
      const config: GalaxyRenderConfig = {
        particleCount: 1000,
        radius: 20,
        coreRadius: 3,
        armCount: 3,
        spiralTightness: 0.5,
        rotationSpeed: 15.0, // Very high
        opacity: 0.7,
        theme: 'classic',
        enableGlow: true,
        enableNebula: true,
        enableBloom: true,
        noiseIntensity: 0.3,
        motionBlur: 0.0,
        lowPowerMode: false,
      };
      
      const result = validateGalaxyConfig(config);
      
      expect(result.warnings.some(w => w.includes('Rotation speed'))).toBe(true);
    });
  });
  
  describe('disposeGalaxy', () => {
    it('should dispose all layers', () => {
      const config: GalaxyRenderConfig = {
        particleCount: 100,
        radius: 20,
        coreRadius: 3,
        armCount: 2,
        spiralTightness: 0.5,
        rotationSpeed: 0.05,
        opacity: 0.7,
        theme: 'classic',
        enableGlow: true,
        enableNebula: true,
        enableBloom: false,
        noiseIntensity: 0.3,
        motionBlur: 0.0,
        lowPowerMode: false,
      };
      
      const galaxy = generateGalaxy(config);
      const layerCount = galaxy.layers.length;
      
      const disposeSpy = jest.fn();
      galaxy.layers.forEach(layer => {
        jest.spyOn(layer.geometry, 'dispose');
        jest.spyOn(layer.material as any, 'dispose');
      });
      
      disposeGalaxy(galaxy);
      
      galaxy.layers.forEach(layer => {
        expect(layer.geometry.dispose).toHaveBeenCalled();
        expect((layer.material as any).dispose).toHaveBeenCalled();
      });
    });
  });
  
  describe('Theme variations', () => {
    const themes: GalaxyTheme[] = ['neon', 'molten', 'ethereal', 'classic', 'dark-matter'];
    
    themes.forEach(theme => {
      it(`should generate galaxy with ${theme} theme`, () => {
        const config: GalaxyRenderConfig = {
          particleCount: 100,
          radius: 20,
          coreRadius: 3,
          armCount: 2,
          spiralTightness: 0.5,
          rotationSpeed: 0.05,
          opacity: 0.7,
          theme,
          enableGlow: false,
          enableNebula: false,
          enableBloom: false,
          noiseIntensity: 0.3,
          motionBlur: 0.0,
          lowPowerMode: false,
        };
        
        const galaxy = generateGalaxy(config);
        
        expect(galaxy.config.theme).toBe(theme);
        expect(galaxy.layers.length).toBeGreaterThan(0);
        
        disposeGalaxy(galaxy);
      });
    });
  });
});
