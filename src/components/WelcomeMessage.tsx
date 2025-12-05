'use client';

/**
 * WelcomeMessage - Welcome callout displayed on galaxy view
 * Shows a tasteful branding message with instructions
 */

interface WelcomeMessageProps {
  galaxyName: string;
}

export default function WelcomeMessage({ galaxyName }: WelcomeMessageProps) {
  return (
    <div
      className="welcome-message"
      role="complementary"
      aria-label="Welcome message"
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        padding: '2rem',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        border: '2px solid rgba(74, 144, 226, 0.5)',
        borderRadius: '12px',
        maxWidth: '90%',
        width: '500px',
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
          marginBottom: '1rem',
          color: '#4A90E2',
          fontWeight: 'bold',
          letterSpacing: '0.05em',
        }}
      >
        Welcome to the Horizon
      </h2>
      <p
        style={{
          fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
          color: '#CCCCCC',
          marginBottom: '1rem',
          lineHeight: '1.6',
        }}
      >
        You are now exploring <strong style={{ color: '#FFFFFF' }}>{galaxyName}</strong>
      </p>
      <p
        style={{
          fontSize: 'clamp(0.8rem, 1.8vw, 1rem)',
          color: '#999',
          lineHeight: '1.5',
        }}
      >
        Click on solar systems to discover planets and moons
      </p>
    </div>
  );
}
