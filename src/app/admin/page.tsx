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

export default function AdminPage() {
  const [universe, setUniverse] = useState<Universe | null>(null);
  const [gitBaseHash, setGitBaseHash] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

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
      // Initialize gitBaseHash from the response
      // gitBaseHash can be null if GitHub is unreachable
      const baseHash = data.gitBaseHash || data.hash || '';
      if (!data.gitBaseHash) {
        console.warn('[Admin Page] GitHub baseline unavailable, using local hash as fallback. Dual-hash benefits may be limited.');
      }
      setGitBaseHash(baseHash);
      
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

      <UniverseEditor
        universe={universe}
        gitBaseHash={gitBaseHash}
        onUpdate={(updatedUniverse, newGitBaseHash) => {
          setUniverse(updatedUniverse);
          // Update git base hash if provided (after successful commit)
          if (newGitBaseHash && typeof newGitBaseHash === 'string' && newGitBaseHash.trim()) {
            setGitBaseHash(newGitBaseHash);
          }
        }}
      />
    </>
  );
}
