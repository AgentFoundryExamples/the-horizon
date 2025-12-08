'use client';

/**
 * ContextualWelcomeMessage - Wrapper that provides contextual hero messaging
 * Displays different titles and descriptions based on current navigation state
 */

import { useNavigationStore } from '@/lib/store';
import type { Galaxy } from '@/lib/universe/types';
import WelcomeMessage from './WelcomeMessage';

interface ContextualWelcomeMessageProps {
  galaxies: Galaxy[];
}

export default function ContextualWelcomeMessage({ galaxies }: ContextualWelcomeMessageProps) {
  const {
    focusLevel,
    focusedGalaxyId,
    focusedSolarSystemId,
    focusedPlanetId,
  } = useNavigationStore();

  // Hide welcome message on planet views
  if (focusLevel === 'planet') {
    return null;
  }

  // Get current galaxy and solar system
  const currentGalaxy = galaxies.find((g) => g.id === focusedGalaxyId);
  const currentSolarSystem = currentGalaxy?.solarSystems?.find(
    (s) => s.id === focusedSolarSystemId
  );

  // Determine title and description based on focus level
  let title = 'Welcome to the Horizon';
  let description = 'Click a galaxy to explore';

  if (focusLevel === 'galaxy' && currentGalaxy) {
    title = `Exploring ${currentGalaxy.name}`;
    description = currentGalaxy.description || 'A vast collection of stars and worlds';
  } else if (focusLevel === 'solar-system' && currentSolarSystem) {
    title = `Navigating ${currentSolarSystem.name}`;
    description = `A star system with ${currentSolarSystem.planets?.length || 0} planet${currentSolarSystem.planets?.length === 1 ? '' : 's'}`;
  }

  return (
    <WelcomeMessage
      title={title}
      description={description}
      visible={true}
    />
  );
}
