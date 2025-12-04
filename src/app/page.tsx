import { getGalaxies } from '@/lib/universe';
import UniverseScene from '@/components/UniverseScene';
import SceneHUD from '@/components/SceneHUD';

export default async function HomePage() {
  const galaxies = await getGalaxies();

  if (galaxies.length === 0) {
    return (
      <main style={{ padding: '2rem', minHeight: '100vh' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Welcome to The Horizon</h1>
        <div style={{ padding: '2rem', border: '1px solid #444', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>No Galaxies Found</h2>
          <p>The universe data could not be loaded or is empty. Please check the universe.json file.</p>
        </div>
      </main>
    );
  }

  return (
    <main style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
      <UniverseScene galaxies={galaxies} />
      <SceneHUD galaxies={galaxies} />
      
      {/* Info overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: '1rem',
          right: '1rem',
          padding: '1rem',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          border: '1px solid #444',
          borderRadius: '8px',
          maxWidth: '300px',
          zIndex: 100,
        }}
      >
        <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: '#4A90E2' }}>
          The Horizon
        </h3>
        <p style={{ fontSize: '0.8rem', color: '#CCCCCC', marginBottom: '0.5rem' }}>
          Click on galaxies to explore solar systems and stars.
        </p>
        <p style={{ fontSize: '0.75rem', color: '#888' }}>
          Use mouse to orbit • Scroll to zoom
        </p>
      </div>
    </main>
  );
}
