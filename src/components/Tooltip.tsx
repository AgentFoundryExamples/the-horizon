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
  /** Vertical offset in pixels (positive = up, negative = down) */
  offsetY?: number;
  /** Horizontal offset in pixels (positive = right, negative = left) */
  offsetX?: number;
  /** Font size for tooltip text (e.g., '1rem', '16px') */
  fontSize?: string;
  /** Maximum width for tooltip (e.g., '300px', '90vw') */
  maxWidth?: string;
  /** Fixed 3D screen coordinates for tooltip (bypasses automatic positioning) */
  screenCoordinates?: { x: number; y: number };
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
  offsetY = 0,
  offsetX = 0,
  fontSize = '1rem',
  maxWidth = '300px',
  screenCoordinates,
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
    // Use fixed screen coordinates if provided (for 3D scenes)
    if (screenCoordinates) {
      setCoords({ x: screenCoordinates.x + offsetX, y: screenCoordinates.y + offsetY });
      return;
    }

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

    setCoords({ x: x + offsetX, y: y + offsetY });
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
    // Check if the property exists before accessing it (older browsers may use MouseEvent).
    const isTouchEvent = (e.nativeEvent as any)?.pointerType === 'touch';

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

  // Update position when tooltip becomes visible or when window resizes
  useEffect(() => {
    if (isVisible) {
      updatePosition();
      
      // Handle window resize
      const handleResize = () => {
        if (isVisible) {
          updatePosition();
        }
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [isVisible]);

  const getTooltipStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'fixed',
      zIndex: 9999,
      pointerEvents: 'none',
      padding: '0.75rem 1rem',
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      color: '#FFFFFF',
      borderRadius: '8px',
      fontSize: fontSize,
      maxWidth: maxWidth,
      wordWrap: 'break-word',
      whiteSpace: 'normal',
      border: '2px solid rgba(74, 144, 226, 0.7)',
      boxShadow: '0 6px 16px rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(4px)',
    };

    // Calculate initial position based on position prop
    let left = coords.x;
    let top = coords.y;
    let transform = '';

    switch (position) {
      case 'top':
        transform = 'translate(-50%, -100%) translateY(-12px)';
        break;
      case 'bottom':
        transform = 'translate(-50%, 0) translateY(12px)';
        break;
      case 'left':
        transform = 'translate(-100%, -50%) translateX(-12px)';
        break;
      case 'right':
        transform = 'translate(0, -50%) translateX(12px)';
        break;
    }

    return {
      ...baseStyle,
      left: `${left}px`,
      top: `${top}px`,
      transform,
    };
  };

  // Adjust position after render to handle viewport boundaries
  useEffect(() => {
    if (isVisible && tooltipRef.current) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let needsUpdate = false;
      let newLeft = coords.x;
      let newTop = coords.y;

      // Check horizontal overflow
      if (tooltipRect.right > viewportWidth - 10) {
        newLeft = viewportWidth - tooltipRect.width / 2 - 10;
        needsUpdate = true;
      } else if (tooltipRect.left < 10) {
        newLeft = tooltipRect.width / 2 + 10;
        needsUpdate = true;
      }

      // Check vertical overflow
      if (position === 'top' && tooltipRect.top < 10) {
        // Would overflow top edge, adjust down
        needsUpdate = true;
      } else if (position === 'bottom' && tooltipRect.bottom > viewportHeight - 10) {
        // Would overflow bottom edge, adjust up
        needsUpdate = true;
      }

      if (needsUpdate && (newLeft !== coords.x || newTop !== coords.y)) {
        setCoords({ x: newLeft, y: newTop });
      }
    }
  }, [isVisible, coords, position]);

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
