/**
 * Unit tests for SceneHUD component - Transition Indicator and Breadcrumb Navigation
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import SceneHUD from '../SceneHUD';
import { useNavigationStore } from '@/lib/store';
import { useHoverStore } from '@/lib/hover-store';
import type { Galaxy } from '@/lib/universe/types';

// Mock galaxy data
const mockGalaxies: Galaxy[] = [
  {
    id: 'milky-way',
    name: 'Milky Way',
    description: 'Our home galaxy',
    theme: 'blue-white',
    particleColor: '#4A90E2',
    stars: [],
    solarSystems: [
      {
        id: 'sol-system',
        name: 'Solar System',
        theme: 'yellow-star',
        mainStar: {
          id: 'sol',
          name: 'Sol',
          theme: 'yellow-dwarf'
        },
        planets: [
          {
            id: 'earth',
            name: 'Earth',
            theme: 'blue-green',
            summary: 'Our home planet',
            contentMarkdown: '# Earth\n\nOur home planet',
            moons: [
              {
                id: 'luna',
                name: 'Luna',
                contentMarkdown: '# Luna\n\nEarth\'s moon',
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

  describe('Breadcrumb Navigation', () => {
    beforeEach(() => {
      // Reset stores before each test
      const navStore = renderHook(() => useNavigationStore());
      const hoverStore = renderHook(() => useHoverStore());
      act(() => {
        navStore.result.current.reset();
        hoverStore.result.current.clearHover();
      });
    });

    describe('Universe Breadcrumb', () => {
      it('should render Universe as a button', () => {
        render(<SceneHUD galaxies={mockGalaxies} />);
        
        const universeButton = screen.getByRole('button', { name: /navigate to universe/i });
        expect(universeButton).toBeInTheDocument();
      });

      it('should be disabled when at universe level', () => {
        render(<SceneHUD galaxies={mockGalaxies} />);
        
        const universeButton = screen.getByRole('button', { name: /navigate to universe/i });
        expect(universeButton).toBeDisabled();
      });

      it('should have aria-current when at universe level', () => {
        render(<SceneHUD galaxies={mockGalaxies} />);
        
        const universeButton = screen.getByRole('button', { name: /navigate to universe/i });
        expect(universeButton).toHaveAttribute('aria-current', 'page');
      });

      it('should navigate to universe when clicked from galaxy level', () => {
        const { result } = renderHook(() => useNavigationStore());
        
        // Navigate to galaxy first
        act(() => {
          result.current.navigateToGalaxy('milky-way');
          result.current.finishTransition();
        });
        
        render(<SceneHUD galaxies={mockGalaxies} />);
        
        const universeButton = screen.getByRole('button', { name: /navigate to universe/i });
        expect(universeButton).not.toBeDisabled();
        
        act(() => {
          fireEvent.click(universeButton);
        });
        
        expect(result.current.focusLevel).toBe('universe');
        expect(result.current.isTransitioning).toBe(true);
      });

      it('should support keyboard navigation with Enter key', () => {
        const { result } = renderHook(() => useNavigationStore());
        
        // Navigate to galaxy first
        act(() => {
          result.current.navigateToGalaxy('milky-way');
          result.current.finishTransition();
        });
        
        render(<SceneHUD galaxies={mockGalaxies} />);
        
        const universeButton = screen.getByRole('button', { name: /navigate to universe/i });
        
        act(() => {
          fireEvent.keyDown(universeButton, { key: 'Enter', code: 'Enter' });
        });
        
        expect(result.current.focusLevel).toBe('universe');
        expect(result.current.isTransitioning).toBe(true);
      });

      it('should support keyboard navigation with Space key', () => {
        const { result } = renderHook(() => useNavigationStore());
        
        // Navigate to galaxy first
        act(() => {
          result.current.navigateToGalaxy('milky-way');
          result.current.finishTransition();
        });
        
        render(<SceneHUD galaxies={mockGalaxies} />);
        
        const universeButton = screen.getByRole('button', { name: /navigate to universe/i });
        
        act(() => {
          fireEvent.keyDown(universeButton, { key: ' ', code: 'Space' });
        });
        
        expect(result.current.focusLevel).toBe('universe');
        expect(result.current.isTransitioning).toBe(true);
      });

      it('should be disabled during transitions', () => {
        const { result } = renderHook(() => useNavigationStore());
        
        act(() => {
          result.current.navigateToGalaxy('milky-way');
          // Don't finish transition
        });
        
        render(<SceneHUD galaxies={mockGalaxies} />);
        
        const universeButton = screen.getByRole('button', { name: /navigate to universe/i });
        expect(universeButton).toBeDisabled();
      });
    });

    describe('Galaxy Breadcrumb', () => {
      it('should render galaxy name as a button when at solar system level', () => {
        const { result } = renderHook(() => useNavigationStore());
        
        act(() => {
          result.current.navigateToGalaxy('milky-way');
          result.current.finishTransition();
          result.current.navigateToSolarSystem('sol-system');
          result.current.finishTransition();
        });
        
        render(<SceneHUD galaxies={mockGalaxies} />);
        
        const galaxyButton = screen.getByRole('button', { name: /navigate to milky way/i });
        expect(galaxyButton).toBeInTheDocument();
        expect(galaxyButton).toHaveTextContent('Milky Way');
      });

      it('should be disabled when at galaxy level', () => {
        const { result } = renderHook(() => useNavigationStore());
        
        act(() => {
          result.current.navigateToGalaxy('milky-way');
          result.current.finishTransition();
        });
        
        render(<SceneHUD galaxies={mockGalaxies} />);
        
        const galaxyButton = screen.getByRole('button', { name: /navigate to milky way/i });
        expect(galaxyButton).toBeDisabled();
      });

      it('should have aria-current when at galaxy level', () => {
        const { result } = renderHook(() => useNavigationStore());
        
        act(() => {
          result.current.navigateToGalaxy('milky-way');
          result.current.finishTransition();
        });
        
        render(<SceneHUD galaxies={mockGalaxies} />);
        
        const galaxyButton = screen.getByRole('button', { name: /navigate to milky way/i });
        expect(galaxyButton).toHaveAttribute('aria-current', 'page');
      });

      it('should navigate to galaxy when clicked from solar system level', () => {
        const { result } = renderHook(() => useNavigationStore());
        
        act(() => {
          result.current.navigateToGalaxy('milky-way');
          result.current.finishTransition();
          result.current.navigateToSolarSystem('sol-system');
          result.current.finishTransition();
        });
        
        render(<SceneHUD galaxies={mockGalaxies} />);
        
        const galaxyButton = screen.getByRole('button', { name: /navigate to milky way/i });
        expect(galaxyButton).not.toBeDisabled();
        
        act(() => {
          fireEvent.click(galaxyButton);
        });
        
        expect(result.current.focusLevel).toBe('galaxy');
        expect(result.current.focusedGalaxyId).toBe('milky-way');
        expect(result.current.isTransitioning).toBe(true);
      });

      it('should support keyboard navigation', () => {
        const { result } = renderHook(() => useNavigationStore());
        
        act(() => {
          result.current.navigateToGalaxy('milky-way');
          result.current.finishTransition();
          result.current.navigateToSolarSystem('sol-system');
          result.current.finishTransition();
        });
        
        render(<SceneHUD galaxies={mockGalaxies} />);
        
        const galaxyButton = screen.getByRole('button', { name: /navigate to milky way/i });
        
        act(() => {
          fireEvent.keyDown(galaxyButton, { key: 'Enter', code: 'Enter' });
        });
        
        expect(result.current.focusLevel).toBe('galaxy');
        expect(result.current.isTransitioning).toBe(true);
      });
    });

    describe('Solar System Breadcrumb', () => {
      it('should render solar system name as a button when at planet level', () => {
        const { result } = renderHook(() => useNavigationStore());
        
        act(() => {
          result.current.navigateToGalaxy('milky-way');
          result.current.finishTransition();
          result.current.navigateToSolarSystem('sol-system');
          result.current.finishTransition();
          result.current.navigateToPlanet('earth');
          result.current.finishTransition();
        });
        
        render(<SceneHUD galaxies={mockGalaxies} />);
        
        const systemButton = screen.getByRole('button', { name: /navigate to solar system/i });
        expect(systemButton).toBeInTheDocument();
        expect(systemButton).toHaveTextContent('Solar System');
      });

      it('should be disabled when at solar system level', () => {
        const { result } = renderHook(() => useNavigationStore());
        
        act(() => {
          result.current.navigateToGalaxy('milky-way');
          result.current.finishTransition();
          result.current.navigateToSolarSystem('sol-system');
          result.current.finishTransition();
        });
        
        render(<SceneHUD galaxies={mockGalaxies} />);
        
        const systemButton = screen.getByRole('button', { name: /navigate to solar system/i });
        expect(systemButton).toBeDisabled();
      });

      it('should navigate to solar system when clicked from planet level', () => {
        const { result } = renderHook(() => useNavigationStore());
        
        act(() => {
          result.current.navigateToGalaxy('milky-way');
          result.current.finishTransition();
          result.current.navigateToSolarSystem('sol-system');
          result.current.finishTransition();
          result.current.navigateToPlanet('earth');
          result.current.finishTransition();
        });
        
        render(<SceneHUD galaxies={mockGalaxies} />);
        
        const systemButton = screen.getByRole('button', { name: /navigate to solar system/i });
        expect(systemButton).not.toBeDisabled();
        
        act(() => {
          fireEvent.click(systemButton);
        });
        
        expect(result.current.focusLevel).toBe('solar-system');
        expect(result.current.focusedSolarSystemId).toBe('sol-system');
        expect(result.current.isTransitioning).toBe(true);
      });
    });

    describe('Planet Breadcrumb', () => {
      it('should render planet name as plain text (not clickable)', () => {
        const { result } = renderHook(() => useNavigationStore());
        
        act(() => {
          result.current.navigateToGalaxy('milky-way');
          result.current.finishTransition();
          result.current.navigateToSolarSystem('sol-system');
          result.current.finishTransition();
          result.current.navigateToPlanet('earth');
          result.current.finishTransition();
        });
        
        const { container } = render(<SceneHUD galaxies={mockGalaxies} />);
        
        // Should not find a button with planet name
        const planetButtons = screen.queryAllByRole('button').filter(btn => 
          btn.textContent?.includes('Earth')
        );
        expect(planetButtons).toHaveLength(0);
        
        // Should find planet name as text
        expect(container.textContent).toContain('Earth');
      });

      it('should have aria-current on planet text', () => {
        const { result } = renderHook(() => useNavigationStore());
        
        act(() => {
          result.current.navigateToGalaxy('milky-way');
          result.current.finishTransition();
          result.current.navigateToSolarSystem('sol-system');
          result.current.finishTransition();
          result.current.navigateToPlanet('earth');
          result.current.finishTransition();
        });
        
        const { container } = render(<SceneHUD galaxies={mockGalaxies} />);
        
        // Find the span with aria-current
        const planetSpan = container.querySelector('[aria-current="page"]');
        expect(planetSpan).toBeInTheDocument();
        expect(planetSpan).toHaveTextContent('Earth');
      });
    });

    describe('No-op Behavior', () => {
      it('should not re-navigate when clicking active universe breadcrumb', () => {
        const { result } = renderHook(() => useNavigationStore());
        
        render(<SceneHUD galaxies={mockGalaxies} />);
        
        const universeButton = screen.getByRole('button', { name: /navigate to universe/i });
        
        const initialTransitionState = result.current.isTransitioning;
        
        act(() => {
          fireEvent.click(universeButton);
        });
        
        // Should remain at universe level without transitioning
        expect(result.current.focusLevel).toBe('universe');
        expect(result.current.isTransitioning).toBe(initialTransitionState);
      });

      it('should not re-navigate when clicking active galaxy breadcrumb', () => {
        const { result } = renderHook(() => useNavigationStore());
        
        act(() => {
          result.current.navigateToGalaxy('milky-way');
          result.current.finishTransition();
        });
        
        render(<SceneHUD galaxies={mockGalaxies} />);
        
        const galaxyButton = screen.getByRole('button', { name: /navigate to milky way/i });
        
        act(() => {
          fireEvent.click(galaxyButton);
        });
        
        // Should not start a new transition
        expect(result.current.isTransitioning).toBe(false);
      });
    });

    describe('Hover State Cleanup', () => {
      it('should clear hover state when navigating via breadcrumb', () => {
        const { result: navResult } = renderHook(() => useNavigationStore());
        const { result: hoverResult } = renderHook(() => useHoverStore());
        
        // Set up initial state with hover
        act(() => {
          navResult.current.navigateToGalaxy('milky-way');
          navResult.current.finishTransition();
          hoverResult.current.setHoveredObject({
            id: 'test',
            name: 'Test Object',
            type: 'galaxy',
            position: { x: 0, y: 0, z: 0 } as any,
          });
        });
        
        expect(hoverResult.current.hoveredObject).not.toBeNull();
        
        render(<SceneHUD galaxies={mockGalaxies} />);
        
        const universeButton = screen.getByRole('button', { name: /navigate to universe/i });
        
        act(() => {
          fireEvent.click(universeButton);
        });
        
        // Hover state should be cleared
        expect(hoverResult.current.hoveredObject).toBeNull();
      });
    });

    describe('Rapid Click Queueing', () => {
      it('should queue multiple rapid breadcrumb clicks via store', () => {
        const { result } = renderHook(() => useNavigationStore());
        
        // Start at planet level
        act(() => {
          result.current.navigateToGalaxy('milky-way');
          result.current.finishTransition();
          result.current.navigateToSolarSystem('sol-system');
          result.current.finishTransition();
          result.current.navigateToPlanet('earth');
          result.current.finishTransition();
        });
        
        // Trigger rapid navigation via store (simulating quick clicks)
        act(() => {
          result.current.navigateToSolarSystem('sol-system');
          // Try to navigate again while transitioning
          result.current.navigateToGalaxy('milky-way');
        });
        
        // Second navigation should be queued since first is in progress
        expect(result.current.isTransitioning).toBe(true);
        expect(result.current.transitionQueue.length).toBeGreaterThan(0);
      });

      it('should disable breadcrumb buttons during transitions', () => {
        const { result } = renderHook(() => useNavigationStore());
        
        act(() => {
          result.current.navigateToGalaxy('milky-way');
          result.current.finishTransition();
          result.current.navigateToSolarSystem('sol-system');
          result.current.finishTransition();
          result.current.navigateToPlanet('earth');
          result.current.finishTransition();
        });
        
        render(<SceneHUD galaxies={mockGalaxies} />);
        
        // Start a transition
        act(() => {
          result.current.navigateToSolarSystem('sol-system');
        });
        
        // All breadcrumb buttons should be disabled during transition
        const universeButton = screen.getByRole('button', { name: /navigate to universe/i });
        const galaxyButton = screen.getByRole('button', { name: /navigate to milky way/i });
        const systemButton = screen.getByRole('button', { name: /navigate to solar system/i });
        
        expect(universeButton).toBeDisabled();
        expect(galaxyButton).toBeDisabled();
        expect(systemButton).toBeDisabled();
      });
    });

    describe('Accessibility', () => {
      it('should have proper ARIA labels for all breadcrumb buttons', () => {
        const { result } = renderHook(() => useNavigationStore());
        
        act(() => {
          result.current.navigateToGalaxy('milky-way');
          result.current.finishTransition();
          result.current.navigateToSolarSystem('sol-system');
          result.current.finishTransition();
          result.current.navigateToPlanet('earth');
          result.current.finishTransition();
        });
        
        render(<SceneHUD galaxies={mockGalaxies} />);
        
        expect(screen.getByRole('button', { name: /navigate to universe/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /navigate to milky way/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /navigate to solar system/i })).toBeInTheDocument();
      });

      it('should indicate current page with aria-current', () => {
        const { result } = renderHook(() => useNavigationStore());
        
        act(() => {
          result.current.navigateToGalaxy('milky-way');
          result.current.finishTransition();
        });
        
        render(<SceneHUD galaxies={mockGalaxies} />);
        
        const galaxyButton = screen.getByRole('button', { name: /navigate to milky way/i });
        expect(galaxyButton).toHaveAttribute('aria-current', 'page');
      });
    });
  });
});
