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

'use client';

/**
 * PlanetSurface - Renders planet surface with markdown content and moon navigation
 * Combines 3D scene with HTML overlay for content display
 */

import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Planet, Moon, SolarSystem } from '@/lib/universe/types';
import { useNavigationStore } from '@/lib/store';
import MarkdownContent from './MarkdownContent';
import { calculateMoonSize } from '@/lib/universe/scale-constants';
import { normalizePlanetLayout, layoutConfigToCSS } from '@/lib/universe/planet-layout';
import {
  DEFAULT_GRAPHICS_CONFIG,
  getPlanetMaterialPreset,
  detectDeviceCapabilities,
  applyPlanetMaterial,
  mapThemeToMaterialPreset,
  clonePlanetMaterial,
  clampAnimationMultiplier,
} from '@/lib/graphics';

/**
 * Validate and sanitize URL to prevent XSS and malicious URLs
 * Only allows http, https, and relative paths starting with /
 */
function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  
  // Allow relative paths starting with /
  if (url.startsWith('/')) return true;
  
  // Validate absolute URLs
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Sanitize URL by returning it only if valid, otherwise return undefined
 */
function sanitizeUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  return isValidUrl(url) ? url : undefined;
}

interface PlanetSurfaceProps {
  planet: Planet;
  solarSystem: SolarSystem;
  position: THREE.Vector3;
}

// Moon orbit configuration constants
const MOON_BASE_ORBIT_RADIUS = 4; // Base radius for first moon (units)
const MOON_ORBIT_INCREMENT = 0.8; // Additional radius per moon index (units)
const MOON_VERTICAL_OSCILLATION = 1; // Maximum vertical oscillation (units)
const MOON_ORBITAL_SPEED = 0.2; // Orbital speed (radians/second)

/**
 * Moon sphere in the skybox
 */
function MoonSphere({ moon, index, onClick }: { moon: Moon; index: number; onClick: () => void }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const moonSize = calculateMoonSize();

  useFrame((state) => {
    if (!meshRef.current) return;

    // Tighter orbit animation - keeps moons close to planet and within viewport
    const time = state.clock.getElapsedTime();
    // Use a non-repeating phase offset for a more natural moon distribution.
    // Multiplying by 2 ensures a wider spread than a factor of 1.
    const angle = index * 2 + time * MOON_ORBITAL_SPEED;
    // Formula ensures moons stay within reasonable viewport bounds:
    // - For typical systems (3-5 moons): max radius ~5.6-7.2 units
    // - For larger systems (8 moons, indices 0-7): worst case 4 + 7*0.8 = 9.6 units
    // The tighter spacing keeps most moons within 6-7 units during normal viewing
    const radius = MOON_BASE_ORBIT_RADIUS + index * MOON_ORBIT_INCREMENT;

    meshRef.current.position.x = Math.cos(angle) * radius;
    // Vertical oscillation for natural movement
    meshRef.current.position.y = Math.sin(time * 0.3 + index) * MOON_VERTICAL_OSCILLATION;
    meshRef.current.position.z = Math.sin(angle) * radius;
  });

  return (
    <mesh ref={meshRef} onClick={onClick}>
      <sphereGeometry args={[moonSize, 16, 16]} />
      <meshStandardMaterial color="#AAAAAA" />
    </mesh>
  );
}

/**
 * Planet surface scene with skybox
 */
