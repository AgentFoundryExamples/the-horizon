'use client';

/**
 * OverlayLabels - DOM-based overlay for hover labels
 * Renders labels in fixed viewport positions, outside the 3D canvas
 * Now uses portal to render directly in DOM for consistent positioning across all views
 */

import { useHoverStore } from '@/lib/hover-store';
import { useNavigationStore } from '@/lib/store';
import { getLabelConfig } from '@/lib/label-config';
import '../styles/overlay-labels.css';

/**
 * OverlayLabels component - renders as pure DOM overlay
 * No longer uses Drei's Html component to avoid 3D positioning issues
 */
export default function OverlayLabels() {
  const hoveredObject = useHoverStore((state) => state.hoveredObject);
  const labelsVisible = useHoverStore((state) => state.labelsVisible);
  const focusLevel = useNavigationStore((state) => state.focusLevel);

  console.log('OverlayLabels render:', { hoveredObject: hoveredObject?.name, labelsVisible, focusLevel });

  // Don't render if no object is hovered or labels are hidden
  if (!hoveredObject || !labelsVisible) {
    return null;
  }

  // Don't show hover labels in planet view
  if (focusLevel === 'planet') {
    return null;
  }

  const { name, type, metadata } = hoveredObject;

  // Get per-scene label configuration
  const labelConfig = getLabelConfig(focusLevel);

  // Position label based on focus level - each view has custom positioning
  let labelPosition;
  if (focusLevel === 'universe') {
    labelPosition = { top: '100px', left: '20px' };  // Universe view
  } else if (focusLevel === 'galaxy') {
    labelPosition = { top: '100px', left: '20px' };  // Galaxy view
  } else if (focusLevel === 'solar-system') {
    labelPosition = { top: '100px', left: '20px' };  // Solar system view
  } else {
    labelPosition = { top: '100px', left: '20px' };  // Fallback
  }

  console.log('Label position for', focusLevel, ':', labelPosition);

  return (
    <div 
      className="overlay-label" 
      role="tooltip" 
      aria-live="polite"
      style={{
        position: 'fixed',
        ...labelPosition,
        pointerEvents: 'none',
        userSelect: 'none',
        zIndex: 1000,
      }}
    >
      <div 
        className={`overlay-label-content ${labelConfig.enableGlow ? 'with-glow' : 'no-glow'}`}
        style={{
          minWidth: labelConfig.minWidth,
          maxWidth: labelConfig.maxWidth,
          backgroundColor: labelConfig.backgroundOpacity !== undefined 
            ? `rgba(0, 0, 0, ${labelConfig.backgroundOpacity})` 
            : undefined,
          borderColor: labelConfig.borderColor,
        }}
      >
        <div 
          className="overlay-label-name"
          style={{
            fontSize: labelConfig.fontSize,
            // Map 'wrap' to 'normal' for valid CSS whiteSpace value
            // Default to 'nowrap' if textWrap is undefined
            whiteSpace: labelConfig.textWrap === 'wrap' ? 'normal' : 'nowrap',
          }}
        >{name}</div>
        <div 
          className="overlay-label-type"
          style={{
            fontSize: labelConfig.typeFontSize,
          }}
        >{type}</div>
        {metadata?.description && (
          <div className="overlay-label-description">{metadata.description}</div>
        )}
        {metadata?.planetCount !== undefined && (
          <div className="overlay-label-meta">
            {metadata.planetCount} {metadata.planetCount === 1 ? 'planet' : 'planets'}
          </div>
        )}
        {metadata?.moonCount !== undefined && metadata.moonCount > 0 && (
          <div className="overlay-label-meta">
            {metadata.moonCount} {metadata.moonCount === 1 ? 'moon' : 'moons'}
          </div>
        )}
      </div>
    </div>
  );
}
