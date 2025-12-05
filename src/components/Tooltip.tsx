'use client';

/**
 * Tooltip - Reusable tooltip component for hover/tap labels
 * Supports hover, focus, and tap interactions with accessibility features
 */

import { useState, useEffect, useRef, ReactNode } from 'react';
import { usePrefersReducedMotion } from '@/lib/animation';

export interface TooltipProps {
  /** Content to display in tooltip */
  content: string | ReactNode;
  /** Children element that triggers the tooltip */
  children: ReactNode;
  /** Optional class name for styling */
  className?: string;
  /** Position of the tooltip relative to trigger */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Delay before showing tooltip (ms) */
  delay?: number;
  /** Whether to show on touch devices (default: true) */
  enableTouch?: boolean;
}

/**
 * Tooltip component with hover, focus, and touch support
 * Respects prefers-reduced-motion for animations
 */
export default function Tooltip({
  content,
  children,
  className = '',
  position = 'top',
  delay = 300,
  enableTouch = true,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  const showTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const actualDelay = prefersReducedMotion ? 0 : delay;
    
    timeoutRef.current = setTimeout(() => {
      updatePosition();
      setIsVisible(true);
    }, actualDelay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };

  const updatePosition = () => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    let x = 0;
    let y = 0;

    switch (position) {
      case 'top':
        x = rect.left + rect.width / 2;
        y = rect.top;
        break;
      case 'bottom':
        x = rect.left + rect.width / 2;
        y = rect.bottom;
        break;
      case 'left':
        x = rect.left;
        y = rect.top + rect.height / 2;
        break;
      case 'right':
        x = rect.right;
        y = rect.top + rect.height / 2;
        break;
    }

    setCoords({ x, y });
  };

  const handleMouseEnter = () => {
    showTooltip();
  };

  const handleMouseLeave = () => {
    hideTooltip();
  };

  const handleFocus = () => {
    showTooltip();
  };

  const handleBlur = () => {
    hideTooltip();
  };

  const handleClick = (e: React.MouseEvent) => {
    // This check is for touch devices, where we want tap-to-toggle behavior.
    // 'pointerType' is available on React's synthetic PointerEvents.
    // We cast the native event to check its type.
    const isTouchEvent = (e.nativeEvent as PointerEvent).pointerType === 'touch';

    if (enableTouch && isTouchEvent) {
      e.preventDefault();
      if (isVisible) {
        hideTooltip();
      } else {
        showTooltip();
      }
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Update position when tooltip becomes visible
  useEffect(() => {
    if (isVisible) {
      updatePosition();
    }
  }, [isVisible]);

  const getTooltipStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'fixed',
      zIndex: 9999,
      pointerEvents: 'none',
      padding: '0.5rem 0.75rem',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      color: '#FFFFFF',
      borderRadius: '4px',
      fontSize: '0.875rem',
      maxWidth: '250px',
      wordWrap: 'break-word',
      whiteSpace: 'normal',
      border: '1px solid rgba(74, 144, 226, 0.5)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    };

    // Position-specific adjustments
    switch (position) {
      case 'top':
        return {
          ...baseStyle,
          left: `${coords.x}px`,
          top: `${coords.y}px`,
          transform: 'translate(-50%, -100%) translateY(-8px)',
        };
      case 'bottom':
        return {
          ...baseStyle,
          left: `${coords.x}px`,
          top: `${coords.y}px`,
          transform: 'translate(-50%, 0) translateY(8px)',
        };
      case 'left':
        return {
          ...baseStyle,
          left: `${coords.x}px`,
          top: `${coords.y}px`,
          transform: 'translate(-100%, -50%) translateX(-8px)',
        };
      case 'right':
        return {
          ...baseStyle,
          left: `${coords.x}px`,
          top: `${coords.y}px`,
          transform: 'translate(0, -50%) translateX(8px)',
        };
    }
  };

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onClick={handleClick}
        style={{ display: 'inline-block', cursor: 'pointer' }}
        tabIndex={0}
        role="button"
        aria-label="Show tooltip"
      >
        {children}
      </div>

      {isVisible && (
        <div
          ref={tooltipRef}
          style={getTooltipStyle()}
          role="tooltip"
          aria-live="polite"
          className={`tooltip-content ${className}`}
        >
          {content}
        </div>
      )}
    </>
  );
}
