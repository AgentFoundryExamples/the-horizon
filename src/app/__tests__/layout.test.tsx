/**
 * Unit tests for RootLayout component - Dark Mode Enforcement
 */

import { render } from '@testing-library/react';
import RootLayout, { metadata, viewport } from '../layout';

describe('RootLayout - Dark Mode Enforcement', () => {
  describe('Metadata and Viewport Configuration', () => {
    it('should configure dark color scheme in viewport', () => {
      expect(viewport).toBeDefined();
      expect(viewport.colorScheme).toBe('dark');
    });

    it('should have proper metadata without colorScheme', () => {
      expect(metadata).toBeDefined();
      expect(metadata.title).toBe('The Horizon - Explore the Universe');
      // Ensure colorScheme is NOT in metadata (should be in viewport)
      expect((metadata as any).colorScheme).toBeUndefined();
    });
  });

  describe('HTML Element Dark Mode Attributes', () => {
    it('should render html element with data-theme="dark" attribute', () => {
      const { container } = render(
        <RootLayout>
          <div>Test Content</div>
        </RootLayout>
      );

      const htmlElement = container.querySelector('html');
      expect(htmlElement).toHaveAttribute('data-theme', 'dark');
    });

    it('should render html element with inline colorScheme style', () => {
      const { container } = render(
        <RootLayout>
          <div>Test Content</div>
        </RootLayout>
      );

      const htmlElement = container.querySelector('html');
      expect(htmlElement).toHaveStyle({ colorScheme: 'dark' });
    });

    it('should render html element with lang="en" attribute', () => {
      const { container } = render(
        <RootLayout>
          <div>Test Content</div>
        </RootLayout>
      );

      const htmlElement = container.querySelector('html');
      expect(htmlElement).toHaveAttribute('lang', 'en');
    });

    it('should render children inside body element', () => {
      const { container } = render(
        <RootLayout>
          <div data-testid="test-child">Test Content</div>
        </RootLayout>
      );

      const bodyElement = container.querySelector('body');
      expect(bodyElement).toBeInTheDocument();
      expect(bodyElement?.querySelector('[data-testid="test-child"]')).toBeInTheDocument();
    });
  });

  describe('Dark Mode Enforcement - No Light Mode Support', () => {
    it('should force dark mode regardless of system preferences', () => {
      // This test verifies that the layout enforces dark mode attributes
      // regardless of what prefers-color-scheme the user has set
      const { container } = render(
        <RootLayout>
          <div>Content</div>
        </RootLayout>
      );

      const htmlElement = container.querySelector('html');
      
      // All three methods of forcing dark mode should be present
      expect(htmlElement).toHaveAttribute('data-theme', 'dark');
      expect(htmlElement).toHaveStyle({ colorScheme: 'dark' });
      expect(viewport.colorScheme).toBe('dark');
    });

    it('should not have any light mode theme attributes', () => {
      const { container } = render(
        <RootLayout>
          <div>Content</div>
        </RootLayout>
      );

      const htmlElement = container.querySelector('html');
      
      // Verify no light mode attributes exist
      expect(htmlElement).not.toHaveAttribute('data-theme', 'light');
      expect(htmlElement).not.toHaveAttribute('data-theme', 'auto');
      expect(htmlElement?.getAttribute('data-theme')).toBe('dark');
    });
  });

  describe('SSR Consistency', () => {
    it('should render consistent dark mode attributes on server and client', () => {
      // First render (simulating SSR)
      const { container: container1 } = render(
        <RootLayout>
          <div>SSR Content</div>
        </RootLayout>
      );

      // Second render (simulating CSR/hydration)
      const { container: container2 } = render(
        <RootLayout>
          <div>CSR Content</div>
        </RootLayout>
      );

      const html1 = container1.querySelector('html');
      const html2 = container2.querySelector('html');

      // Both renders should have identical dark mode attributes
      expect(html1?.getAttribute('data-theme')).toBe(html2?.getAttribute('data-theme'));
      expect(html1?.style.colorScheme).toBe(html2?.style.colorScheme);
    });
  });
});
