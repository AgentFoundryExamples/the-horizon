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
      <sphereGeometry args={[0.3, 16, 16]} />
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
      {/* Planet sphere */}
      <mesh ref={planetRef}>
        <sphereGeometry args={[3, 32, 32]} />
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

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        right: '2rem',
        transform: 'translateY(-50%)',
        width: '400px',
        maxHeight: '80vh',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        border: '1px solid #444',
        borderRadius: '8px',
        padding: '1.5rem',
        overflow: 'auto',
        zIndex: 100,
        color: '#FFFFFF',
      }}
    >
      {/* Title and subtitle */}
      <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #444', paddingBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem', color: '#4A90E2' }}>{title}</h1>
        {subtitle && <p style={{ fontSize: '0.9rem', color: '#AAAAAA', margin: 0 }}>{subtitle}</p>}
      </div>

      {/* Markdown content */}
      <MarkdownContent content={content} />

      {/* Moon navigation */}
      {!currentMoon && planet.moons && planet.moons.length > 0 && (
        <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #444' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Moons</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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
  );
}

export default PlanetSurface3D;