export function PlanetSurface3D({ planet, solarSystem, position }: PlanetSurfaceProps) {
  const { navigateToMoon } = useNavigationStore();
  const planetRef = useRef<THREE.Mesh>(null);
  const [atmosphereShell, setAtmosphereShell] = useState<THREE.Mesh | null>(null);

  // Detect device capabilities for material optimization
  const capabilities = useMemo(() => detectDeviceCapabilities(), []);

  // Get graphics configuration
  const graphicsConfig = useMemo(() => DEFAULT_GRAPHICS_CONFIG, []);
  const planetViewConfig = graphicsConfig.planetView;

  // Get layout configuration for this planet
  const layoutConfig = useMemo(() => {
    return normalizePlanetLayout(planet.layoutConfig);
  }, [planet.layoutConfig]);

  // Get material preset based on planet theme
  const materialPreset = useMemo(() => {
    const presetId = mapThemeToMaterialPreset(planet.theme);
    const preset = getPlanetMaterialPreset(presetId);
    // Clone to prevent reference mutation across multiple planets
    return preset ? clonePlanetMaterial(preset) : null;
  }, [planet.theme]);

  // Apply material to planet mesh
  useEffect(() => {
    if (planetRef.current && materialPreset) {
      const { material, atmosphereShell: newAtmosphere } = applyPlanetMaterial(
        planetRef.current,
        materialPreset,
        planetViewConfig,
        capabilities,
        graphicsConfig.universe.lowPowerMode
      );

      // Add atmosphere shell if created
      if (newAtmosphere && planetRef.current) {
        planetRef.current.add(newAtmosphere);
        setAtmosphereShell(newAtmosphere);
      }

      // Cleanup previous atmosphere on unmount
      return () => {
        if (atmosphereShell && planetRef.current) {
          planetRef.current.remove(atmosphereShell);
        }
      };
    }
  }, [materialPreset, planetViewConfig, capabilities, graphicsConfig.universe.lowPowerMode]);

  // Apply scale to planet mesh only when it changes (not in useFrame)
  useEffect(() => {
    if (planetRef.current) {
      const planetScale = layoutConfig.planetRenderScale * (planetViewConfig.planetRenderScale ?? 1.0);
      planetRef.current.scale.setScalar(planetScale);
    }
  }, [layoutConfig, planetViewConfig.planetRenderScale]);

  // Animation with configurable rotation speed
  const rotationSpeed = useMemo(() => {
    return clampAnimationMultiplier(planetViewConfig.rotationSpeed, 1.0) * 0.001;
  }, [planetViewConfig.rotationSpeed]);

  useFrame(() => {
    if (planetRef.current) {
      // Rotation with configurable speed
      planetRef.current.rotation.y += rotationSpeed;
    }
  });

  return (
    <group position={position}>
      {/* Planet sphere - optimized size for left-column visibility */}
      <mesh ref={planetRef}>
        <sphereGeometry args={[1.2, 32, 32]} />
        {/* Material is applied dynamically via applyPlanetMaterial */}
      </mesh>

      {/* Ambient lighting for planet */}
      <ambientLight intensity={0.4 * (planetViewConfig.lightingIntensity ?? 1.0)} />
      <directionalLight position={[10, 10, 5]} intensity={1.0 * (planetViewConfig.lightingIntensity ?? 1.0)} />

      {/* Moons in skybox */}
      {(planet.moons || []).map((moon, index) => (
        <MoonSphere key={moon.id} moon={moon} index={index} onClick={() => navigateToMoon(moon.id)} />
      ))}

      {/* Stars in background */}
      <Stars />
    </group>
  );
}

/**
 * Background stars for skybox
 */
function Stars() {
  const starsRef = useRef<THREE.Points>(null);

  const { positions, colors } = useMemo(() => {
    const count = 500;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 50 + Math.random() * 50;

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);

      colors[i3] = colors[i3 + 1] = colors[i3 + 2] = 0.8 + Math.random() * 0.2;
    }

    return { positions, colors };
  }, []);

  return (
    <points ref={starsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={colors.length / 3} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.5} vertexColors />
    </points>
  );
}

/**
 * HTML overlay for markdown content
 */
interface PlanetSurfaceOverlayProps {
  planet: Planet;
  currentMoonId: string | null;
}

