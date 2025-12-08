'use client';

/**
 * WelcomeMessage - Contextual hero message displayed across universe views
 * Shows contextual titles and descriptions for galaxies, solar systems, and universe
 */

export interface WelcomeMessageProps {
  title?: string;
  description?: string;
  visible?: boolean;
}

export default function WelcomeMessage({ 
  title = 'Welcome to the Horizon', 
  description = 'Click a galaxy to explore',
  visible = true 
}: WelcomeMessageProps) {
  if (!visible) {
    return null;
  }

  return (
    <div
      className="welcome-message"
      role="complementary"
      aria-label="Welcome message"
    >
      <h2 className="welcome-message-title">
        {title}
      </h2>
      <p className="welcome-message-text">
        {description}
      </p>
    </div>
  );
}
