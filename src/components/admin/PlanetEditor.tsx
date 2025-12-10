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
  onUpdate: (planet: Planet, originalId: string) => void;
  onClose: () => void;
}

export default function PlanetEditor({ planet, onUpdate, onClose }: PlanetEditorProps) {
  const [originalPlanetId] = useState(planet.id || '');
  const [localPlanet, setLocalPlanet] = useState(planet);
  const [activeTab, setActiveTab] = useState<'info' | 'content' | 'moons' | 'layout'>('info');
  const [editingMoon, setEditingMoon] = useState<number | null>(null);

  const handleChange = (field: keyof Planet, value: unknown) => {
    const updated = { ...localPlanet, [field]: value };
    setLocalPlanet(updated);
  };

  const handleSave = () => {
    onUpdate(localPlanet, originalPlanetId);
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
      <div className="breadcrumb" style={{ marginBottom: '1.5rem' }}>
        <span className="breadcrumb-item" onClick={onClose} style={{ cursor: 'pointer' }}>
          Back to System
        </span>
        <span className="breadcrumb-separator">›</span>
        <span className="breadcrumb-current">{planet.name}</span>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--admin-border)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('info')}
          className={`btn btn-small ${activeTab === 'info' ? '' : 'btn-secondary'}`}
        >
          Basic Info
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
        <button
          onClick={() => setActiveTab('layout')}
          className={`btn btn-small ${activeTab === 'layout' ? '' : 'btn-secondary'}`}
        >
          Layout
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h4 style={{ margin: 0 }}>Markdown Editor</h4>
              <span className="form-hint" style={{ margin: 0, fontSize: '0.85rem' }}>
                {localPlanet.contentMarkdown.length} characters
              </span>
            </div>
            <textarea
              value={localPlanet.contentMarkdown}
              onChange={(e) => handleChange('contentMarkdown', e.target.value)}
              placeholder="# Planet Name&#10;&#10;Add your markdown content here..."
            />
            <span className="form-hint">
              Supports GitHub-flavored markdown. Use headers, lists, bold, italics, code blocks, and more.
            </span>
          </div>
          <div className="editor-panel">
            <h4>Live Preview</h4>
            <div className="markdown-preview">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {localPlanet.contentMarkdown}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'layout' && (
        <>
          <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(74, 144, 226, 0.1)', borderRadius: '4px', border: '1px solid rgba(74, 144, 226, 0.3)' }}>
            <h4 style={{ marginTop: 0, marginBottom: '0.5rem', color: '#4A90E2' }}>Layout Configuration</h4>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#AAAAAA' }}>
              Customize the Planet Viewer layout to control positioning and scale of the 3D render and content panel.
              All values are automatically clamped to safe ranges.
            </p>
          </div>

          <div className="form-group">
            <label>
              Planet Column Width (%)
              <span className="form-hint" style={{ marginLeft: '0.5rem' }}>
                Default: 30%, Range: 20-50%
              </span>
            </label>
            <input
              type="number"
              min="20"
              max="50"
              step="1"
              value={localPlanet.layoutConfig?.planetColumnWidth ?? 30}
              onChange={(e) => {
                const numValue = parseFloat(e.target.value);
                const value = !isNaN(numValue) ? numValue : 30;
                handleChange('layoutConfig', {
                  ...(localPlanet.layoutConfig || {}),
                  planetColumnWidth: value,
                });
              }}
            />
            <span className="form-hint">
              Percentage of screen width for the planet visualization (left side). Higher values emphasize the planet render.
            </span>
          </div>

          <div className="form-group">
            <label>
              Planet Render Scale
              <span className="form-hint" style={{ marginLeft: '0.5rem' }}>
                Default: 1.0, Range: 0.5-2.0
              </span>
            </label>
            <input
              type="number"
              min="0.5"
              max="2.0"
              step="0.1"
              value={localPlanet.layoutConfig?.planetRenderScale ?? 1.0}
              onChange={(e) => {
                const numValue = parseFloat(e.target.value);
                const value = !isNaN(numValue) ? numValue : 1.0;
                handleChange('layoutConfig', {
                  ...(localPlanet.layoutConfig || {}),
                  planetRenderScale: value,
                });
              }}
            />
            <span className="form-hint">
              Scale multiplier for the 3D planet sphere. Use 1.5-2.0 for gas giants, 0.5-0.8 for small bodies.
            </span>
          </div>

          <div className="form-group">
            <label>
              Planet Horizontal Offset (%)
              <span className="form-hint" style={{ marginLeft: '0.5rem' }}>
                Default: 0%, Range: -50 to 50%
              </span>
            </label>
            <input
              type="number"
              min="-50"
              max="50"
              step="5"
              value={localPlanet.layoutConfig?.planetOffsetX ?? 0}
              onChange={(e) => {
                const numValue = parseFloat(e.target.value);
                const value = !isNaN(numValue) ? numValue : 0;
                handleChange('layoutConfig', {
                  ...(localPlanet.layoutConfig || {}),
                  planetOffsetX: value,
                });
              }}
            />
            <span className="form-hint">
              Horizontal position adjustment. Negative values move left, positive values move right.
            </span>
          </div>

          <div className="form-group">
            <label>
              Planet Vertical Offset (%)
              <span className="form-hint" style={{ marginLeft: '0.5rem' }}>
                Default: 0%, Range: -50 to 50%
              </span>
            </label>
            <input
              type="number"
              min="-50"
              max="50"
              step="5"
              value={localPlanet.layoutConfig?.planetOffsetY ?? 0}
              onChange={(e) => {
                const numValue = parseFloat(e.target.value);
                const value = !isNaN(numValue) ? numValue : 0;
                handleChange('layoutConfig', {
                  ...(localPlanet.layoutConfig || {}),
                  planetOffsetY: value,
                });
              }}
            />
            <span className="form-hint">
              Vertical position adjustment. Negative values move up, positive values move down.
            </span>
          </div>

          <div className="form-group">
            <label>
              Content Padding (rem)
              <span className="form-hint" style={{ marginLeft: '0.5rem' }}>
                Default: 2, Range: 1-4
              </span>
            </label>
            <input
              type="number"
              min="1"
              max="4"
              step="0.5"
              value={localPlanet.layoutConfig?.contentPadding ?? 2}
              onChange={(e) => {
                const numValue = parseFloat(e.target.value);
                const value = !isNaN(numValue) ? numValue : 2;
                handleChange('layoutConfig', {
                  ...(localPlanet.layoutConfig || {}),
                  contentPadding: value,
                });
              }}
            />
            <span className="form-hint">
              Internal padding of the content column. Higher values provide more breathing room.
            </span>
          </div>

          <div className="form-group">
            <label>
              Content Max Width (px)
              <span className="form-hint" style={{ marginLeft: '0.5rem' }}>
                Default: 800, Range: 600-1200
              </span>
            </label>
            <input
              type="number"
              min="600"
              max="1200"
              step="50"
              value={localPlanet.layoutConfig?.contentMaxWidth ?? 800}
              onChange={(e) => {
                const numValue = parseFloat(e.target.value);
                const value = !isNaN(numValue) ? numValue : 800;
                handleChange('layoutConfig', {
                  ...(localPlanet.layoutConfig || {}),
                  contentMaxWidth: value,
                });
              }}
            />
            <span className="form-hint">
              Maximum width of the content column. Optimal line length for readability is around 800px.
            </span>
          </div>

          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(255, 200, 0, 0.1)', borderRadius: '4px', border: '1px solid rgba(255, 200, 0, 0.3)' }}>
            <h4 style={{ marginTop: 0, marginBottom: '0.5rem', color: '#FFC800' }}>Reset to Defaults</h4>
            <button
              onClick={() => handleChange('layoutConfig', undefined)}
              className="btn btn-secondary"
              style={{ marginTop: '0.5rem' }}
            >
              Clear Custom Layout
            </button>
            <span className="form-hint" style={{ display: 'block', marginTop: '0.5rem' }}>
              Removes all custom layout settings and uses the default configuration.
            </span>
          </div>
        </>
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
