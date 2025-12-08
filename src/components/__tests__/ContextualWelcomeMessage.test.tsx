/**
 * Unit tests for ContextualWelcomeMessage component
 */

import { render, screen } from '@testing-library/react';
import ContextualWelcomeMessage from '../ContextualWelcomeMessage';
import { useNavigationStore } from '@/lib/store';
import type { Galaxy } from '@/lib/universe/types';

// Mock the navigation store
jest.mock('@/lib/store', () => ({
  useNavigationStore: jest.fn(),
}));

const mockUseNavigationStore = useNavigationStore as jest.MockedFunction<typeof useNavigationStore>;

describe('ContextualWelcomeMessage', () => {
  const mockGalaxies: Galaxy[] = [
    {
      id: 'milky-way',
      name: 'Milky Way',
      description: 'Our home galaxy, a barred spiral galaxy containing hundreds of billions of stars.',
      theme: 'blue-white',
      particleColor: '#4A90E2',
      stars: [],
      solarSystems: [
        {
          id: 'sol-system',
          name: 'Sol System',
          theme: 'yellow-star',
          mainStar: {
            id: 'sol',
            name: 'Sol',
            theme: 'yellow-dwarf',
          },
          planets: [
            {
              id: 'earth',
              name: 'Earth',
              theme: 'blue-green',
              summary: 'The third planet from Sol',
              contentMarkdown: '# Earth',
              moons: [],
            },
          ],
        },
      ],
    },
    {
      id: 'andromeda',
      name: 'Andromeda',
      description: 'The nearest major galaxy to the Milky Way.',
      theme: 'purple-white',
      particleColor: '#9B59B6',
      stars: [],
      solarSystems: [],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Universe View', () => {
    it('should render default welcome message at universe level', () => {
      mockUseNavigationStore.mockReturnValue({
        focusLevel: 'universe',
        focusedGalaxyId: null,
        focusedSolarSystemId: null,
        focusedPlanetId: null,
      } as any);

      render(<ContextualWelcomeMessage galaxies={mockGalaxies} />);

      expect(screen.getByText('Welcome to the Horizon')).toBeInTheDocument();
      expect(screen.getByText('Click a galaxy to explore')).toBeInTheDocument();
    });
  });

  describe('Galaxy View', () => {
    it('should render galaxy-specific message when viewing a galaxy', () => {
      mockUseNavigationStore.mockReturnValue({
        focusLevel: 'galaxy',
        focusedGalaxyId: 'milky-way',
        focusedSolarSystemId: null,
        focusedPlanetId: null,
      } as any);

      render(<ContextualWelcomeMessage galaxies={mockGalaxies} />);

      expect(screen.getByText('Exploring Milky Way')).toBeInTheDocument();
      expect(screen.getByText('Our home galaxy, a barred spiral galaxy containing hundreds of billions of stars.')).toBeInTheDocument();
    });

    it('should render fallback description when galaxy description is missing', () => {
      const galaxiesWithoutDescription: Galaxy[] = [
        {
          ...mockGalaxies[0],
          description: '',
        },
      ];

      mockUseNavigationStore.mockReturnValue({
        focusLevel: 'galaxy',
        focusedGalaxyId: 'milky-way',
        focusedSolarSystemId: null,
        focusedPlanetId: null,
      } as any);

      render(<ContextualWelcomeMessage galaxies={galaxiesWithoutDescription} />);

      expect(screen.getByText('Exploring Milky Way')).toBeInTheDocument();
      expect(screen.getByText('A vast collection of stars and worlds')).toBeInTheDocument();
    });

    it('should handle galaxy with long name and description', () => {
      const galaxyWithLongText: Galaxy[] = [
        {
          ...mockGalaxies[0],
          name: 'The Extremely Long Named Spiral Galaxy NGC-1234567890',
          description: 'This is a very long description that contains extensive information about the galaxy, its formation, composition, and the countless celestial bodies it contains.',
        },
      ];

      mockUseNavigationStore.mockReturnValue({
        focusLevel: 'galaxy',
        focusedGalaxyId: 'milky-way',
        focusedSolarSystemId: null,
        focusedPlanetId: null,
      } as any);

      render(<ContextualWelcomeMessage galaxies={galaxyWithLongText} />);

      expect(screen.getByText('Exploring The Extremely Long Named Spiral Galaxy NGC-1234567890')).toBeInTheDocument();
    });
  });

  describe('Solar System View', () => {
    it('should render solar system-specific message', () => {
      mockUseNavigationStore.mockReturnValue({
        focusLevel: 'solar-system',
        focusedGalaxyId: 'milky-way',
        focusedSolarSystemId: 'sol-system',
        focusedPlanetId: null,
      } as any);

      render(<ContextualWelcomeMessage galaxies={mockGalaxies} />);

      expect(screen.getByText('Navigating Sol System')).toBeInTheDocument();
      expect(screen.getByText('A star system with 1 planet')).toBeInTheDocument();
    });

    it('should pluralize planets correctly when multiple planets exist', () => {
      const galaxyWithMultiplePlanets: Galaxy[] = [
        {
          ...mockGalaxies[0],
          solarSystems: [
            {
              ...mockGalaxies[0].solarSystems[0],
              planets: [
                mockGalaxies[0].solarSystems[0].planets[0],
                {
                  id: 'mars',
                  name: 'Mars',
                  theme: 'red',
                  summary: 'The red planet',
                  contentMarkdown: '# Mars',
                  moons: [],
                },
              ],
            },
          ],
        },
      ];

      mockUseNavigationStore.mockReturnValue({
        focusLevel: 'solar-system',
        focusedGalaxyId: 'milky-way',
        focusedSolarSystemId: 'sol-system',
        focusedPlanetId: null,
      } as any);

      render(<ContextualWelcomeMessage galaxies={galaxyWithMultiplePlanets} />);

      expect(screen.getByText('A star system with 2 planets')).toBeInTheDocument();
    });

    it('should handle solar system with no planets', () => {
      const galaxyWithNoPlanets: Galaxy[] = [
        {
          ...mockGalaxies[0],
          solarSystems: [
            {
              ...mockGalaxies[0].solarSystems[0],
              planets: [],
            },
          ],
        },
      ];

      mockUseNavigationStore.mockReturnValue({
        focusLevel: 'solar-system',
        focusedGalaxyId: 'milky-way',
        focusedSolarSystemId: 'sol-system',
        focusedPlanetId: null,
      } as any);

      render(<ContextualWelcomeMessage galaxies={galaxyWithNoPlanets} />);

      expect(screen.getByText('A star system with 0 planets')).toBeInTheDocument();
    });
  });

  describe('Planet View', () => {
    it('should hide welcome message when viewing a planet', () => {
      mockUseNavigationStore.mockReturnValue({
        focusLevel: 'planet',
        focusedGalaxyId: 'milky-way',
        focusedSolarSystemId: 'sol-system',
        focusedPlanetId: 'earth',
      } as any);

      const { container } = render(<ContextualWelcomeMessage galaxies={mockGalaxies} />);

      expect(container.querySelector('.welcome-message')).not.toBeInTheDocument();
    });

    it('should not render any text when viewing a planet', () => {
      mockUseNavigationStore.mockReturnValue({
        focusLevel: 'planet',
        focusedGalaxyId: 'milky-way',
        focusedSolarSystemId: 'sol-system',
        focusedPlanetId: 'earth',
      } as any);

      const { container } = render(<ContextualWelcomeMessage galaxies={mockGalaxies} />);

      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing galaxy gracefully', () => {
      mockUseNavigationStore.mockReturnValue({
        focusLevel: 'galaxy',
        focusedGalaxyId: 'non-existent-galaxy',
        focusedSolarSystemId: null,
        focusedPlanetId: null,
      } as any);

      render(<ContextualWelcomeMessage galaxies={mockGalaxies} />);

      // Should fall back to default welcome message
      expect(screen.getByText('Welcome to the Horizon')).toBeInTheDocument();
    });

    it('should handle missing solar system gracefully', () => {
      mockUseNavigationStore.mockReturnValue({
        focusLevel: 'solar-system',
        focusedGalaxyId: 'milky-way',
        focusedSolarSystemId: 'non-existent-system',
        focusedPlanetId: null,
      } as any);

      render(<ContextualWelcomeMessage galaxies={mockGalaxies} />);

      // Should fall back to default welcome message
      expect(screen.getByText('Welcome to the Horizon')).toBeInTheDocument();
    });

    it('should handle empty galaxies array', () => {
      mockUseNavigationStore.mockReturnValue({
        focusLevel: 'universe',
        focusedGalaxyId: null,
        focusedSolarSystemId: null,
        focusedPlanetId: null,
      } as any);

      render(<ContextualWelcomeMessage galaxies={[]} />);

      expect(screen.getByText('Welcome to the Horizon')).toBeInTheDocument();
    });

    it('should handle galaxy with special characters in name', () => {
      const galaxyWithSpecialChars: Galaxy[] = [
        {
          ...mockGalaxies[0],
          name: 'NGC-1234 & M31',
          description: 'Features 1,000+ stars',
        },
      ];

      mockUseNavigationStore.mockReturnValue({
        focusLevel: 'galaxy',
        focusedGalaxyId: 'milky-way',
        focusedSolarSystemId: null,
        focusedPlanetId: null,
      } as any);

      render(<ContextualWelcomeMessage galaxies={galaxyWithSpecialChars} />);

      expect(screen.getByText('Exploring NGC-1234 & M31')).toBeInTheDocument();
      expect(screen.getByText('Features 1,000+ stars')).toBeInTheDocument();
    });
  });

  describe('State Transitions', () => {
    it('should update when navigation state changes', () => {
      const { rerender } = render(<ContextualWelcomeMessage galaxies={mockGalaxies} />);

      // Start at universe level
      mockUseNavigationStore.mockReturnValue({
        focusLevel: 'universe',
        focusedGalaxyId: null,
        focusedSolarSystemId: null,
        focusedPlanetId: null,
      } as any);

      rerender(<ContextualWelcomeMessage galaxies={mockGalaxies} />);
      expect(screen.getByText('Welcome to the Horizon')).toBeInTheDocument();

      // Navigate to galaxy
      mockUseNavigationStore.mockReturnValue({
        focusLevel: 'galaxy',
        focusedGalaxyId: 'milky-way',
        focusedSolarSystemId: null,
        focusedPlanetId: null,
      } as any);

      rerender(<ContextualWelcomeMessage galaxies={mockGalaxies} />);
      expect(screen.getByText('Exploring Milky Way')).toBeInTheDocument();
    });
  });
});
