/**
 * Unit tests for OverlayLabels component with per-scene configuration
 */

import { render } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import OverlayLabels from '../OverlayLabels';
import { useHoverStore } from '@/lib/hover-store';
import { useNavigationStore } from '@/lib/store';
import { LABEL_CONFIGS } from '@/lib/label-config';
import * as THREE from 'three';

// Mock the Html component from @react-three/drei
jest.mock('@react-three/drei', () => ({
  Html: ({ children, distanceFactor, position, ...rest }: any) => (
    <div 
      data-testid="html-component" 
      data-distance-factor={distanceFactor} 
      data-position={position?.join(',')}
      {...rest}
    >
      {children}
    </div>
  ),
}));

describe('OverlayLabels - Per-Scene Configuration', () => {
  beforeEach(() => {
    // Reset stores before each test
    const navStore = renderHook(() => useNavigationStore());
    const hoverStore = renderHook(() => useHoverStore());
    act(() => {
      navStore.result.current.reset();
      hoverStore.result.current.clearHover();
    });
  });

  describe('Scene-specific styling', () => {
    it('should apply universe config when at universe level', () => {
      const { result: hoverResult } = renderHook(() => useHoverStore());

      act(() => {
        // Set to universe level (default)
        hoverResult.current.setHoveredObject({
          id: 'test-galaxy',
          name: 'Test Galaxy',
          type: 'galaxy',
          position: new THREE.Vector3(10, 0, 0),
        });
      });

      const { getByTestId } = render(<OverlayLabels />);

      const htmlComponent = getByTestId('html-component');
      expect(htmlComponent.getAttribute('data-distance-factor')).toBe(
        String(LABEL_CONFIGS.universe.distanceFactor)
      );
    });

    it('should apply galaxy config when at galaxy level', () => {
      const { result: navResult } = renderHook(() => useNavigationStore());
      const { result: hoverResult } = renderHook(() => useHoverStore());

      act(() => {
        navResult.current.navigateToGalaxy('test-galaxy');
        navResult.current.finishTransition();
        hoverResult.current.setHoveredObject({
          id: 'test-system',
          name: 'Test System',
          type: 'solar-system',
          position: new THREE.Vector3(5, 0, 0),
        });
      });

      const { getByTestId } = render(<OverlayLabels />);

      const htmlComponent = getByTestId('html-component');
      expect(htmlComponent.getAttribute('data-distance-factor')).toBe(
        String(LABEL_CONFIGS.galaxy.distanceFactor)
      );
    });

    it('should apply solar-system config when at solar-system level', () => {
      const { result: navResult } = renderHook(() => useNavigationStore());
      const { result: hoverResult } = renderHook(() => useHoverStore());

      act(() => {
        navResult.current.navigateToGalaxy('test-galaxy');
        navResult.current.finishTransition();
        navResult.current.navigateToSolarSystem('test-system');
        navResult.current.finishTransition();
        hoverResult.current.setHoveredObject({
          id: 'test-planet',
          name: 'Test Planet',
          type: 'planet',
          position: new THREE.Vector3(2, 0, 0),
        });
      });

      const { getByTestId } = render(<OverlayLabels />);

      const htmlComponent = getByTestId('html-component');
      expect(htmlComponent.getAttribute('data-distance-factor')).toBe(
        String(LABEL_CONFIGS['solar-system'].distanceFactor)
      );
    });

    it('should apply planet config when at planet level', () => {
      const { result: navResult } = renderHook(() => useNavigationStore());
      const { result: hoverResult } = renderHook(() => useHoverStore());

      act(() => {
        navResult.current.navigateToGalaxy('test-galaxy');
        navResult.current.finishTransition();
        navResult.current.navigateToSolarSystem('test-system');
        navResult.current.finishTransition();
        navResult.current.navigateToPlanet('test-planet');
        navResult.current.finishTransition();
        hoverResult.current.setHoveredObject({
          id: 'test-moon',
          name: 'Test Moon',
          type: 'planet', // moons use planet type
          position: new THREE.Vector3(1, 0, 0),
        });
      });

      const { getByTestId } = render(<OverlayLabels />);

      const htmlComponent = getByTestId('html-component');
      expect(htmlComponent.getAttribute('data-distance-factor')).toBe(
        String(LABEL_CONFIGS.planet.distanceFactor)
      );
    });
  });

  describe('Font size configuration', () => {
    it('should apply per-scene font sizes to label name', () => {
      const { result: hoverResult } = renderHook(() => useHoverStore());

      act(() => {
        hoverResult.current.setHoveredObject({
          id: 'test',
          name: 'Test Object',
          type: 'galaxy',
          position: new THREE.Vector3(0, 0, 0),
        });
      });

      const { container } = render(<OverlayLabels />);

      const nameElement = container.querySelector('.overlay-label-name');
      expect(nameElement).toHaveStyle({ fontSize: LABEL_CONFIGS.universe.fontSize });
    });

    it('should apply per-scene font sizes to label type', () => {
      const { result: hoverResult } = renderHook(() => useHoverStore());

      act(() => {
        hoverResult.current.setHoveredObject({
          id: 'test',
          name: 'Test Object',
          type: 'galaxy',
          position: new THREE.Vector3(0, 0, 0),
        });
      });

      const { container } = render(<OverlayLabels />);

      const typeElement = container.querySelector('.overlay-label-type');
      expect(typeElement).toHaveStyle({ fontSize: LABEL_CONFIGS.universe.typeFontSize });
    });
  });

  describe('Glow effect configuration', () => {
    it('should have with-glow class for universe scene', () => {
      const { result: hoverResult } = renderHook(() => useHoverStore());

      act(() => {
        hoverResult.current.setHoveredObject({
          id: 'test',
          name: 'Test Object',
          type: 'galaxy',
          position: new THREE.Vector3(0, 0, 0),
        });
      });

      const { container } = render(<OverlayLabels />);

      const contentElement = container.querySelector('.overlay-label-content');
      expect(contentElement).toHaveClass('with-glow');
    });

    it('should have no-glow class for planet scene', () => {
      const { result: navResult } = renderHook(() => useNavigationStore());
      const { result: hoverResult } = renderHook(() => useHoverStore());

      act(() => {
        navResult.current.navigateToGalaxy('test-galaxy');
        navResult.current.finishTransition();
        navResult.current.navigateToSolarSystem('test-system');
        navResult.current.finishTransition();
        navResult.current.navigateToPlanet('test-planet');
        navResult.current.finishTransition();
        hoverResult.current.setHoveredObject({
          id: 'test',
          name: 'Test Moon',
          type: 'planet',
          position: new THREE.Vector3(0, 0, 0),
        });
      });

      const { container } = render(<OverlayLabels />);

      const contentElement = container.querySelector('.overlay-label-content');
      expect(contentElement).toHaveClass('no-glow');
    });
  });

  describe('Text wrapping configuration', () => {
    it('should have nowrap for universe scene', () => {
      const { result: hoverResult } = renderHook(() => useHoverStore());

      act(() => {
        hoverResult.current.setHoveredObject({
          id: 'test',
          name: 'Very Long Galaxy Name That Should Not Wrap',
          type: 'galaxy',
          position: new THREE.Vector3(0, 0, 0),
        });
      });

      const { container } = render(<OverlayLabels />);

      const nameElement = container.querySelector('.overlay-label-name');
      expect(nameElement).toHaveStyle({ whiteSpace: 'nowrap' });
    });

    it('should have wrap for planet scene', () => {
      const { result: navResult } = renderHook(() => useNavigationStore());
      const { result: hoverResult } = renderHook(() => useHoverStore());

      act(() => {
        navResult.current.navigateToGalaxy('test-galaxy');
        navResult.current.finishTransition();
        navResult.current.navigateToSolarSystem('test-system');
        navResult.current.finishTransition();
        navResult.current.navigateToPlanet('test-planet');
        navResult.current.finishTransition();
        hoverResult.current.setHoveredObject({
          id: 'test',
          name: 'Long Moon Name That Can Wrap',
          type: 'planet',
          position: new THREE.Vector3(0, 0, 0),
        });
      });

      const { container } = render(<OverlayLabels />);

      const nameElement = container.querySelector('.overlay-label-name');
      expect(nameElement).toHaveStyle({ whiteSpace: 'normal' });
    });
  });

  describe('Scene transitions', () => {
    it('should update config when transitioning from universe to galaxy', () => {
      const { result: navResult } = renderHook(() => useNavigationStore());
      const { result: hoverResult } = renderHook(() => useHoverStore());

      act(() => {
        hoverResult.current.setHoveredObject({
          id: 'test',
          name: 'Test Object',
          type: 'galaxy',
          position: new THREE.Vector3(0, 0, 0),
        });
      });

      const { getByTestId, rerender } = render(<OverlayLabels />);

      // Initially at universe level
      let htmlComponent = getByTestId('html-component');
      expect(htmlComponent.getAttribute('data-distance-factor')).toBe(
        String(LABEL_CONFIGS.universe.distanceFactor)
      );

      // Navigate to galaxy and keep hover object
      act(() => {
        navResult.current.navigateToGalaxy('test-galaxy');
        navResult.current.finishTransition();
        // Re-set hovered object after navigation (simulating continued hover)
        hoverResult.current.setHoveredObject({
          id: 'test',
          name: 'Test Object',
          type: 'solar-system',
          position: new THREE.Vector3(0, 0, 0),
        });
      });

      rerender(<OverlayLabels />);

      // Should now use galaxy config
      htmlComponent = getByTestId('html-component');
      expect(htmlComponent.getAttribute('data-distance-factor')).toBe(
        String(LABEL_CONFIGS.galaxy.distanceFactor)
      );
    });
  });

  describe('Edge cases', () => {
    it('should not render when no object is hovered', () => {
      const { container } = render(<OverlayLabels />);

      expect(container.querySelector('.overlay-label')).not.toBeInTheDocument();
    });

    it('should not render when labels are hidden', () => {
      const { result: hoverResult } = renderHook(() => useHoverStore());

      act(() => {
        hoverResult.current.setHoveredObject({
          id: 'test',
          name: 'Test',
          type: 'galaxy',
          position: new THREE.Vector3(0, 0, 0),
        });
        hoverResult.current.setLabelsVisibility(false);
      });

      const { container } = render(<OverlayLabels />);

      expect(container.querySelector('.overlay-label')).not.toBeInTheDocument();
    });

    it('should handle invalid position gracefully', () => {
      const { result: hoverResult } = renderHook(() => useHoverStore());
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      act(() => {
        // Force invalid position through store (bypassing validation)
        hoverResult.current.setHoveredObject({
          id: 'test',
          name: 'Test',
          type: 'galaxy',
          position: { x: NaN, y: 0, z: 0 } as any,
        });
      });

      const { container } = render(<OverlayLabels />);

      expect(container.querySelector('.overlay-label')).not.toBeInTheDocument();
      
      consoleWarnSpy.mockRestore();
    });
  });
});
