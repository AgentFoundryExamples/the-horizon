'use client';

/**
 * CollapsibleSection - Reusable collapsible container for content sections
 * Provides keyboard navigation, screen reader support, and smooth animations
 */

import { useState, useRef, useEffect, ReactNode, KeyboardEvent } from 'react';
import {
  normalizeCollapsibleConfig,
  collapsibleConfigToCSS,
  type CollapsibleSectionConfig,
} from '@/lib/collapsible-config';
import '../../styles/collapsible-section.css';

interface CollapsibleSectionProps {
  /**
   * Section title displayed in the header
   */
  title: string;
  
  /**
   * Content to render inside the collapsible area
   */
  children: ReactNode;
  
  /**
   * Number of items in the section (for badge display)
   */
  itemCount?: number;
  
  /**
   * Configuration options
   */
  config?: CollapsibleSectionConfig;
  
  /**
   * Optional CSS class name for customization
   */
  className?: string;
  
  /**
   * Callback when section is expanded/collapsed
   */
  onToggle?: (isExpanded: boolean) => void;
}

export default function CollapsibleSection({
  title,
  children,
  itemCount = 0,
  config,
  className = '',
  onToggle,
}: CollapsibleSectionProps) {
  const normalizedConfig = normalizeCollapsibleConfig(config);
  const [isExpanded, setIsExpanded] = useState(!normalizedConfig.defaultCollapsed);
  const contentRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  // Track if user has interacted (for auto-expand behavior)
  const hasInteracted = useRef(false);
  
  const handleToggle = () => {
    hasInteracted.current = true;
    const newState = !isExpanded;
    setIsExpanded(newState);
    
    if (onToggle) {
      onToggle(newState);
    }
    
    // Scroll to top of content when expanding
    if (newState && contentRef.current) {
      setTimeout(() => {
        contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }, 50);
    }
  };
  
  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    // Enter and Space are handled by default button behavior
    // Add Escape to collapse
    if (e.key === 'Escape' && isExpanded) {
      e.preventDefault();
      handleToggle();
      buttonRef.current?.focus();
    }
  };
  
  // CSS custom properties from config
  const styleVars = collapsibleConfigToCSS(normalizedConfig);
  
  return (
    <section
      className={`collapsible-section ${isExpanded ? 'collapsible-section--expanded' : ''} ${className}`}
      style={styleVars as React.CSSProperties}
      aria-labelledby={`collapsible-title-${title.replace(/\s+/g, '-').toLowerCase()}`}
    >
      <header className="collapsible-section__header">
        <button
          ref={buttonRef}
          className="collapsible-section__toggle"
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          aria-expanded={isExpanded}
          aria-controls={`collapsible-content-${title.replace(/\s+/g, '-').toLowerCase()}`}
          id={`collapsible-title-${title.replace(/\s+/g, '-').toLowerCase()}`}
        >
          <span className="collapsible-section__icon" aria-hidden="true">
            {isExpanded ? '▼' : '▶'}
          </span>
          <span className="collapsible-section__title">{title}</span>
          {normalizedConfig.showItemCount && itemCount > 0 && (
            <span className="collapsible-section__badge" aria-label={`${itemCount} items`}>
              {itemCount}
            </span>
          )}
        </button>
      </header>
      
      <div
        ref={contentRef}
        className="collapsible-section__content"
        id={`collapsible-content-${title.replace(/\s+/g, '-').toLowerCase()}`}
        role="region"
        aria-hidden={!isExpanded}
      >
        <div className="collapsible-section__inner">
          {children}
        </div>
      </div>
    </section>
  );
}
