/**
 * Global state management for scene navigation
 * Tracks current focus level and handles navigation state
 */

import { create } from 'zustand';

export type FocusLevel = 'universe' | 'galaxy' | 'solar-system';

export interface NavigationState {
  focusLevel: FocusLevel;
  focusedGalaxyId: string | null;
  focusedSolarSystemId: string | null;
  isTransitioning: boolean;
  transitionQueue: Array<{ level: FocusLevel; id: string | null }>;
}

interface NavigationStore extends NavigationState {
  setFocus: (level: FocusLevel, id?: string | null) => void;
  setTransitioning: (isTransitioning: boolean) => void;
  navigateToGalaxy: (galaxyId: string) => void;
  navigateToSolarSystem: (solarSystemId: string) => void;
  navigateBack: () => void;
  reset: () => void;
}

const initialState: NavigationState = {
  focusLevel: 'universe',
  focusedGalaxyId: null,
  focusedSolarSystemId: null,
  isTransitioning: false,
  transitionQueue: [],
};

export const useNavigationStore = create<NavigationStore>((set, get) => ({
  ...initialState,

  setFocus: (level: FocusLevel, id: string | null = null) => {
    // Validate that galaxy/solar-system levels have an id
    if ((level === 'galaxy' || level === 'solar-system') && !id) {
      console.warn(`setFocus: ${level} level requires an id parameter`);
    }

    set({
      focusLevel: level,
      ...(level === 'galaxy' && { focusedGalaxyId: id, focusedSolarSystemId: null }),
      ...(level === 'solar-system' && { focusedSolarSystemId: id }),
      ...(level === 'universe' && { focusedGalaxyId: null, focusedSolarSystemId: null }),
    });
  },

  setTransitioning: (isTransitioning: boolean) => {
    set({ isTransitioning });
  },

  navigateToGalaxy: (galaxyId: string) => {
    const state = get();
    
    // If already transitioning, queue the navigation
    if (state.isTransitioning) {
      set({
        transitionQueue: [...state.transitionQueue, { level: 'galaxy', id: galaxyId }],
      });
      return;
    }

    set({
      isTransitioning: true,
      focusLevel: 'galaxy',
      focusedGalaxyId: galaxyId,
      focusedSolarSystemId: null,
    });
  },

  navigateToSolarSystem: (solarSystemId: string) => {
    const state = get();

    // If already transitioning, queue the navigation
    if (state.isTransitioning) {
      set({
        transitionQueue: [...state.transitionQueue, { level: 'solar-system', id: solarSystemId }],
      });
      return;
    }

    set({
      isTransitioning: true,
      focusLevel: 'solar-system',
      focusedSolarSystemId: solarSystemId,
    });
  },

  navigateBack: () => {
    const state = get();

    // Ignore if transitioning
    if (state.isTransitioning) {
      return;
    }

    set({ isTransitioning: true });

    if (state.focusLevel === 'solar-system') {
      // Go back to galaxy view
      set({
        focusLevel: 'galaxy',
        focusedSolarSystemId: null,
      });
    } else if (state.focusLevel === 'galaxy') {
      // Go back to universe view
      set({
        focusLevel: 'universe',
        focusedGalaxyId: null,
      });
    }
  },

  reset: () => {
    set(initialState);
  },
}));
