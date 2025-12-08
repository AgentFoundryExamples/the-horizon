/**
 * Unit tests for projection utilities
 */

import * as THREE from 'three';
import {
  projectToScreen,
  clampToScreen,
  calculateLabelOffset,
  arePositionsTooClose,
} from '../projection';

describe('Projection Utilities', () => {
  describe('projectToScreen', () => {
    let camera: THREE.PerspectiveCamera;
    const width = 1920;
    const height = 1080;

    beforeEach(() => {
      camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      camera.position.set(0, 0, 10);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
    });

    it('should project object at origin to center of screen', () => {
      const position = new THREE.Vector3(0, 0, 0);
      const result = projectToScreen(position, camera, width, height);

      // Origin should project near center
      expect(result.x).toBeCloseTo(width / 2, 0);
      expect(result.y).toBeCloseTo(height / 2, 0);
      expect(result.isBehindCamera).toBe(false);
      expect(result.isOffScreen).toBe(false);
    });

    it('should detect objects behind camera', () => {
      const position = new THREE.Vector3(0, 0, 15); // Behind camera at z=10
      const result = projectToScreen(position, camera, width, height);

      expect(result.isBehindCamera).toBe(true);
    });

    it('should project object on left side of camera', () => {
      const position = new THREE.Vector3(-5, 0, 0);
      const result = projectToScreen(position, camera, width, height);

      // Left side should have x < center
      expect(result.x).toBeLessThan(width / 2);
      expect(result.isBehindCamera).toBe(false);
    });

    it('should project object on right side of camera', () => {
      const position = new THREE.Vector3(5, 0, 0);
      const result = projectToScreen(position, camera, width, height);

      // Right side should have x > center
      expect(result.x).toBeGreaterThan(width / 2);
      expect(result.isBehindCamera).toBe(false);
    });

    it('should project object above camera', () => {
      const position = new THREE.Vector3(0, 5, 0);
      const result = projectToScreen(position, camera, width, height);

      // Above camera should have y < center (Y is flipped in screen space)
      expect(result.y).toBeLessThan(height / 2);
      expect(result.isBehindCamera).toBe(false);
    });

    it('should project object below camera', () => {
      const position = new THREE.Vector3(0, -5, 0);
      const result = projectToScreen(position, camera, width, height);

      // Below camera should have y > center
      expect(result.y).toBeGreaterThan(height / 2);
      expect(result.isBehindCamera).toBe(false);
    });

    it('should detect off-screen objects', () => {
      const position = new THREE.Vector3(100, 0, 0); // Far to the right
      const result = projectToScreen(position, camera, width, height);

      expect(result.isOffScreen).toBe(true);
    });

    it('should not modify original position vector', () => {
      const originalPosition = new THREE.Vector3(5, 10, 0);
      const position = originalPosition.clone();
      
      projectToScreen(position, camera, width, height);

      expect(position.x).toBe(originalPosition.x);
      expect(position.y).toBe(originalPosition.y);
      expect(position.z).toBe(originalPosition.z);
    });
  });

  describe('clampToScreen', () => {
    const width = 1920;
    const height = 1080;
    const margin = 50;

    it('should not clamp positions within bounds', () => {
      const result = clampToScreen(960, 540, width, height, margin);

      expect(result.x).toBe(960);
      expect(result.y).toBe(540);
      expect(result.clamped).toBe(false);
    });

    it('should clamp position too far left', () => {
      const result = clampToScreen(-100, 540, width, height, margin);

      expect(result.x).toBe(margin);
      expect(result.y).toBe(540);
      expect(result.clamped).toBe(true);
    });

    it('should clamp position too far right', () => {
      const result = clampToScreen(2000, 540, width, height, margin);

      expect(result.x).toBe(width - margin);
      expect(result.y).toBe(540);
      expect(result.clamped).toBe(true);
    });

    it('should clamp position too far up', () => {
      const result = clampToScreen(960, -100, width, height, margin);

      expect(result.x).toBe(960);
      expect(result.y).toBe(margin);
      expect(result.clamped).toBe(true);
    });

    it('should clamp position too far down', () => {
      const result = clampToScreen(960, 1200, width, height, margin);

      expect(result.x).toBe(960);
      expect(result.y).toBe(height - margin);
      expect(result.clamped).toBe(true);
    });

    it('should clamp both coordinates when out of bounds', () => {
      const result = clampToScreen(-100, -100, width, height, margin);

      expect(result.x).toBe(margin);
      expect(result.y).toBe(margin);
      expect(result.clamped).toBe(true);
    });

    it('should use default margin if not provided', () => {
      const result = clampToScreen(0, 0, width, height);

      expect(result.x).toBe(50); // Default margin is 50
      expect(result.y).toBe(50);
      expect(result.clamped).toBe(true);
    });

    it('should handle custom margin', () => {
      const customMargin = 100;
      const result = clampToScreen(0, 0, width, height, customMargin);

      expect(result.x).toBe(customMargin);
      expect(result.y).toBe(customMargin);
      expect(result.clamped).toBe(true);
    });

    it('should clamp near edges with margin', () => {
      const result = clampToScreen(25, 540, width, height, margin);

      expect(result.x).toBe(margin);
      expect(result.y).toBe(540);
      expect(result.clamped).toBe(true);
    });
  });

  describe('calculateLabelOffset', () => {
    it('should apply default offset', () => {
      const result = calculateLabelOffset(100, 200);

      expect(result.x).toBe(120); // 100 + 20
      expect(result.y).toBe(170); // 200 - 30
    });

    it('should apply custom offset', () => {
      const result = calculateLabelOffset(100, 200, 50, -100);

      expect(result.x).toBe(150); // 100 + 50
      expect(result.y).toBe(100); // 200 - 100
    });

    it('should handle negative base positions', () => {
      const result = calculateLabelOffset(-50, -100, 20, -30);

      expect(result.x).toBe(-30); // -50 + 20
      expect(result.y).toBe(-130); // -100 - 30
    });

    it('should handle zero offsets', () => {
      const result = calculateLabelOffset(100, 200, 0, 0);

      expect(result.x).toBe(100);
      expect(result.y).toBe(200);
    });
  });

  describe('arePositionsTooClose', () => {
    it('should detect positions that are too close', () => {
      const pos1 = { x: 100, y: 100 };
      const pos2 = { x: 150, y: 100 };
      const threshold = 100;

      const result = arePositionsTooClose(pos1, pos2, threshold);

      expect(result).toBe(true);
    });

    it('should detect positions that are far enough apart', () => {
      const pos1 = { x: 100, y: 100 };
      const pos2 = { x: 250, y: 100 };
      const threshold = 100;

      const result = arePositionsTooClose(pos1, pos2, threshold);

      expect(result).toBe(false);
    });

    it('should use default threshold if not provided', () => {
      const pos1 = { x: 100, y: 100 };
      const pos2 = { x: 180, y: 100 };

      const result = arePositionsTooClose(pos1, pos2);

      expect(result).toBe(true); // Default threshold is 100
    });

    it('should handle diagonal distances', () => {
      const pos1 = { x: 0, y: 0 };
      const pos2 = { x: 60, y: 80 };
      const threshold = 100;

      // Distance = sqrt(60^2 + 80^2) = 100
      // Distance equals threshold, so not too close (< threshold)
      const result = arePositionsTooClose(pos1, pos2, threshold);

      expect(result).toBe(false); // Distance = threshold, not less than
    });

    it('should handle identical positions', () => {
      const pos1 = { x: 100, y: 100 };
      const pos2 = { x: 100, y: 100 };
      const threshold = 10;

      const result = arePositionsTooClose(pos1, pos2, threshold);

      expect(result).toBe(true);
    });

    it('should handle negative positions', () => {
      const pos1 = { x: -100, y: -100 };
      const pos2 = { x: -150, y: -100 };
      const threshold = 100;

      const result = arePositionsTooClose(pos1, pos2, threshold);

      expect(result).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large screen dimensions', () => {
      const camera = new THREE.PerspectiveCamera(75, 3840 / 2160, 0.1, 1000);
      camera.position.set(0, 0, 10);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();

      const position = new THREE.Vector3(0, 0, 0);
      const result = projectToScreen(position, camera, 3840, 2160);

      expect(result.x).toBeCloseTo(1920, 0);
      expect(result.y).toBeCloseTo(1080, 0);
    });

    it('should handle very small screen dimensions', () => {
      const camera = new THREE.PerspectiveCamera(75, 320 / 240, 0.1, 1000);
      camera.position.set(0, 0, 10);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();

      const position = new THREE.Vector3(0, 0, 0);
      const result = projectToScreen(position, camera, 320, 240);

      expect(result.x).toBeCloseTo(160, 0);
      expect(result.y).toBeCloseTo(120, 0);
    });

    it('should handle extreme camera angles', () => {
      const camera = new THREE.PerspectiveCamera(75, 1920 / 1080, 0.1, 1000);
      camera.position.set(10, 10, 10);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();

      const position = new THREE.Vector3(0, 0, 0);
      const result = projectToScreen(position, camera, 1920, 1080);

      // Should still project without errors
      expect(typeof result.x).toBe('number');
      expect(typeof result.y).toBe('number');
      expect(typeof result.isBehindCamera).toBe('boolean');
    });
  });
});
