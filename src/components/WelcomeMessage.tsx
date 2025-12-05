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
      style={{
        position: 'absolute',
        top: '2rem',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '1rem 2rem',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        border: '2px solid rgba(74, 144, 226, 0.5)',
        borderRadius: '12px',
        maxWidth: '90%',
        width: 'auto',
        textAlign: 'center',
        zIndex: 50,
        pointerEvents: 'none',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
      }}
    >
      <h2
        style={{
          fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
          marginBottom: '0.5rem',
          color: '#4A90E2',
          fontWeight: 'bold',
          letterSpacing: '0.05em',
        }}
      >
        Welcome to the Horizon
      </h2>
      <p
        style={{
          fontSize: 'clamp(0.8rem, 1.8vw, 1rem)',
          color: '#CCCCCC',
          lineHeight: '1.5',
          margin: 0,
        }}
      >
        Click a galaxy to explore
      </p>
    </div>
  );
}
