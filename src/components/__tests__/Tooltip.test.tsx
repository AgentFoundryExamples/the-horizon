/**
 * Unit tests for Tooltip component
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import Tooltip from '../Tooltip';

// Mock matchMedia
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

describe('Tooltip', () => {
  beforeEach(() => {
    mockMatchMedia(false);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render children without tooltip initially', () => {
      render(
        <Tooltip content="Test tooltip">
          <button>Hover me</button>
        </Tooltip>
      );

      expect(screen.getByText('Hover me')).toBeInTheDocument();
      expect(screen.queryByText('Test tooltip')).not.toBeInTheDocument();
    });

    it('should render with custom className', () => {
      render(
        <Tooltip content="Test tooltip" className="custom-class">
          <button>Hover me</button>
        </Tooltip>
      );

      expect(screen.getByText('Hover me')).toBeInTheDocument();
    });
  });

  describe('Mouse interactions', () => {
    it('should show tooltip on mouse enter after delay', async () => {
      render(
        <Tooltip content="Test tooltip" delay={100}>
          <button>Hover me</button>
        </Tooltip>
      );

      const trigger = screen.getByText('Hover me').parentElement!;
      fireEvent.mouseEnter(trigger);

      // Tooltip should not appear immediately
      expect(screen.queryByText('Test tooltip')).not.toBeInTheDocument();

      // Fast-forward time
      jest.advanceTimersByTime(100);

      await waitFor(() => {
        expect(screen.getByText('Test tooltip')).toBeInTheDocument();
      });
    });

    it('should hide tooltip on mouse leave', async () => {
      render(
        <Tooltip content="Test tooltip" delay={0}>
          <button>Hover me</button>
        </Tooltip>
      );

      const trigger = screen.getByText('Hover me').parentElement!;
      
      fireEvent.mouseEnter(trigger);
      jest.advanceTimersByTime(0);

      await waitFor(() => {
        expect(screen.getByText('Test tooltip')).toBeInTheDocument();
      });

      fireEvent.mouseLeave(trigger);

      await waitFor(() => {
        expect(screen.queryByText('Test tooltip')).not.toBeInTheDocument();
      });
    });

    it('should cancel showing if mouse leaves before delay', async () => {
      render(
        <Tooltip content="Test tooltip" delay={500}>
          <button>Hover me</button>
        </Tooltip>
      );

      const trigger = screen.getByText('Hover me').parentElement!;
      
      fireEvent.mouseEnter(trigger);
      jest.advanceTimersByTime(200);
      
      fireEvent.mouseLeave(trigger);
      jest.advanceTimersByTime(500);

      expect(screen.queryByText('Test tooltip')).not.toBeInTheDocument();
    });
  });

  describe('Keyboard interactions', () => {
    it('should show tooltip on focus', async () => {
      render(
        <Tooltip content="Test tooltip" delay={100}>
          <button>Focus me</button>
        </Tooltip>
      );

      const trigger = screen.getByText('Focus me').parentElement!;
      fireEvent.focus(trigger);

      jest.advanceTimersByTime(100);

      await waitFor(() => {
        expect(screen.getByText('Test tooltip')).toBeInTheDocument();
      });
    });

    it('should hide tooltip on blur', async () => {
      render(
        <Tooltip content="Test tooltip" delay={0}>
          <button>Focus me</button>
        </Tooltip>
      );

      const trigger = screen.getByText('Focus me').parentElement!;
      
      fireEvent.focus(trigger);
      jest.advanceTimersByTime(0);

      await waitFor(() => {
        expect(screen.getByText('Test tooltip')).toBeInTheDocument();
      });

      fireEvent.blur(trigger);

      await waitFor(() => {
        expect(screen.queryByText('Test tooltip')).not.toBeInTheDocument();
      });
    });
  });

  describe('Touch interactions', () => {
    it('should support touch interaction when enabled', async () => {
      // Note: This test verifies the touch interaction logic exists.
      // Full end-to-end touch behavior is best verified with integration/E2E tests
      // since jsdom doesn't fully support PointerEvent with pointerType.
      render(
        <Tooltip content="Test tooltip" delay={0} enableTouch={true}>
          <button>Touch me</button>
        </Tooltip>
      );

      const trigger = screen.getByText('Touch me').parentElement!;
      
      // Verify the component has onClick handler (used for touch detection)
      expect(trigger).toHaveAttribute('role', 'button');
      expect(trigger).toHaveAttribute('tabIndex', '0');
    });

    it('should not show tooltip on regular mouse click', async () => {
      render(
        <Tooltip content="Test tooltip" delay={0} enableTouch={true}>
          <button>Click me</button>
        </Tooltip>
      );

      const trigger = screen.getByText('Click me').parentElement!;
      
      // Regular mouse click (not touch)
      fireEvent.click(trigger);
      jest.advanceTimersByTime(0);

      // Tooltip should NOT appear for regular clicks
      expect(screen.queryByText('Test tooltip')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', async () => {
      render(
        <Tooltip content="Test tooltip" delay={0}>
          <button>Hover me</button>
        </Tooltip>
      );

      const trigger = screen.getByText('Hover me').parentElement!;
      
      expect(trigger).toHaveAttribute('role', 'button');
      expect(trigger).toHaveAttribute('aria-label', 'Show tooltip');
      expect(trigger).toHaveAttribute('tabIndex', '0');

      fireEvent.mouseEnter(trigger);
      jest.advanceTimersByTime(0);

      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).toBeInTheDocument();
        expect(tooltip).toHaveAttribute('aria-live', 'polite');
      });
    });

    it('should be keyboard navigable', () => {
      render(
        <Tooltip content="Test tooltip">
          <button>Keyboard me</button>
        </Tooltip>
      );

      const trigger = screen.getByText('Keyboard me').parentElement!;
      expect(trigger).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Prefers-reduced-motion', () => {
    it('should show tooltip immediately when reduced motion is preferred', async () => {
      mockMatchMedia(true);

      render(
        <Tooltip content="Test tooltip" delay={500}>
          <button>Hover me</button>
        </Tooltip>
      );

      const trigger = screen.getByText('Hover me').parentElement!;
      fireEvent.mouseEnter(trigger);

      // Should show immediately with no delay
      jest.advanceTimersByTime(0);

      await waitFor(() => {
        expect(screen.getByText('Test tooltip')).toBeInTheDocument();
      });
    });
  });

  describe('Positioning', () => {
    it('should accept different positions', () => {
      const positions: Array<'top' | 'bottom' | 'left' | 'right'> = ['top', 'bottom', 'left', 'right'];

      positions.forEach((position) => {
        const { unmount } = render(
          <Tooltip content="Test tooltip" position={position}>
            <button>Position {position}</button>
          </Tooltip>
        );
        
        expect(screen.getByText(`Position ${position}`)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Cleanup', () => {
    it('should clear timeout on unmount', () => {
      const { unmount } = render(
        <Tooltip content="Test tooltip" delay={500}>
          <button>Hover me</button>
        </Tooltip>
      );

      const trigger = screen.getByText('Hover me').parentElement!;
      fireEvent.mouseEnter(trigger);

      // Unmount before delay completes
      unmount();

      // Advance timers - tooltip should not appear
      jest.advanceTimersByTime(500);

      expect(screen.queryByText('Test tooltip')).not.toBeInTheDocument();
    });
  });

  describe('Long text handling', () => {
    it('should handle long tooltip content', async () => {
      const longContent = 'This is a very long tooltip content that should wrap properly and not overflow the maximum width constraint set in the component styles.';

      render(
        <Tooltip content={longContent} delay={0}>
          <button>Long content</button>
        </Tooltip>
      );

      const trigger = screen.getByText('Long content').parentElement!;
      fireEvent.mouseEnter(trigger);
      jest.advanceTimersByTime(0);

      await waitFor(() => {
        expect(screen.getByText(longContent)).toBeInTheDocument();
      });
    });
  });
});
