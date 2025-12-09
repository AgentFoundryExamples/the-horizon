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

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Universe } from '@/lib/universe/types';
import UniverseEditor from '@/components/admin/UniverseEditor';
import GraphicsConfigEditor from '@/components/admin/GraphicsConfigEditor';
import { useGraphicsConfig } from '@/lib/graphics-context';

export default function AdminPage() {
  const [universe, setUniverse] = useState<Universe | null>(null);
  const [gitBaseHash, setGitBaseHash] = useState<string>('');
  const [localDiskHash, setLocalDiskHash] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState<'content' | 'graphics'>('content');
  const router = useRouter();
  const { config: graphicsConfig, updateConfig: updateGraphicsConfig } = useGraphicsConfig();

  useEffect(() => {
    fetchUniverse();
  }, []);

  const fetchUniverse = async () => {
    try {
      const response = await fetch('/api/admin/universe');
      if (response.status === 401) {
        router.push('/admin/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch universe');
      }

      const data = await response.json();
      setUniverse(data.universe);
      // Initialize both hashes from the response
      // gitBaseHash can be null if GitHub is unreachable
      // Use localDiskHash as fallback for initial state, but log warning
      const baseHash = data.gitBaseHash || data.hash || '';
      if (!data.gitBaseHash && data.localDiskHash) {
        console.warn('[Admin Page] GitHub baseline unavailable, using local hash as fallback. Dual-hash benefits may be limited.');
      }
      setGitBaseHash(baseHash);
      setLocalDiskHash(data.localDiskHash || data.hash || '');
      
      if (data.validationErrors && data.validationErrors.length > 0) {
        console.warn('Validation warnings:', data.validationErrors);
      }
    } catch (err) {
      setError('Failed to load universe data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/admin/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (loading) {
    return <div className="loading">Loading universe data...</div>;
  }

  if (error) {
    return (
      <div className="admin-card">
        <div className="alert alert-error">{error}</div>
        <button onClick={fetchUniverse} className="btn">
          Retry
        </button>
      </div>
    );
  }

  if (!universe) {
    return (
      <div className="admin-card">
        <div className="alert alert-error">No universe data found</div>
      </div>
    );
  }

  const stats = {
    galaxies: universe.galaxies.length,
    solarSystems: universe.galaxies.reduce(
      (acc, g) => acc + (g.solarSystems?.length || 0),
      0
    ),
    planets: universe.galaxies.reduce(
      (acc, g) =>
        acc +
        (g.solarSystems?.reduce((acc2, s) => acc2 + (s.planets?.length || 0), 0) || 0),
      0
    ),
    moons: universe.galaxies.reduce(
      (acc, g) =>
        acc +
        (g.solarSystems?.reduce(
          (acc2, s) =>
            acc2 +
            (s.planets?.reduce((acc3, p) => acc3 + (p.moons?.length || 0), 0) || 0),
          0
        ) || 0),
      0
    ),
    stars: universe.galaxies.reduce((acc, g) => acc + (g.stars?.length || 0), 0),
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>Universe Dashboard</h1>
        <button onClick={handleLogout} className="btn btn-secondary">
          Logout
        </button>
      </div>

      <div className="admin-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.galaxies}</div>
          <div className="stat-label">Galaxies</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.solarSystems}</div>
          <div className="stat-label">Solar Systems</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.planets}</div>
          <div className="stat-label">Planets</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.moons}</div>
          <div className="stat-label">Moons</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.stars}</div>
          <div className="stat-label">Stars</div>
        </div>
      </div>

      {/* Section Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '2px solid var(--admin-border)' }}>
        <button
          onClick={() => setActiveSection('content')}
          className={`btn btn-small ${activeSection === 'content' ? '' : 'btn-secondary'}`}
          style={{
            borderRadius: '4px 4px 0 0',
            borderBottom: activeSection === 'content' ? '2px solid #4A90E2' : 'none',
            marginBottom: '-2px',
          }}
        >
          📝 Content Management
        </button>
        <button
          onClick={() => setActiveSection('graphics')}
          className={`btn btn-small ${activeSection === 'graphics' ? '' : 'btn-secondary'}`}
          style={{
            borderRadius: '4px 4px 0 0',
            borderBottom: activeSection === 'graphics' ? '2px solid #4A90E2' : 'none',
            marginBottom: '-2px',
          }}
        >
          🎨 Graphics Configuration
        </button>
      </div>

      {/* Content Section */}
      {activeSection === 'content' && (
        <UniverseEditor
          universe={universe}
          gitBaseHash={gitBaseHash}
          localDiskHash={localDiskHash}
          onUpdate={(updatedUniverse, newLocalHash, newGitBaseHash) => {
            setUniverse(updatedUniverse);
            // Update local disk hash if provided
            if (newLocalHash && typeof newLocalHash === 'string' && newLocalHash.trim()) {
              setLocalDiskHash(newLocalHash);
            }
            // Update git base hash if provided (after successful commit)
            if (newGitBaseHash && typeof newGitBaseHash === 'string' && newGitBaseHash.trim()) {
              setGitBaseHash(newGitBaseHash);
            }
          }}
        />
      )}

      {/* Graphics Section */}
      {activeSection === 'graphics' && (
        <div className="admin-card">
          <h2>Graphics Configuration</h2>
          <p style={{ color: 'var(--admin-text-muted)', marginBottom: '1.5rem' }}>
            Configure visual settings for all views. Changes are saved automatically to localStorage and take effect immediately.
          </p>
          
          <GraphicsConfigEditor
            initialConfig={graphicsConfig}
            onChange={updateGraphicsConfig}
            showLivePreview={true}
          />

          <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'rgba(74, 144, 226, 0.1)', borderRadius: '4px', border: '1px solid rgba(74, 144, 226, 0.3)' }}>
            <h4 style={{ marginTop: 0, color: '#4A90E2' }}>💡 Graphics Configuration Tips</h4>
            <ul style={{ marginBottom: 0, color: '#AAAAAA' }}>
              <li>All changes are saved automatically to browser localStorage</li>
              <li>Settings persist across sessions until reset or cleared</li>
              <li>Use Import/Export to share configurations between browsers/devices</li>
              <li>Test extreme values carefully - some may impact performance</li>
              <li>Low Power Mode reduces quality for better performance on mobile devices</li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
