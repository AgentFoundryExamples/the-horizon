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
  finishTransition: () => void;
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

  finishTransition: () => {
    const state = get();
    const nextAction = state.transitionQueue[0];

    if (nextAction) {
      // Dequeue the action and set transitioning to false temporarily
      set({ 
        transitionQueue: state.transitionQueue.slice(1),
        isTransitioning: false 
      });
      
      // Execute the next action (which will set isTransitioning back to true)
      if (nextAction.level === 'galaxy' && nextAction.id) {
        get().navigateToGalaxy(nextAction.id);
      } else if (nextAction.level === 'solar-system' && nextAction.id) {
        get().navigateToSolarSystem(nextAction.id);
      }
    } else {
      // No more actions, transition is finished
      set({ isTransitioning: false });
    }
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

    // Ignore if transitioning or already at the top level
    if (state.isTransitioning || state.focusLevel === 'universe') {
      return;
    }

    if (state.focusLevel === 'solar-system') {
      // Go back to galaxy view
      set({
        isTransitioning: true,
        focusLevel: 'galaxy',
        focusedSolarSystemId: null,
      });
    } else if (state.focusLevel === 'galaxy') {
      // Go back to universe view
      set({
        isTransitioning: true,
        focusLevel: 'universe',
        focusedGalaxyId: null,
        focusedSolarSystemId: null, // Ensure this is also cleared
      });
    }
  },

  reset: () => {
    set(initialState);
  },
}));
