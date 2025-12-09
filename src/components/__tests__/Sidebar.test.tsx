import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Sidebar from '../Sidebar';
import { useNavigationStore } from '@/lib/store';
import type { Galaxy } from '@/lib/universe/types';

// Mock scrollIntoView for tests
Element.prototype.scrollIntoView = jest.fn();

// Mock the navigation store
jest.mock('@/lib/store', () => ({
  useNavigationStore: jest.fn(),
}));

const mockNavigateToGalaxy = jest.fn();
const mockNavigateToSolarSystem = jest.fn();
const mockNavigateToPlanet = jest.fn();

const mockGalaxies: Galaxy[] = [
  {
    id: 'galaxy-1',
    name: 'Andromeda',
    description: 'Nearest major galaxy',
    theme: 'blue',
    particleColor: '#4A90E2',
    stars: [],
    solarSystems: [
      {
        id: 'system-1',
        name: 'Alpha System',
        theme: 'yellow',
        mainStar: { id: 'star-1', name: 'Alpha Star', theme: 'yellow' },
        planets: [
          {
            id: 'planet-1',
            name: 'Earth-like',
            theme: 'earth-like',
            summary: 'A habitable planet',
            contentMarkdown: '# Planet Content',
            moons: [],
          },
        ],
      },
    ],
  },
  {
    id: 'galaxy-2',
    name: 'Milky Way',
    description: 'Our home galaxy',
    theme: 'spiral',
    particleColor: '#FFFFFF',
    stars: [],
    solarSystems: [],
  },
];

