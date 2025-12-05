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
  Html: ({ children, style }: any) => <div style={style}>{children}</div>,
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
    it('should render tooltip when visible is true', () => {
      render(
        <Canvas>
          <SceneTooltip {...defaultProps} />
        </Canvas>
      );

      expect(screen.getByText('Test tooltip')).toBeInTheDocument();
    });

    it('should not render tooltip when visible is false', () => {
      render(
        <Canvas>
          <SceneTooltip {...defaultProps} visible={false} />
        </Canvas>
      );

      expect(screen.queryByText('Test tooltip')).not.toBeInTheDocument();
    });

    it('should render with custom fontSize', () => {
      render(
        <Canvas>
          <SceneTooltip {...defaultProps} fontSize="1.5rem" />
        </Canvas>
      );

      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveStyle({ fontSize: '1.5rem' });
    });

    it('should render with custom maxWidth', () => {
      render(
        <Canvas>
          <SceneTooltip {...defaultProps} maxWidth="400px" />
        </Canvas>
      );

      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveStyle({ maxWidth: '400px' });
    });
  });

  describe('Positioning', () => {
    it('should accept custom offsetY', () => {
      render(
        <Canvas>
          <SceneTooltip {...defaultProps} offsetY={-60} />
        </Canvas>
      );

      expect(screen.getByText('Test tooltip')).toBeInTheDocument();
    });

    it('should accept custom offsetX', () => {
      render(
        <Canvas>
          <SceneTooltip {...defaultProps} offsetX={20} />
        </Canvas>
      );

      expect(screen.getByText('Test tooltip')).toBeInTheDocument();
    });

    it('should accept different world positions', () => {
      const position = new THREE.Vector3(10, 20, 30);
      render(
        <Canvas>
          <SceneTooltip {...defaultProps} worldPosition={position} />
        </Canvas>
      );

      expect(screen.getByText('Test tooltip')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <Canvas>
          <SceneTooltip {...defaultProps} />
        </Canvas>
      );

      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveAttribute('aria-live', 'polite');
    });

    it('should be non-interactive', () => {
      render(
        <Canvas>
          <SceneTooltip {...defaultProps} />
        </Canvas>
      );

      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveStyle({ pointerEvents: 'none' });
    });
  });

  describe('Content types', () => {
    it('should render string content', () => {
      render(
        <Canvas>
          <SceneTooltip {...defaultProps} content="String content" />
        </Canvas>
      );

      expect(screen.getByText('String content')).toBeInTheDocument();
    });

    it('should render ReactNode content', () => {
      const content = (
        <div>
          <strong>Complex</strong> <em>Content</em>
        </div>
      );

      render(
        <Canvas>
          <SceneTooltip {...defaultProps} content={content} />
        </Canvas>
      );

      expect(screen.getByText('Complex')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should have proper background and border styles', () => {
      render(
        <Canvas>
          <SceneTooltip {...defaultProps} />
        </Canvas>
      );

      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveStyle({
        background: 'rgba(0, 0, 0, 0.95)',
        border: '2px solid rgba(74, 144, 226, 0.7)',
      });
    });

    it('should have proper text color', () => {
      render(
        <Canvas>
          <SceneTooltip {...defaultProps} />
        </Canvas>
      );

      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveStyle({ color: '#FFFFFF' });
    });

    it('should have backdrop filter for blur effect', () => {
      render(
        <Canvas>
          <SceneTooltip {...defaultProps} />
        </Canvas>
      );

      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveStyle({ backdropFilter: 'blur(4px)' });
    });
  });

  describe('Distance factor', () => {
    it('should accept custom distanceFactor', () => {
      render(
        <Canvas>
          <SceneTooltip {...defaultProps} distanceFactor={100} />
        </Canvas>
      );

      expect(screen.getByText('Test tooltip')).toBeInTheDocument();
    });
  });
});
