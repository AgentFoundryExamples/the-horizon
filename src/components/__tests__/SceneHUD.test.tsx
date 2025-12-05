/**
 * Unit tests for SceneHUD component - Transition Indicator
 */

import { render, screen, waitFor } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import SceneHUD from '../SceneHUD';
import { useNavigationStore } from '@/lib/store';
import type { Galaxy } from '@/lib/universe/types';

// Mock galaxy data
const mockGalaxies: Galaxy[] = [
  {
    id: 'milky-way',
    name: 'Milky Way',
    description: 'Our home galaxy',
    particleColor: '#4A90E2',
    solarSystems: [
      {
        id: 'sol-system',
        name: 'Solar System',
        description: 'Our solar system',
        position: { x: 0, y: 0, z: 0 },
        starColor: '#FFD700',
        planets: [
          {
            id: 'earth',
            name: 'Earth',
            description: 'Our home planet',
            orbitalRadius: 5,
            orbitalPeriod: 365,
            size: 1,
            color: '#4A90E2',
            content: '# Earth',
            moons: [
              {
                id: 'luna',
                name: 'Luna',
                description: 'Earth\'s moon',
                size: 0.3,
                color: '#CCCCCC',
                content: '# Luna',
              },
            ],
          },
        ],
      },
    ],
  },
];

