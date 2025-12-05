'use client';

/**
 * SceneHUD - Heads-up display for scene navigation
 * Shows breadcrumb trail and back button
 */

import { useNavigationStore } from '@/lib/store';
import type { Galaxy } from '@/lib/universe/types';
import type { FocusLevel } from '@/lib/store';

interface SceneHUDProps {
  galaxies: Galaxy[];
}

// Helper function to determine transition message based on focus level
const getTransitionMessage = (focusLevel: FocusLevel): string => {
  if (focusLevel === 'galaxy') return 'Warping to galaxy...';
  if (focusLevel === 'solar-system') return 'Traveling to system...';
  if (focusLevel === 'planet') return 'Landing on surface...';
  return 'Traveling...';
};

export default function SceneHUD({ galaxies }: SceneHUDProps) {
  const {
    focusLevel,
    focusedGalaxyId,
    focusedSolarSystemId,
    focusedPlanetId,
    focusedMoonId,
    isTransitioning,
    navigateBack,
  } = useNavigationStore();

  const focusedGalaxy = galaxies.find((g) => g.id === focusedGalaxyId);
  const focusedSolarSystem = focusedGalaxy?.solarSystems?.find(
    (s) => s.id === focusedSolarSystemId
  );
  const focusedPlanet = focusedSolarSystem?.planets?.find((p) => p.id === focusedPlanetId);
  const focusedMoon = focusedPlanet?.moons?.find((m) => m.id === focusedMoonId);

  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '1rem 2rem',
          pointerEvents: 'none',
          zIndex: 100,
        }}
      >
      {/* Breadcrumb navigation */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.9rem',
          color: '#CCCCCC',
        }}
      >
        <span>Universe</span>
        {focusLevel !== 'universe' && (
          <>
            <span>→</span>
            <span style={{ color: '#FFFFFF', fontWeight: 'bold' }}>
              {focusedGalaxy?.name || 'Galaxy'}
            </span>
          </>
        )}
        {(focusLevel === 'solar-system' || focusLevel === 'planet') && (
          <>
            <span>→</span>
            <span style={{ color: '#FFFFFF', fontWeight: 'bold' }}>
              {focusedSolarSystem?.name || 'Solar System'}
            </span>
          </>
        )}
        {focusLevel === 'planet' && (
          <>
            <span>→</span>
            <span style={{ color: '#FFFFFF', fontWeight: 'bold' }}>
              {focusedMoon ? focusedMoon.name : focusedPlanet?.name || 'Planet'}
            </span>
          </>
        )}
      </div>

      {/* Back button */}
      {focusLevel !== 'universe' && (
        <button
          onClick={navigateBack}
          disabled={isTransitioning}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            backgroundColor: isTransitioning ? '#444444' : '#4A90E2',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '4px',
            cursor: isTransitioning ? 'not-allowed' : 'pointer',
            fontSize: '0.9rem',
            pointerEvents: 'auto',
            opacity: isTransitioning ? 0.5 : 1,
            transition: 'all 0.3s',
          }}
          onMouseEnter={(e) => {
            if (!isTransitioning) {
              e.currentTarget.style.backgroundColor = '#357ABD';
            }
          }}
          onMouseLeave={(e) => {
            if (!isTransitioning) {
              e.currentTarget.style.backgroundColor = '#4A90E2';
            }
          }}
        >
          ← Back
        </button>
      )}

    </div>

      {/* Centered transition indicator */}
      {isTransitioning && (
        <div
          className="transition-indicator"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            padding: '1.5rem 2.5rem',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            border: '2px solid rgba(74, 144, 226, 0.6)',
            borderRadius: '12px',
            fontSize: '1.2rem',
            color: '#FFFFFF',
            fontWeight: '500',
            letterSpacing: '0.05em',
            textAlign: 'center',
            pointerEvents: 'none',
            zIndex: 1000,
            backdropFilter: 'blur(8px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              className="transition-indicator-spinner"
              style={{
                width: '16px',
                height: '16px',
                border: '2px solid rgba(74, 144, 226, 0.3)',
                borderTopColor: '#4A90E2',
                borderRadius: '50%',
              }}
              aria-hidden="true"
            />
            <span>{getTransitionMessage(focusLevel)}</span>
          </div>
        </div>
      )}
    </>
  );
}
