/**
 * Unit tests for animation utilities
 */

import { renderHook, act } from '@testing-library/react';
import {
  usePrefersReducedMotion,
  getAnimationConfig,
  calculateAnimationIntensity,
  useAnimationPerformance,
  DEFAULT_ANIMATION_CONFIG,
  AnimationConfig,
} from '../animation';

// Mock matchMedia
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

describe('Animation Utilities', () => {
  describe('usePrefersReducedMotion', () => {
    it('should return false when reduced motion is not preferred', () => {
      mockMatchMedia(false);
      const { result } = renderHook(() => usePrefersReducedMotion());
      expect(result.current).toBe(false);
    });

    it('should return true when reduced motion is preferred', () => {
      mockMatchMedia(true);
      const { result } = renderHook(() => usePrefersReducedMotion());
      expect(result.current).toBe(true);
    });

    it('should update when media query changes', () => {
      let listener: ((e: MediaQueryListEvent) => void) | null = null;
      
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(() => ({
          matches: false,
          media: '(prefers-reduced-motion: reduce)',
          addEventListener: jest.fn((_, handler) => {
            listener = handler;
          }),
          removeEventListener: jest.fn(),
        })),
      });

      const { result } = renderHook(() => usePrefersReducedMotion());
      expect(result.current).toBe(false);

      // Simulate media query change
      if (listener) {
        act(() => {
          listener({ matches: true } as MediaQueryListEvent);
        });
      }

      expect(result.current).toBe(true);
    });

    it('should handle legacy addListener API', () => {
      let listener: ((e: MediaQueryListEvent) => void) | null = null;
      
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(() => ({
          matches: false,
          media: '(prefers-reduced-motion: reduce)',
          addEventListener: undefined,
          addListener: jest.fn((handler) => {
            listener = handler;
          }),
          removeListener: jest.fn(),
        })),
      });

      const { result } = renderHook(() => usePrefersReducedMotion());
      expect(result.current).toBe(false);
    });
  });

  describe('getAnimationConfig', () => {
    it('should return config unchanged when reduced motion is not preferred', () => {
      const config: AnimationConfig = {
        rotation: true,
        rotationSpeed: 1.0,
        parallax: true,
        particleDrift: true,
        driftSpeed: 1.0,
        intensity: 1.0,
      };

      const result = getAnimationConfig(config, false);
      expect(result).toEqual(config);
    });

    it('should disable all animations when reduced motion is preferred', () => {
      const config: AnimationConfig = {
        rotation: true,
        rotationSpeed: 1.0,
        parallax: true,
        particleDrift: true,
        driftSpeed: 1.0,
        intensity: 1.0,
      };

      const result = getAnimationConfig(config, true);
      
      expect(result.rotation).toBe(false);
      expect(result.rotationSpeed).toBe(0);
      expect(result.parallax).toBe(false);
      expect(result.particleDrift).toBe(false);
      expect(result.driftSpeed).toBe(0);
      expect(result.intensity).toBe(0);
    });

    it('should work with DEFAULT_ANIMATION_CONFIG', () => {
      const result = getAnimationConfig(DEFAULT_ANIMATION_CONFIG, false);
      expect(result).toEqual(DEFAULT_ANIMATION_CONFIG);

      const reducedResult = getAnimationConfig(DEFAULT_ANIMATION_CONFIG, true);
      expect(reducedResult.intensity).toBe(0);
    });
  });

  describe('calculateAnimationIntensity', () => {
    it('should return 1.0 when FPS meets or exceeds target', () => {
      expect(calculateAnimationIntensity(60, 60)).toBe(1.0);
      expect(calculateAnimationIntensity(70, 60)).toBe(1.0);
      expect(calculateAnimationIntensity(120, 60)).toBe(1.0);
    });

    it('should return reduced intensity when FPS drops below target', () => {
      expect(calculateAnimationIntensity(45, 60)).toBeLessThan(1.0);
      expect(calculateAnimationIntensity(45, 60)).toBeGreaterThan(0.3);
    });

    it('should return minimum intensity (0.3) when FPS drops below 30', () => {
      expect(calculateAnimationIntensity(20, 60)).toBe(0.3);
      expect(calculateAnimationIntensity(10, 60)).toBe(0.3);
      expect(calculateAnimationIntensity(5, 60)).toBe(0.3);
    });

    it('should handle edge cases', () => {
      expect(calculateAnimationIntensity(30, 60)).toBeGreaterThanOrEqual(0.3);
      expect(calculateAnimationIntensity(0, 60)).toBe(0.3);
    });

    it('should work with custom target FPS', () => {
      expect(calculateAnimationIntensity(30, 30)).toBe(1.0);
      expect(calculateAnimationIntensity(15, 30)).toBe(0.3);
    });
  });

  describe('useAnimationPerformance', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      // Mock performance.now()
      let now = 0;
      global.performance.now = jest.fn(() => {
        now += 16.67; // ~60 FPS
        return now;
      });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should initialize with default values', () => {
      const { result } = renderHook(() => useAnimationPerformance());
      
      expect(result.current.fps).toBe(60);
      expect(result.current.intensity).toBe(1.0);
    });

    it('should clean up on unmount', () => {
      const { unmount } = renderHook(() => useAnimationPerformance());
      const cancelSpy = jest.spyOn(window, 'cancelAnimationFrame');
      
      unmount();
      
      expect(cancelSpy).toHaveBeenCalled();
      cancelSpy.mockRestore();
    });
  });

  describe('DEFAULT_ANIMATION_CONFIG', () => {
    it('should have all required properties', () => {
      expect(DEFAULT_ANIMATION_CONFIG).toHaveProperty('rotation');
      expect(DEFAULT_ANIMATION_CONFIG).toHaveProperty('rotationSpeed');
      expect(DEFAULT_ANIMATION_CONFIG).toHaveProperty('parallax');
      expect(DEFAULT_ANIMATION_CONFIG).toHaveProperty('particleDrift');
      expect(DEFAULT_ANIMATION_CONFIG).toHaveProperty('driftSpeed');
      expect(DEFAULT_ANIMATION_CONFIG).toHaveProperty('intensity');
    });

    it('should enable all animations by default', () => {
      expect(DEFAULT_ANIMATION_CONFIG.rotation).toBe(true);
      expect(DEFAULT_ANIMATION_CONFIG.parallax).toBe(true);
      expect(DEFAULT_ANIMATION_CONFIG.particleDrift).toBe(true);
      expect(DEFAULT_ANIMATION_CONFIG.intensity).toBe(1.0);
    });
  });
});
