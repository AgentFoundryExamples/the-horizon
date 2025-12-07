import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import NotificationBanner from '../NotificationBanner';

describe('NotificationBanner', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should render notification with message', () => {
    render(
      <NotificationBanner type="success" message="Operation successful" />
    );

    expect(screen.getByText('Operation successful')).toBeInTheDocument();
  });

  it('should render success notification with correct icon', () => {
    render(
      <NotificationBanner type="success" message="Success message" />
    );

    expect(screen.getByText('✓')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('notification-success');
  });

  it('should render error notification with correct icon', () => {
    render(
      <NotificationBanner type="error" message="Error message" />
    );

    expect(screen.getByText('✕')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('notification-error');
  });

  it('should render warning notification with correct icon', () => {
    render(
      <NotificationBanner type="warning" message="Warning message" />
    );

    expect(screen.getByText('⚠')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('notification-warning');
  });

  it('should render info notification with correct icon', () => {
    render(
      <NotificationBanner type="info" message="Info message" />
    );

    expect(screen.getByText('ℹ')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('notification-info');
  });

  it('should call onClose when close button is clicked', () => {
    const mockOnClose = jest.fn();
    render(
      <NotificationBanner
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
      <NotificationBanner type="success" message="Test message" />
    );

    expect(screen.queryByLabelText('Close notification')).not.toBeInTheDocument();
  });

  it('should auto-close after default delay when autoClose is true', () => {
    const mockOnClose = jest.fn();
    render(
      <NotificationBanner
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
      <NotificationBanner
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
      <NotificationBanner
        type="success"
        message="Test message"
        onClose={mockOnClose}
        autoClose={false}
      />
    );

    jest.advanceTimersByTime(10000);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should not auto-close when onClose is not provided', () => {
    render(
      <NotificationBanner
        type="success"
        message="Test message"
        autoClose={true}
      />
    );

    // Should not throw error
    jest.advanceTimersByTime(5000);
  });

  it('should have proper ARIA role', () => {
    render(
      <NotificationBanner type="success" message="Test message" />
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should clear timer on unmount', () => {
    const mockOnClose = jest.fn();
    const { unmount } = render(
      <NotificationBanner
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
});
