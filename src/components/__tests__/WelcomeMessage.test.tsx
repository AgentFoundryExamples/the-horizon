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

    it('should have semantic heading structure', () => {
      render(<WelcomeMessage />);
      
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Welcome to the Horizon');
    });
  });

  describe('Component Structure', () => {
    it('should render with correct CSS class names', () => {
      const { container } = render(<WelcomeMessage />);
      
      const message = container.querySelector('.welcome-message');
      const title = container.querySelector('.welcome-message-title');
      const text = container.querySelector('.welcome-message-text');
      
      expect(message).toBeInTheDocument();
      expect(title).toBeInTheDocument();
      expect(text).toBeInTheDocument();
    });

    it('should have welcome-message class for styling', () => {
      const { container } = render(<WelcomeMessage />);
      
      expect(container.querySelector('.welcome-message')).toHaveClass('welcome-message');
    });

    it('should have welcome-message-title class on heading', () => {
      const { container } = render(<WelcomeMessage />);
      const heading = container.querySelector('h2');
      
      expect(heading).toHaveClass('welcome-message-title');
    });

    it('should have welcome-message-text class on paragraph', () => {
      const { container } = render(<WelcomeMessage />);
      const paragraph = container.querySelector('p');
      
      expect(paragraph).toHaveClass('welcome-message-text');
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

  describe('Content Validation', () => {
    it('should have correct heading text content', () => {
      render(<WelcomeMessage />);
      
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Welcome to the Horizon');
    });

    it('should have correct paragraph text content', () => {
      render(<WelcomeMessage />);
      
      const paragraph = screen.getByText('Click a galaxy to explore');
      expect(paragraph.tagName).toBe('P');
    });
  });
});