export function PlanetSurfaceOverlay({ planet, currentMoonId }: PlanetSurfaceOverlayProps) {
  const { navigateToMoon } = useNavigationStore();

  // Determine which content to show
  const currentMoon = currentMoonId ? planet.moons?.find((m) => m.id === currentMoonId) : null;
  const content = currentMoon ? (currentMoon.contentMarkdown || `# ${currentMoon.name}\n\nNo content available.`) : (planet.contentMarkdown || `# ${planet.name}\n\nNo content available.`);
  const title = currentMoon ? currentMoon.name : planet.name;
  const subtitle = currentMoon ? `Moon of ${planet.name}` : planet.summary;
  
  // Metadata - moons inherit from planet when not specified
  const publishedDate = currentMoon ? currentMoon.publishedDate || planet.publishedDate : planet.publishedDate;
  const author = planet.author; // Moons always inherit author from planet
  const tags = currentMoon ? currentMoon.tags || planet.tags : planet.tags;
  const rawFeaturedImage = currentMoon ? currentMoon.featuredImage || planet.featuredImage : planet.featuredImage;
  const featuredImage = sanitizeUrl(rawFeaturedImage); // Validate URL for security
  const rawExternalLinks = planet.externalLinks || []; // Moons inherit external links from planet
  const externalLinks = rawExternalLinks.filter(link => isValidUrl(link.url)); // Filter valid URLs only

  // Layout configuration - normalize and apply
  const layoutConfig = useMemo(() => {
    return normalizePlanetLayout(planet.layoutConfig);
  }, [planet.layoutConfig]);

  const containerStyle = useMemo(() => {
    return layoutConfigToCSS(layoutConfig);
  }, [layoutConfig]);

  return (
    <div className="planet-surface-container" style={containerStyle as React.CSSProperties}>
      {/* Left column - Planet visualization placeholder */}
      <div className="planet-visual-column">
        <div className="planet-visual-label">
          <span>{title}</span>
        </div>
      </div>

      {/* Right column - Content */}
      <div className="planet-content-column">
        {/* Title and metadata header */}
        <div className="planet-content-header">
          <h1 className="planet-title">{title}</h1>
          {subtitle && <p className="planet-subtitle">{subtitle}</p>}
          
          {/* Metadata row */}
          {(publishedDate || author || (tags && tags.length > 0)) && (
            <div className="planet-metadata">
              {publishedDate && (
                <div className="metadata-item">
                  <svg className="metadata-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 6h8M4 9h8M4 12h5M13 2H3a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <time dateTime={publishedDate}>{formatDate(publishedDate)}</time>
                </div>
              )}
              {author && (
                <div className="metadata-item">
                  <svg className="metadata-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 14a6 6 0 0 1 12 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>{author}</span>
                </div>
              )}
              {tags && tags.length > 0 && (
                <div className="metadata-tags">
                  {tags.map((tag, index) => (
                    <span key={index} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Featured image */}
        {featuredImage && (
          <div className="planet-featured-media">
            <img src={featuredImage} alt={`Featured image for ${title}`} />
          </div>
        )}

        {/* Markdown content */}
        <div className="planet-content-body">
          <MarkdownContent content={content} />
        </div>

        {/* External links section */}
        {externalLinks.length > 0 && (
          <div className="planet-external-links">
            <h3 className="section-title">Related Resources</h3>
            <div className="external-links-list">
              {externalLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="external-link"
                >
                  <span className="link-title">{link.title}</span>
                  {link.description && <span className="link-description">{link.description}</span>}
                  <svg className="external-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 3H3v10h10v-3M10 2h4v4M14 2L7 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Moon navigation */}
        {!currentMoon && planet.moons && planet.moons.length > 0 && (
          <div className="planet-moons-section">
            <h3 className="section-title">Moons</h3>
            <div className="moons-button-group">
              {planet.moons.map((moon) => (
                <button
                  key={moon.id}
                  onClick={() => navigateToMoon(moon.id)}
                  className="moon-nav-button"
                >
                  {moon.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Back to planet button when viewing moon */}
        {currentMoon && (
          <button
            onClick={() => navigateToMoon('')}
            className="back-to-planet-button"
          >
            ← Back to {planet.name}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Format ISO date string to readable format
 */
function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  // Check if date is valid
  if (isNaN(date.getTime())) {
    console.warn(`Invalid date format: ${isoDate}`);
    return 'Date unavailable';
  }
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export default PlanetSurface3D;
