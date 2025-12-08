import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import UniverseEditor from '../UniverseEditor';
import { Universe } from '@/lib/universe/types';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock fetch
global.fetch = jest.fn();

describe('UniverseEditor - Dual Hash System', () => {
  const mockUniverse: Universe = {
    galaxies: [
      {
        id: 'test-galaxy',
        name: 'Test Galaxy',
        description: 'A test galaxy',
        theme: 'blue-white',
        particleColor: '#4A90E2',
        stars: [],
        solarSystems: [],
      },
    ],
  };

  const mockOnUpdate = jest.fn();
  const initialGitBaseHash = 'git-base-abc123';
  const initialLocalDiskHash = 'git-base-abc123'; // Initially in sync

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Save to Disk - preserves gitBaseHash', () => {
    it('should update only localDiskHash when saving to disk, preserving gitBaseHash', async () => {
      const newLocalHash = 'local-disk-def456';
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, hash: newLocalHash }),
      });

      render(
        <UniverseEditor
          universe={mockUniverse}
          gitBaseHash={initialGitBaseHash}
          localDiskHash={initialLocalDiskHash}
          onUpdate={mockOnUpdate}
        />
      );

      const saveButton = screen.getByText('💾 Save to Disk');
      fireEvent.click(saveButton);

      await waitFor(() => {
        // Check that onUpdate was called with universe and newLocalHash
        // Third parameter (gitBaseHash) is not passed, so it should remain unchanged in parent
        expect(mockOnUpdate).toHaveBeenCalledWith(
          mockUniverse,
          newLocalHash, // localDiskHash updated
        );
      });

      // Verify the PATCH call used localDiskHash
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/universe',
        expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining(initialLocalDiskHash),
        })
      );
    });

    it('should handle multiple saves without affecting gitBaseHash', async () => {
      const firstNewHash = 'local-disk-def456';
      const secondNewHash = 'local-disk-ghi789';
      
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, hash: firstNewHash }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, hash: secondNewHash }),
        });

      render(
        <UniverseEditor
          universe={mockUniverse}
          gitBaseHash={initialGitBaseHash}
          localDiskHash={initialLocalDiskHash}
          onUpdate={mockOnUpdate}
        />
      );

      const saveButton = screen.getByText('💾 Save to Disk');
      
      // First save
      fireEvent.click(saveButton);
      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenNthCalledWith(
          1,
          mockUniverse,
          firstNewHash,
        );
      });

      // Second save
      fireEvent.click(saveButton);
      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenNthCalledWith(
          2,
          mockUniverse,
          secondNewHash,
        );
      });

      expect(mockOnUpdate).toHaveBeenCalledTimes(2);
    });
  });

  describe('Commit to GitHub - uses gitBaseHash', () => {
    it('should use gitBaseHash for commit operation, not localDiskHash', async () => {
      const localDiskHash = 'local-disk-changed-123';
      const commitResponseHash = 'github-commit-xyz789';
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ 
          success: true, 
          hash: commitResponseHash,
          message: 'Changes committed successfully',
        }),
      });

      render(
        <UniverseEditor
          universe={mockUniverse}
          gitBaseHash={initialGitBaseHash}
          localDiskHash={localDiskHash}
          onUpdate={mockOnUpdate}
        />
      );

      // Fill in commit message
      const commitMessageInput = screen.getByLabelText(/Commit Message/i);
      fireEvent.change(commitMessageInput, { target: { value: 'Test commit' } });

      const commitButton = screen.getByText('✓ Commit to Main Branch');
      fireEvent.click(commitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/admin/universe',
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining(initialGitBaseHash), // Uses gitBaseHash, not localDiskHash
          })
        );
      });

      // Verify body doesn't contain localDiskHash
      const fetchCall = (global.fetch as jest.Mock).mock.calls.find(
        call => call[1]?.method === 'POST'
      );
      expect(fetchCall[1].body).not.toContain(localDiskHash);
    });

    it('should update both hashes after successful commit', async () => {
      const localDiskHash = 'local-disk-changed-123';
      const newHash = 'github-commit-xyz789';
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ 
          success: true, 
          hash: newHash,
          message: 'Changes committed successfully',
        }),
      });

      render(
        <UniverseEditor
          universe={mockUniverse}
          gitBaseHash={initialGitBaseHash}
          localDiskHash={localDiskHash}
          onUpdate={mockOnUpdate}
        />
      );

      const commitMessageInput = screen.getByLabelText(/Commit Message/i);
      fireEvent.change(commitMessageInput, { target: { value: 'Test commit' } });

      const commitButton = screen.getByText('✓ Commit to Main Branch');
      fireEvent.click(commitButton);

      await waitFor(() => {
        // Both hashes should be updated to the new GitHub hash
        const lastCall = mockOnUpdate.mock.calls[mockOnUpdate.mock.calls.length - 1];
        expect(lastCall[0]).toEqual(mockUniverse); // universe
        expect(lastCall[1]).toBe(newHash); // localDiskHash updated
        expect(lastCall[2]).toBe(newHash); // gitBaseHash updated
      });
    });

    it('should warn and not update hashes when commit hash not returned', async () => {
      const localDiskHash = 'local-disk-changed-123';
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ 
          success: true,
          message: 'Changes committed successfully',
          // No hash in response
        }),
      });

      render(
        <UniverseEditor
          universe={mockUniverse}
          gitBaseHash={initialGitBaseHash}
          localDiskHash={localDiskHash}
          onUpdate={mockOnUpdate}
        />
      );

      const commitMessageInput = screen.getByLabelText(/Commit Message/i);
      fireEvent.change(commitMessageInput, { target: { value: 'Test commit' } });

      const commitButton = screen.getByText('✓ Commit to Main Branch');
      fireEvent.click(commitButton);

      await waitFor(() => {
        // When no hash is returned, onUpdate is called with just universe (no hash updates)
        // This logs a warning and requires user to refresh
        const lastCall = mockOnUpdate.mock.calls[mockOnUpdate.mock.calls.length - 1];
        expect(lastCall[0]).toEqual(mockUniverse);
        expect(lastCall.length).toBe(1); // Only universe parameter passed
      });
    });
  });

  describe('Conflict detection', () => {
    it('should detect conflicts during save using localDiskHash', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({ 
          error: 'Conflict detected',
          message: 'The file has been modified. Please refresh and try again.',
        }),
      });

      render(
        <UniverseEditor
          universe={mockUniverse}
          gitBaseHash={initialGitBaseHash}
          localDiskHash={initialLocalDiskHash}
          onUpdate={mockOnUpdate}
        />
      );

      const saveButton = screen.getByText('💾 Save to Disk');
      fireEvent.click(saveButton);

      await waitFor(() => {
        // In conflict case, no update is called since save fails
        expect(screen.getByText(/The file has been modified/i)).toBeInTheDocument();
      });

      // Verify gitBaseHash was not passed to save operation
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.currentHash).toBe(initialLocalDiskHash);
    });
  });

  describe('Hash lifecycle', () => {
    it('should maintain gitBaseHash through multiple edit-save cycles', async () => {
      const saveHashes = ['hash1', 'hash2', 'hash3'];
      let callCount = 0;
      
      (global.fetch as jest.Mock).mockImplementation(() => {
        const hash = saveHashes[callCount++];
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, hash }),
        });
      });

      render(
        <UniverseEditor
          universe={mockUniverse}
          gitBaseHash={initialGitBaseHash}
          localDiskHash={initialLocalDiskHash}
          onUpdate={mockOnUpdate}
        />
      );

      const saveButton = screen.getByText('💾 Save to Disk');
      
      // Multiple saves
      for (let i = 0; i < 3; i++) {
        fireEvent.click(saveButton);
        await waitFor(() => {
          expect(mockOnUpdate).toHaveBeenNthCalledWith(
            i + 1,
            mockUniverse,
            saveHashes[i],
          );
        });
      }

      // Verify gitBaseHash parameter was never updated in any call (only 2 params passed)
      mockOnUpdate.mock.calls.forEach(call => {
        expect(call.length).toBe(2); // Only universe and localDiskHash passed
      });
    });
  });
});
