'use client';

/**
 * UniverseScene - Main 3D scene showing galaxies as particle clouds
 * Implements shader-based particles with smooth camera transitions
 */

import { useEffect, useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { Galaxy } from '@/lib/universe/types';
import { calculateGalaxyLayout, validateSpacing } from '@/lib/universe/layout';
import { useNavigationStore } from '@/lib/store';
import { useHoverStore, type HoveredObject } from '@/lib/hover-store';
import {
  CameraAnimator,
  calculateFocusPosition,
  DEFAULT_CAMERA_POSITIONS,
  DEFAULT_ANIMATION_CONFIG,
} from '@/lib/camera';
import { usePrefersReducedMotion, getAnimationConfig, DEFAULT_ANIMATION_CONFIG as DEFAULT_ANIM_CONFIG } from '@/lib/animation';
import { calculateGalaxyScaleWithOverride, calculateGalaxyScale } from '@/lib/universe/scale-constants';
import {
  DEFAULT_GRAPHICS_CONFIG,
  createStarfieldConfig,
  generateStarfield,
  updateStarfield,
  disposeStarfield,
  type StarfieldData,
} from '@/lib/graphics';
import GalaxyView from './GalaxyView';
import SolarSystemView from './SolarSystemView';
import { PlanetSurface3D, PlanetSurfaceOverlay } from './PlanetSurface';
import OverlayLabels from './OverlayLabels';
import '../styles/planet.css';

// Planet surface view constants - optimized for tighter moon orbits and better framing
const PLANET_SURFACE_POSITION = new THREE.Vector3(10, 0, 0);
const PLANET_CAMERA_OFFSET = new THREE.Vector3(2, 0, 24); // Moved closer for better planet framing
const PLANET_CAMERA_LOOKAT_OFFSET = new THREE.Vector3(24, 0, 0); // Adjusted to center planet better in left column

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
  const setHoveredObject = useHoverStore((state) => state.setHoveredObject);
  
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
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        // Get world position from the event object for accurate tracking
        const object = e.object as THREE.Object3D;
        const worldPosition = new THREE.Vector3();
        object.getWorldPosition(worldPosition);
        
        const hoveredObj: HoveredObject = {
          id: galaxy.id,
          name: galaxy.name,
          type: 'galaxy',
          position: worldPosition,
          metadata: {
            description: galaxy.description,
            planetCount: galaxy.solarSystems?.reduce((acc, sys) => acc + (sys.planets?.length || 0), 0),
          },
        };
        setHoveredObject(hoveredObj);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
        setHoveredObject(null);
      }}
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
    </group>
  );
}

/**
 * Background starfield component
 * Renders config-driven starfield with parallax
 */
function BackgroundStarfield() {
  const starfieldRef = useRef<THREE.Points | null>(null);
  const starfieldDataRef = useRef<StarfieldData | null>(null);
  const { isTransitioning } = useNavigationStore();
  
  // Generate starfield on mount
  useEffect(() => {
    const config = createStarfieldConfig(
      DEFAULT_GRAPHICS_CONFIG.universe,
      DEFAULT_GRAPHICS_CONFIG.galaxyView
    );
    const starfieldData = generateStarfield(config);
    starfieldDataRef.current = starfieldData;
    
    return () => {
      if (starfieldDataRef.current) {
        disposeStarfield(starfieldDataRef.current);
      }
    };
  }, []);
  
  // Update starfield animation each frame
  useFrame((state, delta) => {
    if (starfieldDataRef.current) {
      // Pause parallax during camera transitions to avoid motion sickness
      updateStarfield(starfieldDataRef.current, delta, isTransitioning);
    }
  });
  
  // Render starfield if data is available
  if (!starfieldDataRef.current) {
    return null;
  }
  
  return (
    <points
      ref={starfieldRef}
      geometry={starfieldDataRef.current.geometry}
      material={starfieldDataRef.current.material}
    />
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

  // Position galaxies using symmetric layout helper
  const galaxyPositions = useMemo(() => {
    // Use symmetric layout based on galaxy count
    const galaxyIds = galaxies.map(g => g.id);
    
    // Spacing must be > 2× GALAXY_SCALE.MAX_RADIUS to prevent overlap
    // Current: MAX_RADIUS=22, so spacing must be > 44. Using 50 for safety margin.
    const spacing = 50;
    
    // Runtime validation: ensure spacing accommodates maximum galaxy diameter
    if (process.env.NODE_ENV !== 'production') {
      const maxDiameter = calculateGalaxyScale(1).maxRadius * 2;
      if (!validateSpacing(spacing, maxDiameter)) {
        console.warn(
          `Grid spacing (${spacing}) is too small for max galaxy diameter (${maxDiameter}). ` +
          `Increase spacing to at least ${Math.ceil(maxDiameter + 6)}`
        );
      }
    }
    
    // Calculate symmetric layout
    const layout = calculateGalaxyLayout(galaxyIds, spacing);
    
    return layout.positions;
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
        // Adjusted distance to accommodate larger galaxies (previously 25, 35)
        const targetPos = calculateFocusPosition(galaxyPos, 35, 40);
        
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
      // Planet is positioned at PLANET_SURFACE_POSITION in absolute world coordinates
      // Camera should be positioned to frame the planet on the left side
      const planetPos = PLANET_SURFACE_POSITION;
      const targetPos = {
        position: planetPos.clone().add(PLANET_CAMERA_OFFSET),
        lookAt: planetPos.clone().add(PLANET_CAMERA_LOOKAT_OFFSET),
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
      
      {/* Background starfield - always visible */}
      <BackgroundStarfield />
      
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
          position={PLANET_SURFACE_POSITION}
        />
      )}

      {/* Orbit controls - disabled during transitions */}
      <OrbitControls
        ref={controlsRef}
        enabled={!isTransitioning && focusLevel === 'universe'}
        enableDamping
        dampingFactor={0.05}
        minDistance={30}
        maxDistance={250}
        maxPolarAngle={Math.PI / 2}
      />
      
      {/* Overlay labels - portals to DOM outside Canvas */}
      <OverlayLabels />
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
          position: DEFAULT_CAMERA_POSITIONS.universe.position.toArray() as [number, number, number],
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
