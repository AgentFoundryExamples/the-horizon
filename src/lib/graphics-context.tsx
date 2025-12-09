'use client';

/**
 * Graphics Configuration Context
 * 
 * Provides runtime GraphicsConfig access to all components with live updates.
 * Supports persistence to localStorage with validation and conflict detection.
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  GraphicsConfig,
  sanitizeGraphicsConfig,
  validateGraphicsConfig,
  serializeGraphicsConfig,
  deserializeGraphicsConfig,
} from './graphics/config';
import { DEFAULT_GRAPHICS_CONFIG } from './graphics/presets';

const STORAGE_KEY = 'the-horizon-graphics-config';
const STORAGE_VERSION_KEY = 'the-horizon-graphics-config-version';

interface GraphicsConfigContextValue {
  config: GraphicsConfig;
  updateConfig: (newConfig: Partial<GraphicsConfig>) => void;
  resetConfig: () => void;
  isLoading: boolean;
  lastError: string | null;
}

const GraphicsConfigContext = createContext<GraphicsConfigContextValue | undefined>(undefined);

interface GraphicsConfigProviderProps {
  children: ReactNode;
  initialConfig?: GraphicsConfig;
}

/**
 * Provider component that manages GraphicsConfig state and persistence
 */
export function GraphicsConfigProvider({ children, initialConfig }: GraphicsConfigProviderProps) {
  const [config, setConfig] = useState<GraphicsConfig>(initialConfig || DEFAULT_GRAPHICS_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [lastError, setLastError] = useState<string | null>(null);

  // Load config from localStorage on mount
  useEffect(() => {
    try {
      if (typeof window === 'undefined') {
        setIsLoading(false);
        return;
      }

      const stored = localStorage.getItem(STORAGE_KEY);
      const storedVersion = localStorage.getItem(STORAGE_VERSION_KEY);

      if (stored) {
        const { config: loadedConfig, validation } = deserializeGraphicsConfig(stored);

        if (!validation.valid) {
          console.error('Loaded graphics config has errors:', validation.errors);
          setLastError(`Config validation failed: ${validation.errors.join(', ')}`);
          // Fall back to default config
          setConfig(DEFAULT_GRAPHICS_CONFIG);
        } else {
          if (validation.warnings.length > 0) {
            console.warn('Graphics config warnings:', validation.warnings);
          }
          
          // Check version mismatch
          if (storedVersion !== loadedConfig.version) {
            console.warn(`Config version mismatch: stored=${storedVersion}, loaded=${loadedConfig.version}`);
          }
          
          setConfig(loadedConfig);
        }
      } else {
        // No stored config, use default
        setConfig(DEFAULT_GRAPHICS_CONFIG);
      }
    } catch (error) {
      console.error('Failed to load graphics config:', error);
      setLastError(error instanceof Error ? error.message : 'Unknown error loading config');
      setConfig(DEFAULT_GRAPHICS_CONFIG);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save config to localStorage whenever it changes
  useEffect(() => {
    if (isLoading) return; // Don't save during initial load

    try {
      if (typeof window === 'undefined') return;

      const serialized = serializeGraphicsConfig(config);
      localStorage.setItem(STORAGE_KEY, serialized);
      localStorage.setItem(STORAGE_VERSION_KEY, config.version);
      setLastError(null);
    } catch (error) {
      console.error('Failed to save graphics config:', error);
      setLastError(error instanceof Error ? error.message : 'Unknown error saving config');
    }
  }, [config, isLoading]);

  const updateConfig = useCallback((newConfig: Partial<GraphicsConfig>) => {
    setConfig((currentConfig) => {
      const merged = {
        ...currentConfig,
        ...newConfig,
        // Deep merge for nested objects
        universe: { ...currentConfig.universe, ...(newConfig.universe || {}) },
        galaxyView: { ...currentConfig.galaxyView, ...(newConfig.galaxyView || {}) },
        solarSystemView: { ...currentConfig.solarSystemView, ...(newConfig.solarSystemView || {}) },
        planetView: { ...currentConfig.planetView, ...(newConfig.planetView || {}) },
        planetMaterials: { ...currentConfig.planetMaterials, ...(newConfig.planetMaterials || {}) },
      };

      // Validate and sanitize the merged config
      const validation = validateGraphicsConfig(merged);
      if (!validation.valid) {
        console.error('Config update rejected due to validation errors:', validation.errors);
        setLastError(`Update failed: ${validation.errors.join(', ')}`);
        return currentConfig; // Keep current config if validation fails
      }

      if (validation.warnings.length > 0) {
        console.warn('Config update warnings:', validation.warnings);
      }

      const sanitized = sanitizeGraphicsConfig(merged);
      setLastError(null);
      return sanitized;
    });
  }, []);

  const resetConfig = useCallback(() => {
    setConfig(DEFAULT_GRAPHICS_CONFIG);
    setLastError(null);
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_VERSION_KEY);
    }
  }, []);

  return (
    <GraphicsConfigContext.Provider
      value={{
        config,
        updateConfig,
        resetConfig,
        isLoading,
        lastError,
      }}
    >
      {children}
    </GraphicsConfigContext.Provider>
  );
}

/**
 * Hook to access GraphicsConfig from any component
 * Throws if used outside GraphicsConfigProvider
 */
export function useGraphicsConfig(): GraphicsConfigContextValue {
  const context = useContext(GraphicsConfigContext);
  if (!context) {
    throw new Error('useGraphicsConfig must be used within a GraphicsConfigProvider');
  }
  return context;
}

/**
 * Hook to access only the config without update functions
 * Useful for read-only components
 */
export function useGraphicsConfigReadOnly(): GraphicsConfig {
  const { config } = useGraphicsConfig();
  return config;
}
