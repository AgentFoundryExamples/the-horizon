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
/**
 * Global state management for scene navigation
 * Tracks current focus level and handles navigation state
 */

import { create } from 'zustand';

export type FocusLevel = 'universe' | 'galaxy' | 'solar-system' | 'planet';

export interface NavigationState {
  focusLevel: FocusLevel;
  focusedGalaxyId: string | null;
  focusedSolarSystemId: string | null;
  focusedPlanetId: string | null;
  focusedMoonId: string | null;
  isTransitioning: boolean;
  transitionQueue: Array<{ level: FocusLevel; id: string | null }>;
}

interface NavigationStore extends NavigationState {
  setFocus: (level: FocusLevel, id?: string | null) => void;
  setTransitioning: (isTransitioning: boolean) => void;
  finishTransition: () => void;
  navigateToGalaxy: (galaxyId: string) => void;
  navigateToSolarSystem: (solarSystemId: string) => void;
  navigateToPlanet: (planetId: string) => void;
  navigateToMoon: (moonId: string) => void;
  navigateBack: () => void;
  reset: () => void;
}

const initialState: NavigationState = {
  focusLevel: 'universe',
  focusedGalaxyId: null,
  focusedSolarSystemId: null,
  focusedPlanetId: null,
  focusedMoonId: null,
  isTransitioning: false,
  transitionQueue: [],
};

export const useNavigationStore = create<NavigationStore>((set, get) => ({
  ...initialState,

  setFocus: (level: FocusLevel, id: string | null = null) => {
    // Validate that galaxy/solar-system/planet levels have an id
    if ((level === 'galaxy' || level === 'solar-system' || level === 'planet') && !id) {
      console.warn(`setFocus: ${level} level requires an id parameter`);
    }

    set({
      focusLevel: level,
      ...(level === 'galaxy' && { focusedGalaxyId: id, focusedSolarSystemId: null, focusedPlanetId: null, focusedMoonId: null }),
      ...(level === 'solar-system' && { focusedSolarSystemId: id, focusedPlanetId: null, focusedMoonId: null }),
      ...(level === 'planet' && { focusedPlanetId: id, focusedMoonId: null }),
      ...(level === 'universe' && { focusedGalaxyId: null, focusedSolarSystemId: null, focusedPlanetId: null, focusedMoonId: null }),
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
      } else if (nextAction.level === 'planet' && nextAction.id) {
        get().navigateToPlanet(nextAction.id);
      } else if (nextAction.level === 'universe') {
        // Universe navigation doesn't require an ID
        get().navigateBack(); // Navigate back handles universe level
      } else {
        console.warn('Unknown navigation level in queue:', nextAction.level);
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
      focusedPlanetId: null,
      focusedMoonId: null,
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
      focusedPlanetId: null,
      focusedMoonId: null,
    });
  },

  navigateToPlanet: (planetId: string) => {
    const state = get();

    // If already transitioning, queue the navigation
    if (state.isTransitioning) {
      set({
        transitionQueue: [...state.transitionQueue, { level: 'planet', id: planetId }],
      });
      return;
    }

    set({
      isTransitioning: true,
      focusLevel: 'planet',
      focusedPlanetId: planetId,
      focusedMoonId: null,
    });
  },

  navigateToMoon: (moonId: string) => {
    const state = get();

    // Moon navigation is a quick swap, not queued
    if (state.isTransitioning) {
      return;
    }

    // Empty string clears the moon selection, returning to planet view
    set({
      focusedMoonId: moonId === '' ? null : moonId,
    });
  },

  navigateBack: () => {
    const state = get();

    // Ignore if transitioning or already at the top level
    if (state.isTransitioning || state.focusLevel === 'universe') {
      return;
    }

    if (state.focusLevel === 'planet') {
      // Go back to solar system view
      set({
        isTransitioning: true,
        focusLevel: 'solar-system',
        focusedPlanetId: null,
        focusedMoonId: null,
      });
    } else if (state.focusLevel === 'solar-system') {
      // Go back to galaxy view
      set({
        isTransitioning: true,
        focusLevel: 'galaxy',
        focusedSolarSystemId: null,
        focusedPlanetId: null,
        focusedMoonId: null,
      });
    } else if (state.focusLevel === 'galaxy') {
      // Go back to universe view
      set({
        isTransitioning: true,
        focusLevel: 'universe',
        focusedGalaxyId: null,
        focusedSolarSystemId: null,
        focusedPlanetId: null,
        focusedMoonId: null,
      });
    }
  },

  reset: () => {
    set(initialState);
  },
}));
