'use client';

/**
 * Sidebar - Persistent navigation component for universe exploration
 * Lists galaxies, solar systems, or planets based on current view level
 * Provides keyboard navigation and click-to-focus functionality
 */

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { useNavigationStore, type FocusLevel } from '@/lib/store';
import type { Galaxy, SolarSystem, Planet } from '@/lib/universe/types';
import '../styles/sidebar.css';

interface SidebarProps {
  galaxies: Galaxy[];
}

interface ListItem {
  id: string;
  name: string;
  description?: string;
  metadata?: string;
}

export default function Sidebar({ galaxies }: SidebarProps) {
  const {
    focusLevel,
    focusedGalaxyId,
    focusedSolarSystemId,
    focusedPlanetId,
    navigateToGalaxy,
    navigateToSolarSystem,
    navigateToPlanet,
  } = useNavigationStore();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Determine what entities to display based on focus level
  const getListItems = (): ListItem[] => {
    if (focusLevel === 'universe') {
      // Show all galaxies
      return galaxies.map(galaxy => ({
        id: galaxy.id,
        name: galaxy.name,
        description: galaxy.description,
        metadata: `${galaxy.solarSystems?.length || 0} systems`,
      }));
    } else if (focusLevel === 'galaxy' && focusedGalaxyId) {
      // Show solar systems in the focused galaxy
      const galaxy = galaxies.find(g => g.id === focusedGalaxyId);
      return (galaxy?.solarSystems || []).map(system => ({
        id: system.id,
        name: system.name,
        metadata: `${system.planets?.length || 0} planets`,
      }));
    } else if (focusLevel === 'solar-system' && focusedGalaxyId && focusedSolarSystemId) {
      // Show planets in the focused solar system
      const galaxy = galaxies.find(g => g.id === focusedGalaxyId);
      const system = galaxy?.solarSystems?.find(s => s.id === focusedSolarSystemId);
      return (system?.planets || []).map(planet => ({
        id: planet.id,
        name: planet.name,
        description: planet.summary,
        metadata: `${planet.moons?.length || 0} moons`,
      }));
    }
    return [];
  };

  const listItems = getListItems();

  // Determine the currently active item ID
  const getActiveItemId = (): string | null => {
    if (focusLevel === 'universe') return null; // No active galaxy at universe level
    if (focusLevel === 'galaxy') return focusedGalaxyId;
    if (focusLevel === 'solar-system') return focusedSolarSystemId;
    if (focusLevel === 'planet') return focusedPlanetId;
    return null;
  };

  const activeItemId = getActiveItemId();

  // Reset focused index when list items change
  useEffect(() => {
    setFocusedIndex(0);
  }, [focusLevel, focusedGalaxyId, focusedSolarSystemId]);

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (listItems.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => (prev + 1) % listItems.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => (prev - 1 + listItems.length) % listItems.length);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        handleItemClick(listItems[focusedIndex].id);
        break;
      case 'Escape':
        e.preventDefault();
        setIsCollapsed(true);
        break;
    }
  };

  // Scroll focused item into view
  useEffect(() => {
    if (itemRefs.current[focusedIndex]) {
      itemRefs.current[focusedIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [focusedIndex]);

  // Handle item selection
  const handleItemClick = (id: string) => {
    if (focusLevel === 'universe') {
      navigateToGalaxy(id);
    } else if (focusLevel === 'galaxy') {
      navigateToSolarSystem(id);
    } else if (focusLevel === 'solar-system') {
      navigateToPlanet(id);
    }
  };

  // Get title based on focus level
  const getTitle = (): string => {
    if (focusLevel === 'universe') return 'Galaxies';
    if (focusLevel === 'galaxy') return 'Solar Systems';
    if (focusLevel === 'solar-system') return 'Planets';
    return 'Navigation';
  };

  // Don't render sidebar on planet detail view
  if (focusLevel === 'planet') {
    return null;
  }

  return (
    <aside
      className={`sidebar ${isCollapsed ? 'sidebar--collapsed' : ''}`}
      role="navigation"
      aria-label="Entity navigation"
    >
      <div className="sidebar__header">
        <h2 className="sidebar__title">{getTitle()}</h2>
        <button
          className="sidebar__toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!isCollapsed}
        >
          {isCollapsed ? '›' : '‹'}
        </button>
      </div>

      {!isCollapsed && (
        <div
          ref={listRef}
          className="sidebar__content"
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="list"
        >
          {listItems.length === 0 ? (
            <div className="sidebar__empty" role="status">
              No items to display
            </div>
          ) : (
            listItems.map((item, index) => {
              const isActive = item.id === activeItemId;
              const isFocused = index === focusedIndex;

              return (
                <button
                  key={item.id}
                  ref={el => {
                    itemRefs.current[index] = el;
                  }}
                  className={`sidebar__item ${isActive ? 'sidebar__item--active' : ''} ${
                    isFocused ? 'sidebar__item--focused' : ''
                  }`}
                  onClick={() => handleItemClick(item.id)}
                  onMouseEnter={() => setFocusedIndex(index)}
                  aria-current={isActive ? 'location' : undefined}
                  role="listitem"
                >
                  <div className="sidebar__item-content">
                    <div className="sidebar__item-name">{item.name}</div>
                    {item.description && (
                      <div className="sidebar__item-description">{item.description}</div>
                    )}
                    {item.metadata && (
                      <div className="sidebar__item-metadata">{item.metadata}</div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </aside>
  );
}
