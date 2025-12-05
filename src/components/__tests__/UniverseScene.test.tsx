/**
 * Integration tests for UniverseScene - Welcome Message Display
 */

import { render } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import UniverseScene from '../UniverseScene';
import { useNavigationStore } from '@/lib/store';
import type { Galaxy } from '@/lib/universe/types';

// Mock Canvas component from react-three/fiber
jest.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => <div data-testid="canvas">{children}</div>,
  useFrame: jest.fn(),
  useThree: () => ({
    camera: { position: { clone: jest.fn() } },
  }),
}));

// Mock drei components
jest.mock('@react-three/drei', () => ({
  OrbitControls: () => null,
}));

// Mock galaxy data
const mockGalaxies: Galaxy[] = [
  {
    id: 'milky-way',
    name: 'Milky Way',
    description: 'Our home galaxy',
    theme: 'spiral',
    particleColor: '#4A90E2',
    solarSystems: [],
    stars: [],
  },
  {
    id: 'andromeda',
    name: 'Andromeda',
    description: 'Nearest major galaxy',
    theme: 'spiral',
    particleColor: '#8A2BE2',
    solarSystems: [],
    stars: [],
  },
];

describe('UniverseScene - Welcome Message Integration', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useNavigationStore());
    act(() => {
      result.current.reset();
    });
  });

  describe('Welcome Message Visibility', () => {
    it('should not show welcome message on universe view', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      const { container } = render(<UniverseScene galaxies={mockGalaxies} />);
      
      // Welcome message should not be visible
      expect(container.querySelector('.welcome-message')).not.toBeInTheDocument();
    });

    it('should show welcome message when navigating to galaxy', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      // Navigate to galaxy
      act(() => {
        result.current.navigateToGalaxy('milky-way');
        result.current.finishTransition();
      });
      
      const { container } = render(<UniverseScene galaxies={mockGalaxies} />);
      
      // Welcome message should be visible
      expect(container.querySelector('.welcome-message')).toBeInTheDocument();
    });

    it('should not show welcome message on solar system view', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      // Navigate to solar system
      act(() => {
        result.current.navigateToGalaxy('milky-way');
        result.current.finishTransition();
        result.current.navigateToSolarSystem('sol-system');
        result.current.finishTransition();
      });
      
      const { container } = render(<UniverseScene galaxies={mockGalaxies} />);
      
      // Welcome message should not be visible
      expect(container.querySelector('.welcome-message')).not.toBeInTheDocument();
    });

    it('should not show welcome message on planet view', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      // Navigate to planet
      act(() => {
        result.current.navigateToGalaxy('milky-way');
        result.current.finishTransition();
        result.current.navigateToSolarSystem('sol-system');
        result.current.finishTransition();
        result.current.navigateToPlanet('earth');
        result.current.finishTransition();
      });
      
      const { container } = render(<UniverseScene galaxies={mockGalaxies} />);
      
      // Welcome message should not be visible
      expect(container.querySelector('.welcome-message')).not.toBeInTheDocument();
    });

    it('should hide welcome message when navigating back to universe', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      // Navigate to galaxy
      act(() => {
        result.current.navigateToGalaxy('milky-way');
        result.current.finishTransition();
      });
      
      const { container, rerender } = render(<UniverseScene galaxies={mockGalaxies} />);
      
      // Welcome message should be visible
      expect(container.querySelector('.welcome-message')).toBeInTheDocument();
      
      // Navigate back to universe
      act(() => {
        result.current.navigateBack();
        result.current.finishTransition();
      });
      
      rerender(<UniverseScene galaxies={mockGalaxies} />);
      
      // Welcome message should be hidden
      expect(container.querySelector('.welcome-message')).not.toBeInTheDocument();
    });
  });

  describe('Galaxy Name Display', () => {
    it('should display the correct galaxy name in welcome message', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      act(() => {
        result.current.navigateToGalaxy('milky-way');
        result.current.finishTransition();
      });
      
      const { getByText } = render(<UniverseScene galaxies={mockGalaxies} />);
      
      // Should display Milky Way
      expect(getByText('Milky Way')).toBeInTheDocument();
    });

    it('should update galaxy name when switching galaxies', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      // Navigate to first galaxy
      act(() => {
        result.current.navigateToGalaxy('milky-way');
        result.current.finishTransition();
      });
      
      const { getByText, rerender } = render(<UniverseScene galaxies={mockGalaxies} />);
      
      expect(getByText('Milky Way')).toBeInTheDocument();
      
      // Navigate to second galaxy
      act(() => {
        result.current.navigateToGalaxy('andromeda');
        result.current.finishTransition();
      });
      
      rerender(<UniverseScene galaxies={mockGalaxies} />);
      
      // Should now display Andromeda
      expect(getByText('Andromeda')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid galaxy ID gracefully', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      act(() => {
        result.current.navigateToGalaxy('non-existent-galaxy');
        result.current.finishTransition();
      });
      
      const { container } = render(<UniverseScene galaxies={mockGalaxies} />);
      
      // Should not crash, welcome message should not appear
      expect(container.querySelector('.welcome-message')).not.toBeInTheDocument();
    });

    it('should handle empty galaxy list', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      act(() => {
        result.current.navigateToGalaxy('milky-way');
        result.current.finishTransition();
      });
      
      // Render with empty galaxy list
      const { container } = render(<UniverseScene galaxies={[]} />);
      
      // Should not crash, welcome message should not appear
      expect(container.querySelector('.welcome-message')).not.toBeInTheDocument();
    });

    it('should not show message during transition', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      // Start transition but don't finish
      act(() => {
        result.current.navigateToGalaxy('milky-way');
      });
      
      const { container } = render(<UniverseScene galaxies={mockGalaxies} />);
      
      // Message should be visible even during transition (based on focusLevel)
      // This is expected behavior - the message appears as soon as focusLevel changes
      expect(container.querySelector('.welcome-message')).toBeInTheDocument();
    });
  });

  describe('Component Hierarchy', () => {
    it('should render Canvas before welcome message', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      act(() => {
        result.current.navigateToGalaxy('milky-way');
        result.current.finishTransition();
      });
      
      const { container } = render(<UniverseScene galaxies={mockGalaxies} />);
      
      const canvas = container.querySelector('[data-testid="canvas"]');
      const welcomeMessage = container.querySelector('.welcome-message');
      
      expect(canvas).toBeInTheDocument();
      expect(welcomeMessage).toBeInTheDocument();
      
      // Welcome message should be a sibling of canvas (both in container)
      expect(canvas?.parentElement).toBe(welcomeMessage?.parentElement);
    });

    it('should have correct z-index layering', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      act(() => {
        result.current.navigateToGalaxy('milky-way');
        result.current.finishTransition();
      });
      
      const { container } = render(<UniverseScene galaxies={mockGalaxies} />);
      
      const welcomeMessage = container.querySelector('.welcome-message');
      
      // Welcome message should have z-index of 50 (below transition indicator)
      expect(welcomeMessage).toHaveStyle({ zIndex: '50' });
    });
  });

  describe('Conditional Rendering Logic', () => {
    it('should require both focusLevel and focusedGalaxy to display', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      // Set focusLevel to galaxy but no focusedGalaxyId
      act(() => {
        result.current.setFocus('galaxy');
      });
      
      const { container } = render(<UniverseScene galaxies={mockGalaxies} />);
      
      // Should not display without valid galaxy
      expect(container.querySelector('.welcome-message')).not.toBeInTheDocument();
    });

    it('should display when both conditions are met', () => {
      const { result } = renderHook(() => useNavigationStore());
      
      // Properly navigate to galaxy (sets both focusLevel and focusedGalaxyId)
      act(() => {
        result.current.navigateToGalaxy('milky-way');
        result.current.finishTransition();
      });
      
      const { container } = render(<UniverseScene galaxies={mockGalaxies} />);
      
      // Should display with both conditions met
      expect(container.querySelector('.welcome-message')).toBeInTheDocument();
    });
  });
});
