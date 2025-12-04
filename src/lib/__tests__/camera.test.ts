/**
 * Unit tests for camera utilities
 */

import * as THREE from 'three';
import {
  easeInOutCubic,
  easeInOutQuint,
  lerp,
  slerp,
  calculateFocusPosition,
  createCameraPath,
  CameraAnimator,
  constrainCamera,
  DEFAULT_CAMERA_POSITIONS,
  DEFAULT_ANIMATION_CONFIG,
} from '../camera';

describe('Easing Functions', () => {
  describe('easeInOutCubic', () => {
    it('should return 0 at t=0', () => {
      expect(easeInOutCubic(0)).toBe(0);
    });

    it('should return 1 at t=1', () => {
      expect(easeInOutCubic(1)).toBe(1);
    });

    it('should return 0.5 at t=0.5', () => {
      expect(easeInOutCubic(0.5)).toBe(0.5);
    });

    it('should ease in during first half', () => {
      const t1 = easeInOutCubic(0.1);
      const t2 = easeInOutCubic(0.2);
      const diff = t2 - t1;
      expect(diff).toBeGreaterThan(0);
      expect(diff).toBeLessThan(0.1);
    });

    it('should ease out during second half', () => {
      const t1 = easeInOutCubic(0.8);
      const t2 = easeInOutCubic(0.9);
      const diff = t2 - t1;
      expect(diff).toBeGreaterThan(0);
      expect(diff).toBeLessThan(0.1);
    });
  });

  describe('easeInOutQuint', () => {
    it('should return 0 at t=0', () => {
      expect(easeInOutQuint(0)).toBe(0);
    });

    it('should return 1 at t=1', () => {
      expect(easeInOutQuint(1)).toBe(1);
    });

    it('should return 0.5 at t=0.5', () => {
      expect(easeInOutQuint(0.5)).toBe(0.5);
    });
  });

  describe('lerp', () => {
    it('should return start value at t=0', () => {
      expect(lerp(10, 20, 0)).toBe(10);
    });

    it('should return end value at t=1', () => {
      expect(lerp(10, 20, 1)).toBe(20);
    });

    it('should interpolate correctly at t=0.5', () => {
      expect(lerp(10, 20, 0.5)).toBe(15);
    });

    it('should work with negative values', () => {
      expect(lerp(-10, 10, 0.5)).toBe(0);
    });
  });

  describe('slerp', () => {
    it('should interpolate between quaternions', () => {
      const start = new THREE.Quaternion(0, 0, 0, 1);
      const end = new THREE.Quaternion(0, 1, 0, 0);
      const result = slerp(start, end, 0.5);
      
      expect(result).toBeInstanceOf(THREE.Quaternion);
      expect(result.w).toBeLessThan(1);
      expect(result.w).toBeGreaterThan(0);
    });
  });
});

describe('Camera Position Calculations', () => {
  describe('calculateFocusPosition', () => {
    it('should create position relative to target', () => {
      const target = new THREE.Vector3(0, 0, 0);
      const distance = 10;
      const result = calculateFocusPosition(target, distance, 45);

      // The function creates an offset position, not necessarily at exact distance
      expect(result.position).toBeInstanceOf(THREE.Vector3);
      expect(result.position.length()).toBeGreaterThan(distance);
    });

    it('should look at target position', () => {
      const target = new THREE.Vector3(5, 5, 5);
      const result = calculateFocusPosition(target, 10, 45);

      expect(result.lookAt.x).toBe(target.x);
      expect(result.lookAt.y).toBe(target.y);
      expect(result.lookAt.z).toBe(target.z);
    });

    it('should position camera at specified angle', () => {
      const target = new THREE.Vector3(0, 0, 0);
      const result = calculateFocusPosition(target, 10, 90);

      expect(result.position.x).toBeGreaterThan(9);
      expect(result.position.y).toBeGreaterThan(0);
    });
  });

  describe('createCameraPath', () => {
    it('should create a spline with 3 points', () => {
      const start = new THREE.Vector3(0, 0, 0);
      const end = new THREE.Vector3(10, 0, 10);
      const path = createCameraPath(start, end, 5);

      expect(path).toBeInstanceOf(THREE.CatmullRomCurve3);
      expect(path.points.length).toBe(3);
    });

    it('should have elevated midpoint', () => {
      const start = new THREE.Vector3(0, 0, 0);
      const end = new THREE.Vector3(10, 0, 10);
      const path = createCameraPath(start, end, 5);

      expect(path.points[1].y).toBeGreaterThan(start.y);
      expect(path.points[1].y).toBeGreaterThan(end.y);
    });

    it('should start and end at specified positions', () => {
      const start = new THREE.Vector3(1, 2, 3);
      const end = new THREE.Vector3(10, 20, 30);
      const path = createCameraPath(start, end, 5);

      const startPoint = path.getPoint(0);
      const endPoint = path.getPoint(1);

      expect(startPoint.x).toBeCloseTo(start.x, 1);
      expect(startPoint.y).toBeCloseTo(start.y, 1);
      expect(startPoint.z).toBeCloseTo(start.z, 1);
      expect(endPoint.x).toBeCloseTo(end.x, 1);
      expect(endPoint.y).toBeCloseTo(end.y, 1);
      expect(endPoint.z).toBeCloseTo(end.z, 1);
    });
  });
});

