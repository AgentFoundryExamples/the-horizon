'use client';

/**
 * SceneHUD - Heads-up display for scene navigation
 * Shows breadcrumb trail, back button, and overlay hover labels
 */

import { useState } from 'react';
import { useNavigationStore } from '@/lib/store';
import { useHoverStore } from '@/lib/hover-store';
import { DARK_PALETTE } from '@/lib/dark-palette';
import type { Galaxy } from '@/lib/universe/types';
import type { FocusLevel } from '@/lib/store';

interface SceneHUDProps {
  galaxies: Galaxy[];
}

// Helper function to determine transition message based on focus level
// Note: During transitions, focusLevel represents the destination (not the origin)
// because the store sets focusLevel and isTransitioning together
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
    navigateToUniverse,
    navigateToGalaxy,
    navigateToSolarSystem,
  } = useNavigationStore();
  
  const { labelsVisible, toggleLabelsVisibility } = useHoverStore();
  
  // State for managing focus and hover styles declaratively
  const [focusedBreadcrumb, setFocusedBreadcrumb] = useState<string | null>(null);
  const [hoveredBreadcrumb, setHoveredBreadcrumb] = useState<string | null>(null);

  const focusedGalaxy = galaxies.find((g) => g.id === focusedGalaxyId);
  const focusedSolarSystem = focusedGalaxy?.solarSystems?.find(
    (s) => s.id === focusedSolarSystemId
  );
  const focusedPlanet = focusedSolarSystem?.planets?.find((p) => p.id === focusedPlanetId);
  const focusedMoon = focusedPlanet?.moons?.find((m) => m.id === focusedMoonId);

  // Handler for keyboard navigation
  const handleBreadcrumbKeyPress = (event: React.KeyboardEvent, handler: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handler();
    }
  };

  // Common styles for breadcrumb buttons
  const getBreadcrumbButtonStyle = (
    breadcrumbId: string,
    isActive: boolean, 
    isDisabled: boolean
  ) => {
    const isFocused = focusedBreadcrumb === breadcrumbId;
    const isHovered = hoveredBreadcrumb === breadcrumbId;
    
    return {
      background: 'none',
      border: 'none',
      padding: '0.25rem 0.5rem',
      margin: '-0.25rem -0.5rem',
      color: isActive ? DARK_PALETTE.text.primary : (isHovered ? DARK_PALETTE.text.primary : DARK_PALETTE.text.secondary),
      fontWeight: isActive ? ('bold' as const) : ('normal' as const),
      fontSize: '0.9rem',
      cursor: isDisabled ? 'default' : 'pointer',
      pointerEvents: 'auto' as const,
      textDecoration: isHovered && !isActive ? 'underline' : 'none',
      borderRadius: '4px',
      transition: 'all 0.2s',
      opacity: isTransitioning ? 0.5 : 1,
      outline: isFocused && !isActive ? `2px solid ${DARK_PALETTE.accent.primary}` : 'none',
      outlineOffset: isFocused && !isActive ? '2px' : '0',
    };
  };

  // Consolidated hover handler
  const handleBreadcrumbHover = (breadcrumbId: string, isActive: boolean, isEntering: boolean) => {
    if (!isTransitioning && !isActive) {
      setHoveredBreadcrumb(isEntering ? breadcrumbId : null);
    }
  };

  // Consolidated focus handler
  const handleBreadcrumbFocus = (breadcrumbId: string, isActive: boolean) => {
    if (!isTransitioning && !isActive) {
      setFocusedBreadcrumb(breadcrumbId);
    }
  };

  const handleBreadcrumbBlur = () => {
    setFocusedBreadcrumb(null);
  };

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
          color: DARK_PALETTE.text.secondary,
        }}
      >
        {/* Universe breadcrumb - always clickable unless at universe level */}
        <button
          onClick={() => navigateToUniverse()}
          onKeyDown={(e) => handleBreadcrumbKeyPress(e, navigateToUniverse)}
          disabled={isTransitioning || focusLevel === 'universe'}
          aria-label="Navigate to Universe view"
          aria-current={focusLevel === 'universe' ? 'page' : undefined}
          style={getBreadcrumbButtonStyle('universe', focusLevel === 'universe', isTransitioning || focusLevel === 'universe')}
          onMouseEnter={() => handleBreadcrumbHover('universe', focusLevel === 'universe', true)}
          onMouseLeave={() => handleBreadcrumbHover('universe', focusLevel === 'universe', false)}
          onFocus={() => handleBreadcrumbFocus('universe', focusLevel === 'universe')}
          onBlur={handleBreadcrumbBlur}
        >
          Universe
        </button>
        
        {focusLevel !== 'universe' && (
          <>
            <span>→</span>
            {/* Galaxy breadcrumb - clickable when not at galaxy level */}
            <button
              onClick={() => focusedGalaxyId && navigateToGalaxy(focusedGalaxyId)}
              onKeyDown={(e) => handleBreadcrumbKeyPress(e, () => focusedGalaxyId && navigateToGalaxy(focusedGalaxyId))}
              disabled={isTransitioning || focusLevel === 'galaxy' || !focusedGalaxyId}
              aria-label={`Navigate to ${focusedGalaxy?.name || 'Galaxy'} view`}
              aria-current={focusLevel === 'galaxy' ? 'page' : undefined}
              style={getBreadcrumbButtonStyle('galaxy', focusLevel === 'galaxy', isTransitioning || focusLevel === 'galaxy')}
              onMouseEnter={() => handleBreadcrumbHover('galaxy', focusLevel === 'galaxy', true)}
              onMouseLeave={() => handleBreadcrumbHover('galaxy', focusLevel === 'galaxy', false)}
              onFocus={() => handleBreadcrumbFocus('galaxy', focusLevel === 'galaxy')}
              onBlur={handleBreadcrumbBlur}
            >
              {focusedGalaxy?.name || 'Galaxy'}
            </button>
          </>
        )}
        
        {(focusLevel === 'solar-system' || focusLevel === 'planet') && (
          <>
            <span>→</span>
            {/* Solar System breadcrumb - clickable when at planet level */}
            <button
              onClick={() => focusedSolarSystemId && navigateToSolarSystem(focusedSolarSystemId)}
              onKeyDown={(e) => handleBreadcrumbKeyPress(e, () => focusedSolarSystemId && navigateToSolarSystem(focusedSolarSystemId))}
              disabled={isTransitioning || focusLevel === 'solar-system' || !focusedSolarSystemId}
              aria-label={`Navigate to ${focusedSolarSystem?.name || 'Solar System'} view`}
              aria-current={focusLevel === 'solar-system' ? 'page' : undefined}
              style={getBreadcrumbButtonStyle('solar-system', focusLevel === 'solar-system', isTransitioning || focusLevel === 'solar-system')}
              onMouseEnter={() => handleBreadcrumbHover('solar-system', focusLevel === 'solar-system', true)}
              onMouseLeave={() => handleBreadcrumbHover('solar-system', focusLevel === 'solar-system', false)}
              onFocus={() => handleBreadcrumbFocus('solar-system', focusLevel === 'solar-system')}
              onBlur={handleBreadcrumbBlur}
            >
              {focusedSolarSystem?.name || 'Solar System'}
            </button>
          </>
        )}
        
        {focusLevel === 'planet' && (
          <>
            <span>→</span>
            {/* Planet breadcrumb - currently active, not clickable */}
            <span 
              style={{ 
                color: DARK_PALETTE.text.primary, 
                fontWeight: 'bold',
                padding: '0.25rem 0.5rem',
              }}
              aria-current="page"
            >
              {focusedMoon ? focusedMoon.name : focusedPlanet?.name || 'Planet'}
            </span>
          </>
        )}
      </div>

      {/* Back button and label visibility toggle */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        {focusLevel !== 'universe' && (
          <button
            onClick={navigateBack}
            disabled={isTransitioning}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: isTransitioning ? DARK_PALETTE.border.primary : DARK_PALETTE.accent.primary,
              color: DARK_PALETTE.text.primary,
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
                e.currentTarget.style.backgroundColor = DARK_PALETTE.accent.active;
              }
            }}
            onMouseLeave={(e) => {
              if (!isTransitioning) {
                e.currentTarget.style.backgroundColor = DARK_PALETTE.accent.primary;
              }
            }}
          >
            ← Back
          </button>
        )}
        
        {/* Label visibility toggle */}
        <button
          onClick={toggleLabelsVisibility}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: labelsVisible ? DARK_PALETTE.accent.primary : DARK_PALETTE.ui.buttonSecondary,
            color: DARK_PALETTE.text.primary,
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            pointerEvents: 'auto',
            transition: 'all 0.3s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = labelsVisible ? DARK_PALETTE.accent.active : DARK_PALETTE.ui.buttonSecondaryHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = labelsVisible ? DARK_PALETTE.accent.primary : DARK_PALETTE.ui.buttonSecondary;
          }}
          title={labelsVisible ? 'Hide hover labels' : 'Show hover labels'}
          aria-label={labelsVisible ? 'Hide hover labels' : 'Show hover labels'}
        >
          {labelsVisible ? '👁️ Labels' : '👁️‍🗨️ Labels'}
        </button>
      </div>

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
            backgroundColor: DARK_PALETTE.background.tertiary,
            border: `2px solid ${DARK_PALETTE.accent.transparent60}`,
            borderRadius: '12px',
            fontSize: '1.2rem',
            color: DARK_PALETTE.text.primary,
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
              aria-hidden="true"
            />
            <span>{getTransitionMessage(focusLevel)}</span>
          </div>
        </div>
      )}
    </>
  );
}
