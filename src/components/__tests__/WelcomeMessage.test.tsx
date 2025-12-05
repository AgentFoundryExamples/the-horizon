/**
 * Unit tests for WelcomeMessage component
 */

import { render, screen } from '@testing-library/react';
import WelcomeMessage from '../WelcomeMessage';

describe('WelcomeMessage', () => {
  describe('Content Rendering', () => {
    it('should render welcome title', () => {
      render(<WelcomeMessage />);
      
      expect(screen.getByText('Welcome to the Horizon')).toBeInTheDocument();
    });

    it('should display navigation instructions', () => {
      render(<WelcomeMessage />);
      
      expect(screen.getByText('Click a galaxy to explore')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA role', () => {
      const { container } = render(<WelcomeMessage />);
      const message = container.querySelector('.welcome-message');
      
      expect(message).toHaveAttribute('role', 'complementary');
    });

    it('should have aria-label for screen readers', () => {
      const { container } = render(<WelcomeMessage />);
      const message = container.querySelector('.welcome-message');
      
      expect(message).toHaveAttribute('aria-label', 'Welcome message');
    });

    it('should not trap focus (pointer-events: none)', () => {
      const { container } = render(<WelcomeMessage />);
      const message = container.querySelector('.welcome-message');
      
      expect(message).toHaveStyle({ pointerEvents: 'none' });
    });

    it('should have semantic heading structure', () => {
      render(<WelcomeMessage />);
      
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Welcome to the Horizon');
    });
  });

  describe('Styling and Positioning', () => {
    it('should be positioned at top center of screen', () => {
      const { container } = render(<WelcomeMessage />);
      const message = container.querySelector('.welcome-message');
      
      expect(message).toHaveStyle({
        position: 'absolute',
        top: '2rem',
        left: '50%',
      });
    });

    it('should have backdrop blur effect', () => {
      const { container } = render(<WelcomeMessage />);
      const message = container.querySelector('.welcome-message') as HTMLElement;
      
      expect(message.style.backdropFilter).toBe('blur(8px)');
    });

    it('should be responsive with maxWidth', () => {
      const { container } = render(<WelcomeMessage />);
      const message = container.querySelector('.welcome-message');
      
      expect(message).toHaveStyle({
        maxWidth: '90%',
        width: 'auto',
      });
    });

    it('should have appropriate z-index', () => {
      const { container } = render(<WelcomeMessage />);
      const message = container.querySelector('.welcome-message');
      
      // Should be below transition indicator (z-index: 1000)
      expect(message).toHaveStyle({ zIndex: '50' });
    });

    it('should be compact with reduced padding', () => {
      const { container } = render(<WelcomeMessage />);
      const message = container.querySelector('.welcome-message');
      
      expect(message).toHaveStyle({
        padding: '1rem 2rem',
      });
    });
  });

  describe('Responsive Typography', () => {
    it('should have responsive heading with proper styling', () => {
      const { container } = render(<WelcomeMessage />);
      const heading = container.querySelector('h2') as HTMLElement;
      
      // Verify heading exists and has styling
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveStyle({
        color: '#4A90E2',
        fontWeight: 'bold',
      });
    });

    it('should have responsive body text with proper styling', () => {
      const { container } = render(<WelcomeMessage />);
      const paragraph = container.querySelector('p');
      
      expect(paragraph).toBeInTheDocument();
      expect(paragraph).toHaveStyle({
        color: '#CCCCCC',
      });
    });
  });

  describe('Component Structure', () => {
    it('should render with correct class name', () => {
      const { container } = render(<WelcomeMessage />);
      
      expect(container.querySelector('.welcome-message')).toBeInTheDocument();
    });

    it('should have centered text alignment', () => {
      const { container } = render(<WelcomeMessage />);
      const message = container.querySelector('.welcome-message');
      
      expect(message).toHaveStyle({ textAlign: 'center' });
    });

    it('should render exactly one heading', () => {
      render(<WelcomeMessage />);
      
      const headings = screen.getAllByRole('heading');
      expect(headings).toHaveLength(1);
    });

    it('should render exactly one paragraph', () => {
      const { container } = render(<WelcomeMessage />);
      const paragraphs = container.querySelectorAll('p');
      
      expect(paragraphs).toHaveLength(1);
    });
  });
});
