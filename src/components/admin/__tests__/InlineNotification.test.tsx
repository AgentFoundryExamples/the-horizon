import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import InlineNotification from '../InlineNotification';

describe('InlineNotification', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should render notification with message', () => {
    render(
      <InlineNotification type="success" message="Operation successful" />
    );

    expect(screen.getByText('Operation successful')).toBeInTheDocument();
  });

  it('should render success notification with correct icon', () => {
    render(
      <InlineNotification type="success" message="Success message" />
    );

    expect(screen.getByText('✓')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveClass('inline-notification-success');
  });

  it('should render error notification with correct icon', () => {
    render(
      <InlineNotification type="error" message="Error message" />
    );

    expect(screen.getByText('✕')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveClass('inline-notification-error');
  });

  it('should render warning notification with correct icon', () => {
    render(
      <InlineNotification type="warning" message="Warning message" />
    );

    expect(screen.getByText('⚠')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveClass('inline-notification-warning');
  });

  it('should render info notification with correct icon', () => {
    render(
      <InlineNotification type="info" message="Info message" />
    );

    expect(screen.getByText('ℹ')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveClass('inline-notification-info');
  });

  it('should render pending notification with loading spinner', () => {
    const { container } = render(
      <InlineNotification type="pending" message="Loading..." />
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(container.querySelector('.loading-spinner')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveClass('inline-notification-pending');
  });

  it('should call onClose when close button is clicked', () => {
    const mockOnClose = jest.fn();
    render(
      <InlineNotification
        type="success"
        message="Test message"
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByLabelText('Close notification');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should not render close button when onClose is not provided', () => {
    render(
      <InlineNotification type="success" message="Test message" />
    );

    expect(screen.queryByLabelText('Close notification')).not.toBeInTheDocument();
  });

  it('should not render close button for pending notifications', () => {
    const mockOnClose = jest.fn();
    render(
      <InlineNotification
        type="pending"
        message="Loading..."
        onClose={mockOnClose}
      />
    );

    expect(screen.queryByLabelText('Close notification')).not.toBeInTheDocument();
  });

  it('should auto-close after default delay when autoClose is true', () => {
    const mockOnClose = jest.fn();
    render(
      <InlineNotification
        type="success"
        message="Test message"
        onClose={mockOnClose}
        autoClose={true}
      />
    );

    expect(mockOnClose).not.toHaveBeenCalled();

    jest.advanceTimersByTime(5000);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should auto-close after custom delay', () => {
    const mockOnClose = jest.fn();
    render(
      <InlineNotification
        type="success"
        message="Test message"
        onClose={mockOnClose}
        autoClose={true}
        autoCloseDelay={3000}
      />
    );

    jest.advanceTimersByTime(2999);
    expect(mockOnClose).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should not auto-close when autoClose is false', () => {
    const mockOnClose = jest.fn();
    render(
      <InlineNotification
        type="success"
        message="Test message"
        onClose={mockOnClose}
        autoClose={false}
      />
    );

    jest.advanceTimersByTime(10000);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should not auto-close pending notifications', () => {
    const mockOnClose = jest.fn();
    render(
      <InlineNotification
        type="pending"
        message="Loading..."
        onClose={mockOnClose}
        autoClose={true}
      />
    );

    jest.advanceTimersByTime(10000);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should not auto-close when onClose is not provided', () => {
    render(
      <InlineNotification
        type="success"
        message="Test message"
        autoClose={true}
      />
    );

    // Should not throw error
    jest.advanceTimersByTime(5000);
  });

  it('should have proper ARIA attributes', () => {
    render(
      <InlineNotification type="success" message="Test message" />
    );

    const notification = screen.getByRole('status');
    expect(notification).toHaveAttribute('aria-live', 'polite');
    expect(notification).toHaveAttribute('aria-atomic', 'true');
  });

  it('should clear timer on unmount', () => {
    const mockOnClose = jest.fn();
    const { unmount } = render(
      <InlineNotification
        type="success"
        message="Test message"
        onClose={mockOnClose}
        autoClose={true}
      />
    );

    unmount();
    jest.advanceTimersByTime(5000);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should reset timer when message changes', () => {
    const mockOnClose = jest.fn();
    const { rerender } = render(
      <InlineNotification
        type="success"
        message="Original message"
        onClose={mockOnClose}
        autoClose={true}
        autoCloseDelay={3000}
      />
    );

    // Advance partway through the timer
    jest.advanceTimersByTime(2000);

    // Change the message - this should reset the timer
    rerender(
      <InlineNotification
        type="success"
        message="Updated message"
        onClose={mockOnClose}
        autoClose={true}
        autoCloseDelay={3000}
      />
    );

    // Advance the original remainder - should not close yet
    jest.advanceTimersByTime(1000);
    expect(mockOnClose).not.toHaveBeenCalled();

    // Advance the full new delay
    jest.advanceTimersByTime(2000);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should reset timer when type changes', () => {
    const mockOnClose = jest.fn();
    const { rerender } = render(
      <InlineNotification
        type="success"
        message="Test message"
        onClose={mockOnClose}
        autoClose={true}
        autoCloseDelay={3000}
      />
    );

    jest.advanceTimersByTime(2000);

    // Change the type - this should reset the timer
    rerender(
      <InlineNotification
        type="error"
        message="Test message"
        onClose={mockOnClose}
        autoClose={true}
        autoCloseDelay={3000}
      />
    );

    jest.advanceTimersByTime(1000);
    expect(mockOnClose).not.toHaveBeenCalled();

    jest.advanceTimersByTime(2000);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should apply custom className', () => {
    const { container } = render(
      <InlineNotification
        type="success"
        message="Test message"
        className="custom-class"
      />
    );

    const notification = container.querySelector('.custom-class');
    expect(notification).toBeInTheDocument();
    expect(notification).toHaveClass('inline-notification');
    expect(notification).toHaveClass('inline-notification-success');
  });

  it('should handle long error messages without breaking layout', () => {
    const longMessage = 'This is a very long error message that contains a lot of details about what went wrong in the system. It includes technical information and guidance on how to resolve the issue. The message continues with more information to test text wrapping and layout behavior.';
    
    render(
      <InlineNotification type="error" message={longMessage} />
    );

    expect(screen.getByText(longMessage)).toBeInTheDocument();
  });
});
