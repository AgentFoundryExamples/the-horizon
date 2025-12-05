// Copyright 2025 John Brosnihan
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use client';

import { useState } from 'react';
import { Galaxy, SolarSystem, Star } from '@/lib/universe/types';
import { generateId } from '@/lib/universe/mutate';
import SolarSystemEditor from './SolarSystemEditor';

interface GalaxyEditorProps {
  galaxy: Galaxy;
  onUpdate: (galaxy: Galaxy) => void;
  onClose: () => void;
}

export default function GalaxyEditor({ galaxy, onUpdate, onClose }: GalaxyEditorProps) {
  const [localGalaxy, setLocalGalaxy] = useState(galaxy);
  const [editingSystem, setEditingSystem] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'systems' | 'stars'>('info');
  const [showAnimationPreview, setShowAnimationPreview] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof Galaxy, value: unknown) => {
    const updated = { ...localGalaxy, [field]: value };
    setLocalGalaxy(updated);
    
    // Clear validation error for this field when user starts typing
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateGalaxy = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!localGalaxy.name || localGalaxy.name.trim().length === 0) {
      errors.name = 'Name is required';
    }
    
    if (!localGalaxy.description || localGalaxy.description.trim().length === 0) {
      errors.description = 'Description is required';
    }
    
    if (!localGalaxy.theme || localGalaxy.theme.trim().length === 0) {
      errors.theme = 'Theme is required';
    }
    
    if (!localGalaxy.particleColor || localGalaxy.particleColor.trim().length === 0) {
      errors.particleColor = 'Particle color is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = () => {
    if (!validateGalaxy()) {
      return;
    }
    
    // Auto-generate ID from name if ID is empty or just whitespace
    const updatedGalaxy = {
      ...localGalaxy,
      id: localGalaxy.id && localGalaxy.id.trim() ? localGalaxy.id : generateId(localGalaxy.name),
    };
    
    onUpdate(updatedGalaxy);
  };

  const handleAddSolarSystem = () => {
    const newSystem: SolarSystem = {
      id: generateId('New System'),
      name: 'New System',
      theme: 'yellow-star',
      mainStar: {
        id: generateId('New Star'),
        name: 'New Star',
        theme: 'yellow-dwarf',
      },
      planets: [],
    };

    const updated = {
      ...localGalaxy,
      solarSystems: [...(localGalaxy.solarSystems || []), newSystem],
    };
    setLocalGalaxy(updated);
    setEditingSystem(newSystem.id);
  };

  const handleUpdateSolarSystem = (updatedSystem: SolarSystem) => {
    const updated = {
      ...localGalaxy,
      solarSystems: (localGalaxy.solarSystems || []).map((s) =>
        s.id === updatedSystem.id ? updatedSystem : s
      ),
    };
    setLocalGalaxy(updated);
  };

  const handleDeleteSolarSystem = (systemId: string) => {
    if (!confirm('Are you sure you want to delete this solar system?')) {
      return;
    }

    const updated = {
      ...localGalaxy,
      solarSystems: (localGalaxy.solarSystems || []).filter((s) => s.id !== systemId),
    };
    setLocalGalaxy(updated);
    
    if (editingSystem === systemId) {
      setEditingSystem(null);
    }
  };

  const handleAddStar = () => {
    const newStar: Star = {
      id: generateId('New Star'),
      name: 'New Star',
      theme: 'yellow-white',
    };

    const updated = {
      ...localGalaxy,
      stars: [...(localGalaxy.stars || []), newStar],
    };
    setLocalGalaxy(updated);
  };

  const handleUpdateStar = (index: number, field: keyof Star, value: string) => {
    const updated = {
      ...localGalaxy,
      stars: (localGalaxy.stars || []).map((s, i) =>
        i === index ? { ...s, [field]: value } : s
      ),
    };
    setLocalGalaxy(updated);
  };

  const handleDeleteStar = (index: number) => {
    if (!confirm('Are you sure you want to delete this star?')) {
      return;
    }

    const updated = {
      ...localGalaxy,
      stars: (localGalaxy.stars || []).filter((_, i) => i !== index),
    };
    setLocalGalaxy(updated);
  };

  return (
    <div>
      <h3>Edit Galaxy: {galaxy.name}</h3>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--admin-border)' }}>
        <button
          onClick={() => setActiveTab('info')}
          className={`btn btn-small ${activeTab === 'info' ? '' : 'btn-secondary'}`}
        >
          Info
        </button>
        <button
          onClick={() => setActiveTab('systems')}
          className={`btn btn-small ${activeTab === 'systems' ? '' : 'btn-secondary'}`}
        >
          Solar Systems ({localGalaxy.solarSystems?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('stars')}
          className={`btn btn-small ${activeTab === 'stars' ? '' : 'btn-secondary'}`}
        >
          Stars ({localGalaxy.stars?.length || 0})
        </button>
      </div>

      {activeTab === 'info' && (
        <>
          <div className="form-group">
            <label htmlFor="galaxy-id">ID</label>
            <input
              type="text"
              id="galaxy-id"
              value={localGalaxy.id}
              onChange={(e) => handleChange('id', e.target.value)}
            />
            <span className="form-hint">Unique identifier (kebab-case)</span>
          </div>

          <div className="form-group">
            <label htmlFor="galaxy-name">Name *</label>
            <input
              type="text"
              id="galaxy-name"
              value={localGalaxy.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={validationErrors.name ? 'error' : ''}
              required
            />
            {validationErrors.name && (
              <span className="form-error">{validationErrors.name}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="galaxy-description">Description *</label>
            <textarea
              id="galaxy-description"
              value={localGalaxy.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className={validationErrors.description ? 'error' : ''}
              required
            />
            {validationErrors.description && (
              <span className="form-error">{validationErrors.description}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="galaxy-theme">Theme *</label>
            <input
              type="text"
              id="galaxy-theme"
              value={localGalaxy.theme}
              onChange={(e) => handleChange('theme', e.target.value)}
              placeholder="e.g., blue-white, purple-white"
              className={validationErrors.theme ? 'error' : ''}
              required
            />
            {validationErrors.theme && (
              <span className="form-error">{validationErrors.theme}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="galaxy-color">Particle Color *</label>
            <input
              type="color"
              id="galaxy-color"
              value={localGalaxy.particleColor}
              onChange={(e) => handleChange('particleColor', e.target.value)}
              className={validationErrors.particleColor ? 'error' : ''}
              required
            />
            <input
              type="text"
              value={localGalaxy.particleColor}
              onChange={(e) => handleChange('particleColor', e.target.value)}
              placeholder="#4A90E2"
              style={{ marginTop: '0.5rem' }}
              className={validationErrors.particleColor ? 'error' : ''}
              required
            />
            {validationErrors.particleColor && (
              <span className="form-error">{validationErrors.particleColor}</span>
            )}
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={showAnimationPreview}
                onChange={(e) => setShowAnimationPreview(e.target.checked)}
                style={{ marginRight: '0.5rem' }}
              />
              Preview animations (respects prefers-reduced-motion)
            </label>
            <span className="form-hint">
              Toggle to preview galaxy rotation and particle drift animations
            </span>
          </div>
        </>
      )}

      {activeTab === 'systems' && (
        <>
          <div className="entity-list">
            {(localGalaxy.solarSystems || []).map((system) => (
              <div key={system.id} className="entity-item">
                <div className="entity-info">
                  <h4>{system.name}</h4>
                  <p>{system.planets?.length || 0} planets</p>
                </div>
                <div className="entity-actions">
                  <button
                    onClick={() => setEditingSystem(system.id)}
                    className="btn btn-small btn-secondary"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteSolarSystem(system.id)}
                    className="btn btn-small btn-danger"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button onClick={handleAddSolarSystem} className="btn" style={{ marginTop: '1rem' }}>
            + Add Solar System
          </button>

          {editingSystem && (
            <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--admin-bg)', borderRadius: '4px' }}>
              <SolarSystemEditor
                solarSystem={(localGalaxy.solarSystems || []).find((s) => s.id === editingSystem)!}
                onUpdate={handleUpdateSolarSystem}
                onClose={() => setEditingSystem(null)}
              />
            </div>
          )}
        </>
      )}

      {activeTab === 'stars' && (
        <>
          <div className="entity-list">
            {(localGalaxy.stars || []).map((star, index) => (
              <div key={index} className="entity-item">
                <div style={{ flex: 1 }}>
                  <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                    <input
                      type="text"
                      value={star.name}
                      onChange={(e) => handleUpdateStar(index, 'name', e.target.value)}
                      placeholder="Star name"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                    <input
                      type="text"
                      value={star.id}
                      onChange={(e) => handleUpdateStar(index, 'id', e.target.value)}
                      placeholder="star-id"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <input
                      type="text"
                      value={star.theme}
                      onChange={(e) => handleUpdateStar(index, 'theme', e.target.value)}
                      placeholder="Theme (e.g., yellow-white)"
                    />
                  </div>
                </div>
                <div className="entity-actions">
                  <button
                    onClick={() => handleDeleteStar(index)}
                    className="btn btn-small btn-danger"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button onClick={handleAddStar} className="btn" style={{ marginTop: '1rem' }}>
            + Add Star
          </button>
        </>
      )}

      <div className="btn-group" style={{ marginTop: '1.5rem' }}>
        <button onClick={handleSave} className="btn">
          Save Changes
        </button>
        <button onClick={onClose} className="btn btn-secondary">
          Close
        </button>
      </div>
    </div>
  );
}
