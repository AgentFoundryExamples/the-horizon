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
import { Planet, Moon } from '@/lib/universe/types';
import { generateId } from '@/lib/universe/mutate';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface PlanetEditorProps {
  planet: Planet;
  onUpdate: (planet: Planet) => void;
  onClose: () => void;
}

export default function PlanetEditor({ planet, onUpdate, onClose }: PlanetEditorProps) {
  const [localPlanet, setLocalPlanet] = useState(planet);
  const [activeTab, setActiveTab] = useState<'info' | 'content' | 'moons'>('info');
  const [editingMoon, setEditingMoon] = useState<number | null>(null);

  const handleChange = (field: keyof Planet, value: unknown) => {
    const updated = { ...localPlanet, [field]: value };
    setLocalPlanet(updated);
  };

  const handleSave = () => {
    onUpdate(localPlanet);
  };

  const handleAddMoon = () => {
    const newMoon: Moon = {
      id: generateId('New Moon'),
      name: 'New Moon',
      contentMarkdown: '# New Moon\n\nAdd your description here...',
    };

    const updated = {
      ...localPlanet,
      moons: [...(localPlanet.moons || []), newMoon],
    };
    setLocalPlanet(updated);
    setEditingMoon((localPlanet.moons || []).length);
  };

  const handleUpdateMoon = (index: number, field: keyof Moon, value: string) => {
    const updated = {
      ...localPlanet,
      moons: (localPlanet.moons || []).map((m, i) =>
        i === index ? { ...m, [field]: value } : m
      ),
    };
    setLocalPlanet(updated);
  };

  const handleDeleteMoon = (index: number) => {
    if (!confirm('Are you sure you want to delete this moon?')) {
      return;
    }

    const updated = {
      ...localPlanet,
      moons: (localPlanet.moons || []).filter((_, i) => i !== index),
    };
    setLocalPlanet(updated);
    
    if (editingMoon === index) {
      setEditingMoon(null);
    }
  };

  return (
    <div>
      <h4>Edit Planet: {planet.name}</h4>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--admin-border)' }}>
        <button
          onClick={() => setActiveTab('info')}
          className={`btn btn-small ${activeTab === 'info' ? '' : 'btn-secondary'}`}
        >
          Info
        </button>
        <button
          onClick={() => setActiveTab('content')}
          className={`btn btn-small ${activeTab === 'content' ? '' : 'btn-secondary'}`}
        >
          Content
        </button>
        <button
          onClick={() => setActiveTab('moons')}
          className={`btn btn-small ${activeTab === 'moons' ? '' : 'btn-secondary'}`}
        >
          Moons ({localPlanet.moons?.length || 0})
        </button>
      </div>

      {activeTab === 'info' && (
        <>
          <div className="form-group">
            <label>ID</label>
            <input
              type="text"
              value={localPlanet.id}
              onChange={(e) => handleChange('id', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={localPlanet.name}
              onChange={(e) => handleChange('name', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Theme</label>
            <input
              type="text"
              value={localPlanet.theme}
              onChange={(e) => handleChange('theme', e.target.value)}
              placeholder="e.g., blue-green, red, earth-like"
            />
          </div>

          <div className="form-group">
            <label>Summary</label>
            <textarea
              value={localPlanet.summary}
              onChange={(e) => handleChange('summary', e.target.value)}
              rows={2}
              placeholder="Brief summary shown in the solar system view"
            />
          </div>
        </>
      )}

      {activeTab === 'content' && (
        <div className="editor-container">
          <div className="editor-panel">
            <h4>Markdown Editor</h4>
            <textarea
              value={localPlanet.contentMarkdown}
              onChange={(e) => handleChange('contentMarkdown', e.target.value)}
              placeholder="# Planet Name&#10;&#10;Add your markdown content here..."
            />
            <span className="form-hint">
              Supports GitHub-flavored markdown. Use headers, lists, bold, italics, etc.
            </span>
          </div>
          <div className="editor-panel">
            <h4>Preview</h4>
            <div className="markdown-preview">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {localPlanet.contentMarkdown}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'moons' && (
        <>
          <div className="entity-list">
            {(localPlanet.moons || []).map((moon, index) => (
              <div key={index}>
                <div className="entity-item">
                  <div className="entity-info">
                    <h4>{moon.name}</h4>
                    <p>ID: {moon.id}</p>
                  </div>
                  <div className="entity-actions">
                    <button
                      onClick={() => setEditingMoon(editingMoon === index ? null : index)}
                      className="btn btn-small btn-secondary"
                    >
                      {editingMoon === index ? 'Collapse' : 'Edit'}
                    </button>
                    <button
                      onClick={() => handleDeleteMoon(index)}
                      className="btn btn-small btn-danger"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {editingMoon === index && (
                  <div style={{ padding: '1rem', background: 'var(--admin-bg)', marginTop: '0.5rem', borderRadius: '4px' }}>
                    <div className="form-group">
                      <label>Moon ID</label>
                      <input
                        type="text"
                        value={moon.id}
                        onChange={(e) => handleUpdateMoon(index, 'id', e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>Moon Name</label>
                      <input
                        type="text"
                        value={moon.name}
                        onChange={(e) => handleUpdateMoon(index, 'name', e.target.value)}
                      />
                    </div>

                    <div className="editor-container">
                      <div className="editor-panel">
                        <h4>Markdown Editor</h4>
                        <textarea
                          value={moon.contentMarkdown}
                          onChange={(e) => handleUpdateMoon(index, 'contentMarkdown', e.target.value)}
                          placeholder="# Moon Name&#10;&#10;Add your markdown content here..."
                        />
                      </div>
                      <div className="editor-panel">
                        <h4>Preview</h4>
                        <div className="markdown-preview">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {moon.contentMarkdown}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <button onClick={handleAddMoon} className="btn" style={{ marginTop: '1rem' }}>
            + Add Moon
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
