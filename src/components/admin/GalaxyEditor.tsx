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
import { generateId, ensureGalaxyId } from '@/lib/universe/mutate';
import SolarSystemEditor from './SolarSystemEditor';
import Modal from './Modal';

interface GalaxyEditorProps {
  galaxy: Galaxy;
  onUpdate: (galaxy: Galaxy, originalId: string) => void;
  onClose: () => void;
}

export default function GalaxyEditor({ galaxy, onUpdate, onClose }: GalaxyEditorProps) {
  // Ensure galaxy has a valid ID before initializing state
  // Preserve empty string (intentional for auto-generation) but handle undefined
  const initialGalaxy = galaxy.id !== undefined 
    ? galaxy 
    : { ...galaxy, id: '' };
  
  // Track the original ID to allow ID updates while maintaining reference
  const [originalGalaxyId] = useState(galaxy.id || '');
  const [localGalaxy, setLocalGalaxy] = useState(initialGalaxy);
  const [editingSystem, setEditingSystem] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'systems' | 'stars'>('info');
  const [showAnimationPreview, setShowAnimationPreview] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  // Only allow auto-ID generation for brand new galaxies (no ID or empty string ID)
  const [idManuallyEdited, setIdManuallyEdited] = useState(Boolean(galaxy.id && galaxy.id.trim()));
  const isExistingGalaxy = Boolean(galaxy.id && galaxy.id.trim());

  const handleChange = (field: keyof Galaxy, value: unknown) => {
    const updated = { ...localGalaxy, [field]: value };
    
    // Auto-update ID when name changes, but ONLY for new galaxies (not existing ones)
    if (field === 'name' && !idManuallyEdited && !isExistingGalaxy && typeof value === 'string') {
      updated.id = generateId(value);
    }
    
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
  
  const handleIdChange = (value: string) => {
    setIdManuallyEdited(true);
    handleChange('id', value);
  };

  const validateGalaxy = (galaxyToValidate: Galaxy): boolean => {
    const errors: Record<string, string> = {};
    
    if (!galaxyToValidate.name || galaxyToValidate.name.trim().length === 0) {
      errors.name = 'Name is required';
    }
    
    if (!galaxyToValidate.description || galaxyToValidate.description.trim().length === 0) {
      errors.description = 'Description is required';
    }
    
    if (!galaxyToValidate.theme || galaxyToValidate.theme.trim().length === 0) {
      errors.theme = 'Theme is required';
    }
    
    if (!galaxyToValidate.particleColor || galaxyToValidate.particleColor.trim().length === 0) {
      errors.particleColor = 'Particle color is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = () => {
    // Ensure galaxy has a valid ID before validation
    let galaxyToValidate: Galaxy;
    try {
      galaxyToValidate = ensureGalaxyId(localGalaxy);
    } catch (error) {
      // If ID generation fails due to missing name, proceed with validation
      // which will display the appropriate error message
      galaxyToValidate = localGalaxy;
    }
    
    if (!validateGalaxy(galaxyToValidate)) {
      // If validation fails, update state to show generated ID to the user
      setLocalGalaxy(galaxyToValidate);
      return;
    }
    
    onUpdate(galaxyToValidate, originalGalaxyId);
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

  const handleUpdateSolarSystem = (updatedSystem: SolarSystem, originalId: string) => {
    const updated = {
      ...localGalaxy,
      solarSystems: (localGalaxy.solarSystems || []).map((s) =>
        s.id === originalId ? updatedSystem : s
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
      <div className="breadcrumb" style={{ marginBottom: '1.5rem' }}>
        <span className="breadcrumb-item" onClick={onClose} style={{ cursor: 'pointer' }}>
          All Galaxies
        </span>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-current">{galaxy.name}</span>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--admin-border)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('info')}
          className={`btn btn-small ${activeTab === 'info' ? '' : 'btn-secondary'}`}
        >
          Basic Info
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
          Background Stars ({localGalaxy.stars?.length || 0})
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
              onChange={(e) => handleIdChange(e.target.value)}
            />
            <span className="form-hint">Unique identifier (kebab-case). Auto-generated from name if left empty.</span>
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
          <div className="content-list">
            {(localGalaxy.solarSystems || []).map((system) => (
              <div key={system.id} className="content-card">
                <div className="content-card-header">
                  <div>
                    <h4 className="content-card-title">{system.name}</h4>
                    <p className="content-card-meta">{system.planets?.length || 0} planets</p>
                  </div>
                </div>
                <div className="content-card-actions">
                  <button
                    onClick={() => setEditingSystem(system.id)}
                    className="btn btn-small"
                  >
                    Edit System
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
          
          {(localGalaxy.solarSystems || []).length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--admin-text-muted)' }}>
              <p style={{ marginBottom: '1rem' }}>No solar systems in this galaxy yet</p>
              <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Solar systems contain planets and moons for users to explore
              </p>
            </div>
          )}
          
          <button onClick={handleAddSolarSystem} className="btn" style={{ marginTop: '1rem' }}>
            + Add Solar System
          </button>

          {/* Solar System Editor Modal */}
          <Modal
            isOpen={!!editingSystem}
            onClose={() => setEditingSystem(null)}
            title={editingSystem ? `Edit: ${(localGalaxy.solarSystems || []).find((s) => s.id === editingSystem)?.name}` : 'Edit Solar System'}
            size="large"
          >
            {editingSystem && (
              <SolarSystemEditor
                solarSystem={(localGalaxy.solarSystems || []).find((s) => s.id === editingSystem)!}
                onUpdate={(updated, originalId) => {
                  handleUpdateSolarSystem(updated, originalId);
                  setEditingSystem(null); // Auto-close on save
                }}
                onClose={() => setEditingSystem(null)}
              />
            )}
          </Modal>
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
