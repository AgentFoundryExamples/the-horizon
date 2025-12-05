/**
 * Unit tests for SceneTooltip component
 */

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import SceneTooltip from '../SceneTooltip';

// Mock @react-three/drei Html component
jest.mock('@react-three/drei', () => ({
  Html: ({ children }: any) => <div data-testid="html-wrapper">{children}</div>,
}));

// Mock ResizeObserver
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverMock as any;

// Mock HTMLCanvasElement.getContext
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  fillStyle: '',
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  getImageData: jest.fn(() => ({
    data: new Array(4),
  })),
  putImageData: jest.fn(),
  createImageData: jest.fn(() => []),
  setTransform: jest.fn(),
  drawImage: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  stroke: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  measureText: jest.fn(() => ({ width: 0 })),
  transform: jest.fn(),
  rect: jest.fn(),
  clip: jest.fn(),
})) as any;

describe('SceneTooltip', () => {
  const defaultProps = {
    content: 'Test tooltip',
    worldPosition: new THREE.Vector3(0, 0, 0),
    visible: true,
  };

  describe('Rendering', () => {
    it('should render without crashing when visible', () => {
      expect(() => {
        render(
          <Canvas>
            <SceneTooltip {...defaultProps} />
          </Canvas>
        );
      }).not.toThrow();
    });

    it('should not render when visible is false', () => {
      const { container } = render(
        <Canvas>
          <SceneTooltip {...defaultProps} visible={false} />
        </Canvas>
      );

      // Component should return null when not visible
      expect(container.querySelector('.scene-tooltip')).not.toBeInTheDocument();
    });

    it('should accept custom fontSize prop', () => {
      expect(() => {
        render(
          <Canvas>
            <SceneTooltip {...defaultProps} fontSize="1.5rem" />
          </Canvas>
        );
      }).not.toThrow();
    });

    it('should accept custom maxWidth prop', () => {
      expect(() => {
        render(
          <Canvas>
            <SceneTooltip {...defaultProps} maxWidth="400px" />
          </Canvas>
        );
      }).not.toThrow();
    });
  });

  describe('Positioning', () => {
    it('should accept custom offsetY', () => {
      expect(() => {
        render(
          <Canvas>
            <SceneTooltip {...defaultProps} offsetY={-60} />
          </Canvas>
        );
      }).not.toThrow();
    });

    it('should accept custom offsetX', () => {
      expect(() => {
        render(
          <Canvas>
            <SceneTooltip {...defaultProps} offsetX={20} />
          </Canvas>
        );
      }).not.toThrow();
    });

    it('should accept different world positions', () => {
      const position = new THREE.Vector3(10, 20, 30);
      expect(() => {
        render(
          <Canvas>
            <SceneTooltip {...defaultProps} worldPosition={position} />
          </Canvas>
        );
      }).not.toThrow();
    });
  });

  describe('Content types', () => {
    it('should accept string content', () => {
      expect(() => {
        render(
          <Canvas>
            <SceneTooltip {...defaultProps} content="String content" />
          </Canvas>
        );
      }).not.toThrow();
    });

    it('should accept ReactNode content', () => {
      const content = (
        <div>
          <strong>Complex</strong> <em>Content</em>
        </div>
      );

      expect(() => {
        render(
          <Canvas>
            <SceneTooltip {...defaultProps} content={content} />
          </Canvas>
        );
      }).not.toThrow();
    });
  });

  describe('Styling', () => {
    it('should accept custom className', () => {
      expect(() => {
        render(
          <Canvas>
            <SceneTooltip {...defaultProps} className="custom-class" />
          </Canvas>
        );
      }).not.toThrow();
    });

    it('should accept custom borderColor', () => {
      expect(() => {
        render(
          <Canvas>
            <SceneTooltip {...defaultProps} borderColor="rgba(255, 0, 0, 0.7)" />
          </Canvas>
        );
      }).not.toThrow();
    });
  });

  describe('Distance factor', () => {
    it('should accept custom distanceFactor', () => {
      expect(() => {
        render(
          <Canvas>
            <SceneTooltip {...defaultProps} distanceFactor={100} />
          </Canvas>
        );
      }).not.toThrow();
    });
  });
});
