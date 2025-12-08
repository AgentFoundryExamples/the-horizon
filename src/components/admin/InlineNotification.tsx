'use client';

import { useEffect } from 'react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'pending';

interface InlineNotificationProps {
  type: NotificationType;
  message: string;
  onClose?: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
  className?: string;
}

export default function InlineNotification({
  type,
  message,
  onClose,
  autoClose = true,
  autoCloseDelay = 5000,
  className = '',
}: InlineNotificationProps) {
  useEffect(() => {
    if (autoClose && onClose && type !== 'pending') {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay, onClose, message, type]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      case 'pending':
        return <span className="loading-spinner"></span>;
    }
  };

  return (
    <div 
      className={`inline-notification inline-notification-${type} ${className}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="inline-notification-icon">{getIcon()}</span>
      <span className="inline-notification-message">{message}</span>
      {onClose && type !== 'pending' && (
        <button
          className="inline-notification-close"
          onClick={onClose}
          aria-label="Close notification"
          type="button"
        >
          ×
        </button>
      )}
    </div>
  );
}
