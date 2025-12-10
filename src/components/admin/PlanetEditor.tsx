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
import { Planet, Moon, ExternalLink } from '@/lib/universe/types';
import { generateId } from '@/lib/universe/mutate';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CELESTIAL_THEME_PRESETS, validateHexColor, clampGlowIntensity, clampRotationSpeed } from '@/lib/universe/visual-themes';

interface PlanetEditorProps {
  planet: Planet;
  onUpdate: (planet: Planet, originalId: string) => void;
  onClose: () => void;
}

export default function PlanetEditor({ planet, onUpdate, onClose }: PlanetEditorProps) {
  const [originalPlanetId] = useState(planet.id || '');
  const [localPlanet, setLocalPlanet] = useState(planet);
  const [activeTab, setActiveTab] = useState<'info' | 'content' | 'moons' | 'links' | 'layout' | 'visuals'>('info');
  const [editingMoon, setEditingMoon] = useState<number | null>(null);
  const [editingLink, setEditingLink] = useState<number | null>(null);

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

  // Link management functions
  const handleAddLink = () => {
    // Generate a unique default URL to avoid immediate duplicate detection
    const timestamp = Date.now();
    const newLink: ExternalLink = {
      title: 'New Link',
      url: `https://example.com/link-${timestamp}`,
      description: '',
    };

    const updated = {
      ...localPlanet,
      externalLinks: [...(localPlanet.externalLinks || []), newLink],
    };
    setLocalPlanet(updated);
    setEditingLink((localPlanet.externalLinks || []).length);
  };

  const handleUpdateLink = (index: number, field: keyof ExternalLink, value: string) => {
    const updated = {
      ...localPlanet,
      externalLinks: (localPlanet.externalLinks || []).map((link, i) =>
        i === index ? { ...link, [field]: value } : link
      ),
    };
    setLocalPlanet(updated);
  };

  const handleDeleteLink = (index: number) => {
    if (!confirm('Are you sure you want to delete this link?')) {
      return;
    }

    const updated = {
      ...localPlanet,
      externalLinks: (localPlanet.externalLinks || []).filter((_, i) => i !== index),
    };
    setLocalPlanet(updated);
    
    if (editingLink === index) {
      setEditingLink(null);
    }
  };

  const handleMoveLink = (index: number, direction: 'up' | 'down') => {
    const links = [...(localPlanet.externalLinks || [])];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= links.length) {
      return;
    }

    [links[index], links[newIndex]] = [links[newIndex], links[index]];
    
    // Use callback form of setState to avoid race conditions
    setLocalPlanet(prev => ({
      ...prev,
      externalLinks: links,
    }));

    // Update editing index using callback form to ensure correct state
    setEditingLink(currentEditingLink => {
      if (currentEditingLink === index) {
        return newIndex;
      } else if (currentEditingLink === newIndex) {
        return index;
      }
      return currentEditingLink;
    });
  };

  // URL validation helper
  const validateLinkUrl = (url: string): string | null => {
    if (!url || url.trim().length === 0) {
      return 'URL is required';
    }

    try {
      const urlObj = new URL(url);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return 'URL must use http or https protocol';
      }
      return null;
    } catch (error: unknown) {
      return 'Invalid URL format';
    }
  };

  // Check for duplicate URLs
  const isDuplicateUrl = (url: string, currentIndex: number): boolean => {
    const links = localPlanet.externalLinks || [];
    const normalizedUrl = url.trim().toLowerCase();
    
    return links.some((link, index) => 
      index !== currentIndex && 
      link.url.trim().toLowerCase() === normalizedUrl
    );
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
          onClick={() => setActiveTab('links')}
          className={`btn btn-small ${activeTab === 'links' ? '' : 'btn-secondary'}`}
        >
          Links ({localPlanet.externalLinks?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('layout')}
          className={`btn btn-small ${activeTab === 'layout' ? '' : 'btn-secondary'}`}
        >
          Layout
        </button>
        <button
          onClick={() => setActiveTab('visuals')}
          className={`btn btn-small ${activeTab === 'visuals' ? '' : 'btn-secondary'}`}
        >
          Visuals
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

      {activeTab === 'visuals' && (
        <>
          <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(74, 144, 226, 0.1)', borderRadius: '4px', border: '1px solid rgba(74, 144, 226, 0.3)' }}>
            <h4 style={{ marginTop: 0, marginBottom: '0.5rem', color: '#4A90E2' }}>Visual Theme Configuration</h4>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#AAAAAA' }}>
              Customize the planet&apos;s appearance with theme presets, glow effects, and rotation settings.
              All values are optional and will fallback to theme-based defaults.
            </p>
          </div>

          <div className="form-group">
            <label>
              Theme Preset
              <span className="form-hint" style={{ marginLeft: '0.5rem' }}>
                Quick preset selection for common planet types
              </span>
            </label>
            <select
              value={localPlanet.visualTheme?.preset || ''}
              onChange={(e) => {
                const presetName = e.target.value || undefined;
                const preset = presetName ? CELESTIAL_THEME_PRESETS[presetName] : undefined;
                
                // Apply preset values when selected
                if (preset) {
                  handleChange('visualTheme', {
                    preset: presetName,
                    glowColor: preset.glowColor,
                    glowIntensity: preset.glowIntensity,
                    rotationSpeed: preset.rotationSpeed,
                    // Preserve any existing texture URLs
                    diffuseTexture: localPlanet.visualTheme?.diffuseTexture,
                    normalTexture: localPlanet.visualTheme?.normalTexture,
                    specularTexture: localPlanet.visualTheme?.specularTexture,
                  });
                } else {
                  handleChange('visualTheme', {
                    ...(localPlanet.visualTheme || {}),
                    preset: undefined,
                  });
                }
              }}
            >
              <option value="">Default (from base theme)</option>
              <option value="rocky">Rocky</option>
              <option value="gasGiant">Gas Giant</option>
              <option value="icy">Icy</option>
              <option value="volcanic">Volcanic</option>
              <option value="earth-like">Earth-like</option>
              <option value="blue-green">Blue-Green</option>
              <option value="red">Red</option>
              <option value="desert">Desert</option>
            </select>
            <span className="form-hint">
              Presets provide sensible defaults for glow color, intensity, and rotation speed
            </span>
          </div>

          <div className="form-group">
            <label>
              Glow Color
              <span className="form-hint" style={{ marginLeft: '0.5rem' }}>
                Hex color for theme-colored border/glow effect
              </span>
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="color"
                value={localPlanet.visualTheme?.glowColor || '#CCCCCC'}
                onChange={(e) => {
                  const validColor = validateHexColor(e.target.value, '#CCCCCC');
                  handleChange('visualTheme', {
                    ...(localPlanet.visualTheme || {}),
                    glowColor: validColor,
                  });
                }}
                style={{ width: '60px', height: '40px', cursor: 'pointer', border: '2px solid var(--admin-border)', borderRadius: '4px' }}
              />
              <input
                type="text"
                value={localPlanet.visualTheme?.glowColor || ''}
                onChange={(e) => {
                  const validColor = validateHexColor(e.target.value, localPlanet.visualTheme?.glowColor || '#CCCCCC');
                  handleChange('visualTheme', {
                    ...(localPlanet.visualTheme || {}),
                    glowColor: validColor,
                  });
                }}
                placeholder="#CCCCCC"
                style={{ flex: 1 }}
              />
            </div>
            <span className="form-hint">
              Leave empty to use color from theme preset. Changes apply to planet glow effect.
            </span>
          </div>

          <div className="form-group">
            <label>
              Glow Intensity
              <span className="form-hint" style={{ marginLeft: '0.5rem' }}>
                Current: {((localPlanet.visualTheme?.glowIntensity ?? 0.3) * 100).toFixed(0)}%
              </span>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={localPlanet.visualTheme?.glowIntensity ?? 0.3}
              onChange={(e) => {
                const value = clampGlowIntensity(parseFloat(e.target.value));
                handleChange('visualTheme', {
                  ...(localPlanet.visualTheme || {}),
                  glowIntensity: value,
                });
              }}
              style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#888' }}>
              <span>No glow (0%)</span>
              <span>Maximum glow (100%)</span>
            </div>
            <span className="form-hint">
              Controls the prominence of the planet&apos;s atmospheric glow effect
            </span>
          </div>

          <div className="form-group">
            <label>
              Rotation Speed
              <span className="form-hint" style={{ marginLeft: '0.5rem' }}>
                Current: {(localPlanet.visualTheme?.rotationSpeed ?? 1.0).toFixed(1)}x
              </span>
            </label>
            <input
              type="range"
              min="0.1"
              max="3.0"
              step="0.1"
              value={localPlanet.visualTheme?.rotationSpeed ?? 1.0}
              onChange={(e) => {
                const value = clampRotationSpeed(parseFloat(e.target.value));
                handleChange('visualTheme', {
                  ...(localPlanet.visualTheme || {}),
                  rotationSpeed: value,
                });
              }}
              style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#888' }}>
              <span>Slow (0.1x)</span>
              <span>Normal (1x)</span>
              <span>Fast (3x)</span>
            </div>
            <span className="form-hint">
              Multiplier for planet rotation speed. Gas giants typically rotate faster.
            </span>
          </div>

          <div className="form-group">
            <label>
              Diffuse Texture URL (Optional)
              <span className="form-hint" style={{ marginLeft: '0.5rem' }}>
                Advanced: Surface texture
              </span>
            </label>
            <input
              type="text"
              value={localPlanet.visualTheme?.diffuseTexture || ''}
              onChange={(e) => handleChange('visualTheme', {
                ...(localPlanet.visualTheme || {}),
                diffuseTexture: e.target.value,
              })}
              placeholder="/universe/assets/earth-texture.jpg"
            />
            <span className="form-hint">
              URL or path to surface texture. Leave empty for solid color rendering.
            </span>
          </div>

          <div className="form-group">
            <label>
              Normal Map URL (Optional)
              <span className="form-hint" style={{ marginLeft: '0.5rem' }}>
                Advanced: Surface detail
              </span>
            </label>
            <input
              type="text"
              value={localPlanet.visualTheme?.normalTexture || ''}
              onChange={(e) => handleChange('visualTheme', {
                ...(localPlanet.visualTheme || {}),
                normalTexture: e.target.value,
              })}
              placeholder="/universe/assets/earth-normal.jpg"
            />
            <span className="form-hint">
              Normal map for surface detail. Enhances visual depth without geometry complexity.
            </span>
          </div>

          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(255, 200, 0, 0.1)', borderRadius: '4px', border: '1px solid rgba(255, 200, 0, 0.3)' }}>
            <h4 style={{ marginTop: 0, marginBottom: '0.5rem', color: '#FFC800' }}>Reset to Defaults</h4>
            <button
              onClick={() => handleChange('visualTheme', undefined)}
              className="btn btn-secondary"
              style={{ marginTop: '0.5rem' }}
            >
              Clear Visual Theme
            </button>
            <span className="form-hint" style={{ display: 'block', marginTop: '0.5rem' }}>
              Removes all custom visual settings and uses theme-based defaults.
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

      {activeTab === 'links' && (
        <>
          <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(74, 144, 226, 0.1)', borderRadius: '4px', border: '1px solid rgba(74, 144, 226, 0.3)' }}>
            <h4 style={{ marginTop: 0, marginBottom: '0.5rem', color: '#4A90E2' }}>External Links Management</h4>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--admin-text-muted)' }}>
              Add, edit, and organize external links for this planet. Links appear in the &quot;Related Resources&quot; section on the planet page.
              URLs must use http or https protocol and must be unique.
            </p>
          </div>

          {(localPlanet.externalLinks || []).length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--admin-text-muted)', background: 'var(--admin-bg)', borderRadius: '4px', border: '1px dashed var(--admin-border)' }}>
              <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No links yet</p>
              <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>Add external links to provide references and related resources for this planet</p>
            </div>
          )}

          <div className="entity-list">
            {(localPlanet.externalLinks || []).map((link, index) => {
              const urlError = validateLinkUrl(link.url);
              const isDuplicate = isDuplicateUrl(link.url, index);
              const hasError = urlError || isDuplicate;

              return (
                <div key={index}>
                  <div className="entity-item">
                    <div className="entity-info">
                      <h4>
                        {link.title || 'Untitled Link'}
                        {hasError && <span style={{ color: 'var(--admin-danger)', marginLeft: '0.5rem', fontSize: '0.9rem' }}>⚠</span>}
                      </h4>
                      <p style={{ wordBreak: 'break-all' }}>
                        {link.url || 'No URL'}
                        {isDuplicate && <span style={{ color: 'var(--admin-danger)', fontSize: '0.85rem', marginLeft: '0.5rem' }}>(Duplicate)</span>}
                      </p>
                    </div>
                    <div className="entity-actions" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button
                        onClick={() => handleMoveLink(index, 'up')}
                        disabled={index === 0}
                        className="btn btn-small btn-secondary"
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => handleMoveLink(index, 'down')}
                        disabled={index === (localPlanet.externalLinks || []).length - 1}
                        className="btn btn-small btn-secondary"
                        title="Move down"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => setEditingLink(editingLink === index ? null : index)}
                        className="btn btn-small btn-secondary"
                      >
                        {editingLink === index ? 'Collapse' : 'Edit'}
                      </button>
                      <button
                        onClick={() => handleDeleteLink(index)}
                        className="btn btn-small btn-danger"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {editingLink === index && (
                    <div style={{ padding: '1rem', background: 'var(--admin-bg)', marginTop: '0.5rem', borderRadius: '4px' }}>
                      <div className="form-group">
                        <label>
                          Link Title *
                          <span className="form-hint" style={{ marginLeft: '0.5rem' }}>
                            Short descriptive title (e.g., &quot;NASA Earth Observatory&quot;)
                          </span>
                        </label>
                        <input
                          type="text"
                          value={link.title}
                          onChange={(e) => handleUpdateLink(index, 'title', e.target.value)}
                          placeholder="e.g., NASA Earth Observatory"
                          className={!link.title?.trim() ? 'error' : ''}
                        />
                        {!link.title?.trim() && (
                          <span className="form-hint" style={{ color: 'var(--admin-danger)' }}>
                            Title is required
                          </span>
                        )}
                      </div>

                      <div className="form-group">
                        <label>
                          URL *
                          <span className="form-hint" style={{ marginLeft: '0.5rem' }}>
                            Must use http:// or https:// protocol
                          </span>
                        </label>
                        <input
                          type="url"
                          value={link.url}
                          onChange={(e) => handleUpdateLink(index, 'url', e.target.value)}
                          placeholder="https://example.com"
                          className={hasError ? 'error' : ''}
                        />
                        {urlError && (
                          <span className="form-hint" style={{ color: 'var(--admin-danger)' }}>
                            {urlError}
                          </span>
                        )}
                        {!urlError && isDuplicate && (
                          <span className="form-hint" style={{ color: 'var(--admin-danger)' }}>
                            This URL is already used in another link
                          </span>
                        )}
                      </div>

                      <div className="form-group">
                        <label>
                          Description (Optional)
                          <span className="form-hint" style={{ marginLeft: '0.5rem' }}>
                            Brief context about this resource
                          </span>
                        </label>
                        <textarea
                          value={link.description || ''}
                          onChange={(e) => handleUpdateLink(index, 'description', e.target.value)}
                          rows={2}
                          placeholder="e.g., Satellite imagery and scientific data about Earth"
                        />
                      </div>

                      <div style={{ padding: '0.75rem', background: 'rgba(74, 144, 226, 0.1)', borderRadius: '4px', border: '1px solid rgba(74, 144, 226, 0.3)', marginTop: '1rem' }}>
                        <h4 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '0.9rem', color: '#4A90E2' }}>Preview</h4>
                        <div style={{ fontSize: '0.9rem' }}>
                          <strong>{link.title || 'Untitled Link'}</strong>
                          <br />
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#4A90E2', textDecoration: 'underline', wordBreak: 'break-all' }}
                          >
                            {link.url || 'No URL'}
                          </a>
                          {link.description && (
                            <>
                              <br />
                              <span style={{ color: '#888888' }}>{link.description}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button onClick={handleAddLink} className="btn" style={{ marginTop: '1rem' }}>
            + Add Link
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
