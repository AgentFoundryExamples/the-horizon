import Link from 'next/link';
import { getGalaxies } from '@/lib/universe';

export default async function HomePage() {
  const galaxies = await getGalaxies();

  return (
    <main style={{ padding: '2rem', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Welcome to The Horizon</h1>
      <p style={{ fontSize: '1.2rem', marginBottom: '2rem', color: '#cccccc' }}>
        Explore the vast universe with interactive 3D visualizations of galaxies, solar systems, planets, and moons.
      </p>

      {galaxies.length === 0 ? (
        <div style={{ padding: '2rem', border: '1px solid #444', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>No Galaxies Found</h2>
          <p>The universe data could not be loaded or is empty. Please check the universe.json file.</p>
        </div>
      ) : (
        <section>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Galaxies</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {galaxies.map((galaxy) => (
              <Link
                key={galaxy.id}
                href={`/galaxy/${galaxy.id}`}
                style={{
                  padding: '1.5rem',
                  border: '1px solid #444',
                  borderRadius: '8px',
                  backgroundColor: '#111',
                  transition: 'all 0.3s',
                }}
              >
                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{galaxy.name}</h3>
                <p style={{ color: '#cccccc', marginBottom: '0.5rem' }}>{galaxy.description}</p>
                <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#888' }}>
                  <div>Theme: {galaxy.theme}</div>
                  <div>Stars: {galaxy.stars?.length || 0}</div>
                  <div>Solar Systems: {galaxy.solarSystems?.length || 0}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section style={{ marginTop: '3rem', padding: '2rem', border: '1px solid #444', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>About This Project</h2>
        <p style={{ color: '#cccccc', marginBottom: '1rem' }}>
          The Horizon is a modern web application built with Next.js 14, React, and Three.js. 
          It provides an interactive 3D universe exploration experience.
        </p>
        <p style={{ color: '#cccccc' }}>
          The universe data is stored in a structured JSON format and can be extended through 
          future admin workflows.
        </p>
      </section>
    </main>
  );
}
