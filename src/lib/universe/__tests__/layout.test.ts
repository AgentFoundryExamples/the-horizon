/**
 * Tests for galaxy layout system
 */

import * as THREE from 'three';
import {
  calculateGalaxyLayout,
  getRecommendedCameraDistance,
  validateSpacing,
  validateRingSpacing,
  type GalaxyLayout,
} from '../layout';

describe('Galaxy Layout System', () => {
  describe('calculateGalaxyLayout', () => {
    describe('Edge Cases', () => {
      it('should handle empty galaxy array', () => {
        const layout = calculateGalaxyLayout([]);
        
        expect(layout.positions.size).toBe(0);
        expect(layout.boundingRadius).toBe(0);
      });
    });
    
    describe('Single Galaxy (Centered)', () => {
      it('should position single galaxy at origin', () => {
        const layout = calculateGalaxyLayout(['galaxy-1']);
        
        expect(layout.positions.size).toBe(1);
        
        const pos = layout.positions.get('galaxy-1');
        expect(pos).toBeDefined();
        expect(pos!.x).toBe(0);
        expect(pos!.y).toBe(0);
        expect(pos!.z).toBe(0);
        expect(layout.boundingRadius).toBe(0);
      });
    });
    
    describe('Two Galaxies (Horizontal Mirror)', () => {
      it('should position two galaxies symmetrically on X-axis', () => {
        const layout = calculateGalaxyLayout(['galaxy-1', 'galaxy-2']);
        
        expect(layout.positions.size).toBe(2);
        
        const pos1 = layout.positions.get('galaxy-1');
        const pos2 = layout.positions.get('galaxy-2');
        
        expect(pos1).toBeDefined();
        expect(pos2).toBeDefined();
        
        // Should be mirrored across origin
        expect(pos1!.x).toBe(-pos2!.x);
        expect(pos1!.y).toBe(0);
        expect(pos2!.y).toBe(0);
        expect(pos1!.z).toBe(0);
        expect(pos2!.z).toBe(0);
        
        // Should be at least spacing/2 apart
        expect(Math.abs(pos2!.x - pos1!.x)).toBeGreaterThanOrEqual(50);
      });
      
      it('should respect custom spacing for two galaxies', () => {
        const customSpacing = 100;
        const layout = calculateGalaxyLayout(['galaxy-1', 'galaxy-2'], customSpacing);
        
        const pos1 = layout.positions.get('galaxy-1');
        const pos2 = layout.positions.get('galaxy-2');
        
        expect(Math.abs(pos2!.x - pos1!.x)).toBe(customSpacing);
        expect(layout.boundingRadius).toBe(customSpacing / 2);
      });
    });
    
    describe('Three Galaxies (Triangle)', () => {
      it('should arrange three galaxies in equilateral triangle', () => {
        const layout = calculateGalaxyLayout(['galaxy-1', 'galaxy-2', 'galaxy-3']);
        
        expect(layout.positions.size).toBe(3);
        
        const pos1 = layout.positions.get('galaxy-1');
        const pos2 = layout.positions.get('galaxy-2');
        const pos3 = layout.positions.get('galaxy-3');
        
        expect(pos1).toBeDefined();
        expect(pos2).toBeDefined();
        expect(pos3).toBeDefined();
        
        // All galaxies should be at y=0
        expect(pos1!.y).toBe(0);
        expect(pos2!.y).toBe(0);
        expect(pos3!.y).toBe(0);
        
        // Calculate distances between galaxies
        const dist12 = pos1!.distanceTo(pos2!);
        const dist23 = pos2!.distanceTo(pos3!);
        const dist31 = pos3!.distanceTo(pos1!);
        
        // All sides should be equal (equilateral triangle)
        expect(Math.abs(dist12 - dist23)).toBeLessThan(0.01);
        expect(Math.abs(dist23 - dist31)).toBeLessThan(0.01);
        expect(Math.abs(dist31 - dist12)).toBeLessThan(0.01);
        
        // Distance should match spacing
        expect(dist12).toBeCloseTo(50, 1);
      });
      
      it('should center triangle at origin', () => {
        const layout = calculateGalaxyLayout(['galaxy-1', 'galaxy-2', 'galaxy-3']);
        
        const pos1 = layout.positions.get('galaxy-1')!;
        const pos2 = layout.positions.get('galaxy-2')!;
        const pos3 = layout.positions.get('galaxy-3')!;
        
        // Center of mass should be at origin
        const centerX = (pos1.x + pos2.x + pos3.x) / 3;
        const centerZ = (pos1.z + pos2.z + pos3.z) / 3;
        
        expect(Math.abs(centerX)).toBeLessThan(0.01);
        expect(Math.abs(centerZ)).toBeLessThan(0.01);
      });
    });
    
    describe('Four Galaxies (Square/Diamond)', () => {
      it('should arrange four galaxies in diamond pattern', () => {
        const layout = calculateGalaxyLayout(['galaxy-1', 'galaxy-2', 'galaxy-3', 'galaxy-4']);
        
        expect(layout.positions.size).toBe(4);
        
        const positions = [
          layout.positions.get('galaxy-1')!,
          layout.positions.get('galaxy-2')!,
          layout.positions.get('galaxy-3')!,
          layout.positions.get('galaxy-4')!,
        ];
        
        // All at y=0
        positions.forEach(pos => expect(pos.y).toBe(0));
        
        // All galaxies should be equidistant from origin (diamond shape)
        const distancesFromOrigin = positions.map(pos => 
          Math.sqrt(pos.x ** 2 + pos.z ** 2)
        );
        
        const avgDistFromOrigin = distancesFromOrigin.reduce((a, b) => a + b, 0) / 4;
        distancesFromOrigin.forEach(dist => {
          expect(Math.abs(dist - avgDistFromOrigin)).toBeLessThan(0.01);
        });
        
        // Check that opposite galaxies are aligned (N-S and E-W)
        // Galaxy 0 (North) and Galaxy 3 (South) should be on Z-axis
        expect(Math.abs(positions[0].x)).toBeLessThan(0.01);
        expect(Math.abs(positions[3].x)).toBeLessThan(0.01);
        
        // Galaxy 1 (West) and Galaxy 2 (East) should be on X-axis
        expect(Math.abs(positions[1].z)).toBeLessThan(0.01);
        expect(Math.abs(positions[2].z)).toBeLessThan(0.01);
      });
      
      it('should center diamond at origin', () => {
        const layout = calculateGalaxyLayout(['galaxy-1', 'galaxy-2', 'galaxy-3', 'galaxy-4']);
        
        const positions = [
          layout.positions.get('galaxy-1')!,
          layout.positions.get('galaxy-2')!,
          layout.positions.get('galaxy-3')!,
          layout.positions.get('galaxy-4')!,
        ];
        
        const centerX = positions.reduce((sum, pos) => sum + pos.x, 0) / 4;
        const centerZ = positions.reduce((sum, pos) => sum + pos.z, 0) / 4;
        
        expect(Math.abs(centerX)).toBeLessThan(0.01);
        expect(Math.abs(centerZ)).toBeLessThan(0.01);
      });
      
      it('should maintain correct spacing between adjacent galaxies', () => {
        const spacing = 50;
        const layout = calculateGalaxyLayout(['galaxy-1', 'galaxy-2', 'galaxy-3', 'galaxy-4'], spacing);
        
        const positions = [
          layout.positions.get('galaxy-1')!, // North
          layout.positions.get('galaxy-2')!, // West
          layout.positions.get('galaxy-3')!, // East
          layout.positions.get('galaxy-4')!, // South
        ];
        
        // Check distance between adjacent galaxies (N-W, W-S, S-E, E-N)
        const distances = [
          positions[0].distanceTo(positions[1]), // N to W
          positions[1].distanceTo(positions[3]), // W to S
          positions[3].distanceTo(positions[2]), // S to E
          positions[2].distanceTo(positions[0]), // E to N
        ];
        
        // All adjacent distances should equal spacing (within floating point tolerance)
        distances.forEach(dist => {
          expect(Math.abs(dist - spacing)).toBeLessThan(0.01);
        });
      });
    });
    
    describe('Five+ Galaxies (Circular Ring)', () => {
      it('should arrange 5 galaxies in circular ring', () => {
        const layout = calculateGalaxyLayout(['g1', 'g2', 'g3', 'g4', 'g5']);
        
        expect(layout.positions.size).toBe(5);
        
        // All galaxies should be same distance from origin
        const positions = Array.from(layout.positions.values());
        const distances = positions.map(pos => Math.sqrt(pos.x ** 2 + pos.z ** 2));
        
        const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;
        distances.forEach(dist => {
          expect(Math.abs(dist - avgDistance)).toBeLessThan(0.01);
        });
        
        expect(layout.boundingRadius).toBeCloseTo(avgDistance, 1);
      });
      
      it('should evenly space galaxies around circle', () => {
        const layout = calculateGalaxyLayout(['g1', 'g2', 'g3', 'g4', 'g5', 'g6']);
        
        const positions = [
          layout.positions.get('g1')!,
          layout.positions.get('g2')!,
          layout.positions.get('g3')!,
          layout.positions.get('g4')!,
          layout.positions.get('g5')!,
          layout.positions.get('g6')!,
        ];
        
        // Check angular spacing
        const angles = positions.map(pos => Math.atan2(pos.z, pos.x));
        const expectedAngleStep = (2 * Math.PI) / 6;
        
        for (let i = 0; i < 6; i++) {
          const nextIdx = (i + 1) % 6;
          let angleDiff = angles[nextIdx] - angles[i];
          
          // Normalize angle difference to [0, 2π)
          if (angleDiff < 0) angleDiff += 2 * Math.PI;
          
          expect(Math.abs(angleDiff - expectedAngleStep)).toBeLessThan(0.01);
        }
      });
      
      it('should maintain consistent spacing for large galaxy counts', () => {
        const spacing = 50;
        const layout = calculateGalaxyLayout(
          Array.from({ length: 20 }, (_, i) => `galaxy-${i}`),
          spacing
        );
        
        expect(layout.positions.size).toBe(20);
        
        const positions = Array.from(layout.positions.values());
        
        // Check spacing between adjacent galaxies on the circle
        for (let i = 0; i < 20; i++) {
          const next = (i + 1) % 20;
          const distance = positions[i].distanceTo(positions[next]);
          
          // Arc length should approximate spacing for large circles
          expect(distance).toBeGreaterThanOrEqual(spacing * 0.95);
          expect(distance).toBeLessThanOrEqual(spacing * 1.05);
        }
      });
      
      it('should handle very large galaxy counts', () => {
        const largeCount = 100;
        const layout = calculateGalaxyLayout(
          Array.from({ length: largeCount }, (_, i) => `galaxy-${i}`)
        );
        
        expect(layout.positions.size).toBe(largeCount);
        expect(layout.boundingRadius).toBeGreaterThan(0);
        
        // All positions should be valid
        Array.from(layout.positions.values()).forEach(pos => {
          expect(Number.isFinite(pos.x)).toBe(true);
          expect(Number.isFinite(pos.y)).toBe(true);
          expect(Number.isFinite(pos.z)).toBe(true);
        });
      });
    });
    
    describe('Custom Spacing', () => {
      it('should respect custom spacing parameter', () => {
        const customSpacing = 80;
        const layout = calculateGalaxyLayout(['g1', 'g2', 'g3'], customSpacing);
        
        const pos1 = layout.positions.get('g1')!;
        const pos2 = layout.positions.get('g2')!;
        
        const distance = pos1.distanceTo(pos2);
        expect(distance).toBeCloseTo(customSpacing, 1);
      });
    });
    
    describe('Deterministic Positioning', () => {
      it('should produce same layout for same input', () => {
        const ids = ['galaxy-a', 'galaxy-b', 'galaxy-c'];
        
        const layout1 = calculateGalaxyLayout(ids);
        const layout2 = calculateGalaxyLayout(ids);
        
        expect(layout1.positions.size).toBe(layout2.positions.size);
        expect(layout1.boundingRadius).toBe(layout2.boundingRadius);
        
        ids.forEach(id => {
          const pos1 = layout1.positions.get(id)!;
          const pos2 = layout2.positions.get(id)!;
          
          expect(pos1.x).toBe(pos2.x);
          expect(pos1.y).toBe(pos2.y);
          expect(pos1.z).toBe(pos2.z);
        });
      });
    });
  });
  
  describe('getRecommendedCameraDistance', () => {
    it('should return positive distance for zero bounding radius', () => {
      const distance = getRecommendedCameraDistance(0);
      expect(distance).toBeGreaterThan(0);
    });
    
    it('should increase distance with larger bounding radius', () => {
      const dist1 = getRecommendedCameraDistance(50);
      const dist2 = getRecommendedCameraDistance(100);
      
      expect(dist2).toBeGreaterThan(dist1);
    });
    
    it('should account for galaxy size', () => {
      const boundingRadius = 100;
      const smallGalaxyDist = getRecommendedCameraDistance(boundingRadius, 10);
      const largeGalaxyDist = getRecommendedCameraDistance(boundingRadius, 30);
      
      expect(largeGalaxyDist).toBeGreaterThan(smallGalaxyDist);
    });
  });
  
  describe('validateSpacing', () => {
    it('should return true for sufficient spacing', () => {
      expect(validateSpacing(50, 44)).toBe(true);
      expect(validateSpacing(100, 44)).toBe(true);
    });
    
    it('should return false for insufficient spacing', () => {
      expect(validateSpacing(44, 44)).toBe(false);
      expect(validateSpacing(40, 44)).toBe(false);
    });
    
    it('should handle edge case of equal spacing and diameter', () => {
      expect(validateSpacing(50, 50)).toBe(false);
    });
  });
  
  describe('validateRingSpacing', () => {
    it('should return true for non-ring layouts (< 5 galaxies)', () => {
      expect(validateRingSpacing(1, 50, 44)).toBe(true);
      expect(validateRingSpacing(4, 50, 44)).toBe(true);
    });
    
    it('should validate chord distance for ring layouts', () => {
      // For 5 galaxies with spacing 50:
      // radius = (5 * 50) / (2π) ≈ 39.79
      // angleStep = 2π / 5 = 72°
      // chordDistance = 2 * 39.79 * sin(36°) ≈ 46.78
      // This is > 44, so should be valid
      expect(validateRingSpacing(5, 50, 44)).toBe(true);
    });
    
    it('should detect insufficient chord distance', () => {
      // For 20 galaxies with spacing 30:
      // radius = (20 * 30) / (2π) ≈ 95.49
      // angleStep = 2π / 20 = 18°
      // chordDistance = 2 * 95.49 * sin(9°) ≈ 29.88
      // This is < 44, so should be invalid
      expect(validateRingSpacing(20, 30, 44)).toBe(false);
    });
    
    it('should work for large galaxy counts', () => {
      // For 100 galaxies with spacing 50:
      // radius = (100 * 50) / (2π) ≈ 795.77
      // angleStep = 2π / 100 = 3.6°
      // chordDistance = 2 * 795.77 * sin(1.8°) ≈ 49.99
      // This is > 44, so should be valid
      expect(validateRingSpacing(100, 50, 44)).toBe(true);
    });
  });
});