describe('CameraAnimator', () => {
  let mockCamera: THREE.Camera;

  beforeEach(() => {
    mockCamera = new THREE.PerspectiveCamera();
    mockCamera.position.set(0, 0, 0);
  });

  it('should initialize with correct positions', () => {
    const from = {
      position: new THREE.Vector3(0, 0, 0),
      lookAt: new THREE.Vector3(0, 0, 0),
    };
    const to = {
      position: new THREE.Vector3(10, 10, 10),
      lookAt: new THREE.Vector3(5, 5, 5),
    };

    const animator = new CameraAnimator(from, to);
    expect(animator).toBeInstanceOf(CameraAnimator);
  });

  it('should update camera position over time', () => {
    const from = {
      position: new THREE.Vector3(0, 0, 0),
      lookAt: new THREE.Vector3(0, 0, 0),
    };
    const to = {
      position: new THREE.Vector3(10, 0, 0),
      lookAt: new THREE.Vector3(0, 0, 0),
    };

    const animator = new CameraAnimator(from, to, { duration: 1000, easing: (t) => t });

    // First update initializes start time
    animator.update(mockCamera, 0);
    
    // Halfway through animation
    const complete = animator.update(mockCamera, 500);
    expect(complete).toBe(false);
    expect(mockCamera.position.x).toBeGreaterThan(0);
    expect(mockCamera.position.x).toBeLessThan(10);
  });

  it('should complete animation after duration', () => {
    const from = {
      position: new THREE.Vector3(0, 0, 0),
      lookAt: new THREE.Vector3(0, 0, 0),
    };
    const to = {
      position: new THREE.Vector3(10, 0, 0),
      lookAt: new THREE.Vector3(0, 0, 0),
    };

    const animator = new CameraAnimator(from, to, { duration: 1000, easing: (t) => t });

    // Initialize with start time
    animator.update(mockCamera, 0);
    
    // Complete animation
    const complete = animator.update(mockCamera, 1000);
    expect(complete).toBe(true);
    expect(mockCamera.position.x).toBeCloseTo(10, 1);
  });

  it('should call onComplete callback', () => {
    const from = {
      position: new THREE.Vector3(0, 0, 0),
      lookAt: new THREE.Vector3(0, 0, 0),
    };
    const to = {
      position: new THREE.Vector3(10, 0, 0),
      lookAt: new THREE.Vector3(0, 0, 0),
    };

    const onComplete = jest.fn();
    const animator = new CameraAnimator(from, to, { duration: 1000, easing: (t) => t });
    animator.setOnComplete(onComplete);

    // Initialize with start time
    animator.update(mockCamera, 0);
    
    // Complete animation
    animator.update(mockCamera, 1000);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('should reset animation', () => {
    const from = {
      position: new THREE.Vector3(0, 0, 0),
      lookAt: new THREE.Vector3(0, 0, 0),
    };
    const to = {
      position: new THREE.Vector3(10, 0, 0),
      lookAt: new THREE.Vector3(0, 0, 0),
    };

    const animator = new CameraAnimator(from, to);
    animator.update(mockCamera, 500);
    animator.reset();

    const complete = animator.update(mockCamera, 100);
    expect(complete).toBe(false);
  });
});

describe('constrainCamera', () => {
  it('should not modify position within bounds', () => {
    const position = new THREE.Vector3(10, 10, 10);
    const result = constrainCamera(position, 5, 200);

    expect(result.x).toBe(position.x);
    expect(result.y).toBe(position.y);
    expect(result.z).toBe(position.z);
  });

  it('should enforce minimum distance', () => {
    const position = new THREE.Vector3(1, 1, 1);
    const result = constrainCamera(position, 10, 200);

    const distance = result.length();
    expect(distance).toBeCloseTo(10, 1);
  });

  it('should enforce maximum distance', () => {
    const position = new THREE.Vector3(100, 100, 100);
    const result = constrainCamera(position, 5, 50);

    const distance = result.length();
    expect(distance).toBeCloseTo(50, 1);
  });

  it('should maintain direction when constraining', () => {
    const position = new THREE.Vector3(10, 0, 0);
    const result = constrainCamera(position, 20, 200);

    expect(result.y).toBeCloseTo(0, 5);
    expect(result.z).toBeCloseTo(0, 5);
    expect(result.x).toBeGreaterThan(0);
  });
});

describe('Default configurations', () => {
  it('should have valid default camera positions', () => {
    expect(DEFAULT_CAMERA_POSITIONS.universe.position).toBeInstanceOf(THREE.Vector3);
    expect(DEFAULT_CAMERA_POSITIONS.universe.lookAt).toBeInstanceOf(THREE.Vector3);
    expect(DEFAULT_CAMERA_POSITIONS.galaxy.position).toBeInstanceOf(THREE.Vector3);
    expect(DEFAULT_CAMERA_POSITIONS.galaxy.lookAt).toBeInstanceOf(THREE.Vector3);
  });

  it('should have valid default animation config', () => {
    expect(DEFAULT_ANIMATION_CONFIG.duration).toBeGreaterThan(0);
    expect(typeof DEFAULT_ANIMATION_CONFIG.easing).toBe('function');
  });
});