describe('SceneHUD - Transition Indicator', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useNavigationStore());
    act(() => {
      result.current.reset();
    });
  });

  describe('Indicator Visibility', () => {
    it('should not show transition indicator when not transitioning', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      const { container } = render(<SceneHUD galaxies={mockGalaxies} />);
      
      // Indicator should not be in DOM
      const indicator = container.querySelector('.transition-indicator');
      expect(indicator).not.toBeInTheDocument();
    });

    it('should show transition indicator when transitioning', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      // Start a transition
      act(() => {
        result.current.navigateToGalaxy('milky-way');
      });
      
      const { container } = render(<SceneHUD galaxies={mockGalaxies} />);
      
      // Indicator should be visible
      const indicator = container.querySelector('.transition-indicator');
      expect(indicator).toBeInTheDocument();
    });

    it('should hide indicator after transition completes', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      // Start a transition
      act(() => {
        result.current.navigateToGalaxy('milky-way');
      });
      
      const { container, rerender } = render(<SceneHUD galaxies={mockGalaxies} />);
      
      // Indicator should be visible
      expect(container.querySelector('.transition-indicator')).toBeInTheDocument();
      
      // Complete transition
      act(() => {
        result.current.finishTransition();
      });
      
      // Re-render with updated state
      rerender(<SceneHUD galaxies={mockGalaxies} />);
      
      // Indicator should be hidden
      expect(container.querySelector('.transition-indicator')).not.toBeInTheDocument();
    });
  });

  describe('Themed Messages', () => {
    it('should show "Warping to galaxy..." when navigating to galaxy', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      act(() => {
        result.current.navigateToGalaxy('milky-way');
      });
      
      render(<SceneHUD galaxies={mockGalaxies} />);
      
      expect(screen.getByText('Warping to galaxy...')).toBeInTheDocument();
    });

    it('should show "Traveling to system..." when navigating to solar system', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      act(() => {
        result.current.navigateToGalaxy('milky-way');
        result.current.finishTransition();
        result.current.navigateToSolarSystem('sol-system');
      });
      
      render(<SceneHUD galaxies={mockGalaxies} />);
      
      expect(screen.getByText('Traveling to system...')).toBeInTheDocument();
    });

    it('should show "Landing on surface..." when navigating to planet', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      act(() => {
        result.current.navigateToGalaxy('milky-way');
        result.current.finishTransition();
        result.current.navigateToSolarSystem('sol-system');
        result.current.finishTransition();
        result.current.navigateToPlanet('earth');
      });
      
      render(<SceneHUD galaxies={mockGalaxies} />);
      
      expect(screen.getByText('Landing on surface...')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA role and attributes', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      act(() => {
        result.current.navigateToGalaxy('milky-way');
      });
      
      const { container } = render(<SceneHUD galaxies={mockGalaxies} />);
      const indicator = container.querySelector('.transition-indicator');
      
      expect(indicator).toHaveAttribute('role', 'status');
      expect(indicator).toHaveAttribute('aria-live', 'polite');
      expect(indicator).toHaveAttribute('aria-atomic', 'true');
    });

    it('should have spinner marked as aria-hidden', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      act(() => {
        result.current.navigateToGalaxy('milky-way');
      });
      
      const { container } = render(<SceneHUD galaxies={mockGalaxies} />);
      const spinner = container.querySelector('.transition-indicator-spinner');
      
      expect(spinner).toHaveAttribute('aria-hidden', 'true');
    });

    it('should not trap focus (pointer-events: none)', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      act(() => {
        result.current.navigateToGalaxy('milky-way');
      });
      
      const { container } = render(<SceneHUD galaxies={mockGalaxies} />);
      const indicator = container.querySelector('.transition-indicator');
      
      expect(indicator).toHaveStyle({ pointerEvents: 'none' });
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid consecutive transitions', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      // Trigger multiple rapid transitions
      act(() => {
        result.current.navigateToGalaxy('milky-way');
        result.current.navigateToGalaxy('andromeda');
        result.current.navigateToSolarSystem('sol-system');
      });
      
      const { container } = render(<SceneHUD galaxies={mockGalaxies} />);
      
      // Should show indicator (transitions queued)
      expect(container.querySelector('.transition-indicator')).toBeInTheDocument();
      expect(result.current.transitionQueue.length).toBeGreaterThan(0);
    });

    it('should not show indicator on initial server render', () => {
      // Initial state has isTransitioning: false
      const { container } = render(<SceneHUD galaxies={mockGalaxies} />);
      
      expect(container.querySelector('.transition-indicator')).not.toBeInTheDocument();
    });

    it('should handle transition with no active galaxy', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      act(() => {
        result.current.setTransitioning(true);
      });
      
      // Should render without crashing even with no specific destination
      const { container } = render(<SceneHUD galaxies={mockGalaxies} />);
      
      expect(container.querySelector('.transition-indicator')).toBeInTheDocument();
      expect(screen.getByText('Traveling...')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should be centered on screen', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      act(() => {
        result.current.navigateToGalaxy('milky-way');
      });
      
      const { container } = render(<SceneHUD galaxies={mockGalaxies} />);
      const indicator = container.querySelector('.transition-indicator');
      
      expect(indicator).toHaveStyle({
        position: 'fixed',
        top: '50%',
        left: '50%',
      });
    });

    it('should have high z-index to appear above other elements', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      act(() => {
        result.current.navigateToGalaxy('milky-way');
      });
      
      const { container } = render(<SceneHUD galaxies={mockGalaxies} />);
      const indicator = container.querySelector('.transition-indicator');
      
      expect(indicator).toHaveStyle({ zIndex: '1000' });
    });

    it('should have backdrop blur for visual depth', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      act(() => {
        result.current.navigateToGalaxy('milky-way');
      });
      
      const { container } = render(<SceneHUD galaxies={mockGalaxies} />);
      const indicator = container.querySelector('.transition-indicator') as HTMLElement;
      
      // Check inline style directly since toHaveStyle doesn't support all CSS properties
      expect(indicator.style.backdropFilter).toBe('blur(8px)');
    });
  });

  describe('Back Button Interaction', () => {
    it('should disable back button during transition', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      act(() => {
        result.current.navigateToGalaxy('milky-way');
      });
      
      render(<SceneHUD galaxies={mockGalaxies} />);
      
      const backButton = screen.getByText('← Back');
      expect(backButton).toBeDisabled();
    });

    it('should enable back button after transition completes', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      act(() => {
        result.current.navigateToGalaxy('milky-way');
        result.current.finishTransition();
      });
      
      render(<SceneHUD galaxies={mockGalaxies} />);
      
      const backButton = screen.getByText('← Back');
      expect(backButton).not.toBeDisabled();
    });
  });
});
