/**
 * Unit tests for navigation store
 */

import { renderHook, act } from '@testing-library/react';
import { useNavigationStore } from '../store';

describe('Navigation Store', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useNavigationStore());
    act(() => {
      result.current.reset();
    });
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useNavigationStore());

      expect(result.current.focusLevel).toBe('universe');
      expect(result.current.focusedGalaxyId).toBeNull();
      expect(result.current.focusedSolarSystemId).toBeNull();
      expect(result.current.isTransitioning).toBe(false);
      expect(result.current.transitionQueue).toEqual([]);
    });
  });

  describe('setFocus', () => {
    it('should set focus to universe', () => {
      const { result } = renderHook(() => useNavigationStore());

      act(() => {
        result.current.setFocus('universe');
      });

      expect(result.current.focusLevel).toBe('universe');
      expect(result.current.focusedGalaxyId).toBeNull();
      expect(result.current.focusedSolarSystemId).toBeNull();
    });

    it('should set focus to galaxy with id', () => {
      const { result } = renderHook(() => useNavigationStore());

      act(() => {
        result.current.setFocus('galaxy', 'milky-way');
      });

      expect(result.current.focusLevel).toBe('galaxy');
      expect(result.current.focusedGalaxyId).toBe('milky-way');
      expect(result.current.focusedSolarSystemId).toBeNull();
    });

    it('should set focus to solar system with id', () => {
      const { result } = renderHook(() => useNavigationStore());

      act(() => {
        result.current.setFocus('galaxy', 'milky-way');
        result.current.setFocus('solar-system', 'sol-system');
      });

      expect(result.current.focusLevel).toBe('solar-system');
      expect(result.current.focusedGalaxyId).toBe('milky-way');
      expect(result.current.focusedSolarSystemId).toBe('sol-system');
    });
  });

  describe('setTransitioning', () => {
    it('should set transitioning flag', () => {
      const { result } = renderHook(() => useNavigationStore());

      act(() => {
        result.current.setTransitioning(true);
      });

      expect(result.current.isTransitioning).toBe(true);

      act(() => {
        result.current.setTransitioning(false);
      });

      expect(result.current.isTransitioning).toBe(false);
    });
  });

  describe('navigateToGalaxy', () => {
    it('should navigate to galaxy', () => {
      const { result } = renderHook(() => useNavigationStore());

      act(() => {
        result.current.navigateToGalaxy('milky-way');
      });

      expect(result.current.focusLevel).toBe('galaxy');
      expect(result.current.focusedGalaxyId).toBe('milky-way');
      expect(result.current.isTransitioning).toBe(true);
    });

    it('should clear solar system id when navigating to galaxy', () => {
      const { result } = renderHook(() => useNavigationStore());

      act(() => {
        result.current.setFocus('solar-system', 'sol-system');
        result.current.setTransitioning(false);
        result.current.navigateToGalaxy('andromeda');
      });

      expect(result.current.focusedGalaxyId).toBe('andromeda');
      expect(result.current.focusedSolarSystemId).toBeNull();
    });

    it('should queue navigation if already transitioning', () => {
      const { result } = renderHook(() => useNavigationStore());

      act(() => {
        result.current.setTransitioning(true);
        result.current.navigateToGalaxy('milky-way');
      });

      expect(result.current.transitionQueue.length).toBe(1);
      expect(result.current.transitionQueue[0]).toEqual({
        level: 'galaxy',
        id: 'milky-way',
      });
    });
  });

  describe('navigateToSolarSystem', () => {
    it('should navigate to solar system', () => {
      const { result } = renderHook(() => useNavigationStore());

      act(() => {
        result.current.navigateToSolarSystem('sol-system');
      });

      expect(result.current.focusLevel).toBe('solar-system');
      expect(result.current.focusedSolarSystemId).toBe('sol-system');
      expect(result.current.isTransitioning).toBe(true);
    });

    it('should queue navigation if already transitioning', () => {
      const { result } = renderHook(() => useNavigationStore());

      act(() => {
        result.current.setTransitioning(true);
        result.current.navigateToSolarSystem('sol-system');
      });

      expect(result.current.transitionQueue.length).toBe(1);
      expect(result.current.transitionQueue[0]).toEqual({
        level: 'solar-system',
        id: 'sol-system',
      });
    });
  });

  describe('navigateBack', () => {
    it('should ignore if transitioning', () => {
      const { result } = renderHook(() => useNavigationStore());

      act(() => {
        result.current.setFocus('galaxy', 'milky-way');
        result.current.setTransitioning(true);
        result.current.navigateBack();
      });

      expect(result.current.focusLevel).toBe('galaxy');
    });

    it('should navigate from solar system to galaxy', () => {
      const { result } = renderHook(() => useNavigationStore());

      act(() => {
        result.current.setFocus('galaxy', 'milky-way');
        result.current.setFocus('solar-system', 'sol-system');
        result.current.setTransitioning(false);
        result.current.navigateBack();
      });

      expect(result.current.focusLevel).toBe('galaxy');
      expect(result.current.focusedSolarSystemId).toBeNull();
      expect(result.current.isTransitioning).toBe(true);
    });

    it('should navigate from galaxy to universe', () => {
      const { result } = renderHook(() => useNavigationStore());

      act(() => {
        result.current.setFocus('galaxy', 'milky-way');
        result.current.setTransitioning(false);
        result.current.navigateBack();
      });

      expect(result.current.focusLevel).toBe('universe');
      expect(result.current.focusedGalaxyId).toBeNull();
      expect(result.current.isTransitioning).toBe(true);
    });

    it('should not navigate back from universe level', () => {
      const { result } = renderHook(() => useNavigationStore());

      act(() => {
        result.current.navigateBack();
      });

      expect(result.current.focusLevel).toBe('universe');
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      const { result } = renderHook(() => useNavigationStore());

      act(() => {
        result.current.setFocus('galaxy', 'milky-way');
        result.current.setTransitioning(true);
        result.current.reset();
      });

      expect(result.current.focusLevel).toBe('universe');
      expect(result.current.focusedGalaxyId).toBeNull();
      expect(result.current.focusedSolarSystemId).toBeNull();
      expect(result.current.isTransitioning).toBe(false);
      expect(result.current.transitionQueue).toEqual([]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid navigation requests', () => {
      const { result } = renderHook(() => useNavigationStore());

      act(() => {
        result.current.navigateToGalaxy('milky-way');
        result.current.navigateToGalaxy('andromeda');
        result.current.navigateToSolarSystem('sol-system');
      });

      // First navigation should succeed
      expect(result.current.focusedGalaxyId).toBe('milky-way');
      
      // Others should be queued
      expect(result.current.transitionQueue.length).toBe(2);
    });

    it('should maintain galaxy context when navigating to solar system', () => {
      const { result } = renderHook(() => useNavigationStore());

      act(() => {
        result.current.setFocus('galaxy', 'milky-way');
        result.current.setTransitioning(false);
        result.current.navigateToSolarSystem('sol-system');
      });

      expect(result.current.focusedGalaxyId).toBe('milky-way');
      expect(result.current.focusedSolarSystemId).toBe('sol-system');
    });
  });

  describe('finishTransition', () => {
    it('should process queued navigation when transition completes', () => {
      const { result } = renderHook(() => useNavigationStore());

      act(() => {
        // Start first navigation
        result.current.navigateToGalaxy('milky-way');
        // Queue second navigation
        result.current.navigateToGalaxy('andromeda');
      });

      expect(result.current.focusedGalaxyId).toBe('milky-way');
      expect(result.current.transitionQueue.length).toBe(1);

      // Finish the first transition
      act(() => {
        result.current.finishTransition();
      });

      // Should have processed the queued navigation
      expect(result.current.focusedGalaxyId).toBe('andromeda');
      expect(result.current.transitionQueue.length).toBe(0);
      expect(result.current.isTransitioning).toBe(true);
    });

    it('should set isTransitioning to false when queue is empty', () => {
      const { result } = renderHook(() => useNavigationStore());

      act(() => {
        result.current.navigateToGalaxy('milky-way');
      });

      expect(result.current.isTransitioning).toBe(true);

      act(() => {
        result.current.finishTransition();
      });

      expect(result.current.isTransitioning).toBe(false);
    });

    it('should process solar system navigation from queue', () => {
      const { result } = renderHook(() => useNavigationStore());

      act(() => {
        result.current.navigateToGalaxy('milky-way');
        result.current.navigateToSolarSystem('sol-system');
      });

      expect(result.current.focusLevel).toBe('galaxy');
      expect(result.current.transitionQueue.length).toBe(1);

      act(() => {
        result.current.finishTransition();
      });

      expect(result.current.focusLevel).toBe('solar-system');
      expect(result.current.focusedSolarSystemId).toBe('sol-system');
    });
  });
});
