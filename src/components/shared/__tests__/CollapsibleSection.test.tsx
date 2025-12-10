import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CollapsibleSection from '../CollapsibleSection';

describe('CollapsibleSection Component', () => {
  describe('Basic Rendering', () => {
    it('should render with title and children', () => {
      render(
        <CollapsibleSection title="Test Section" itemCount={3}>
          <div>Test Content</div>
        </CollapsibleSection>
      );
      
      expect(screen.getByText('Test Section')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should show item count badge when provided', () => {
      render(
        <CollapsibleSection title="Test Section" itemCount={5}>
          <div>Test Content</div>
        </CollapsibleSection>
      );
      
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByLabelText('5 items')).toBeInTheDocument();
    });

    it('should not show badge when item count is 0', () => {
      render(
        <CollapsibleSection title="Test Section" itemCount={0}>
          <div>Test Content</div>
        </CollapsibleSection>
      );
      
      expect(screen.queryByLabelText('0 items')).not.toBeInTheDocument();
    });

    it('should hide badge when showItemCount is false', () => {
      render(
        <CollapsibleSection 
          title="Test Section" 
          itemCount={5}
          config={{ showItemCount: false }}
        >
          <div>Test Content</div>
        </CollapsibleSection>
      );
      
      expect(screen.queryByText('5')).not.toBeInTheDocument();
    });
  });

  describe('Collapse/Expand Behavior', () => {
    it('should start collapsed by default', () => {
      render(
        <CollapsibleSection title="Test Section">
          <div data-testid="content">Test Content</div>
        </CollapsibleSection>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-expanded', 'false');
      
      const content = screen.getByTestId('content').parentElement?.parentElement;
      expect(content).toHaveAttribute('aria-hidden', 'true');
    });

    it('should start expanded when defaultCollapsed is false', () => {
      render(
        <CollapsibleSection 
          title="Test Section"
          config={{ defaultCollapsed: false }}
        >
          <div data-testid="content">Test Content</div>
        </CollapsibleSection>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-expanded', 'true');
      
      const content = screen.getByTestId('content').parentElement?.parentElement;
      expect(content).toHaveAttribute('aria-hidden', 'false');
    });

    it('should toggle when clicked', () => {
      render(
        <CollapsibleSection title="Test Section">
          <div>Test Content</div>
        </CollapsibleSection>
      );
      
      const button = screen.getByRole('button');
      
      // Initially collapsed
      expect(button).toHaveAttribute('aria-expanded', 'false');
      
      // Click to expand
      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');
      
      // Click to collapse
      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('should call onToggle callback when toggled', () => {
      const onToggle = jest.fn();
      render(
        <CollapsibleSection title="Test Section" onToggle={onToggle}>
          <div>Test Content</div>
        </CollapsibleSection>
      );
      
      const button = screen.getByRole('button');
      
      fireEvent.click(button);
      expect(onToggle).toHaveBeenCalledWith(true);
      
      fireEvent.click(button);
      expect(onToggle).toHaveBeenCalledWith(false);
    });
  });

  describe('Keyboard Accessibility', () => {
    it('should toggle with button click (Enter/Space handled by browser)', () => {
      render(
        <CollapsibleSection title="Test Section">
          <div>Test Content</div>
        </CollapsibleSection>
      );
      
      const button = screen.getByRole('button');
      button.focus();
      
      // Click simulates both Enter and Space behavior
      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('should collapse on Escape key when expanded', () => {
      render(
        <CollapsibleSection 
          title="Test Section"
          config={{ defaultCollapsed: false }}
        >
          <div>Test Content</div>
        </CollapsibleSection>
      );
      
      const button = screen.getByRole('button');
      button.focus();
      
      // Initially expanded
      expect(button).toHaveAttribute('aria-expanded', 'true');
      
      // Press Escape to collapse
      fireEvent.keyDown(button, { key: 'Escape' });
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Configuration', () => {
    it('should apply custom collapsed height', () => {
      render(
        <CollapsibleSection 
          title="Test Section"
          config={{ collapsedHeight: 6 }}
        >
          <div>Test Content</div>
        </CollapsibleSection>
      );
      
      const section = screen.getByRole('region').closest('.collapsible-section');
      expect(section).toHaveStyle({ '--collapsible-collapsed-height': '6rem' });
    });

    it('should apply custom expanded height', () => {
      render(
        <CollapsibleSection 
          title="Test Section"
          config={{ expandedHeight: 30 }}
        >
          <div>Test Content</div>
        </CollapsibleSection>
      );
      
      const section = screen.getByRole('region').closest('.collapsible-section');
      expect(section).toHaveStyle({ '--collapsible-expanded-height': '30rem' });
    });

    it('should clamp collapsed height to valid range', () => {
      render(
        <CollapsibleSection 
          title="Test Section"
          config={{ collapsedHeight: 100 }} // Too large
        >
          <div>Test Content</div>
        </CollapsibleSection>
      );
      
      const section = screen.getByRole('region').closest('.collapsible-section');
      expect(section).toHaveStyle({ '--collapsible-collapsed-height': '8rem' }); // Max is 8
    });

    it('should clamp expanded height to valid range', () => {
      render(
        <CollapsibleSection 
          title="Test Section"
          config={{ expandedHeight: 5 }} // Too small
        >
          <div>Test Content</div>
        </CollapsibleSection>
      );
      
      const section = screen.getByRole('region').closest('.collapsible-section');
      expect(section).toHaveStyle({ '--collapsible-expanded-height': '15rem' }); // Min is 15
    });
  });

  describe('ARIA and Semantics', () => {
    it('should have proper ARIA labels', () => {
      render(
        <CollapsibleSection title="Moons" itemCount={3}>
          <div data-testid="content">Test Content</div>
        </CollapsibleSection>
      );
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('id', 'collapsible-title-moons');
      expect(button).toHaveAttribute('aria-controls', 'collapsible-content-moons');
      
      const content = screen.getByTestId('content').parentElement?.parentElement;
      expect(content).toHaveAttribute('id', 'collapsible-content-moons');
      expect(content?.closest('.collapsible-section')).toHaveAttribute('aria-labelledby', 'collapsible-title-moons');
    });

    it('should use section element', () => {
      render(
        <CollapsibleSection title="Test Section">
          <div>Test Content</div>
        </CollapsibleSection>
      );
      
      const button = screen.getByRole('button');
      const section = button.closest('section');
      expect(section).toBeInTheDocument();
      expect(section).toHaveClass('collapsible-section');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty children', () => {
      render(
        <CollapsibleSection title="Test Section">
          {null}
        </CollapsibleSection>
      );
      
      expect(screen.getByText('Test Section')).toBeInTheDocument();
    });

    it('should handle large item counts', () => {
      render(
        <CollapsibleSection title="Test Section" itemCount={999}>
          <div>Test Content</div>
        </CollapsibleSection>
      );
      
      expect(screen.getByText('999')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(
        <CollapsibleSection title="Test Section" className="custom-class">
          <div>Test Content</div>
        </CollapsibleSection>
      );
      
      const section = screen.getByRole('region').closest('.collapsible-section');
      expect(section).toHaveClass('custom-class');
    });
  });
});
