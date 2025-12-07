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
import { useRouter } from 'next/navigation';
import { Universe, Galaxy } from '@/lib/universe/types';
import { generateId } from '@/lib/universe/mutate';
import GalaxyEditor from './GalaxyEditor';
import Modal from './Modal';
import NotificationBanner, { NotificationType } from './NotificationBanner';

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
  const router = useRouter();
  const [editingGalaxy, setEditingGalaxy] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [notification, setNotification] = useState<{ type: NotificationType; message: string } | null>(null);
  const [commitMessage, setCommitMessage] = useState('');
  const [createPR, setCreatePR] = useState(false);
  const [localHash, setLocalHash] = useState(currentHash);
  const [retrying, setRetrying] = useState(false);

  const handleSaveToFile = async () => {
    setSaving(true);
    setNotification(null);
    setRetrying(false);

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
        setNotification({
          type: 'success',
          message: 'Changes saved successfully! Your edits are now persisted locally.',
        });
        // Update local hash to the new hash from the server
        if (data.hash) {
          setLocalHash(data.hash);
        }
        onUpdate(universe);
      } else if (response.status === 409) {
        setNotification({
          type: 'error',
          message: data.message || 'Conflict detected: The file has been modified by another user. Please refresh and try again.',
        });
      } else if (response.status === 401) {
        setNotification({
          type: 'error',
          message: 'Unauthorized. Please log in again.',
        });
        // Redirect to login after 5 seconds to give users time to read the message
        setTimeout(() => {
          router.push('/admin/login');
        }, 5000);
      } else {
        setNotification({
          type: 'error',
          message: data.error || data.message || 'Failed to save changes. Please try again.',
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setNotification({
        type: 'error',
        message: `Network error: Unable to connect to the server. ${errorMessage}`,
      });
      setRetrying(true);
    } finally {
      setSaving(false);
    }
  };

  const handleCommit = async () => {
    if (!commitMessage.trim()) {
      setNotification({ type: 'error', message: 'Commit message is required. Please describe your changes.' });
      return;
    }

    setCommitting(true);
    setNotification(null);
    setRetrying(false);

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
        const prMessage = createPR && data.prUrl
          ? ` View your pull request: ${data.prUrl}`
          : '';
        setNotification({
          type: 'success',
          message: createPR
            ? `Pull request created successfully!${prMessage}`
            : 'Changes committed to GitHub successfully. Your updates are now live.',
        });
        setCommitMessage('');
        onUpdate(universe);
      } else if (response.status === 401) {
        setNotification({
          type: 'error',
          message: 'Unauthorized. Please log in again.',
        });
        setTimeout(() => {
          router.push('/admin/login');
        }, 5000);
      } else {
        setNotification({
          type: 'error',
          message: data.error || data.message || 'Failed to commit changes. Please try again.',
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setNotification({
        type: 'error',
        message: `Network error: Unable to connect to the server. ${errorMessage}`,
      });
      setRetrying(true);
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
    // Auto-close the modal after successful update
    setEditingGalaxy(null);
    setNotification({
      type: 'success',
      message: `Galaxy "${updatedGalaxy.name}" updated successfully. Remember to save your changes!`,
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
      {/* Global notification banner */}
      {notification && (
        <NotificationBanner
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
          autoClose={notification.type === 'success'}
          autoCloseDelay={5000}
        />
      )}

      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>Content Management</h2>
          <button onClick={handleAddGalaxy} className="btn">
            + Add New Galaxy
          </button>
        </div>
        
        <p style={{ color: 'var(--admin-text-muted)', marginBottom: '1.5rem' }}>
          Manage your galaxies, solar systems, and planets. Click on any galaxy to edit its details.
        </p>

        <div className="content-list">
          {universe.galaxies.map((galaxy) => (
            <div key={galaxy.id} className="content-card">
              <div className="content-card-header">
                <div>
                  <h3 className="content-card-title">{galaxy.name}</h3>
                  <p className="content-card-meta">
                    {galaxy.solarSystems?.length || 0} solar systems · {galaxy.stars?.length || 0} stars
                  </p>
                </div>
              </div>
              <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.9rem', margin: '0.5rem 0' }}>
                {galaxy.description}
              </p>
              <div className="content-card-actions">
                <button
                  onClick={() => setEditingGalaxy(galaxy.id)}
                  className="btn btn-small"
                >
                  Edit Galaxy
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

        {universe.galaxies.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--admin-text-muted)' }}>
            <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>No galaxies yet</p>
            <p style={{ marginBottom: '1.5rem' }}>Get started by creating your first galaxy</p>
            <button onClick={handleAddGalaxy} className="btn">
              + Create First Galaxy
            </button>
          </div>
        )}
      </div>

      {/* Galaxy Editor Modal */}
      <Modal
        isOpen={!!editingGalaxy}
        onClose={() => setEditingGalaxy(null)}
        title={editingGalaxy ? `Edit: ${universe.galaxies.find((g) => g.id === editingGalaxy)?.name}` : 'Edit Galaxy'}
        size="large"
      >
        {editingGalaxy && (
          <GalaxyEditor
            galaxy={universe.galaxies.find((g) => g.id === editingGalaxy)!}
            onUpdate={handleUpdateGalaxy}
            onClose={() => setEditingGalaxy(null)}
          />
        )}
      </Modal>

      <div className="admin-card">
        <h3>💾 Save Changes</h3>
        <p style={{ marginBottom: '1rem', color: 'var(--admin-text-muted)' }}>
          Save your edits to disk. Your changes will be persisted locally and ready for commit.
        </p>
        
        {retrying && (
          <div className="retry-container" style={{ padding: '1rem', margin: '1rem 0' }}>
            <p className="retry-message">
              Unable to save. Check your network connection and try again.
            </p>
          </div>
        )}

        <button
          onClick={handleSaveToFile}
          className="btn"
          disabled={saving}
        >
          {saving ? (
            <>
              <span className="loading-spinner"></span>
              Saving...
            </>
          ) : (
            '💾 Save to Disk'
          )}
        </button>
        
        <span className="form-hint" style={{ display: 'block', marginTop: '0.5rem' }}>
          Saves changes to local universe.json without committing to GitHub
        </span>
      </div>

      <div className="admin-card">
        <h3>🔀 Commit to GitHub</h3>
        <p style={{ marginBottom: '1rem', color: 'var(--admin-text-muted)' }}>
          After saving locally, commit your changes to GitHub to make them live.
        </p>

        <div className="form-group">
          <label htmlFor="commitMessage">Commit Message *</label>
          <input
            type="text"
            id="commitMessage"
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder="e.g., Add new Andromeda galaxy with 3 solar systems"
            required
            className={!commitMessage.trim() && committing ? 'error' : ''}
          />
          {!commitMessage.trim() && (
            <span className="form-hint" style={{ color: 'var(--admin-warning)' }}>
              A commit message is required to describe your changes
            </span>
          )}
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={createPR}
              onChange={(e) => setCreatePR(e.target.checked)}
              style={{ marginRight: '0.5rem' }}
            />
            Create Pull Request (recommended for team review)
          </label>
          <span className="form-hint">
            Creates a new branch and pull request for review before merging
          </span>
        </div>

        <button
          onClick={handleCommit}
          className="btn"
          disabled={committing || !commitMessage.trim()}
        >
          {committing ? (
            <>
              <span className="loading-spinner"></span>
              Committing...
            </>
          ) : createPR ? (
            '🔀 Create Pull Request'
          ) : (
            '✓ Commit to Main Branch'
          )}
        </button>
      </div>
    </div>
  );
}
