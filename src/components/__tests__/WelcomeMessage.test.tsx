/**
 * Unit tests for WelcomeMessage component
 */

import { render, screen } from '@testing-library/react';
import WelcomeMessage from '../WelcomeMessage';

describe('WelcomeMessage', () => {
  describe('Content Rendering', () => {
    it('should render default welcome title when no props provided', () => {
      render(<WelcomeMessage />);
      
      expect(screen.getByText('Welcome to the Horizon')).toBeInTheDocument();
    });

    it('should render custom title when provided', () => {
      render(<WelcomeMessage title="Exploring Milky Way" />);
      
      expect(screen.getByText('Exploring Milky Way')).toBeInTheDocument();
    });

    it('should display default navigation instructions when no description provided', () => {
      render(<WelcomeMessage />);
      
      expect(screen.getByText('Click a galaxy to explore')).toBeInTheDocument();
    });

    it('should display custom description when provided', () => {
      render(<WelcomeMessage description="A galaxy full of wonders" />);
      
      expect(screen.getByText('A galaxy full of wonders')).toBeInTheDocument();
    });

    it('should render both custom title and description', () => {
      render(
        <WelcomeMessage
          title="Navigating Sol System"
          description="Our home star system"
        />
      );
      
      expect(screen.getByText('Navigating Sol System')).toBeInTheDocument();
      expect(screen.getByText('Our home star system')).toBeInTheDocument();
    });
  });

  describe('Visibility', () => {
    it('should render when visible is true', () => {
      const { container } = render(<WelcomeMessage visible={true} />);
      const message = container.querySelector('.welcome-message');
      
      expect(message).toBeInTheDocument();
    });

    it('should render when visible prop is not provided (default)', () => {
      const { container } = render(<WelcomeMessage />);
      const message = container.querySelector('.welcome-message');
      
      expect(message).toBeInTheDocument();
    });

    it('should not render when visible is false', () => {
      const { container } = render(<WelcomeMessage visible={false} />);
      const message = container.querySelector('.welcome-message');
      
      expect(message).not.toBeInTheDocument();
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

  describe('Edge Cases', () => {
    it('should handle long title text without breaking layout', () => {
      const longTitle = 'Exploring the Extremely Long Named Galaxy That Contains Many Solar Systems and Countless Worlds';
      render(<WelcomeMessage title={longTitle} />);
      
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('should handle long description text without breaking layout', () => {
      const longDescription = 'This is an extremely long description that contains a lot of information about the galaxy, its formation, its stars, and all the fascinating details about the celestial bodies within it.';
      render(<WelcomeMessage description={longDescription} />);
      
      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });

    it('should handle special characters in title', () => {
      render(<WelcomeMessage title="Exploring M31 & NGC-224" />);
      
      expect(screen.getByText('Exploring M31 & NGC-224')).toBeInTheDocument();
    });

    it('should handle special characters in description', () => {
      render(<WelcomeMessage description="Features 1,000+ stars & 50+ planets" />);
      
      expect(screen.getByText('Features 1,000+ stars & 50+ planets')).toBeInTheDocument();
    });

    it('should handle empty string title', () => {
      render(<WelcomeMessage title="" />);
      const heading = screen.getByRole('heading', { level: 2 });
      
      // Empty string should still render the element
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('');
    });

    it('should handle empty string description', () => {
      const { container } = render(<WelcomeMessage description="" />);
      const paragraphs = container.querySelectorAll('p');
      
      // Empty string should still render the element
      expect(paragraphs.length).toBeGreaterThan(0);
    });
  });
});
