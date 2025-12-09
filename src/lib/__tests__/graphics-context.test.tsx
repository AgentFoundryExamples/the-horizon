/**
 * Unit tests for GraphicsConfigContext
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { GraphicsConfigProvider, useGraphicsConfig, useGraphicsConfigReadOnly } from '../graphics-context';
import { DEFAULT_GRAPHICS_CONFIG } from '../graphics/presets';
import { ReactNode } from 'react';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('GraphicsConfigContext', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('GraphicsConfigProvider', () => {
    it('should provide default config when no stored config exists', async () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <GraphicsConfigProvider>{children}</GraphicsConfigProvider>
      );

      const { result } = renderHook(() => useGraphicsConfig(), { wrapper });

      // Wait for loading to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.config).toEqual(DEFAULT_GRAPHICS_CONFIG);
      expect(result.current.lastError).toBeNull();
    });

    it('should load config from localStorage if available', async () => {
      const customConfig = {
        ...DEFAULT_GRAPHICS_CONFIG,
        universe: {
          ...DEFAULT_GRAPHICS_CONFIG.universe,
          globalScaleMultiplier: 1.5,
        },
      };

      localStorageMock.setItem('the-horizon-graphics-config', JSON.stringify(customConfig));
      localStorageMock.setItem('the-horizon-graphics-config-version', customConfig.version);

      const wrapper = ({ children }: { children: ReactNode }) => (
        <GraphicsConfigProvider>{children}</GraphicsConfigProvider>
      );

      const { result } = renderHook(() => useGraphicsConfig(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.config.universe.globalScaleMultiplier).toBe(1.5);
      expect(result.current.lastError).toBeNull();
    });

    it('should prioritize localStorage over initialConfig if both exist', async () => {
      // Set something in localStorage
      const storedConfig = {
        ...DEFAULT_GRAPHICS_CONFIG,
        universe: {
          ...DEFAULT_GRAPHICS_CONFIG.universe,
          globalScaleMultiplier: 1.5,
        },
      };
      localStorageMock.setItem('the-horizon-graphics-config', JSON.stringify(storedConfig));
      
      const initialConfigProp = {
        ...DEFAULT_GRAPHICS_CONFIG,
        universe: {
          ...DEFAULT_GRAPHICS_CONFIG.universe,
          globalScaleMultiplier: 2.0,
        },
      };

      const wrapper = ({ children }: { children: ReactNode }) => (
        <GraphicsConfigProvider initialConfig={initialConfigProp}>
          {children}
        </GraphicsConfigProvider>
      );

      const { result } = renderHook(() => useGraphicsConfig(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // localStorage should override initialConfig
      expect(result.current.config.universe.globalScaleMultiplier).toBe(1.5);
    });

    it('should handle invalid JSON in localStorage gracefully', async () => {
      localStorageMock.setItem('the-horizon-graphics-config', 'invalid json {');

      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      const wrapper = ({ children }: { children: ReactNode }) => (
        <GraphicsConfigProvider>{children}</GraphicsConfigProvider>
      );

      const { result } = renderHook(() => useGraphicsConfig(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should fall back to default config
      expect(result.current.config).toEqual(DEFAULT_GRAPHICS_CONFIG);
      
      // Error is logged to console (check if console.error was called)
      expect(consoleError).toHaveBeenCalled();
      
      consoleError.mockRestore();
    });
  });

  describe('useGraphicsConfig', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = jest.fn();

      expect(() => {
        renderHook(() => useGraphicsConfig());
      }).toThrow('useGraphicsConfig must be used within a GraphicsConfigProvider');

      console.error = originalError;
    });

    it('should update config and save to localStorage', async () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <GraphicsConfigProvider>{children}</GraphicsConfigProvider>
      );

      const { result } = renderHook(() => useGraphicsConfig(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateConfig({
          universe: {
            ...DEFAULT_GRAPHICS_CONFIG.universe,
            globalScaleMultiplier: 1.8,
          },
        });
      });

      await waitFor(() => {
        expect(result.current.config.universe.globalScaleMultiplier).toBe(1.8);
      });

      // Check localStorage was updated
      const stored = localStorageMock.getItem('the-horizon-graphics-config');
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.universe.globalScaleMultiplier).toBe(1.8);
    });

    it('should validate config on update and show warnings for clamped values', async () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <GraphicsConfigProvider>{children}</GraphicsConfigProvider>
      );

      const { result } = renderHook(() => useGraphicsConfig(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        // Set a value that will be clamped (out of range)
        result.current.updateConfig({
          universe: {
            ...DEFAULT_GRAPHICS_CONFIG.universe,
            globalScaleMultiplier: 999, // Out of range [0.1, 5.0]
          },
        });
      });

      // Config should be updated with clamped value
      await waitFor(() => {
        expect(result.current.config.universe.globalScaleMultiplier).toBe(5.0); // Clamped to max
      });

      // Should have no error (warnings are logged to console but don't set lastError)
      expect(result.current.lastError).toBeNull();
    });

    it('should reset config to defaults', async () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <GraphicsConfigProvider>{children}</GraphicsConfigProvider>
      );

      const { result } = renderHook(() => useGraphicsConfig(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Update config
      act(() => {
        result.current.updateConfig({
          universe: {
            ...DEFAULT_GRAPHICS_CONFIG.universe,
            globalScaleMultiplier: 3.0,
          },
        });
      });

      await waitFor(() => {
        expect(result.current.config.universe.globalScaleMultiplier).toBe(3.0);
      });

      // Reset
      act(() => {
        result.current.resetConfig();
      });

      // Config should be reset to defaults
      await waitFor(() => {
        expect(result.current.config).toEqual(DEFAULT_GRAPHICS_CONFIG);
      });

      // After reset, localStorage is cleared, then the useEffect saves default config back
      // Wait a bit for the useEffect to run
      await waitFor(() => {
        const stored = localStorageMock.getItem('the-horizon-graphics-config');
        if (stored) {
          const parsed = JSON.parse(stored);
          expect(parsed).toEqual(DEFAULT_GRAPHICS_CONFIG);
        }
      });
    });

    it('should deep merge nested config objects', async () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <GraphicsConfigProvider>{children}</GraphicsConfigProvider>
      );

      const { result } = renderHook(() => useGraphicsConfig(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateConfig({
          solarSystemView: {
            orbitStrokeWidth: 3.0,
          },
        });
      });

      await waitFor(() => {
        expect(result.current.config.solarSystemView.orbitStrokeWidth).toBe(3.0);
      });

      // Other solar system view properties should remain unchanged
      expect(result.current.config.solarSystemView.planetScaleMultiplier).toBe(
        DEFAULT_GRAPHICS_CONFIG.solarSystemView.planetScaleMultiplier
      );
      expect(result.current.config.solarSystemView.orbitAnimationSpeed).toBe(
        DEFAULT_GRAPHICS_CONFIG.solarSystemView.orbitAnimationSpeed
      );
    });
  });

  describe('useGraphicsConfigReadOnly', () => {
    it('should provide read-only access to config', async () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <GraphicsConfigProvider>{children}</GraphicsConfigProvider>
      );

      const { result } = renderHook(() => useGraphicsConfigReadOnly(), { wrapper });

      await waitFor(() => {
        expect(result.current).toEqual(DEFAULT_GRAPHICS_CONFIG);
      });
    });

    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = jest.fn();

      expect(() => {
        renderHook(() => useGraphicsConfigReadOnly());
      }).toThrow('useGraphicsConfig must be used within a GraphicsConfigProvider');

      console.error = originalError;
    });
  });

  describe('Config persistence', () => {
    it('should save config after loading completes', async () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <GraphicsConfigProvider>{children}</GraphicsConfigProvider>
      );

      const { result } = renderHook(() => useGraphicsConfig(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // After loading completes, config should be saved to localStorage
      const stored = localStorageMock.getItem('the-horizon-graphics-config');
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed).toEqual(DEFAULT_GRAPHICS_CONFIG);
    });

    it('should save after config update', async () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <GraphicsConfigProvider>{children}</GraphicsConfigProvider>
      );

      const { result } = renderHook(() => useGraphicsConfig(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.updateConfig({
          galaxyView: {
            ...DEFAULT_GRAPHICS_CONFIG.galaxyView,
            galaxyOpacity: 0.5,
          },
        });
      });

      await waitFor(() => {
        const stored = localStorageMock.getItem('the-horizon-graphics-config');
        expect(stored).not.toBeNull();
        const parsed = JSON.parse(stored!);
        expect(parsed.galaxyView.galaxyOpacity).toBe(0.5);
      });
    });
  });
});
