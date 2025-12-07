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

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Planet, Moon, SolarSystem } from '@/lib/universe/types';
import { useNavigationStore } from '@/lib/store';
import MarkdownContent from './MarkdownContent';
import { calculateMoonSize } from '@/lib/universe/scale-constants';

interface PlanetSurfaceProps {
  planet: Planet;
  solarSystem: SolarSystem;
  position: THREE.Vector3;
}

/**
 * Moon sphere in the skybox
 */
function MoonSphere({ moon, index, onClick }: { moon: Moon; index: number; onClick: () => void }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const moonSize = calculateMoonSize();

  useFrame((state) => {
    if (!meshRef.current) return;

    // Gentle orbit animation
    const time = state.clock.getElapsedTime();
    const angle = (index / 3) * Math.PI * 2 + time * 0.2;
    const radius = 8 + index * 2;

    meshRef.current.position.x = Math.cos(angle) * radius;
    meshRef.current.position.y = Math.sin(time * 0.3 + index) * 2;
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

  useFrame((state) => {
    if (planetRef.current) {
      // Gentle rotation
      planetRef.current.rotation.y += 0.001;
    }
  });

  return (
    <group position={position}>
      {/* Planet sphere - reduced size for left-column layout */}
      <mesh ref={planetRef}>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshStandardMaterial
          color={
            planet.theme === 'blue-green'
              ? '#2E86AB'
              : planet.theme === 'red'
              ? '#E63946'
              : planet.theme === 'earth-like'
              ? '#4A90E2'
              : '#CCCCCC'
          }
        />
      </mesh>

      {/* Ambient lighting for planet */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

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
  
  // Metadata (planet-level only, moons inherit from planet)
  const publishedDate = currentMoon ? currentMoon.publishedDate || planet.publishedDate : planet.publishedDate;
  const author = currentMoon ? undefined : planet.author;
  const tags = currentMoon ? currentMoon.tags || planet.tags : planet.tags;
  const featuredImage = currentMoon ? currentMoon.featuredImage : planet.featuredImage;
  const externalLinks = currentMoon ? [] : planet.externalLinks || [];

  return (
    <div className="planet-surface-container">
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
  try {
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
  } catch (error) {
    console.error(`Error parsing date: ${isoDate}`, error);
    return 'Date unavailable';
  }
}

export default PlanetSurface3D;
