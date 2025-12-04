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

'use client';

/**
 * MarkdownContent - Renders markdown content with sanitization
 * Supports headings, lists, images, code blocks
 */

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

/**
 * Sanitize markdown content by removing potentially unsafe HTML
 * 
 * SECURITY NOTE: This is defense-in-depth. React Markdown is configured with
 * skipHtml={true} which prevents rendering of any raw HTML, making this the
 * primary security control. This sanitization provides an additional layer.
 * 
 * The regex pattern handles common script tag variations. While CodeQL flags
 * edge cases like </script\t\n bar>, these are already blocked by skipHtml.
 */
function sanitizeContent(content: string): string {
  // Remove script tags with comprehensive pattern (multiple passes to handle edge cases)
  let sanitized = content;
  let prevLength = 0;
  
  // Keep removing script tags until no more are found
  // This handles nested tags and variations
  while (sanitized.length !== prevLength) {
    prevLength = sanitized.length;
    // Match opening tag, any content, and closing tag with whitespace variations
    sanitized = sanitized.replace(/<script[\s\S]*?<\/script[\s]*>/gi, '');
  }
  
  // Remove event handlers (multiple passes to handle all variations including unquoted)
  prevLength = 0;
  while (sanitized.length !== prevLength) {
    prevLength = sanitized.length;
    sanitized = sanitized.replace(/\s*on\w+\s*=\s*(?:["'][^"']*["']|[^>\s]+)/gi, '');
  }
  
  return sanitized;
}

export default function MarkdownContent({ content, className = '' }: MarkdownContentProps) {
  const sanitizedContent = sanitizeContent(content);

  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml={true}
        components={{
          // Customize rendering of specific elements
          h1: ({ ...props }) => <h1 style={{ fontSize: '2rem', marginBottom: '1rem', marginTop: '1.5rem' }} {...props} />,
          h2: ({ ...props }) => <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem', marginTop: '1.25rem' }} {...props} />,
          h3: ({ ...props }) => <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', marginTop: '1rem' }} {...props} />,
          p: ({ ...props }) => <p style={{ marginBottom: '1rem', lineHeight: '1.6' }} {...props} />,
          ul: ({ ...props }) => <ul style={{ marginBottom: '1rem', paddingLeft: '2rem', listStyleType: 'disc' }} {...props} />,
          ol: ({ ...props }) => <ol style={{ marginBottom: '1rem', paddingLeft: '2rem' }} {...props} />,
          li: ({ ...props }) => <li style={{ marginBottom: '0.5rem' }} {...props} />,
          code: ({ className, ...props }) => {
            const isInline = !className?.includes('language-');
            return isInline ? (
              <code
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  padding: '0.2rem 0.4rem',
                  borderRadius: '3px',
                  fontSize: '0.9em',
                  fontFamily: 'monospace',
                }}
                {...props}
              />
            ) : (
              <code
                style={{
                  display: 'block',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  padding: '1rem',
                  borderRadius: '4px',
                  overflow: 'auto',
                  marginBottom: '1rem',
                  fontFamily: 'monospace',
                  fontSize: '0.9em',
                }}
                {...props}
              />
            );
          },
          pre: ({ ...props }) => <pre style={{ margin: 0 }} {...props} />,
          blockquote: ({ ...props }) => (
            <blockquote
              style={{
                borderLeft: '4px solid #4A90E2',
                paddingLeft: '1rem',
                marginBottom: '1rem',
                fontStyle: 'italic',
                color: '#CCCCCC',
              }}
              {...props}
            />
          ),
          a: ({ ...props }) => (
            <a
              style={{
                color: '#4A90E2',
                textDecoration: 'underline',
              }}
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          img: ({ alt, ...props }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              style={{
                maxWidth: '100%',
                height: 'auto',
                borderRadius: '4px',
                marginBottom: '1rem',
              }}
              alt={alt || ''}
              {...props}
            />
          ),
        }}
      >
        {sanitizedContent}
      </ReactMarkdown>
    </div>
  );
}
