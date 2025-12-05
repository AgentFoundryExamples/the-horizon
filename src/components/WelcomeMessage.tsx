'use client';

/**
 * WelcomeMessage - Welcome callout displayed on universe landing page
 * Shows a tasteful branding message with instructions
 */

export default function WelcomeMessage() {
  return (
    <div
      className="welcome-message"
      role="complementary"
      aria-label="Welcome message"
    >
      <h2 className="welcome-message-title">
        Welcome to the Horizon
      </h2>
      <p className="welcome-message-text">
        Click a galaxy to explore
      </p>
    </div>
  );
}
