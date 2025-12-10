import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PlanetSurfaceOverlay } from '../PlanetSurface';
import { useNavigationStore } from '@/lib/store';
import type { Planet } from '@/lib/universe/types';

// Mock scrollTo
Element.prototype.scrollTo = jest.fn();

// Mock the navigation store
jest.mock('@/lib/store', () => ({
  useNavigationStore: jest.fn(),
}));

const mockNavigateToMoon = jest.fn();

const createMockPlanet = (overrides?: Partial<Planet>): Planet => ({
  id: 'test-planet',
  name: 'Test Planet',
  theme: 'earth-like',
  summary: 'A test planet for unit tests',
  contentMarkdown: '# Test Planet\n\nThis is test content.',
  moons: [],
  ...overrides,
});

describe('PlanetSurfaceOverlay - Collapsible Sections Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigationStore as unknown as jest.Mock).mockReturnValue({
      navigateToMoon: mockNavigateToMoon,
    });
  });

  describe('Moons Section', () => {
    it('should not render moons section when planet has no moons', () => {
      const planet = createMockPlanet({ moons: [] });
      render(<PlanetSurfaceOverlay planet={planet} currentMoonId={null} />);
      
      expect(screen.queryByText('Moons')).not.toBeInTheDocument();
    });

    it('should render collapsed moons section with item count', () => {
      const planet = createMockPlanet({
        moons: [
          { id: 'moon-1', name: 'Moon 1', contentMarkdown: '# Moon 1' },
          { id: 'moon-2', name: 'Moon 2', contentMarkdown: '# Moon 2' },
          { id: 'moon-3', name: 'Moon 3', contentMarkdown: '# Moon 3' },
        ],
      });
      
      render(<PlanetSurfaceOverlay planet={planet} currentMoonId={null} />);
      
      expect(screen.getByText('Moons')).toBeInTheDocument();
      expect(screen.getByLabelText('3 items')).toBeInTheDocument();
    });

    it('should expand moons section when clicked', () => {
      const planet = createMockPlanet({
        moons: [
          { id: 'moon-1', name: 'Moon Alpha', contentMarkdown: '# Moon Alpha' },
          { id: 'moon-2', name: 'Moon Beta', contentMarkdown: '# Moon Beta' },
        ],
      });
      
      render(<PlanetSurfaceOverlay planet={planet} currentMoonId={null} />);
      
      const moonsButton = screen.getByRole('button', { name: /Moons/i });
      
      // Initially collapsed
      expect(moonsButton).toHaveAttribute('aria-expanded', 'false');
      
      // Click to expand
      fireEvent.click(moonsButton);
      expect(moonsButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should navigate to moon when moon button is clicked', () => {
      const planet = createMockPlanet({
        moons: [
          { id: 'moon-1', name: 'Moon Alpha', contentMarkdown: '# Moon Alpha' },
        ],
      });
      
      render(<PlanetSurfaceOverlay planet={planet} currentMoonId={null} />);
      
      // Expand moons section first
      const moonsSection = screen.getByRole('button', { name: /Moons/i });
      fireEvent.click(moonsSection);
      
      // Click moon button
      const moonButton = screen.getByRole('button', { name: 'Moon Alpha' });
      fireEvent.click(moonButton);
      
      expect(mockNavigateToMoon).toHaveBeenCalledWith('moon-1');
    });

    it('should hide moons section when viewing a moon', () => {
      const planet = createMockPlanet({
        moons: [
          { id: 'moon-1', name: 'Moon Alpha', contentMarkdown: '# Moon Alpha' },
        ],
      });
      
      render(<PlanetSurfaceOverlay planet={planet} currentMoonId="moon-1" />);
      
      expect(screen.queryByText('Moons')).not.toBeInTheDocument();
    });

    it('should handle large number of moons', () => {
      const manyMoons = Array.from({ length: 50 }, (_, i) => ({
        id: `moon-${i}`,
        name: `Moon ${i}`,
        contentMarkdown: `# Moon ${i}`,
      }));
      
      const planet = createMockPlanet({ moons: manyMoons });
      
      render(<PlanetSurfaceOverlay planet={planet} currentMoonId={null} />);
      
      expect(screen.getByText('Moons')).toBeInTheDocument();
      expect(screen.getByLabelText('50 items')).toBeInTheDocument();
    });
  });

  describe('External Links Section', () => {
    it('should not render links section when planet has no links', () => {
      const planet = createMockPlanet({ externalLinks: [] });
      render(<PlanetSurfaceOverlay planet={planet} currentMoonId={null} />);
      
      expect(screen.queryByText('Related Resources')).not.toBeInTheDocument();
    });

    it('should render collapsed links section with item count', () => {
      const planet = createMockPlanet({
        externalLinks: [
          { title: 'Link 1', url: 'https://example.com/1' },
          { title: 'Link 2', url: 'https://example.com/2' },
        ],
      });
      
      render(<PlanetSurfaceOverlay planet={planet} currentMoonId={null} />);
      
      expect(screen.getByText('Related Resources')).toBeInTheDocument();
      expect(screen.getByLabelText('2 items')).toBeInTheDocument();
    });

    it('should expand links section when clicked', () => {
      const planet = createMockPlanet({
        externalLinks: [
          { title: 'NASA', url: 'https://nasa.gov' },
        ],
      });
      
      render(<PlanetSurfaceOverlay planet={planet} currentMoonId={null} />);
      
      const linksButton = screen.getByRole('button', { name: /Related Resources/i });
      
      // Initially collapsed
      expect(linksButton).toHaveAttribute('aria-expanded', 'false');
      
      // Click to expand
      fireEvent.click(linksButton);
      expect(linksButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should filter out invalid URLs', () => {
      const planet = createMockPlanet({
        externalLinks: [
          { title: 'Valid Link', url: 'https://example.com' },
          { title: 'Invalid Link', url: 'javascript:alert(1)' },
          { title: 'Also Valid', url: 'http://example.org' },
        ],
      });
      
      render(<PlanetSurfaceOverlay planet={planet} currentMoonId={null} />);
      
      // Should show only 2 valid links
      expect(screen.getByLabelText('2 items')).toBeInTheDocument();
    });

    it('should render links with descriptions', () => {
      const planet = createMockPlanet({
        externalLinks: [
          {
            title: 'NASA Homepage',
            url: 'https://nasa.gov',
            description: 'Official NASA website',
          },
        ],
      });
      
      render(<PlanetSurfaceOverlay planet={planet} currentMoonId={null} />);
      
      // Expand to see content
      const linksButton = screen.getByRole('button', { name: /Related Resources/i });
      fireEvent.click(linksButton);
      
      expect(screen.getByText('NASA Homepage')).toBeInTheDocument();
      expect(screen.getByText('Official NASA website')).toBeInTheDocument();
    });
  });

  describe('Scroll and Focus Management', () => {
    it('should reset scroll position and set focus when navigating to moon', async () => {
      const planet = createMockPlanet({
        moons: [
          { id: 'moon-1', name: 'Moon Alpha', contentMarkdown: '# Moon Alpha' },
        ],
      });
      
      const { rerender } = render(
        <PlanetSurfaceOverlay planet={planet} currentMoonId={null} />
      );
      
      // Get the content column before re-rendering
      const contentColumn = screen.getByLabelText('Planet content area');
      const focusSpy = jest.spyOn(contentColumn, 'focus');
      const scrollToSpy = jest.spyOn(contentColumn, 'scrollTo');
      
      // Simulate navigating to a moon
      rerender(<PlanetSurfaceOverlay planet={planet} currentMoonId="moon-1" />);
      
      // Check that scrollTo and focus were called
      expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
      expect(focusSpy).toHaveBeenCalled();
      
      // Check that content column still exists and can receive focus
      expect(contentColumn).toBeInTheDocument();
      expect(contentColumn).toHaveAttribute('tabIndex', '-1');
      
      // Cleanup
      focusSpy.mockRestore();
      scrollToSpy.mockRestore();
    });

    it('should reset scroll when returning to planet without setting focus', () => {
      const planet = createMockPlanet({
        moons: [
          { id: 'moon-1', name: 'Moon Alpha', contentMarkdown: '# Moon Alpha' },
        ],
      });
      
      const { rerender } = render(
        <PlanetSurfaceOverlay planet={planet} currentMoonId="moon-1" />
      );
      
      // Get the content column
      const contentColumn = screen.getByLabelText('Planet content area');
      const focusSpy = jest.spyOn(contentColumn, 'focus');
      const scrollToSpy = jest.spyOn(contentColumn, 'scrollTo');
      
      // Clear the call history from initial render
      focusSpy.mockClear();
      scrollToSpy.mockClear();
      
      // Simulate returning to planet
      rerender(<PlanetSurfaceOverlay planet={planet} currentMoonId={null} />);
      
      // Check that scrollTo was called but focus was not
      expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
      expect(focusSpy).not.toHaveBeenCalled();
      
      // Cleanup
      focusSpy.mockRestore();
      scrollToSpy.mockRestore();
    });

    it('should show back button when viewing moon', () => {
      const planet = createMockPlanet({
        moons: [
          { id: 'moon-1', name: 'Moon Alpha', contentMarkdown: '# Moon Alpha' },
        ],
      });
      
      render(<PlanetSurfaceOverlay planet={planet} currentMoonId="moon-1" />);
      
      const backButton = screen.getByRole('button', { name: /Back to Test Planet/i });
      expect(backButton).toBeInTheDocument();
    });

    it('should navigate back to planet when back button clicked', () => {
      const planet = createMockPlanet({
        moons: [
          { id: 'moon-1', name: 'Moon Alpha', contentMarkdown: '# Moon Alpha' },
        ],
      });
      
      render(<PlanetSurfaceOverlay planet={planet} currentMoonId="moon-1" />);
      
      const backButton = screen.getByRole('button', { name: /Back to Test Planet/i });
      fireEvent.click(backButton);
      
      expect(mockNavigateToMoon).toHaveBeenCalledWith('');
    });
  });

  describe('Combined Sections', () => {
    it('should render both moons and links sections', () => {
      const planet = createMockPlanet({
        moons: [
          { id: 'moon-1', name: 'Moon 1', contentMarkdown: '# Moon 1' },
        ],
        externalLinks: [
          { title: 'NASA', url: 'https://nasa.gov' },
        ],
      });
      
      render(<PlanetSurfaceOverlay planet={planet} currentMoonId={null} />);
      
      expect(screen.getByText('Moons')).toBeInTheDocument();
      expect(screen.getByText('Related Resources')).toBeInTheDocument();
    });

    it('should allow independent expansion of sections', () => {
      const planet = createMockPlanet({
        moons: [
          { id: 'moon-1', name: 'Moon 1', contentMarkdown: '# Moon 1' },
        ],
        externalLinks: [
          { title: 'NASA', url: 'https://nasa.gov' },
        ],
      });
      
      render(<PlanetSurfaceOverlay planet={planet} currentMoonId={null} />);
      
      const moonsButton = screen.getByRole('button', { name: /Moons/i });
      const linksButton = screen.getByRole('button', { name: /Related Resources/i });
      
      // Expand moons only
      fireEvent.click(moonsButton);
      expect(moonsButton).toHaveAttribute('aria-expanded', 'true');
      expect(linksButton).toHaveAttribute('aria-expanded', 'false');
      
      // Expand links too
      fireEvent.click(linksButton);
      expect(moonsButton).toHaveAttribute('aria-expanded', 'true');
      expect(linksButton).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Content Display', () => {
    it('should display primary planet title and subtitle', () => {
      const planet = createMockPlanet({
        name: 'Earth',
        summary: 'The Blue Marble',
        contentMarkdown: '# Earth\n\nOur home planet.',
      });
      
      render(<PlanetSurfaceOverlay planet={planet} currentMoonId={null} />);
      
      // Use getByRole to target the specific h1 title
      expect(screen.getByRole('heading', { level: 1, name: 'Earth' })).toBeInTheDocument();
      expect(screen.getByText('The Blue Marble')).toBeInTheDocument();
    });

    it('should display moon name and subtitle when viewing moon', () => {
      const planet = createMockPlanet({
        name: 'Earth',
        contentMarkdown: '# Planet Content',
        moons: [
          {
            id: 'moon-1',
            name: 'The Moon',
            contentMarkdown: '# Moon Content\n\nMoon details here.',
          },
        ],
      });
      
      render(<PlanetSurfaceOverlay planet={planet} currentMoonId="moon-1" />);
      
      // Use getByRole to target the h1 title specifically
      expect(screen.getByRole('heading', { level: 1, name: 'The Moon' })).toBeInTheDocument();
      expect(screen.getByText('Moon of Earth')).toBeInTheDocument();
    });
  });
});
