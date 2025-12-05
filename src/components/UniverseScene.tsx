'use client';

/**
 * UniverseScene - Main 3D scene showing galaxies as particle clouds
 * Implements shader-based particles with smooth camera transitions
 */

import { useEffect, useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Galaxy } from '@/lib/universe/types';
import { useNavigationStore } from '@/lib/store';
import {
  CameraAnimator,
  calculateFocusPosition,
  DEFAULT_CAMERA_POSITIONS,
  DEFAULT_ANIMATION_CONFIG,
} from '@/lib/camera';
import { usePrefersReducedMotion, getAnimationConfig, DEFAULT_ANIMATION_CONFIG as DEFAULT_ANIM_CONFIG } from '@/lib/animation';
import { calculateGalaxyScaleWithOverride } from '@/lib/universe/scale-constants';
import GalaxyView from './GalaxyView';
import SolarSystemView from './SolarSystemView';
import { PlanetSurface3D, PlanetSurfaceOverlay } from './PlanetSurface';
import '../styles/planet.css';

/**
 * Particle shader for galaxy rendering
 */
const galaxyVertexShader = `
  attribute float size;
  attribute vec3 customColor;
  varying vec3 vColor;
  
  void main() {
    vColor = customColor;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const galaxyFragmentShader = `
  varying vec3 vColor;
  
  void main() {
    float r = distance(gl_PointCoord, vec2(0.5, 0.5));
    if (r > 0.5) discard;
    
    float alpha = 1.0 - smoothstep(0.0, 0.5, r);
    gl_FragColor = vec4(vColor, alpha * 0.8);
  }
