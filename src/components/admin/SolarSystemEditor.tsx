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
  onUpdate: (solarSystem: SolarSystem) => void;
  onClose: () => void;
}

export default function SolarSystemEditor({
  solarSystem,
  onUpdate,
  onClose,
}: SolarSystemEditorProps) {
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
    onUpdate(localSystem);
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

  const handleUpdatePlanet = (updatedPlanet: Planet) => {
    const updated = {
      ...localSystem,
      planets: (localSystem.planets || []).map((p) =>
        p.id === updatedPlanet.id ? updatedPlanet : p
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
                onUpdate={(updated) => {
                  handleUpdatePlanet(updated);
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
