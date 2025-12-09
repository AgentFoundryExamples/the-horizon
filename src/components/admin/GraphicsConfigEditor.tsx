'use client';

/**
 * Graphics Configuration Editor
 * 
 * Admin UI for tuning all GraphicsConfig parameters across all views.
 * Provides sliders, inputs, and presets for designers to adjust visual settings
 * without touching code.
 */

import { useState, useEffect } from 'react';
import {
  GraphicsConfig,
  UniverseConfig,
  GalaxyViewConfig,
  SolarSystemViewConfig,
  PlanetViewConfig,
  HoverLabelConfig,
  validateGraphicsConfig,
  serializeGraphicsConfig,
  deserializeGraphicsConfig,
} from '@/lib/graphics/config';
import { DEFAULT_GRAPHICS_CONFIG, getPlanetMaterialPresetIds } from '@/lib/graphics/presets';

interface GraphicsConfigEditorProps {
  initialConfig?: GraphicsConfig;
  onChange?: (config: GraphicsConfig) => void;
  showLivePreview?: boolean;
}

type TabType = 'universe' | 'galaxy' | 'solar-system' | 'planet' | 'materials' | 'import-export';

export default function GraphicsConfigEditor({
  initialConfig,
  onChange,
  showLivePreview = false,
}: GraphicsConfigEditorProps) {
  const [config, setConfig] = useState<GraphicsConfig>(initialConfig || DEFAULT_GRAPHICS_CONFIG);
  const [activeTab, setActiveTab] = useState<TabType>('universe');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [importExportText, setImportExportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  // Validate config whenever it changes
  useEffect(() => {
    const validation = validateGraphicsConfig(config);
    setValidationErrors(validation.errors);
    setValidationWarnings(validation.warnings);
    
    if (validation.valid && onChange) {
      onChange(config);
    }
  }, [config, onChange]);

  const handleUniverseChange = (field: keyof UniverseConfig, value: unknown) => {
    setConfig((prev) => ({
      ...prev,
      universe: { ...prev.universe, [field]: value },
    }));
  };

  const handleGalaxyViewChange = (field: keyof GalaxyViewConfig, value: unknown) => {
    setConfig((prev) => ({
      ...prev,
      galaxyView: { ...prev.galaxyView, [field]: value },
    }));
  };

  const handleSolarSystemViewChange = (field: keyof SolarSystemViewConfig, value: unknown) => {
    setConfig((prev) => ({
      ...prev,
      solarSystemView: { ...prev.solarSystemView, [field]: value },
    }));
  };

  const handlePlanetViewChange = (field: keyof PlanetViewConfig, value: unknown) => {
    setConfig((prev) => ({
      ...prev,
      planetView: { ...prev.planetView, [field]: value },
    }));
  };

  const handleHoverLabelChange = (
    view: 'galaxyView' | 'solarSystemView' | 'planetView',
    field: keyof HoverLabelConfig,
    value: unknown
  ) => {
    setConfig((prev) => ({
      ...prev,
      [view]: {
        ...prev[view],
        hoverLabels: {
          ...(prev[view].hoverLabels || {}),
          [field]: value,
        },
      },
    }));
  };

  const handleReset = () => {
    if (confirm('Reset all graphics settings to defaults? This cannot be undone.')) {
      setConfig(DEFAULT_GRAPHICS_CONFIG);
    }
  };

  const handleExport = () => {
    const exported = serializeGraphicsConfig(config);
    setImportExportText(exported);
    setImportError(null);
  };

  const handleImport = () => {
    try {
      const { config: importedConfig, validation } = deserializeGraphicsConfig(importExportText);
      
      if (!validation.valid) {
        setImportError(`Import failed: ${validation.errors.join(', ')}`);
        return;
      }
      
      if (validation.warnings.length > 0) {
        console.warn('Import warnings:', validation.warnings);
      }
      
      setConfig(importedConfig);
      setImportError(null);
      setImportExportText('');
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Unknown import error');
    }
  };

  const renderNumberInput = (
    label: string,
    value: number | undefined,
    onChange: (value: number) => void,
    min: number,
    max: number,
    step: number,
    defaultValue: number,
    hint?: string
  ) => (
    <div className="form-group">
      <label>
        {label}
        <span className="form-hint" style={{ marginLeft: '0.5rem' }}>
          Default: {defaultValue}, Range: {min}-{max}
        </span>
      </label>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value ?? defaultValue}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          style={{ flex: 1 }}
        />
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value ?? defaultValue}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          style={{ width: '100px' }}
        />
      </div>
      {hint && <span className="form-hint">{hint}</span>}
    </div>
  );

  const renderCheckbox = (
    label: string,
    checked: boolean | undefined,
    onChange: (value: boolean) => void,
    defaultValue: boolean,
    hint?: string
  ) => (
    <div className="form-group">
      <label>
        <input
          type="checkbox"
          checked={checked ?? defaultValue}
          onChange={(e) => onChange(e.target.checked)}
          style={{ marginRight: '0.5rem' }}
        />
        {label}
      </label>
      {hint && <span className="form-hint">{hint}</span>}
    </div>
  );

  return (
    <div>
      {/* Validation Messages */}
      {validationErrors.length > 0 && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          <strong>Validation Errors:</strong>
          <ul style={{ marginTop: '0.5rem', marginBottom: 0 }}>
            {validationErrors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      
      {validationWarnings.length > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: '1rem', backgroundColor: 'rgba(255, 200, 0, 0.1)', border: '1px solid rgba(255, 200, 0, 0.3)' }}>
          <strong>Warnings:</strong>
          <ul style={{ marginTop: '0.5rem', marginBottom: 0 }}>
            {validationWarnings.map((warning, i) => (
              <li key={i}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--admin-border)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('universe')}
          className={`btn btn-small ${activeTab === 'universe' ? '' : 'btn-secondary'}`}
        >
          Universe
        </button>
        <button
          onClick={() => setActiveTab('galaxy')}
          className={`btn btn-small ${activeTab === 'galaxy' ? '' : 'btn-secondary'}`}
        >
          Galaxy View
        </button>
        <button
          onClick={() => setActiveTab('solar-system')}
          className={`btn btn-small ${activeTab === 'solar-system' ? '' : 'btn-secondary'}`}
        >
          Solar System
        </button>
        <button
          onClick={() => setActiveTab('planet')}
          className={`btn btn-small ${activeTab === 'planet' ? '' : 'btn-secondary'}`}
        >
          Planet View
        </button>
        <button
          onClick={() => setActiveTab('materials')}
          className={`btn btn-small ${activeTab === 'materials' ? '' : 'btn-secondary'}`}
        >
          Materials
        </button>
        <button
          onClick={() => setActiveTab('import-export')}
          className={`btn btn-small ${activeTab === 'import-export' ? '' : 'btn-secondary'}`}
        >
          Import/Export
        </button>
      </div>

      {/* Universe Tab */}
      {activeTab === 'universe' && (
        <div>
          <h3>Universe Settings</h3>
          <p style={{ color: 'var(--admin-text-muted)', marginBottom: '1.5rem' }}>
            Global settings affecting the entire scene
          </p>

          {renderNumberInput(
            'Global Scale Multiplier',
            config.universe.globalScaleMultiplier,
            (v) => handleUniverseChange('globalScaleMultiplier', v),
            0.1,
            5.0,
            0.1,
            1.0,
            'Scales all 3D objects uniformly'
          )}

          {renderNumberInput(
            'Background Star Density',
            config.universe.backgroundStarDensity,
            (v) => handleUniverseChange('backgroundStarDensity', v),
            0,
            1,
            0.05,
            0.5,
            'Density of background starfield (0-1)'
          )}

          {renderCheckbox(
            'Low Power Mode',
            config.universe.lowPowerMode,
            (v) => handleUniverseChange('lowPowerMode', v),
            false,
            'Enable mobile/low-power optimizations (reduces particle counts and effects)'
          )}

          {renderNumberInput(
            'Fallback Quality',
            config.universe.fallbackQuality,
            (v) => handleUniverseChange('fallbackQuality', Math.round(v)),
            1,
            3,
            1,
            2,
            'Quality level when auto-detection fails (1=low, 2=medium, 3=high)'
          )}

          {renderCheckbox(
            'Anti-Aliasing',
            config.universe.antiAliasing,
            (v) => handleUniverseChange('antiAliasing', v),
            true,
            'Smooth edges (may impact performance)'
          )}

          {renderNumberInput(
            'Shadow Quality',
            config.universe.shadowQuality,
            (v) => handleUniverseChange('shadowQuality', Math.round(v)),
            0,
            2,
            1,
            1,
            'Shadow rendering quality (0=off, 1=low, 2=high)'
          )}
        </div>
      )}

      {/* Galaxy View Tab */}
      {activeTab === 'galaxy' && (
        <div>
          <h3>Galaxy View Settings</h3>
          <p style={{ color: 'var(--admin-text-muted)', marginBottom: '1.5rem' }}>
            Settings for galaxy overview rendering
          </p>

          {renderNumberInput(
            'Galaxy Opacity',
            config.galaxyView.galaxyOpacity,
            (v) => handleGalaxyViewChange('galaxyOpacity', v),
            0,
            1,
            0.05,
            0.7,
            'Transparency of galaxy particle clouds'
          )}

          {renderNumberInput(
            'Star Brightness',
            config.galaxyView.starBrightness,
            (v) => handleGalaxyViewChange('starBrightness', v),
            0.1,
            3.0,
            0.1,
            1.0,
            'Brightness multiplier for stars'
          )}

          {renderNumberInput(
            'Star Density',
            config.galaxyView.starDensity,
            (v) => handleGalaxyViewChange('starDensity', v),
            0.1,
            2.0,
            0.1,
            1.0,
            'Number of visible stars (higher = more particles)'
          )}

          {renderNumberInput(
            'Rotation Speed',
            config.galaxyView.rotationSpeed,
            (v) => handleGalaxyViewChange('rotationSpeed', v),
            0,
            5.0,
            0.1,
            1.0,
            'Galaxy rotation animation speed'
          )}

          {renderNumberInput(
            'Camera Zoom',
            config.galaxyView.cameraZoom,
            (v) => handleGalaxyViewChange('cameraZoom', v),
            0.5,
            2.0,
            0.1,
            1.0,
            'Default camera zoom level'
          )}

          <h4 style={{ marginTop: '2rem' }}>Hover Labels</h4>
          
          {renderCheckbox(
            'Enable Hover Labels',
            config.galaxyView.hoverLabels?.enabled,
            (v) => handleHoverLabelChange('galaxyView', 'enabled', v),
            true,
            'Show labels when hovering over galaxies'
          )}

          {renderNumberInput(
            'Font Size',
            config.galaxyView.hoverLabels?.fontSize,
            (v) => handleHoverLabelChange('galaxyView', 'fontSize', v),
            10,
            24,
            1,
            14,
            'Label text size in pixels'
          )}

          {renderNumberInput(
            'Background Opacity',
            config.galaxyView.hoverLabels?.backgroundOpacity,
            (v) => handleHoverLabelChange('galaxyView', 'backgroundOpacity', v),
            0,
            1,
            0.05,
            0.85,
            'Label background transparency'
          )}

          {renderNumberInput(
            'Visibility Distance',
            config.galaxyView.hoverLabels?.visibilityDistance,
            (v) => handleHoverLabelChange('galaxyView', 'visibilityDistance', v),
            0,
            100,
            5,
            50,
            'Max distance for label visibility (world units)'
          )}

          {renderNumberInput(
            'Show Delay',
            config.galaxyView.hoverLabels?.showDelay,
            (v) => handleHoverLabelChange('galaxyView', 'showDelay', v),
            0,
            1000,
            50,
            200,
            'Delay before showing label (milliseconds)'
          )}
        </div>
      )}

      {/* Solar System Tab */}
      {activeTab === 'solar-system' && (
        <div>
          <h3>Solar System View Settings</h3>
          <p style={{ color: 'var(--admin-text-muted)', marginBottom: '1.5rem' }}>
            Settings for solar system rendering with orbiting planets
          </p>

          {renderNumberInput(
            'Orbit Stroke Width',
            config.solarSystemView.orbitStrokeWidth,
            (v) => handleSolarSystemViewChange('orbitStrokeWidth', v),
            0.5,
            5.0,
            0.1,
            1.5,
            'Width of orbit path lines'
          )}

          {renderNumberInput(
            'Planet Scale Multiplier',
            config.solarSystemView.planetScaleMultiplier,
            (v) => handleSolarSystemViewChange('planetScaleMultiplier', v),
            0.1,
            3.0,
            0.1,
            1.0,
            'Scale of planets relative to system'
          )}

          {renderNumberInput(
            'Orbit Animation Speed',
            config.solarSystemView.orbitAnimationSpeed,
            (v) => handleSolarSystemViewChange('orbitAnimationSpeed', v),
            0,
            10.0,
            0.1,
            1.0,
            'Speed of orbital motion'
          )}

          {renderNumberInput(
            'Star Glow Intensity',
            config.solarSystemView.starGlowIntensity,
            (v) => handleSolarSystemViewChange('starGlowIntensity', v),
            0,
            2.0,
            0.1,
            1.0,
            'Intensity of central star glow'
          )}

          {renderNumberInput(
            'Orbital Spacing',
            config.solarSystemView.orbitalSpacing,
            (v) => handleSolarSystemViewChange('orbitalSpacing', v),
            0.5,
            3.0,
            0.1,
            1.0,
            'Distance between orbital planes'
          )}

          {renderNumberInput(
            'Camera Distance',
            config.solarSystemView.cameraDistance,
            (v) => handleSolarSystemViewChange('cameraDistance', v),
            0.5,
            2.0,
            0.1,
            1.0,
            'Camera distance from system center'
          )}

          <h4 style={{ marginTop: '2rem' }}>Hover Labels</h4>
          
          {renderCheckbox(
            'Enable Hover Labels',
            config.solarSystemView.hoverLabels?.enabled,
            (v) => handleHoverLabelChange('solarSystemView', 'enabled', v),
            true,
            'Show labels when hovering over planets'
          )}

          {renderNumberInput(
            'Font Size',
            config.solarSystemView.hoverLabels?.fontSize,
            (v) => handleHoverLabelChange('solarSystemView', 'fontSize', v),
            10,
            24,
            1,
            14,
            'Label text size in pixels'
          )}

          {renderNumberInput(
            'Background Opacity',
            config.solarSystemView.hoverLabels?.backgroundOpacity,
            (v) => handleHoverLabelChange('solarSystemView', 'backgroundOpacity', v),
            0,
            1,
            0.05,
            0.85,
            'Label background transparency'
          )}

          {renderNumberInput(
            'Visibility Distance',
            config.solarSystemView.hoverLabels?.visibilityDistance,
            (v) => handleHoverLabelChange('solarSystemView', 'visibilityDistance', v),
            0,
            100,
            5,
            50,
            'Max distance for label visibility (world units)'
          )}

          {renderNumberInput(
            'Show Delay',
            config.solarSystemView.hoverLabels?.showDelay,
            (v) => handleHoverLabelChange('solarSystemView', 'showDelay', v),
            0,
            1000,
            50,
            200,
            'Delay before showing label (milliseconds)'
          )}
        </div>
      )}

      {/* Planet View Tab */}
      {activeTab === 'planet' && (
        <div>
          <h3>Planet View Settings</h3>
          <p style={{ color: 'var(--admin-text-muted)', marginBottom: '1.5rem' }}>
            Settings for detailed planet rendering
          </p>

          {renderNumberInput(
            'Planet Render Scale',
            config.planetView.planetRenderScale,
            (v) => handlePlanetViewChange('planetRenderScale', v),
            0.5,
            2.0,
            0.1,
            1.0,
            'Size of the 3D planet model'
          )}

          {renderNumberInput(
            'Rotation Speed',
            config.planetView.rotationSpeed,
            (v) => handlePlanetViewChange('rotationSpeed', v),
            0,
            5.0,
            0.1,
            1.0,
            'Planet rotation speed'
          )}

          {renderNumberInput(
            'Atmosphere Glow',
            config.planetView.atmosphereGlow,
            (v) => handlePlanetViewChange('atmosphereGlow', v),
            0,
            2.0,
            0.1,
            1.0,
            'Atmospheric glow intensity'
          )}

          {renderNumberInput(
            'Cloud Opacity',
            config.planetView.cloudOpacity,
            (v) => handlePlanetViewChange('cloudOpacity', v),
            0,
            1,
            0.05,
            0.6,
            'Cloud layer transparency (if applicable)'
          )}

          {renderNumberInput(
            'Lighting Intensity',
            config.planetView.lightingIntensity,
            (v) => handlePlanetViewChange('lightingIntensity', v),
            0.1,
            3.0,
            0.1,
            1.0,
            'Overall lighting brightness'
          )}

          {renderCheckbox(
            'Rim Lighting',
            config.planetView.rimLighting,
            (v) => handlePlanetViewChange('rimLighting', v),
            true,
            'Enable rim lighting effect (edge highlighting)'
          )}

          <h4 style={{ marginTop: '2rem' }}>Hover Labels (Moons)</h4>
          
          {renderCheckbox(
            'Enable Hover Labels',
            config.planetView.hoverLabels?.enabled,
            (v) => handleHoverLabelChange('planetView', 'enabled', v),
            true,
            'Show labels when hovering over moons'
          )}

          {renderNumberInput(
            'Font Size',
            config.planetView.hoverLabels?.fontSize,
            (v) => handleHoverLabelChange('planetView', 'fontSize', v),
            10,
            24,
            1,
            14,
            'Label text size in pixels'
          )}

          {renderNumberInput(
            'Background Opacity',
            config.planetView.hoverLabels?.backgroundOpacity,
            (v) => handleHoverLabelChange('planetView', 'backgroundOpacity', v),
            0,
            1,
            0.05,
            0.85,
            'Label background transparency'
          )}

          {renderNumberInput(
            'Visibility Distance',
            config.planetView.hoverLabels?.visibilityDistance,
            (v) => handleHoverLabelChange('planetView', 'visibilityDistance', v),
            0,
            100,
            5,
            50,
            'Max distance for label visibility (world units)'
          )}

          {renderNumberInput(
            'Show Delay',
            config.planetView.hoverLabels?.showDelay,
            (v) => handleHoverLabelChange('planetView', 'showDelay', v),
            0,
            1000,
            50,
            200,
            'Delay before showing label (milliseconds)'
          )}
        </div>
      )}

      {/* Materials Tab */}
      {activeTab === 'materials' && (
        <div>
          <h3>Planet Material Presets</h3>
          <p style={{ color: 'var(--admin-text-muted)', marginBottom: '1.5rem' }}>
            Available planet material presets. Custom materials coming in future release.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
            {getPlanetMaterialPresetIds().map((presetId) => {
              const material = config.planetMaterials[presetId];
              if (!material) return null;

              return (
                <div
                  key={presetId}
                  style={{
                    padding: '1rem',
                    border: '1px solid var(--admin-border)',
                    borderRadius: '4px',
                    backgroundColor: 'var(--admin-bg)',
                  }}
                >
                  <h4 style={{ marginTop: 0, marginBottom: '0.5rem' }}>{material.name}</h4>
                  <div
                    style={{
                      width: '100%',
                      height: '80px',
                      backgroundColor: material.baseColor,
                      borderRadius: '4px',
                      marginBottom: '0.5rem',
                    }}
                  />
                  <p style={{ fontSize: '0.85rem', color: 'var(--admin-text-muted)', marginBottom: '0.5rem' }}>
                    {material.description}
                  </p>
                  <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
                    <div>Roughness: {material.roughness?.toFixed(1) || '0.5'}</div>
                    <div>Metallic: {material.metallic?.toFixed(1) || '0.0'}</div>
                    <div>Rim: {material.rimIntensity?.toFixed(1) || '0.5'}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'rgba(74, 144, 226, 0.1)', borderRadius: '4px', border: '1px solid rgba(74, 144, 226, 0.3)' }}>
            <h4 style={{ marginTop: 0, color: '#4A90E2' }}>Custom Materials</h4>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#AAAAAA' }}>
              Custom material editing will be available in a future release. For now, you can modify materials programmatically
              using the <code>createCustomPlanetMaterial</code> function from <code>@/lib/graphics/presets</code>.
            </p>
          </div>
        </div>
      )}

      {/* Import/Export Tab */}
      {activeTab === 'import-export' && (
        <div>
          <h3>Import/Export Configuration</h3>
          <p style={{ color: 'var(--admin-text-muted)', marginBottom: '1.5rem' }}>
            Export your current configuration as JSON or import a saved configuration.
          </p>

          <div className="form-group">
            <label>Configuration JSON</label>
            <textarea
              value={importExportText}
              onChange={(e) => setImportExportText(e.target.value)}
              rows={15}
              placeholder="Paste JSON configuration here to import, or click Export to see current config"
              style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
            />
          </div>

          {importError && (
            <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
              {importError}
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={handleExport} className="btn">
              Export Current Config
            </button>
            <button
              onClick={handleImport}
              className="btn btn-secondary"
              disabled={!importExportText.trim()}
            >
              Import Config
            </button>
            <button onClick={() => setImportExportText('')} className="btn btn-secondary">
              Clear
            </button>
          </div>

          <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'rgba(255, 200, 0, 0.1)', borderRadius: '4px', border: '1px solid rgba(255, 200, 0, 0.3)' }}>
            <h4 style={{ marginTop: 0, color: '#FFC800' }}>⚠️ Configuration Safety</h4>
            <ul style={{ marginBottom: 0, color: '#AAAAAA' }}>
              <li>Always validate imported configurations before applying</li>
              <li>Keep backups of working configurations</li>
              <li>Test extreme values in a non-production environment first</li>
              <li>Configurations are stored in localStorage and persist across sessions</li>
            </ul>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="btn-group" style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--admin-border)' }}>
        <button onClick={handleReset} className="btn btn-secondary">
          Reset to Defaults
        </button>
        
        {showLivePreview && (
          <div style={{ marginLeft: 'auto', color: '#4A90E2' }}>
            ✓ Live Preview Active
          </div>
        )}
      </div>
    </div>
  );
}
