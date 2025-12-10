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
import { SolarSystem, Planet } from '@/lib/universe/types';
import { generateId } from '@/lib/universe/mutate';
import PlanetEditor from './PlanetEditor';
import Modal from './Modal';

interface SolarSystemEditorProps {
  solarSystem: SolarSystem;
  onUpdate: (solarSystem: SolarSystem, originalId: string) => void;
  onClose: () => void;
}

export default function SolarSystemEditor({
  solarSystem,
  onUpdate,
  onClose,
}: SolarSystemEditorProps) {
  const [originalSystemId] = useState(solarSystem.id || '');
  const [localSystem, setLocalSystem] = useState(solarSystem);
  const [editingPlanet, setEditingPlanet] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'planets'>('info');

  const handleChange = (field: keyof SolarSystem, value: unknown) => {
    const updated = { ...localSystem, [field]: value };
    setLocalSystem(updated);
  };

  const handleMainStarChange = (field: string, value: string) => {
    const updated = {
      ...localSystem,
      mainStar: { ...localSystem.mainStar, [field]: value },
    };
    setLocalSystem(updated);
  };

  const handleSave = () => {
    onUpdate(localSystem, originalSystemId);
  };

  const handleAddPlanet = () => {
    const newPlanet: Planet = {
      id: generateId('New Planet'),
      name: 'New Planet',
      theme: 'blue-green',
      summary: 'A newly discovered planet',
      contentMarkdown: '# New Planet\n\nAdd your description here...',
      moons: [],
    };

    const updated = {
      ...localSystem,
      planets: [...(localSystem.planets || []), newPlanet],
    };
    setLocalSystem(updated);
    setEditingPlanet(newPlanet.id);
  };

  const handleUpdatePlanet = (updatedPlanet: Planet, originalId: string) => {
    const updated = {
      ...localSystem,
      planets: (localSystem.planets || []).map((p) =>
        p.id === originalId ? updatedPlanet : p
      ),
    };
    setLocalSystem(updated);
  };

  const handleDeletePlanet = (planetId: string) => {
    if (!confirm('Are you sure you want to delete this planet?')) {
      return;
    }

    const updated = {
      ...localSystem,
      planets: (localSystem.planets || []).filter((p) => p.id !== planetId),
    };
    setLocalSystem(updated);
    
    if (editingPlanet === planetId) {
      setEditingPlanet(null);
    }
  };

  return (
    <div>
      <div className="breadcrumb" style={{ marginBottom: '1.5rem' }}>
        <span className="breadcrumb-item" onClick={onClose} style={{ cursor: 'pointer' }}>
          Back to Galaxy
        </span>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-current">{solarSystem.name}</span>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--admin-border)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('info')}
          className={`btn btn-small ${activeTab === 'info' ? '' : 'btn-secondary'}`}
        >
          System Info
        </button>
        <button
          onClick={() => setActiveTab('planets')}
          className={`btn btn-small ${activeTab === 'planets' ? '' : 'btn-secondary'}`}
        >
          Planets ({localSystem.planets?.length || 0})
        </button>
      </div>

      {activeTab === 'info' && (
        <>
          <div className="form-group">
            <label>ID</label>
            <input
              type="text"
              value={localSystem.id}
              onChange={(e) => handleChange('id', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={localSystem.name}
              onChange={(e) => handleChange('name', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Theme</label>
            <input
              type="text"
              value={localSystem.theme}
              onChange={(e) => handleChange('theme', e.target.value)}
              placeholder="e.g., yellow-star, orange-star"
            />
          </div>

          <h4 style={{ marginTop: '1.5rem' }}>Main Star</h4>

          <div className="form-group">
            <label>Star ID</label>
            <input
              type="text"
              value={localSystem.mainStar.id}
              onChange={(e) => handleMainStarChange('id', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Star Name</label>
            <input
              type="text"
              value={localSystem.mainStar.name}
              onChange={(e) => handleMainStarChange('name', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Star Theme</label>
            <input
              type="text"
              value={localSystem.mainStar.theme}
              onChange={(e) => handleMainStarChange('theme', e.target.value)}
              placeholder="e.g., yellow-dwarf, orange-dwarf"
            />
          </div>

          <h4 style={{ marginTop: '1.5rem', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--admin-border)' }}>Star Visual Effects</h4>

          <div className="form-group">
            <label>
              Halo Intensity
              <span className="form-hint" style={{ marginLeft: '0.5rem' }}>
                Current: {(localSystem.mainStar.haloConfig?.haloIntensity ?? 50)}%
              </span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={localSystem.mainStar.haloConfig?.haloIntensity ?? 50}
              onChange={(e) => {
                const updated = {
                  ...localSystem,
                  mainStar: {
                    ...localSystem.mainStar,
                    haloConfig: {
                      ...(localSystem.mainStar.haloConfig || {}),
                      haloIntensity: parseInt(e.target.value),
                    },
                  },
                };
                setLocalSystem(updated);
              }}
              style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#888' }}>
              <span>No halo (0%)</span>
              <span>Maximum halo (100%)</span>
            </div>
            <span className="form-hint">
              Controls the prominence of the star&apos;s glow/halo effect
            </span>
          </div>

          <div className="form-group">
            <label>
              Halo Color
              <span className="form-hint" style={{ marginLeft: '0.5rem' }}>
                Overrides theme-based color if set
              </span>
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="color"
                value={localSystem.mainStar.haloConfig?.color || '#FDB813'}
                onChange={(e) => {
                  const updated = {
                    ...localSystem,
                    mainStar: {
                      ...localSystem.mainStar,
                      haloConfig: {
                        ...(localSystem.mainStar.haloConfig || {}),
                        color: e.target.value,
                      },
                    },
                  };
                  setLocalSystem(updated);
                }}
                style={{ width: '60px', height: '40px', cursor: 'pointer', border: '2px solid var(--admin-border)', borderRadius: '4px' }}
              />
              <input
                type="text"
                value={localSystem.mainStar.haloConfig?.color || ''}
                onChange={(e) => {
                  const updated = {
                    ...localSystem,
                    mainStar: {
                      ...localSystem.mainStar,
                      haloConfig: {
                        ...(localSystem.mainStar.haloConfig || {}),
                        color: e.target.value,
                      },
                    },
                  };
                  setLocalSystem(updated);
                }}
                placeholder="#FDB813"
                style={{ flex: 1 }}
              />
            </div>
            <span className="form-hint">
              Leave empty to use color from star theme. Yellow stars default to #FDB813.
            </span>
          </div>

          <div className="form-group">
            <label>
              Star Texture URL (Optional)
              <span className="form-hint" style={{ marginLeft: '0.5rem' }}>
                Advanced: Surface detail
              </span>
            </label>
            <input
              type="text"
              value={localSystem.mainStar.haloConfig?.texture || ''}
              onChange={(e) => {
                const updated = {
                  ...localSystem,
                  mainStar: {
                    ...localSystem.mainStar,
                    haloConfig: {
                      ...(localSystem.mainStar.haloConfig || {}),
                      texture: e.target.value,
                    },
                  },
                };
                setLocalSystem(updated);
              }}
              placeholder="/universe/assets/sun-texture.jpg"
            />
            <span className="form-hint">
              URL or path to star surface texture (e.g., solar flares, spots). Leave empty for solid color.
            </span>
          </div>

          <div className="form-group">
            <label>
              Halo Radius Multiplier
              <span className="form-hint" style={{ marginLeft: '0.5rem' }}>
                Current: {(localSystem.mainStar.haloConfig?.haloRadius ?? 1.5).toFixed(1)}x
              </span>
            </label>
            <input
              type="range"
              min="1.0"
              max="3.0"
              step="0.1"
              value={localSystem.mainStar.haloConfig?.haloRadius ?? 1.5}
              onChange={(e) => {
                const updated = {
                  ...localSystem,
                  mainStar: {
                    ...localSystem.mainStar,
                    haloConfig: {
                      ...(localSystem.mainStar.haloConfig || {}),
                      haloRadius: parseFloat(e.target.value),
                    },
                  },
                };
                setLocalSystem(updated);
              }}
              style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#888' }}>
              <span>Tight (1x)</span>
              <span>Spread (3x)</span>
            </div>
            <span className="form-hint">
              Controls the size of the halo relative to the star&apos;s radius
            </span>
          </div>
        </>
      )}

      {activeTab === 'planets' && (
        <>
          <div className="content-list">
            {(localSystem.planets || []).map((planet) => (
              <div key={planet.id} className="content-card">
                <div className="content-card-header">
                  <div>
                    <h4 className="content-card-title">{planet.name}</h4>
                    <p className="content-card-meta">{planet.moons?.length || 0} moons</p>
                  </div>
                </div>
                {planet.summary && (
                  <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.9rem', margin: '0.5rem 0' }}>
                    {planet.summary}
                  </p>
                )}
                <div className="content-card-actions">
                  <button
                    onClick={() => setEditingPlanet(planet.id)}
                    className="btn btn-small"
                  >
                    Edit Planet
                  </button>
                  <button
                    onClick={() => handleDeletePlanet(planet.id)}
                    className="btn btn-small btn-danger"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {(localSystem.planets || []).length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--admin-text-muted)' }}>
              <p style={{ marginBottom: '1rem' }}>No planets in this system yet</p>
              <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Planets are the main content destinations users can explore
              </p>
            </div>
          )}
          
          <button onClick={handleAddPlanet} className="btn" style={{ marginTop: '1rem' }}>
            + Add Planet
          </button>

          {/* Planet Editor Modal */}
          <Modal
            isOpen={!!editingPlanet}
            onClose={() => setEditingPlanet(null)}
            title={editingPlanet ? `Edit: ${(localSystem.planets || []).find((p) => p.id === editingPlanet)?.name}` : 'Edit Planet'}
            size="large"
          >
            {editingPlanet && (
              <PlanetEditor
                planet={(localSystem.planets || []).find((p) => p.id === editingPlanet)!}
                onUpdate={(updated, originalId) => {
                  handleUpdatePlanet(updated, originalId);
                  setEditingPlanet(null); // Auto-close on save
                }}
                onClose={() => setEditingPlanet(null)}
              />
            )}
          </Modal>
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
