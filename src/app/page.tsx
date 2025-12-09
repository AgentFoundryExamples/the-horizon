import { getGalaxies } from '@/lib/universe';
import UniverseScene from '@/components/UniverseScene';
import SceneHUD from '@/components/SceneHUD';
import ContextualWelcomeMessage from '@/components/ContextualWelcomeMessage';
import Sidebar from '@/components/Sidebar';

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
      <ContextualWelcomeMessage galaxies={galaxies} />
      <UniverseScene galaxies={galaxies} />
      <SceneHUD galaxies={galaxies} />
      <Sidebar galaxies={galaxies} />
    </main>
  );
}