`;

interface GalaxyParticlesProps {
  galaxy: Galaxy;
  position: THREE.Vector3;
  onClick: () => void;
  isActive: boolean;
  animationConfig: ReturnType<typeof getAnimationConfig>;
  galaxyCount: number;
}

// Performance tuning constants
const BASE_PARTICLE_COUNT = 2000;
const PARTICLES_PER_SOLAR_SYSTEM = 100;
const MAX_PARTICLE_COUNT = 5000; // Cap for performance on lower-end devices

/**
 * Individual galaxy rendered as particle cloud
 */
function GalaxyParticles({ galaxy, position, onClick, isActive, animationConfig, galaxyCount }: GalaxyParticlesProps) {
  const meshRef = useRef<THREE.Points>(null);
  const [hovered, setHovered] = useState(false);
  const particleCount = Math.min(
    BASE_PARTICLE_COUNT + (galaxy.solarSystems?.length || 0) * PARTICLES_PER_SOLAR_SYSTEM,
    MAX_PARTICLE_COUNT
  );

  // Calculate dynamic galaxy scale based on total galaxy count
  const galaxyScale = useMemo(() => {
    return calculateGalaxyScaleWithOverride(galaxyCount, galaxy.manualRadius);
  }, [galaxyCount, galaxy.manualRadius]);

  const { positions, colors, sizes } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    // Parse galaxy color
    const color = new THREE.Color(galaxy.particleColor || '#4A90E2');

    // Create spiral galaxy pattern with dynamic radius
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Spiral parameters - use dynamic scale
      const radius = Math.random() * (galaxyScale.maxRadius - galaxyScale.minRadius) + galaxyScale.minRadius;
      const spinAngle = radius * 0.5;
      const branchAngle = ((i % 3) / 3) * Math.PI * 2;
      
      const angle = branchAngle + spinAngle;
      const randomX = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.5;
      const randomY = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.5;
      const randomZ = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.5;

      positions[i3] = Math.cos(angle) * radius + randomX;
      positions[i3 + 1] = randomY * 0.3;
      positions[i3 + 2] = Math.sin(angle) * radius + randomZ;

      // Color variation
      const mixedColor = color.clone();
      mixedColor.lerp(new THREE.Color('#FFFFFF'), Math.random() * 0.3);

      colors[i3] = mixedColor.r;
      colors[i3 + 1] = mixedColor.g;
      colors[i3 + 2] = mixedColor.b;

      // Size variation
      sizes[i] = Math.random() * 2 + 1;
    }

    return { positions, colors, sizes };
  }, [galaxy, particleCount, galaxyScale]);

  // Gentle rotation animation
  useFrame((state) => {
    if (meshRef.current && animationConfig.rotation) {
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.05 * animationConfig.rotationSpeed * animationConfig.intensity;
      
      // Pulse effect when active
      if (isActive) {
        const scale = 1 + Math.sin(state.clock.getElapsedTime() * 2) * 0.05 * animationConfig.intensity;
        meshRef.current.scale.setScalar(scale);
      }
    }
  });

  return (
    <group
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <points
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-customColor"
            count={particleCount}
            array={colors}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            count={particleCount}
            array={sizes}
            itemSize={1}
          />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={galaxyVertexShader}
          fragmentShader={galaxyFragmentShader}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      {hovered && (
        <Html distanceFactor={50} center>
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.95)',
              color: '#FFFFFF',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: '2px solid rgba(74, 144, 226, 0.7)',
              fontSize: '1rem',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              userSelect: 'none',
              boxShadow: '0 6px 16px rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)',
              transform: 'translateY(-40px)', // Position above galaxy
              minWidth: '120px',
              textAlign: 'center',
            }}
            role="tooltip"
            aria-live="polite"
          >
            <strong style={{ fontSize: '1.1rem' }}>{galaxy.name}</strong>
            {galaxy.solarSystems && galaxy.solarSystems.length > 0 && (
              <div style={{ fontSize: '0.85rem', marginTop: '0.25rem', opacity: 0.9 }}>
                {galaxy.solarSystems.length} solar system{galaxy.solarSystems.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

interface SceneContentProps {
  galaxies: Galaxy[];
}

/**
 * Main scene content with camera management
 */
function SceneContent({ galaxies }: SceneContentProps) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const animatorRef = useRef<CameraAnimator | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const animationConfig = getAnimationConfig(DEFAULT_ANIM_CONFIG, prefersReducedMotion);

  const {
    focusLevel,
    focusedGalaxyId,
    focusedSolarSystemId,
    focusedPlanetId,
    isTransitioning,
    setTransitioning,
    finishTransition,
    navigateToGalaxy,
  } = useNavigationStore();

  // Position galaxies in a grid
  const galaxyPositions = useMemo(() => {
    const positions = new Map<string, THREE.Vector3>();
    const spacing = 30;
    const cols = Math.ceil(Math.sqrt(galaxies.length));

    galaxies.forEach((galaxy, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      positions.set(
        galaxy.id,
        new THREE.Vector3(
          (col - (cols - 1) / 2) * spacing,
          0,
          (row - Math.floor(galaxies.length / cols) / 2) * spacing
        )
      );
    });

    return positions;
  }, [galaxies]);

  const focusedGalaxy = galaxies.find((g) => g.id === focusedGalaxyId);
  const focusedSolarSystem = focusedGalaxy?.solarSystems?.find((s) => s.id === focusedSolarSystemId);
  const focusedPlanet = focusedSolarSystem?.planets?.find((p) => p.id === focusedPlanetId);

  // Handle camera transitions
  useEffect(() => {
    if (focusLevel === 'universe') {
      // Return to universe view
      const targetPos = DEFAULT_CAMERA_POSITIONS.universe;
      animatorRef.current = new CameraAnimator(
        {
          position: camera.position.clone(),
          lookAt: new THREE.Vector3(0, 0, 0),
        },
        targetPos,
        DEFAULT_ANIMATION_CONFIG,
        true
      );

      animatorRef.current.setOnComplete(() => {
        finishTransition();
        animatorRef.current = null;
        if (controlsRef.current) {
          controlsRef.current.enabled = true;
        }
      });

      if (controlsRef.current) {
        controlsRef.current.enabled = false;
      }
    } else if (focusLevel === 'galaxy' && focusedGalaxyId) {
      // Focus on specific galaxy
      const galaxyPos = galaxyPositions.get(focusedGalaxyId);
      if (galaxyPos) {
        const targetPos = calculateFocusPosition(galaxyPos, 25, 35);
        
        animatorRef.current = new CameraAnimator(
          {
            position: camera.position.clone(),
            lookAt: new THREE.Vector3(0, 0, 0),
          },
          targetPos,
          DEFAULT_ANIMATION_CONFIG,
          true
        );

        animatorRef.current.setOnComplete(() => {
          finishTransition();
          animatorRef.current = null;
        });

        if (controlsRef.current) {
          controlsRef.current.enabled = false;
        }
      }
    } else if (focusLevel === 'solar-system' && focusedSolarSystemId) {
      // Focus on solar system
      const galaxyPos = galaxyPositions.get(focusedGalaxyId || '');
      if (galaxyPos) {
        const targetPos = calculateFocusPosition(galaxyPos, 15, 20);
        
        animatorRef.current = new CameraAnimator(
          {
            position: camera.position.clone(),
            lookAt: new THREE.Vector3(0, 0, 0),
          },
          targetPos,
          DEFAULT_ANIMATION_CONFIG,
          true
        );

        animatorRef.current.setOnComplete(() => {
          finishTransition();
          animatorRef.current = null;
        });

        if (controlsRef.current) {
          controlsRef.current.enabled = false;
        }
      }
    } else if (focusLevel === 'planet' && focusedPlanetId) {
      // Focus on planet surface
      const galaxyPos = galaxyPositions.get(focusedGalaxyId || '');
      if (galaxyPos) {
        const targetPos = {
          position: new THREE.Vector3(galaxyPos.x + 5, galaxyPos.y + 3, galaxyPos.z + 5),
          lookAt: galaxyPos,
        };
        
        animatorRef.current = new CameraAnimator(
          {
            position: camera.position.clone(),
            lookAt: new THREE.Vector3(0, 0, 0),
          },
          targetPos,
          DEFAULT_ANIMATION_CONFIG,
          true
        );

        animatorRef.current.setOnComplete(() => {
          finishTransition();
          animatorRef.current = null;
        });

        if (controlsRef.current) {
          controlsRef.current.enabled = false;
        }
      }
    }
  }, [focusLevel, focusedGalaxyId, focusedSolarSystemId, focusedPlanetId, camera, galaxyPositions, finishTransition]);

  // Animation loop
  useFrame((state) => {
    if (animatorRef.current) {
      const complete = animatorRef.current.update(camera, state.clock.getElapsedTime() * 1000);
      if (complete) {
        animatorRef.current = null;
      }
    }
  });

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.8} />
      
      {/* Render galaxies or galaxy detail view */}
      {focusLevel === 'universe' && galaxies.map((galaxy) => {
        const position = galaxyPositions.get(galaxy.id);
        if (!position) return null;

        return (
          <GalaxyParticles
            key={galaxy.id}
            galaxy={galaxy}
            position={position}
            onClick={() => navigateToGalaxy(galaxy.id)}
            isActive={false}
            animationConfig={animationConfig}
            galaxyCount={galaxies.length}
          />
        );
      })}

      {focusLevel === 'galaxy' && focusedGalaxy && (
        <GalaxyView
          galaxy={focusedGalaxy}
          position={galaxyPositions.get(focusedGalaxy.id) || new THREE.Vector3(0, 0, 0)}
        />
      )}

      {focusLevel === 'solar-system' && focusedSolarSystem && (
        <SolarSystemView
          solarSystem={focusedSolarSystem}
          position={galaxyPositions.get(focusedGalaxyId || '') || new THREE.Vector3(0, 0, 0)}
        />
      )}

      {focusLevel === 'planet' && focusedPlanet && focusedSolarSystem && (
        <PlanetSurface3D
          planet={focusedPlanet}
          solarSystem={focusedSolarSystem}
          position={new THREE.Vector3(-3, 0, 0)}
        />
      )}

      {/* Orbit controls - disabled during transitions */}
      <OrbitControls
        ref={controlsRef}
        enabled={!isTransitioning && focusLevel === 'universe'}
        enableDamping
        dampingFactor={0.05}
        minDistance={20}
        maxDistance={200}
        maxPolarAngle={Math.PI / 2}
      />
    </>
  );
}

interface UniverseSceneProps {
  galaxies: Galaxy[];
}

/**
 * Main UniverseScene component
 */
export default function UniverseScene({ galaxies }: UniverseSceneProps) {
  const { focusLevel, focusedGalaxyId, focusedSolarSystemId, focusedPlanetId, focusedMoonId } =
    useNavigationStore();

  const focusedGalaxy = galaxies.find((g) => g.id === focusedGalaxyId);
  const focusedSolarSystem = focusedGalaxy?.solarSystems?.find((s) => s.id === focusedSolarSystemId);
  const focusedPlanet = focusedSolarSystem?.planets?.find((p) => p.id === focusedPlanetId);

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <Canvas
        camera={{
          position: [0, 50, 100],
          fov: 75,
        }}
        style={{ background: '#000000' }}
      >
        <SceneContent galaxies={galaxies} />
      </Canvas>

      {/* Planet surface overlay for markdown content */}
      {focusLevel === 'planet' && focusedPlanet && (
        <PlanetSurfaceOverlay planet={focusedPlanet} currentMoonId={focusedMoonId} />
      )}
    </div>
  );
}
