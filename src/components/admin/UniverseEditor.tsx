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
import { Universe, Galaxy } from '@/lib/universe/types';
import { generateId } from '@/lib/universe/mutate';
import GalaxyEditor from './GalaxyEditor';

interface UniverseEditorProps {
  universe: Universe;
  currentHash: string;
  onUpdate: (universe: Universe) => void;
}

export default function UniverseEditor({
  universe,
  currentHash,
  onUpdate,
}: UniverseEditorProps) {
  const [editingGalaxy, setEditingGalaxy] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [commitMessage, setCommitMessage] = useState('');
  const [createPR, setCreatePR] = useState(false);
  const [localHash, setLocalHash] = useState(currentHash);

  const handleSaveToFile = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/universe', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          universe,
          currentHash: localHash,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({
          type: 'success',
          text: 'Changes saved to disk successfully. Remember to commit when ready!',
        });
        // Update local hash to the new hash from the server
        if (data.hash) {
          setLocalHash(data.hash);
        }
        onUpdate(universe);
      } else if (response.status === 409) {
        setMessage({
          type: 'error',
          text: data.message || 'Conflict detected. Please refresh the page and try again.',
        });
      } else {
        setMessage({
          type: 'error',
          text: data.error || data.message || 'Failed to save changes',
        });
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: 'Failed to connect to server',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCommit = async () => {
    if (!commitMessage.trim()) {
      setMessage({ type: 'error', text: 'Commit message is required' });
      return;
    }

    setCommitting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/universe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commitMessage,
          createPR,
          currentHash: localHash,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({
          type: 'success',
          text: createPR
            ? `Pull request created successfully! ${data.prUrl}`
            : 'Changes committed to GitHub successfully',
        });
        setCommitMessage('');
        onUpdate(universe);
      } else {
        setMessage({
          type: 'error',
          text: data.error || data.message || 'Failed to commit changes',
        });
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: 'Failed to connect to server',
      });
    } finally {
      setCommitting(false);
    }
  };

  const handleAddGalaxy = () => {
    const newGalaxy: Galaxy = {
      id: generateId(`New Galaxy ${Date.now()}`),
      name: 'New Galaxy',
      description: 'A newly discovered galaxy',
      theme: 'blue-white',
      particleColor: '#4A90E2',
      stars: [],
      solarSystems: [],
    };

    onUpdate({
      ...universe,
      galaxies: [...universe.galaxies, newGalaxy],
    });
    setEditingGalaxy(newGalaxy.id);
  };

  const handleUpdateGalaxy = (updatedGalaxy: Galaxy) => {
    onUpdate({
      ...universe,
      galaxies: universe.galaxies.map((g) =>
        g.id === updatedGalaxy.id ? updatedGalaxy : g
      ),
    });
  };

  const handleDeleteGalaxy = (galaxyId: string) => {
    if (!confirm('Are you sure you want to delete this galaxy?')) {
      return;
    }

    onUpdate({
      ...universe,
      galaxies: universe.galaxies.filter((g) => g.id !== galaxyId),
    });
    
    if (editingGalaxy === galaxyId) {
      setEditingGalaxy(null);
    }
  };

  return (
    <div>
      <div className="admin-card">
        <h2>Galaxies</h2>
        
        {message && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="entity-list">
          {universe.galaxies.map((galaxy) => (
            <div key={galaxy.id} className="entity-item">
              <div className="entity-info">
                <h4>{galaxy.name}</h4>
                <p>
                  {galaxy.solarSystems?.length || 0} solar systems,{' '}
                  {galaxy.stars?.length || 0} stars
                </p>
              </div>
              <div className="entity-actions">
                <button
                  onClick={() => setEditingGalaxy(galaxy.id)}
                  className="btn btn-small btn-secondary"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteGalaxy(galaxy.id)}
                  className="btn btn-small btn-danger"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        <button onClick={handleAddGalaxy} className="btn" style={{ marginTop: '1rem' }}>
          + Add Galaxy
        </button>
      </div>

      {editingGalaxy && (
        <div className="admin-card">
          <GalaxyEditor
            galaxy={universe.galaxies.find((g) => g.id === editingGalaxy)!}
            onUpdate={handleUpdateGalaxy}
            onClose={() => setEditingGalaxy(null)}
          />
        </div>
      )}

      <div className="admin-card">
        <h3>Save Changes</h3>
        <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
          Save your edits to disk first, then commit to GitHub when ready.
        </p>
        
        <button
          onClick={handleSaveToFile}
          className="btn"
          disabled={saving}
          style={{ marginBottom: '1rem' }}
        >
          {saving ? 'Saving...' : '💾 Save to Disk'}
        </button>
        
        <span className="form-hint" style={{ display: 'block', marginBottom: '1.5rem' }}>
          Saves changes to local universe.json without committing to GitHub
        </span>
      </div>

      <div className="admin-card">
        <h3>Commit Changes to GitHub</h3>
        <div className="form-group">
          <label htmlFor="commitMessage">Commit Message</label>
          <input
            type="text"
            id="commitMessage"
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder="Describe your changes..."
            required
          />
          <span className="form-hint">
            Describe what changes you made to the universe
          </span>
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={createPR}
              onChange={(e) => setCreatePR(e.target.checked)}
              style={{ marginRight: '0.5rem' }}
            />
            Create Pull Request (recommended for review)
          </label>
          <span className="form-hint">
            If unchecked, changes will be committed directly to main branch
          </span>
        </div>

        <button
          onClick={handleCommit}
          className="btn"
          disabled={committing || !commitMessage.trim()}
        >
          {committing ? 'Committing...' : createPR ? '🔀 Create PR' : '✓ Commit to GitHub'}
        </button>
      </div>
    </div>
  );
}
