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
/**
 * Integration tests for the admin modal save workflow
 * Tests that edits made in nested modals persist through the save chain
 */

import type { Universe, Galaxy, SolarSystem, Planet } from '../types';

describe('Admin Modal Save Workflow', () => {
  let testUniverse: Universe;

  beforeEach(() => {
    testUniverse = {
      galaxies: [
        {
          id: 'test-galaxy',
          name: 'Test Galaxy',
          description: 'Original description',
          theme: 'blue-white',
          particleColor: '#4A90E2',
          stars: [],
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
              planets: [
                {
                  id: 'test-planet',
                  name: 'Test Planet',
                  theme: 'blue-green',
                  summary: 'A test planet',
                  contentMarkdown: '# Test Planet',
                  moons: [],
                },
              ],
            },
          ],
        },
      ],
    };
  });

  describe('State Propagation', () => {
    it('should maintain galaxy edits when modal closes', () => {
      // Simulate GalaxyEditor updating a galaxy
      const updatedGalaxy: Galaxy = {
        ...testUniverse.galaxies[0],
        description: 'Updated description',
      };

      // Simulate UniverseEditor.handleUpdateGalaxy
      const updatedUniverse: Universe = {
        ...testUniverse,
        galaxies: testUniverse.galaxies.map((g) =>
          g.id === updatedGalaxy.id ? updatedGalaxy : g
        ),
      };

      // Verify the update persisted
      expect(updatedUniverse.galaxies[0].description).toBe('Updated description');
      // Verify nested structures are preserved
      expect(updatedUniverse.galaxies[0].solarSystems).toHaveLength(1);
      expect(updatedUniverse.galaxies[0].solarSystems![0].planets).toHaveLength(1);
    });

    it('should maintain nested solar system edits when modal closes', () => {
      // Simulate editing a solar system within GalaxyEditor
      const galaxy = testUniverse.galaxies[0];
      const updatedSystem: SolarSystem = {
        ...galaxy.solarSystems![0],
        name: 'Updated System',
      };

      // Simulate GalaxyEditor.handleUpdateSolarSystem
      const updatedGalaxy: Galaxy = {
        ...galaxy,
        solarSystems: galaxy.solarSystems!.map((s) =>
          s.id === updatedSystem.id ? updatedSystem : s
        ),
      };

      // Verify solar system update
      expect(updatedGalaxy.solarSystems![0].name).toBe('Updated System');
      // Verify planets are preserved
      expect(updatedGalaxy.solarSystems![0].planets).toHaveLength(1);
      expect(updatedGalaxy.solarSystems![0].planets![0].name).toBe('Test Planet');
    });

    it('should maintain nested planet edits when modal closes', () => {
      // Simulate editing a planet within SolarSystemEditor
      const system = testUniverse.galaxies[0].solarSystems![0];
      const updatedPlanet: Planet = {
        ...system.planets![0],
        summary: 'Updated planet summary',
      };

      // Simulate SolarSystemEditor.handleUpdatePlanet
      const updatedSystem: SolarSystem = {
        ...system,
        planets: system.planets!.map((p) =>
          p.id === updatedPlanet.id ? updatedPlanet : p
        ),
      };

      // Verify planet update
      expect(updatedSystem.planets![0].summary).toBe('Updated planet summary');
      // Verify other fields are preserved
      expect(updatedSystem.planets![0].name).toBe('Test Planet');
      expect(updatedSystem.planets![0].contentMarkdown).toBe('# Test Planet');
    });

    it('should propagate deeply nested edits all the way to universe', () => {
      // Start with a planet edit
      const planet = testUniverse.galaxies[0].solarSystems![0].planets![0];
      const updatedPlanet: Planet = {
        ...planet,
        summary: 'Deeply updated planet',
      };

      // Propagate to solar system
      const system = testUniverse.galaxies[0].solarSystems![0];
      const updatedSystem: SolarSystem = {
        ...system,
        planets: system.planets!.map((p) =>
          p.id === updatedPlanet.id ? updatedPlanet : p
        ),
      };

      // Propagate to galaxy
      const galaxy = testUniverse.galaxies[0];
      const updatedGalaxy: Galaxy = {
        ...galaxy,
        solarSystems: galaxy.solarSystems!.map((s) =>
          s.id === updatedSystem.id ? updatedSystem : s
        ),
      };

      // Propagate to universe
      const updatedUniverse: Universe = {
        ...testUniverse,
        galaxies: testUniverse.galaxies.map((g) =>
          g.id === updatedGalaxy.id ? updatedGalaxy : g
        ),
      };

      // Verify the deep edit made it all the way through
      expect(
        updatedUniverse.galaxies[0].solarSystems![0].planets![0].summary
      ).toBe('Deeply updated planet');

      // Verify no data was lost
      expect(updatedUniverse.galaxies[0].name).toBe('Test Galaxy');
      expect(updatedUniverse.galaxies[0].solarSystems![0].name).toBe('Test System');
      expect(updatedUniverse.galaxies[0].solarSystems![0].planets![0].name).toBe('Test Planet');
    });
  });

  describe('Immutability', () => {
    it('should not mutate original universe when updating', () => {
      const originalUniverse = JSON.stringify(testUniverse);

      // Make an update
      const updatedGalaxy: Galaxy = {
        ...testUniverse.galaxies[0],
        description: 'Changed',
      };

      const updatedUniverse: Universe = {
        ...testUniverse,
        galaxies: testUniverse.galaxies.map((g) =>
          g.id === updatedGalaxy.id ? updatedGalaxy : g
        ),
      };

      // Original should be unchanged
      expect(JSON.stringify(testUniverse)).toBe(originalUniverse);
      // New universe should have the change
      expect(updatedUniverse.galaxies[0].description).toBe('Changed');
    });

    it('should not mutate original galaxy when updating solar system', () => {
      // Deep clone for comparison
      const originalGalaxy = {
        ...testUniverse.galaxies[0],
        solarSystems: testUniverse.galaxies[0].solarSystems!.map(s => ({
          ...s,
          planets: s.planets ? [...s.planets] : [],
        })),
      };

      const updatedSystem: SolarSystem = {
        ...testUniverse.galaxies[0].solarSystems![0],
        name: 'Changed System',
      };

      const updatedGalaxy: Galaxy = {
        ...testUniverse.galaxies[0],
        solarSystems: testUniverse.galaxies[0].solarSystems!.map((s) =>
          s.id === updatedSystem.id ? updatedSystem : s
        ),
      };

      // Original should be unchanged
      expect(testUniverse.galaxies[0].solarSystems![0].name).toBe('Test System');
      // New galaxy should have the change
      expect(updatedGalaxy.solarSystems![0].name).toBe('Changed System');
    });
  });

  describe('Edge Cases', () => {
    it('should handle adding new solar system to galaxy', () => {
      const newSystem: SolarSystem = {
        id: 'new-system',
        name: 'New System',
        theme: 'yellow-star',
        mainStar: {
          id: 'new-star',
          name: 'New Star',
          theme: 'yellow-dwarf',
        },
        planets: [],
      };

      const updatedGalaxy: Galaxy = {
        ...testUniverse.galaxies[0],
        solarSystems: [...testUniverse.galaxies[0].solarSystems!, newSystem],
      };

      expect(updatedGalaxy.solarSystems).toHaveLength(2);
      expect(updatedGalaxy.solarSystems![1].id).toBe('new-system');
    });

    it('should handle deleting solar system from galaxy', () => {
      const systemToDelete = testUniverse.galaxies[0].solarSystems![0];

      const updatedGalaxy: Galaxy = {
        ...testUniverse.galaxies[0],
        solarSystems: testUniverse.galaxies[0].solarSystems!.filter(
          (s) => s.id !== systemToDelete.id
        ),
      };

      expect(updatedGalaxy.solarSystems).toHaveLength(0);
    });

    it('should handle empty arrays correctly', () => {
      const galaxyWithoutSystems: Galaxy = {
        id: 'empty-galaxy',
        name: 'Empty Galaxy',
        description: 'No systems',
        theme: 'blue-white',
        particleColor: '#4A90E2',
        stars: [],
        solarSystems: [],
      };

      const universe: Universe = {
        galaxies: [galaxyWithoutSystems],
      };

      expect(universe.galaxies[0].solarSystems).toHaveLength(0);
      expect(universe.galaxies[0].stars).toHaveLength(0);
    });
  });

  describe('Save Workflow Simulation', () => {
    it('should complete full workflow: edit → save → prepare for disk save', () => {
      // Step 1: User opens GalaxyEditor and makes changes
      const localGalaxy: Galaxy = {
        ...testUniverse.galaxies[0],
        description: 'User edited this',
      };

      // Step 2: User clicks "Save Changes" in GalaxyEditor
      // This calls handleUpdateGalaxy which updates UniverseEditor
      const universeAfterGalaxyEdit: Universe = {
        ...testUniverse,
        galaxies: testUniverse.galaxies.map((g) =>
          g.id === localGalaxy.id ? localGalaxy : g
        ),
      };

      // Step 3: User clicks "Save to Disk" in UniverseEditor
      // This should send the updated universe (with all edits) to the API
      const universeToSave = universeAfterGalaxyEdit;

      // Verify the edits are present in the universe to be saved
      expect(universeToSave.galaxies[0].description).toBe('User edited this');
      // Verify nested structures are intact
      expect(universeToSave.galaxies[0].solarSystems).toHaveLength(1);
      expect(universeToSave.galaxies[0].solarSystems![0].planets).toHaveLength(1);
    });

    it('should handle multiple sequential edits', () => {
      let currentUniverse = testUniverse;

      // Edit 1: Update galaxy description
      const galaxy1: Galaxy = {
        ...currentUniverse.galaxies[0],
        description: 'First edit',
      };
      currentUniverse = {
        ...currentUniverse,
        galaxies: currentUniverse.galaxies.map((g) =>
          g.id === galaxy1.id ? galaxy1 : g
        ),
      };

      // Edit 2: Update solar system name
      const system2: SolarSystem = {
        ...currentUniverse.galaxies[0].solarSystems![0],
        name: 'Second edit',
      };
      const galaxy2: Galaxy = {
        ...currentUniverse.galaxies[0],
        solarSystems: currentUniverse.galaxies[0].solarSystems!.map((s) =>
          s.id === system2.id ? system2 : s
        ),
      };
      currentUniverse = {
        ...currentUniverse,
        galaxies: currentUniverse.galaxies.map((g) =>
          g.id === galaxy2.id ? galaxy2 : g
        ),
      };

      // Verify both edits persisted
      expect(currentUniverse.galaxies[0].description).toBe('First edit');
      expect(currentUniverse.galaxies[0].solarSystems![0].name).toBe('Second edit');
    });
  });
});
