'use client';

import { useEffect, useRef } from 'react';

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
  // Use ref to avoid timer resets when onClose function reference changes
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (autoClose && onCloseRef.current && type !== 'pending') {
      const timer = setTimeout(() => {
        onCloseRef.current?.();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay, message, type]);

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