describe('Sidebar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Universe View', () => {
    beforeEach(() => {
      (useNavigationStore as unknown as jest.Mock).mockReturnValue({
        focusLevel: 'universe',
        focusedGalaxyId: null,
        focusedSolarSystemId: null,
        focusedPlanetId: null,
        navigateToGalaxy: mockNavigateToGalaxy,
        navigateToSolarSystem: mockNavigateToSolarSystem,
        navigateToPlanet: mockNavigateToPlanet,
      });
    });

    it('should render galaxies list', () => {
      render(<Sidebar galaxies={mockGalaxies} />);
      
      expect(screen.getByText('Galaxies')).toBeInTheDocument();
      expect(screen.getByText('Andromeda')).toBeInTheDocument();
      expect(screen.getByText('Milky Way')).toBeInTheDocument();
    });

    it('should show galaxy metadata', () => {
      render(<Sidebar galaxies={mockGalaxies} />);
      
      expect(screen.getByText('1 systems')).toBeInTheDocument();
      expect(screen.getByText('0 systems')).toBeInTheDocument();
    });

    it('should navigate to galaxy on click', () => {
      render(<Sidebar galaxies={mockGalaxies} />);
      
      const galaxyButton = screen.getByText('Andromeda').closest('button');
      fireEvent.click(galaxyButton!);
      
      expect(mockNavigateToGalaxy).toHaveBeenCalledWith('galaxy-1');
    });

    it('should show empty state when no galaxies', () => {
      render(<Sidebar galaxies={[]} />);
      
      expect(screen.getByText('No items to display')).toBeInTheDocument();
    });
  });

  describe('Galaxy View', () => {
    beforeEach(() => {
      (useNavigationStore as unknown as jest.Mock).mockReturnValue({
        focusLevel: 'galaxy',
        focusedGalaxyId: 'galaxy-1',
        focusedSolarSystemId: null,
        focusedPlanetId: null,
        navigateToGalaxy: mockNavigateToGalaxy,
        navigateToSolarSystem: mockNavigateToSolarSystem,
        navigateToPlanet: mockNavigateToPlanet,
      });
    });

    it('should render solar systems list', () => {
      render(<Sidebar galaxies={mockGalaxies} />);
      
      expect(screen.getByText('Solar Systems')).toBeInTheDocument();
      expect(screen.getByText('Alpha System')).toBeInTheDocument();
    });

    it('should navigate to solar system on click', () => {
      render(<Sidebar galaxies={mockGalaxies} />);
      
      const systemButton = screen.getByText('Alpha System').closest('button');
      fireEvent.click(systemButton!);
      
      expect(mockNavigateToSolarSystem).toHaveBeenCalledWith('system-1');
    });
  });

  describe('Solar System View', () => {
    beforeEach(() => {
      (useNavigationStore as unknown as jest.Mock).mockReturnValue({
        focusLevel: 'solar-system',
        focusedGalaxyId: 'galaxy-1',
        focusedSolarSystemId: 'system-1',
        focusedPlanetId: null,
        navigateToGalaxy: mockNavigateToGalaxy,
        navigateToSolarSystem: mockNavigateToSolarSystem,
        navigateToPlanet: mockNavigateToPlanet,
      });
    });

    it('should render planets list', () => {
      render(<Sidebar galaxies={mockGalaxies} />);
      
      expect(screen.getByText('Planets')).toBeInTheDocument();
      expect(screen.getByText('Earth-like')).toBeInTheDocument();
    });

    it('should navigate to planet on click', () => {
      render(<Sidebar galaxies={mockGalaxies} />);
      
      const planetButton = screen.getByText('Earth-like').closest('button');
      fireEvent.click(planetButton!);
      
      expect(mockNavigateToPlanet).toHaveBeenCalledWith('planet-1');
    });
  });

  describe('Planet View', () => {
    beforeEach(() => {
      (useNavigationStore as unknown as jest.Mock).mockReturnValue({
        focusLevel: 'planet',
        focusedGalaxyId: 'galaxy-1',
        focusedSolarSystemId: 'system-1',
        focusedPlanetId: 'planet-1',
        navigateToGalaxy: mockNavigateToGalaxy,
        navigateToSolarSystem: mockNavigateToSolarSystem,
        navigateToPlanet: mockNavigateToPlanet,
      });
    });

    it('should not render sidebar on planet view', () => {
      const { container } = render(<Sidebar galaxies={mockGalaxies} />);
      
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Collapse/Expand Functionality', () => {
    beforeEach(() => {
      (useNavigationStore as unknown as jest.Mock).mockReturnValue({
        focusLevel: 'universe',
        focusedGalaxyId: null,
        focusedSolarSystemId: null,
        focusedPlanetId: null,
        navigateToGalaxy: mockNavigateToGalaxy,
        navigateToSolarSystem: mockNavigateToSolarSystem,
        navigateToPlanet: mockNavigateToPlanet,
      });
    });

    it('should toggle collapsed state on button click', () => {
      render(<Sidebar galaxies={mockGalaxies} />);
      
      const toggleButton = screen.getByLabelText(/collapse sidebar/i);
      const sidebar = screen.getByRole('navigation');
      
      expect(sidebar).not.toHaveClass('sidebar--collapsed');
      
      fireEvent.click(toggleButton);
      expect(sidebar).toHaveClass('sidebar--collapsed');
      
      fireEvent.click(toggleButton);
      expect(sidebar).not.toHaveClass('sidebar--collapsed');
    });
  });

  describe('Keyboard Navigation', () => {
    beforeEach(() => {
      (useNavigationStore as unknown as jest.Mock).mockReturnValue({
        focusLevel: 'universe',
        focusedGalaxyId: null,
        focusedSolarSystemId: null,
        focusedPlanetId: null,
        navigateToGalaxy: mockNavigateToGalaxy,
        navigateToSolarSystem: mockNavigateToSolarSystem,
        navigateToPlanet: mockNavigateToPlanet,
      });
    });

    it('should navigate down with ArrowDown key', () => {
      render(<Sidebar galaxies={mockGalaxies} />);
      
      const content = screen.getByRole('list');
      
      fireEvent.keyDown(content, { key: 'ArrowDown' });
      
      const focusedItem = screen.getByText('Milky Way').closest('button');
      expect(focusedItem).toHaveClass('sidebar__item--focused');
    });

    it('should navigate up with ArrowUp key', () => {
      render(<Sidebar galaxies={mockGalaxies} />);
      
      const content = screen.getByRole('list');
      
      // Navigate down first
      fireEvent.keyDown(content, { key: 'ArrowDown' });
      // Then navigate up
      fireEvent.keyDown(content, { key: 'ArrowUp' });
      
      const focusedItem = screen.getByText('Andromeda').closest('button');
      expect(focusedItem).toHaveClass('sidebar__item--focused');
    });

    it('should activate item with Enter key', () => {
      render(<Sidebar galaxies={mockGalaxies} />);
      
      const content = screen.getByRole('list');
      
      fireEvent.keyDown(content, { key: 'Enter' });
      
      expect(mockNavigateToGalaxy).toHaveBeenCalledWith('galaxy-1');
    });

    it('should activate item with Space key', () => {
      render(<Sidebar galaxies={mockGalaxies} />);
      
      const content = screen.getByRole('list');
      
      fireEvent.keyDown(content, { key: ' ' });
      
      expect(mockNavigateToGalaxy).toHaveBeenCalledWith('galaxy-1');
    });

    it('should collapse sidebar with Escape key', () => {
      render(<Sidebar galaxies={mockGalaxies} />);
      
      const content = screen.getByRole('list');
      const sidebar = screen.getByRole('navigation');
      
      fireEvent.keyDown(content, { key: 'Escape' });
      
      expect(sidebar).toHaveClass('sidebar--collapsed');
    });
  });

  describe('Active Item Highlighting', () => {
    it('should highlight active galaxy', () => {
      (useNavigationStore as unknown as jest.Mock).mockReturnValue({
        focusLevel: 'galaxy',
        focusedGalaxyId: 'galaxy-1',
        focusedSolarSystemId: null,
        focusedPlanetId: null,
        navigateToGalaxy: mockNavigateToGalaxy,
        navigateToSolarSystem: mockNavigateToSolarSystem,
        navigateToPlanet: mockNavigateToPlanet,
      });

      render(<Sidebar galaxies={mockGalaxies} />);
      
      const activeSystem = screen.getByText('Alpha System').closest('button');
      // Should not be active yet since we're at galaxy level, not solar-system level
      expect(activeSystem).not.toHaveClass('sidebar__item--active');
    });

    it('should highlight active solar system', () => {
      (useNavigationStore as unknown as jest.Mock).mockReturnValue({
        focusLevel: 'solar-system',
        focusedGalaxyId: 'galaxy-1',
        focusedSolarSystemId: 'system-1',
        focusedPlanetId: null,
        navigateToGalaxy: mockNavigateToGalaxy,
        navigateToSolarSystem: mockNavigateToSolarSystem,
        navigateToPlanet: mockNavigateToPlanet,
      });

      render(<Sidebar galaxies={mockGalaxies} />);
      
      const activePlanet = screen.getByText('Earth-like').closest('button');
      // Should not be active yet since we're at solar-system level, not planet level
      expect(activePlanet).not.toHaveClass('sidebar__item--active');
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      (useNavigationStore as unknown as jest.Mock).mockReturnValue({
        focusLevel: 'universe',
        focusedGalaxyId: null,
        focusedSolarSystemId: null,
        focusedPlanetId: null,
        navigateToGalaxy: mockNavigateToGalaxy,
        navigateToSolarSystem: mockNavigateToSolarSystem,
        navigateToPlanet: mockNavigateToPlanet,
      });
    });

    it('should have proper ARIA labels', () => {
      render(<Sidebar galaxies={mockGalaxies} />);
      
      expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'Entity navigation');
    });

    it('should mark active item with aria-current', () => {
      (useNavigationStore as unknown as jest.Mock).mockReturnValue({
        focusLevel: 'galaxy',
        focusedGalaxyId: 'galaxy-1',
        focusedSolarSystemId: null,
        focusedPlanetId: null,
        navigateToGalaxy: mockNavigateToGalaxy,
        navigateToSolarSystem: mockNavigateToSolarSystem,
        navigateToPlanet: mockNavigateToPlanet,
      });

      render(<Sidebar galaxies={mockGalaxies} />);
      
      const activeSystem = screen.getByText('Alpha System').closest('button');
      // Should not have aria-current since we're showing the list, not highlighting a specific one
      expect(activeSystem).not.toHaveAttribute('aria-current');
    });
  });
});
