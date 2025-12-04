import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getGalaxyById } from '@/lib/universe';

export default async function GalaxyPage({ params }: { params: { id: string } }) {
  const galaxy = await getGalaxyById(params.id);

  if (!galaxy) {
    notFound();
  }

  return (
    <main style={{ padding: '2rem', minHeight: '100vh' }}>
      <Link href="/" style={{ color: '#4A90E2', marginBottom: '1rem', display: 'inline-block' }}>
        ← Back to Home
      </Link>

      <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: galaxy.particleColor }}>
        {galaxy.name}
      </h1>
      
      <p style={{ fontSize: '1.2rem', marginBottom: '2rem', color: '#cccccc' }}>
        {galaxy.description}
      </p>

      <div style={{ marginBottom: '2rem', color: '#888' }}>
        <div>Theme: {galaxy.theme}</div>
        <div>Particle Color: <span style={{ color: galaxy.particleColor }}>{galaxy.particleColor}</span></div>
      </div>

      {galaxy.stars && galaxy.stars.length > 0 && (
        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Free-Floating Stars</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
            {galaxy.stars.map((star) => (
              <div
                key={star.id}
                style={{
                  padding: '1rem',
                  border: '1px solid #444',
                  borderRadius: '8px',
                  backgroundColor: '#111',
                }}
              >
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{star.name}</h3>
                <p style={{ color: '#888', fontSize: '0.9rem' }}>Theme: {star.theme}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {galaxy.solarSystems && galaxy.solarSystems.length > 0 && (
        <section>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Solar Systems</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {galaxy.solarSystems.map((system) => (
              <div
                key={system.id}
                style={{
                  padding: '1.5rem',
                  border: '1px solid #444',
                  borderRadius: '8px',
                  backgroundColor: '#111',
                }}
              >
                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{system.name}</h3>
                <p style={{ color: '#888', marginBottom: '1rem' }}>
                  Main Star: {system.mainStar.name} ({system.mainStar.theme})
                </p>
                {system.planets && system.planets.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Planets:</h4>
                    <ul style={{ paddingLeft: '1.5rem' }}>
                      {system.planets.map((planet) => (
                        <li key={planet.id} style={{ marginBottom: '0.25rem', color: '#cccccc' }}>
                          {planet.name} - {planet.summary}
                          {planet.moons && planet.moons.length > 0 && (
                            <span style={{ color: '#888', fontSize: '0.9rem' }}>
                              {' '}({planet.moons.length} moon{planet.moons.length > 1 ? 's' : ''})
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
