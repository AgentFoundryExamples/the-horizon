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

describe('UniverseEditor - Inline Notifications', () => {
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
  const gitBaseHash = 'git-base-hash-123';
  const localDiskHash = 'local-disk-hash-456';

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Save to Disk - Inline Notifications', () => {
    it('should show pending state inline when saving', async () => {
      (global.fetch as jest.Mock).mockImplementation(() =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({ success: true, hash: 'new-hash' }),
            });
          }, 100);
        })
      );

      render(
        <UniverseEditor
          universe={mockUniverse}
          gitBaseHash={gitBaseHash}
          localDiskHash={localDiskHash}
          onUpdate={mockOnUpdate}
        />
      );

      const saveButton = screen.getByText('💾 Save to Disk');
      fireEvent.click(saveButton);

      // Check for pending notification inline
      await waitFor(() => {
        expect(screen.getByText('Saving changes to disk...')).toBeInTheDocument();
      });

      // Verify it has the correct role for screen readers
      const pendingNotification = screen.getByText('Saving changes to disk...').closest('[role="status"]');
      expect(pendingNotification).toBeInTheDocument();
    });

    it('should show success notification inline after save', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, hash: 'new-hash' }),
      });

      render(
        <UniverseEditor
          universe={mockUniverse}
          gitBaseHash={gitBaseHash}
          localDiskHash={localDiskHash}
          onUpdate={mockOnUpdate}
        />
      );

      const saveButton = screen.getByText('💾 Save to Disk');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText('Changes saved successfully! Your edits are now persisted locally.')
        ).toBeInTheDocument();
      });

      // Verify it's in an inline notification with status role
      const successNotification = screen.getByText(
        'Changes saved successfully! Your edits are now persisted locally.'
      ).closest('[role="status"]');
      expect(successNotification).toBeInTheDocument();
      expect(successNotification).toHaveClass('inline-notification-success');
    });

    it('should show error notification inline when save fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' }),
      });

      render(
        <UniverseEditor
          universe={mockUniverse}
          gitBaseHash={gitBaseHash}
          localDiskHash={localDiskHash}
          onUpdate={mockOnUpdate}
        />
      );

      const saveButton = screen.getByText('💾 Save to Disk');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Internal server error')).toBeInTheDocument();
      });

      // Verify error is displayed inline
      const errorNotification = screen.getByText('Internal server error').closest('[role="status"]');
      expect(errorNotification).toBeInTheDocument();
      expect(errorNotification).toHaveClass('inline-notification-error');
    });

    it('should show conflict error inline with guidance', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({
          message: 'Conflict detected: The file has been modified.',
        }),
      });

      render(
        <UniverseEditor
          universe={mockUniverse}
          gitBaseHash={gitBaseHash}
          localDiskHash={localDiskHash}
          onUpdate={mockOnUpdate}
        />
      );

      const saveButton = screen.getByText('💾 Save to Disk');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/Conflict detected/)).toBeInTheDocument();
      });
    });

    it('should handle long error messages without breaking layout', async () => {
      const longError =
        'This is a very long error message that contains detailed information about what went wrong. It includes technical details and guidance on how to resolve the issue. The message should wrap properly without breaking the layout or hiding the save button.';

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: longError }),
      });

      render(
        <UniverseEditor
          universe={mockUniverse}
          gitBaseHash={gitBaseHash}
          localDiskHash={localDiskHash}
          onUpdate={mockOnUpdate}
        />
      );

      const saveButton = screen.getByText('💾 Save to Disk');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(longError)).toBeInTheDocument();
      });

      // Verify button is still visible and accessible
      expect(saveButton).toBeVisible();
    });

    it('should allow closing success notification', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, hash: 'new-hash' }),
      });

      render(
        <UniverseEditor
          universe={mockUniverse}
          gitBaseHash={gitBaseHash}
          localDiskHash={localDiskHash}
          onUpdate={mockOnUpdate}
        />
      );

      const saveButton = screen.getByText('💾 Save to Disk');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText('Changes saved successfully! Your edits are now persisted locally.')
        ).toBeInTheDocument();
      });

      // Click close button
      const closeButton = screen.getByLabelText('Close notification');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(
          screen.queryByText('Changes saved successfully! Your edits are now persisted locally.')
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Commit to GitHub - Inline Notifications', () => {
    it('should show pending state inline when committing', async () => {
      (global.fetch as jest.Mock).mockImplementation(() =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({ success: true }),
            });
          }, 100);
        })
      );

      render(
        <UniverseEditor
          universe={mockUniverse}
          gitBaseHash={gitBaseHash}
          localDiskHash={localDiskHash}
          onUpdate={mockOnUpdate}
        />
      );

      // Enter commit message
      const commitInput = screen.getByLabelText(/Commit Message/);
      fireEvent.change(commitInput, { target: { value: 'Test commit' } });

      const commitButton = screen.getByText('✓ Commit to Main Branch');
      fireEvent.click(commitButton);

      await waitFor(() => {
        expect(screen.getByText('Committing changes to GitHub...')).toBeInTheDocument();
      });

      const pendingNotification = screen.getByText('Committing changes to GitHub...').closest('[role="status"]');
      expect(pendingNotification).toBeInTheDocument();
    });

    it('should show success notification inline after commit', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(
        <UniverseEditor
          universe={mockUniverse}
          gitBaseHash={gitBaseHash}
          localDiskHash={localDiskHash}
          onUpdate={mockOnUpdate}
        />
      );

      const commitInput = screen.getByLabelText(/Commit Message/);
      fireEvent.change(commitInput, { target: { value: 'Test commit' } });

      const commitButton = screen.getByText('✓ Commit to Main Branch');
      fireEvent.click(commitButton);

      await waitFor(() => {
        expect(
          screen.getByText('Changes committed to GitHub successfully. Your updates are now live.')
        ).toBeInTheDocument();
      });

      const successNotification = screen.getByText(
        'Changes committed to GitHub successfully. Your updates are now live.'
      ).closest('[role="status"]');
      expect(successNotification).toBeInTheDocument();
      expect(successNotification).toHaveClass('inline-notification-success');
    });

    it('should show error notification inline when commit fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'GitHub API error' }),
      });

      render(
        <UniverseEditor
          universe={mockUniverse}
          gitBaseHash={gitBaseHash}
          localDiskHash={localDiskHash}
          onUpdate={mockOnUpdate}
        />
      );

      const commitInput = screen.getByLabelText(/Commit Message/);
      fireEvent.change(commitInput, { target: { value: 'Test commit' } });

      const commitButton = screen.getByText('✓ Commit to Main Branch');
      fireEvent.click(commitButton);

      await waitFor(() => {
        expect(screen.getByText('GitHub API error')).toBeInTheDocument();
      });

      const errorNotification = screen.getByText('GitHub API error').closest('[role="status"]');
      expect(errorNotification).toBeInTheDocument();
      expect(errorNotification).toHaveClass('inline-notification-error');
    });

    it('should disable commit button when message is missing', () => {
      render(
        <UniverseEditor
          universe={mockUniverse}
          gitBaseHash={gitBaseHash}
          localDiskHash={localDiskHash}
          onUpdate={mockOnUpdate}
        />
      );

      // Button should be disabled without message
      const commitButton = screen.getByText('✓ Commit to Main Branch');
      expect(commitButton).toBeDisabled();

      // Enter message and verify button is enabled
      const commitInput = screen.getByLabelText(/Commit Message/);
      fireEvent.change(commitInput, { target: { value: 'Test commit' } });
      expect(commitButton).not.toBeDisabled();
    });

    it('should show PR link in success message', async () => {
      const prUrl = 'https://github.com/test/repo/pull/123';
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, prUrl }),
      });

      render(
        <UniverseEditor
          universe={mockUniverse}
          gitBaseHash={gitBaseHash}
          localDiskHash={localDiskHash}
          onUpdate={mockOnUpdate}
        />
      );

      // Enable PR creation
      const prCheckbox = screen.getByLabelText(/Create Pull Request/);
      fireEvent.click(prCheckbox);

      const commitInput = screen.getByLabelText(/Commit Message/);
      fireEvent.change(commitInput, { target: { value: 'Test PR' } });

      const commitButton = screen.getByText('🔀 Create Pull Request');
      fireEvent.click(commitButton);

      await waitFor(() => {
        expect(screen.getByText(/Pull request created successfully!/)).toBeInTheDocument();
        expect(screen.getByText(new RegExp(prUrl))).toBeInTheDocument();
      });
    });
  });

  describe('Simultaneous Operations', () => {
    it('should handle save and commit notifications independently', async () => {
      // Mock save to succeed
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, hash: 'new-hash' }),
      });

      render(
        <UniverseEditor
          universe={mockUniverse}
          gitBaseHash={gitBaseHash}
          localDiskHash={localDiskHash}
          onUpdate={mockOnUpdate}
        />
      );

      // Trigger save
      const saveButton = screen.getByText('💾 Save to Disk');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText('Changes saved successfully! Your edits are now persisted locally.')
        ).toBeInTheDocument();
      });

      // Mock commit to fail
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Commit failed' }),
      });

      // Trigger commit
      const commitInput = screen.getByLabelText(/Commit Message/);
      fireEvent.change(commitInput, { target: { value: 'Test commit' } });
      const commitButton = screen.getByText('✓ Commit to Main Branch');
      fireEvent.click(commitButton);

      await waitFor(() => {
        expect(screen.getByText('Commit failed')).toBeInTheDocument();
      });

      // Both notifications should be visible
      expect(
        screen.getByText('Changes saved successfully! Your edits are now persisted locally.')
      ).toBeInTheDocument();
      expect(screen.getByText('Commit failed')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have aria-live regions for screen readers', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, hash: 'new-hash' }),
      });

      render(
        <UniverseEditor
          universe={mockUniverse}
          gitBaseHash={gitBaseHash}
          localDiskHash={localDiskHash}
          onUpdate={mockOnUpdate}
        />
      );

      const saveButton = screen.getByText('💾 Save to Disk');
      fireEvent.click(saveButton);

      await waitFor(() => {
        const notification = screen.getByText(
          'Changes saved successfully! Your edits are now persisted locally.'
        ).closest('[role="status"]');
        
        expect(notification).toHaveAttribute('aria-live', 'polite');
        expect(notification).toHaveAttribute('aria-atomic', 'true');
      });
    });
  });
});
