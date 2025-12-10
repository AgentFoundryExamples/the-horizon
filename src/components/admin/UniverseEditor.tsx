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

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Universe, Galaxy } from '@/lib/universe/types';
import { generateId } from '@/lib/universe/mutate';
import GalaxyEditor from './GalaxyEditor';
import Modal from './Modal';
import NotificationBanner, { NotificationType } from './NotificationBanner';
import InlineNotification from './InlineNotification';

interface UniverseEditorProps {
  universe: Universe;
  gitBaseHash: string;
  onUpdate: (universe: Universe, newGitBaseHash?: string) => void;
}

export default function UniverseEditor({
  universe,
  gitBaseHash,
  onUpdate,
}: UniverseEditorProps) {
  const router = useRouter();
  const [editingGalaxy, setEditingGalaxy] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [creatingPR, setCreatingPR] = useState(false);
  const [notification, setNotification] = useState<{ type: NotificationType; message: string } | null>(null);
  const [saveNotification, setSaveNotification] = useState<{ type: NotificationType; message: string } | null>(null);
  const [prNotification, setPRNotification] = useState<{ type: NotificationType; message: string } | null>(null);
  const [commitMessage, setCommitMessage] = useState('');
  const [prMessage, setPRMessage] = useState('');
  const [retrying, setRetrying] = useState(false);

  // Stable callbacks for notification close handlers to prevent timer resets
  const handleCloseSaveNotification = useCallback(() => {
    setSaveNotification(null);
  }, []);

  const handleClosePRNotification = useCallback(() => {
    setPRNotification(null);
  }, []);

  const handleSaveToGitHub = async () => {
    if (!commitMessage.trim()) {
      setSaveNotification({ type: 'error', message: 'Commit message is required. Please describe your changes.' });
      return;
    }

    setSaving(true);
    setSaveNotification(null);
    setRetrying(false);

    try {
      const response = await fetch('/api/admin/universe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          universe,
          commitMessage,
          createPR: false, // Direct commit to main branch
          gitBaseHash,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSaveNotification({
          type: 'success',
          message: 'Changes committed to GitHub successfully! Your updates are now live.',
        });
        setCommitMessage('');
        // Update gitBaseHash to the new hash from GitHub
        if (data.hash) {
          onUpdate(universe, data.hash);
        }
      } else if (response.status === 409) {
        setSaveNotification({
          type: 'error',
          message: data.error || data.message || 'Conflict detected: The file was modified in GitHub. Please refresh and try again.',
        });
        setRetrying(true);
      } else if (response.status === 401) {
        setSaveNotification({
          type: 'error',
          message: 'Unauthorized. Please log in again.',
        });
        setTimeout(() => {
          router.push('/admin/login');
        }, 5000);
      } else {
        setSaveNotification({
          type: 'error',
          message: data.error || data.message || 'Failed to commit changes. Please try again.',
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setSaveNotification({
        type: 'error',
        message: `Network error: Unable to connect to the server. ${errorMessage}`,
      });
      setRetrying(true);
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePR = async () => {
    if (!prMessage.trim()) {
      setPRNotification({ type: 'error', message: 'PR message is required. Please describe your changes.' });
      return;
    }

    setCreatingPR(true);
    setPRNotification(null);
    setRetrying(false);

    try {
      const response = await fetch('/api/admin/universe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          universe,
          commitMessage: prMessage,
          createPR: true, // Create pull request
          gitBaseHash,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const prUrlMessage = data.prUrl
          ? ` View your pull request: ${data.prUrl}`
          : '';
        setPRNotification({
          type: 'success',
          message: `Pull request created successfully!${prUrlMessage}`,
        });
        setPRMessage('');
        // Update gitBaseHash after PR creation
        if (data.hash) {
          onUpdate(universe, data.hash);
        }
      } else if (response.status === 409) {
        setPRNotification({
          type: 'error',
          message: data.error || data.message || 'Conflict detected: The file was modified in GitHub. Please refresh and try again.',
        });
        setRetrying(true);
      } else if (response.status === 401) {
        setPRNotification({
          type: 'error',
          message: 'Unauthorized. Please log in again.',
        });
        setTimeout(() => {
          router.push('/admin/login');
        }, 5000);
      } else {
        setPRNotification({
          type: 'error',
          message: data.error || data.message || 'Failed to create pull request. Please try again.',
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setPRNotification({
        type: 'error',
        message: `Network error: Unable to connect to the server. ${errorMessage}`,
      });
      setRetrying(true);
    } finally {
      setCreatingPR(false);
    }
  };

  const handleAddGalaxy = () => {
    // Generate a guaranteed unique ID using timestamp to avoid collisions
    const timestamp = Date.now();
    const newGalaxy: Galaxy = {
      id: `new-galaxy-${timestamp}`,
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

  const handleUpdateGalaxy = (updatedGalaxy: Galaxy, originalId: string) => {
    onUpdate({
      ...universe,
      galaxies: universe.galaxies.map((g) =>
        g.id === originalId ? updatedGalaxy : g
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

  // Memoize galaxy lookup to avoid redundant array searches on every render
  const editingGalaxyData = editingGalaxy 
    ? universe.galaxies.find((g) => g.id === editingGalaxy)
    : undefined;

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
        title={editingGalaxyData ? `Edit: ${editingGalaxyData.name}` : 'Edit Galaxy'}
        size="large"
      >
        {editingGalaxy && (
          editingGalaxyData ? (
            <GalaxyEditor
              galaxy={editingGalaxyData}
              onUpdate={handleUpdateGalaxy}
              onClose={() => setEditingGalaxy(null)}
            />
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <p>Galaxy not found. This may be a temporary issue.</p>
              <button onClick={() => setEditingGalaxy(null)} className="btn" style={{ marginTop: '1rem' }}>
                Close
              </button>
            </div>
          )
        )}
      </Modal>

      <div className="admin-card">
        <h3>✓ Save to GitHub</h3>
        <p style={{ marginBottom: '1rem', color: 'var(--admin-text-muted)' }}>
          Commit your changes directly to the main branch. Changes go live immediately.
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
            className={!commitMessage.trim() && saving ? 'error' : ''}
          />
          {!commitMessage.trim() && (
            <span className="form-hint" style={{ color: 'var(--admin-warning)' }}>
              A commit message is required to describe your changes
            </span>
          )}
        </div>

        <div className="action-section">
          <button
            onClick={handleSaveToGitHub}
            className="btn"
            disabled={saving || !commitMessage.trim()}
          >
            {saving ? (
              <>
                <span className="loading-spinner"></span>
                Committing...
              </>
            ) : (
              '✓ Commit to Main Branch'
            )}
          </button>
          
          {saving && (
            <InlineNotification
              type="pending"
              message="Committing changes to GitHub..."
              autoClose={false}
            />
          )}
          
          {saveNotification && (
            <InlineNotification
              type={saveNotification.type}
              message={saveNotification.message}
              onClose={handleCloseSaveNotification}
              autoClose={saveNotification.type === 'success'}
              autoCloseDelay={7000}
            />
          )}
          
          <span className="form-hint" style={{ display: 'block', marginTop: saveNotification || saving ? '0.25rem' : '0.5rem' }}>
            Changes are committed directly to main branch and deployed automatically
          </span>
        </div>
      </div>

      <div className="admin-card">
        <h3>🔀 Create Pull Request</h3>
        <p style={{ marginBottom: '1rem', color: 'var(--admin-text-muted)' }}>
          Create a pull request for team review before merging changes.
        </p>

        <div className="form-group">
          <label htmlFor="prMessage">Pull Request Message *</label>
          <input
            type="text"
            id="prMessage"
            value={prMessage}
            onChange={(e) => setPRMessage(e.target.value)}
            placeholder="e.g., Add new Andromeda galaxy for review"
            required
            className={!prMessage.trim() && creatingPR ? 'error' : ''}
          />
          {!prMessage.trim() && (
            <span className="form-hint" style={{ color: 'var(--admin-warning)' }}>
              A message is required to describe your pull request
            </span>
          )}
          <span className="form-hint">
            Creates a new branch and pull request for review before merging
          </span>
        </div>

        <div className="action-section">
          <button
            onClick={handleCreatePR}
            className="btn"
            disabled={creatingPR || !prMessage.trim()}
          >
            {creatingPR ? (
              <>
                <span className="loading-spinner"></span>
                Creating PR...
              </>
            ) : (
              '🔀 Create Pull Request'
            )}
          </button>
          
          {creatingPR && (
            <InlineNotification
              type="pending"
              message="Creating pull request..."
              autoClose={false}
            />
          )}
          
          {prNotification && (
            <InlineNotification
              type={prNotification.type}
              message={prNotification.message}
              onClose={handleClosePRNotification}
              autoClose={prNotification.type === 'success'}
              autoCloseDelay={7000}
            />
          )}
        </div>
      </div>
    </div>
  );
}
