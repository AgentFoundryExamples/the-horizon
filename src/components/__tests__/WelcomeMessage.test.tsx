/**
 * Unit tests for WelcomeMessage component
 */

import { render, screen } from '@testing-library/react';
import WelcomeMessage from '../WelcomeMessage';

describe('WelcomeMessage', () => {
  describe('Content Rendering', () => {
    it('should render welcome title', () => {
      render(<WelcomeMessage galaxyName="Milky Way" />);
      
      expect(screen.getByText('Welcome to the Horizon')).toBeInTheDocument();
    });

    it('should display the galaxy name', () => {
      render(<WelcomeMessage galaxyName="Andromeda" />);
      
      expect(screen.getByText(/You are now exploring/)).toBeInTheDocument();
      expect(screen.getByText('Andromeda')).toBeInTheDocument();
    });

    it('should display navigation instructions', () => {
      render(<WelcomeMessage galaxyName="Milky Way" />);
      
      expect(
        screen.getByText('Click on solar systems to discover planets and moons')
      ).toBeInTheDocument();
    });

    it('should handle different galaxy names', () => {
      const galaxyNames = [
        'Milky Way',
        'Andromeda',
        'Messier 87',
        'Whirlpool Galaxy',
      ];

      galaxyNames.forEach((name) => {
        const { rerender } = render(<WelcomeMessage galaxyName={name} />);
        expect(screen.getByText(name)).toBeInTheDocument();
        rerender(<WelcomeMessage galaxyName={name} />);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA role', () => {
      const { container } = render(<WelcomeMessage galaxyName="Milky Way" />);
      const message = container.querySelector('.welcome-message');
      
      expect(message).toHaveAttribute('role', 'complementary');
    });

    it('should have aria-label for screen readers', () => {
      const { container } = render(<WelcomeMessage galaxyName="Milky Way" />);
      const message = container.querySelector('.welcome-message');
      
      expect(message).toHaveAttribute('aria-label', 'Welcome message');
    });

    it('should not trap focus (pointer-events: none)', () => {
      const { container } = render(<WelcomeMessage galaxyName="Milky Way" />);
      const message = container.querySelector('.welcome-message');
      
      expect(message).toHaveStyle({ pointerEvents: 'none' });
    });

    it('should have semantic heading structure', () => {
      render(<WelcomeMessage galaxyName="Milky Way" />);
      
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Welcome to the Horizon');
    });
  });

  describe('Styling and Positioning', () => {
    it('should be centered on screen', () => {
      const { container } = render(<WelcomeMessage galaxyName="Milky Way" />);
      const message = container.querySelector('.welcome-message');
      
      expect(message).toHaveStyle({
        position: 'absolute',
        top: '50%',
        left: '50%',
      });
    });

    it('should have backdrop blur effect', () => {
      const { container } = render(<WelcomeMessage galaxyName="Milky Way" />);
      const message = container.querySelector('.welcome-message') as HTMLElement;
      
      expect(message.style.backdropFilter).toBe('blur(8px)');
    });

    it('should be responsive with maxWidth', () => {
      const { container } = render(<WelcomeMessage galaxyName="Milky Way" />);
      const message = container.querySelector('.welcome-message');
      
      expect(message).toHaveStyle({
        maxWidth: '90%',
        width: '500px',
      });
    });

    it('should have appropriate z-index', () => {
      const { container } = render(<WelcomeMessage galaxyName="Milky Way" />);
      const message = container.querySelector('.welcome-message');
      
      // Should be below transition indicator (z-index: 1000)
      expect(message).toHaveStyle({ zIndex: '50' });
    });
  });

  describe('Edge Cases', () => {
    it('should handle long galaxy names', () => {
      const longName = 'Messier 87 Supergiant Elliptical Galaxy with Very Long Name';
      render(<WelcomeMessage galaxyName={longName} />);
      
      expect(screen.getByText(longName)).toBeInTheDocument();
    });

    it('should handle galaxy names with special characters', () => {
      const specialName = "NGC 1365 'The Great Barred Spiral'";
      render(<WelcomeMessage galaxyName={specialName} />);
      
      expect(screen.getByText(specialName)).toBeInTheDocument();
    });

    it('should handle empty galaxy name gracefully', () => {
      render(<WelcomeMessage galaxyName="" />);
      
      // Component should still render, just with empty galaxy name
      expect(screen.getByText('Welcome to the Horizon')).toBeInTheDocument();
    });

    it('should handle galaxy names with numbers', () => {
      const numericName = 'Messier 31';
      render(<WelcomeMessage galaxyName={numericName} />);
      
      expect(screen.getByText(numericName)).toBeInTheDocument();
    });
  });

  describe('Responsive Typography', () => {
    it('should have responsive heading with proper styling', () => {
      const { container } = render(<WelcomeMessage galaxyName="Milky Way" />);
      const heading = container.querySelector('h2') as HTMLElement;
      
      // Verify heading exists and has styling
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveStyle({
        color: '#4A90E2',
        fontWeight: 'bold',
      });
    });

    it('should have responsive body text with proper styling', () => {
      const { container } = render(<WelcomeMessage galaxyName="Milky Way" />);
      const paragraphs = container.querySelectorAll('p');
      
      // Verify paragraphs exist
      expect(paragraphs).toHaveLength(2);
      
      // First paragraph (exploring text)
      expect(paragraphs[0]).toHaveStyle({
        color: '#CCCCCC',
      });
      
      // Second paragraph (instructions)
      expect(paragraphs[1]).toHaveStyle({
        color: '#999',
      });
    });
  });

  describe('Component Structure', () => {
    it('should render with correct class name', () => {
      const { container } = render(<WelcomeMessage galaxyName="Milky Way" />);
      
      expect(container.querySelector('.welcome-message')).toBeInTheDocument();
    });

    it('should have centered text alignment', () => {
      const { container } = render(<WelcomeMessage galaxyName="Milky Way" />);
      const message = container.querySelector('.welcome-message');
      
      expect(message).toHaveStyle({ textAlign: 'center' });
    });

    it('should render exactly one heading', () => {
      render(<WelcomeMessage galaxyName="Milky Way" />);
      
      const headings = screen.getAllByRole('heading');
      expect(headings).toHaveLength(1);
    });

    it('should render exactly two paragraphs', () => {
      const { container } = render(<WelcomeMessage galaxyName="Milky Way" />);
      const paragraphs = container.querySelectorAll('p');
      
      expect(paragraphs).toHaveLength(2);
    });
  });
});
