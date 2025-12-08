import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import GalaxyEditor from '../GalaxyEditor';
import { Galaxy } from '@/lib/universe/types';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('GalaxyEditor', () => {
  const mockGalaxy: Galaxy = {
    id: 'test-galaxy',
    name: 'Test Galaxy',
    description: 'A test galaxy',
    theme: 'blue-white',
    particleColor: '#4A90E2',
    stars: [],
    solarSystems: [],
  };

  const mockOnUpdate = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockOnUpdate.mockClear();
    mockOnClose.mockClear();
  });

  it('should render galaxy editor with basic info', () => {
    render(
      <GalaxyEditor
        galaxy={mockGalaxy}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByDisplayValue('Test Galaxy')).toBeInTheDocument();
    expect(screen.getByDisplayValue('A test galaxy')).toBeInTheDocument();
  });

  it('should update local state when fields are changed', () => {
    render(
      <GalaxyEditor
        galaxy={mockGalaxy}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    const nameInput = screen.getByLabelText(/Name/i);
    fireEvent.change(nameInput, { target: { value: 'Updated Galaxy' } });

    expect(nameInput).toHaveValue('Updated Galaxy');
    // Should not call onUpdate until Save is clicked
    expect(mockOnUpdate).not.toHaveBeenCalled();
  });

  it('should call onUpdate with updated galaxy when Save Changes is clicked', () => {
    render(
      <GalaxyEditor
        galaxy={mockGalaxy}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    // Update the name
    const nameInput = screen.getByLabelText(/Name/i);
    fireEvent.change(nameInput, { target: { value: 'Updated Galaxy' } });

    // Click Save Changes
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    // Should call onUpdate with the updated galaxy
    expect(mockOnUpdate).toHaveBeenCalledTimes(1);
    expect(mockOnUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Updated Galaxy',
        description: 'A test galaxy',
      })
    );
  });

  it('should not lose nested edits when saving', async () => {
    const galaxyWithSolarSystem: Galaxy = {
      ...mockGalaxy,
      solarSystems: [
        {
          id: 'test-system',
          name: 'Test System',
          theme: 'yellow-star',
          mainStar: {
            id: 'test-star',
            name: 'Test Star',
            theme: 'yellow-dwarf',
          },
          planets: [],
        },
      ],
    };

    render(
      <GalaxyEditor
        galaxy={galaxyWithSolarSystem}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    // Switch to Solar Systems tab
    const systemsTab = screen.getByText(/Solar Systems/i);
    fireEvent.click(systemsTab);

    // Verify solar system is displayed
    expect(screen.getByText('Test System')).toBeInTheDocument();

    // Switch back to basic info and update the name
    const infoTab = screen.getByText('Basic Info');
    fireEvent.click(infoTab);

    const nameInput = screen.getByLabelText(/Name/i);
    fireEvent.change(nameInput, { target: { value: 'Updated Galaxy' } });

    // Click Save Changes
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    // Should call onUpdate with BOTH the updated name AND the existing solar system
    expect(mockOnUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Updated Galaxy',
        solarSystems: expect.arrayContaining([
          expect.objectContaining({
            id: 'test-system',
            name: 'Test System',
          }),
        ]),
      })
    );
  });

  it('should validate required fields before saving', () => {
    render(
      <GalaxyEditor
        galaxy={mockGalaxy}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    // Clear required field
    const nameInput = screen.getByLabelText(/Name/i);
    fireEvent.change(nameInput, { target: { value: '' } });

    // Try to save
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    // Should show validation error
    expect(screen.getByText('Name is required')).toBeInTheDocument();
    // Should not call onUpdate
    expect(mockOnUpdate).not.toHaveBeenCalled();
  });

  it('should auto-generate ID from name', () => {
    const newGalaxy: Galaxy = {
      id: '',
      name: 'New Galaxy',
      description: 'A new galaxy',
      theme: 'blue-white',
      particleColor: '#4A90E2',
      stars: [],
      solarSystems: [],
    };

    render(
      <GalaxyEditor
        galaxy={newGalaxy}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    // Change the name
    const nameInput = screen.getByLabelText(/Name/i);
    fireEvent.change(nameInput, { target: { value: 'My New Galaxy' } });

    // The ID should auto-update
    const idInput = screen.getByLabelText('ID');
    expect(idInput).toHaveValue('my-new-galaxy');
  });

  it('should preserve manually edited ID', () => {
    render(
      <GalaxyEditor
        galaxy={mockGalaxy}
        onUpdate={mockOnUpdate}
        onClose={mockOnClose}
      />
    );

    // Manually edit the ID
    const idInput = screen.getByLabelText('ID');
    fireEvent.change(idInput, { target: { value: 'custom-id' } });

    // Now change the name
    const nameInput = screen.getByLabelText(/Name/i);
    fireEvent.change(nameInput, { target: { value: 'Different Name' } });

    // ID should remain as manually set
    expect(idInput).toHaveValue('custom-id');
  });
});
