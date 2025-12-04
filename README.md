# The Horizon - Interactive Universe Explorer

A modern web application for exploring a 3D universe featuring galaxies, solar systems, planets, and moons. Built with Next.js 14, React, TypeScript, and Three.js.

## Features

- 🌌 **Universe Data Schema**: Well-defined JSON structure for galaxies, solar systems, planets, and moons
- 🎨 **3D Visualization**: Interactive 3D universe with shader-based particle galaxies
- 🎬 **Cinematic Navigation**: Smooth camera transitions with spline-based paths and easing
- 🪐 **Keplerian Orbits**: Realistic planetary motion using simplified orbital mechanics
- 🎮 **Multi-Layer Exploration**: Traverse from universe → galaxy → solar system → planet views
- 📝 **Markdown Content**: Rich content support using React Markdown with sanitization
- 🌙 **Moon Navigation**: Explore planet surfaces and hop between moons with seamless transitions
- ♿ **Accessibility**: Keyboard navigation, focus states, and reduced motion support
- ✅ **TypeScript**: Fully typed data models with runtime validation
- 🧪 **Tested**: Comprehensive unit tests for data loading and validation
- 🚀 **Next.js 14**: Server-side rendering and static generation support
- ⚡ **Performance**: Instanced rendering, LOD, and GPU-accelerated shaders

## Quick Start

### Prerequisites

- Node.js 18.x or higher
- npm or yarn package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/AgentFoundryExamples/the-horizon.git
cd the-horizon

# Install dependencies
npm install

# Copy environment template (optional for local development)
cp .env.example .env.local

# Start the development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the application.

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run Jest tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
the-horizon/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home page with 3D scene
│   │   ├── globals.css        # Global styles
│   │   └── galaxy/[id]/       # Galaxy detail pages
│   ├── components/            # React components
│   │   ├── UniverseScene.tsx  # Main 3D scene with galaxies
│   │   ├── GalaxyView.tsx     # Galaxy detail view with orbits
│   │   ├── SolarSystemView.tsx # Solar system with planets
│   │   ├── PlanetSurface.tsx  # Planet surface with moons
│   │   ├── MarkdownContent.tsx # Markdown renderer
│   │   └── SceneHUD.tsx       # Navigation overlay
│   ├── styles/
│   │   └── planet.css         # Planet surface styles
│   └── lib/
│       ├── universe/          # Universe data library
│       │   ├── types.ts       # TypeScript models
│       │   ├── data-service.ts # Data loading service
│       │   └── __tests__/     # Unit tests
│       ├── camera.ts          # Camera animation utilities
│       └── store.ts           # Zustand state management
├── public/
│   └── universe/
│       └── universe.json      # Universe data
├── docs/
│   ├── universe-schema.md     # Schema documentation
│   ├── visuals.md            # Scene controls and animation tuning
│   └── content-authoring.md  # Markdown authoring guidelines
├── .env.example              # Environment variable template
├── next.config.js            # Next.js configuration
├── tsconfig.json             # TypeScript configuration
├── jest.config.js            # Jest configuration
└── package.json              # Dependencies and scripts
```

## Universe Data

The universe is defined in `public/universe/universe.json` following a hierarchical structure:

```
Universe → Galaxies → Solar Systems → Planets → Moons
                   → Stars (free-floating)
```

For detailed schema documentation, see [docs/universe-schema.md](docs/universe-schema.md).

### Example Data Access

```typescript
import { getGalaxies, getPlanetById } from '@/lib/universe';

// Get all galaxies
const galaxies = await getGalaxies();

// Get a specific planet
const earth = await getPlanetById('earth');
```

## Testing

The project includes comprehensive unit tests for data validation and loading:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Content Management

### Admin Interface

The Horizon includes a password-protected admin interface for editing universe content directly through your browser.

**Access**: Navigate to `/admin` and log in with your admin password.

**Features**:
- 🔒 Password-protected access with session management
- ✏️ CRUD operations for galaxies, solar systems, planets, and moons
- 📝 Built-in markdown editor with live preview
- 🔄 GitHub integration for automatic commits and pull requests
- ✅ Real-time validation against the universe schema
- 🔐 Optimistic locking to prevent concurrent edit conflicts

### Using the Admin Interface

1. **Login**: Navigate to `/admin` and enter your admin password
2. **Edit Content**: Click "Edit" on any galaxy to modify its properties
3. **Add New Items**: Use the "+" buttons to create new galaxies, solar systems, planets, or moons
4. **Preview Changes**: Markdown content shows a live preview as you type
5. **Commit to GitHub**: Write a commit message and choose to either:
   - Create a Pull Request (recommended for review)
   - Commit directly to the main branch

### Manual Content Editing

You can also edit `public/universe/universe.json` directly:

1. Edit `public/universe/universe.json`
2. Follow the schema defined in `docs/universe-schema.md`
3. Include markdown content for planets and moons
4. Run validation: `npm run dev` and check console for warnings
5. Test your changes locally

### Content Guidelines

- Use proper markdown formatting
- Keep IDs in kebab-case (e.g., `milky-way`)
- Include meaningful descriptions
- Validate JSON syntax before committing

## Environment Variables

Copy `.env.example` to `.env.local` for local development:

```bash
cp .env.example .env.local
```

### Required Environment Variables

**For Admin Interface**:
- `ADMIN_PASSWORD` - Password for admin access (min 16 characters recommended)
- `GITHUB_TOKEN` - Personal access token with `repo` scope
- `GITHUB_OWNER` - Repository owner (e.g., 'AgentFoundryExamples')
- `GITHUB_REPO` - Repository name (e.g., 'the-horizon')
- `GITHUB_BRANCH` - Target branch (default: 'main')

**For Development**:
- `NODE_ENV` - Environment mode (development/production)

### Generating a GitHub Token

1. Go to [GitHub Settings → Personal Access Tokens](https://github.com/settings/tokens/new)
2. Create a new token with `repo` scope (and optionally `workflow` if using actions)
3. Copy the token and add it to your `.env.local` file

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel dashboard
3. Configure environment variables:
   - `ADMIN_PASSWORD` - Strong password for admin access
   - `GITHUB_TOKEN` - GitHub personal access token
   - `GITHUB_OWNER` - Your GitHub username or organization
   - `GITHUB_REPO` - Repository name
   - `GITHUB_BRANCH` - Target branch (usually 'main')
4. Deploy

**Note**: Vercel automatically sets `VERCEL_GIT_REPO_OWNER` and `VERCEL_GIT_REPO_SLUG`, which can be used as fallbacks for `GITHUB_OWNER` and `GITHUB_REPO`.

For detailed deployment instructions, see [docs/deployment.md](docs/deployment.md).

### Other Platforms

```bash
# Build the application
npm run build

# Start production server
npm start
```

The application can be deployed to any platform that supports Next.js.

## Tech Stack

- **Framework**: Next.js 14.2.15
- **Language**: TypeScript 5.6.3
- **UI Library**: React 18.3.1
- **3D Graphics**: Three.js 0.170.0, React Three Fiber 8.17.10, Drei 9.117.3
- **State Management**: Zustand 5.0.1
- **Markdown**: React Markdown 9.0.1
- **Testing**: Jest 29.7.0, Testing Library
- **Linting**: ESLint 8.57.1

## 3D Scene Controls

### Navigation

- **Mouse Drag**: Orbit around the universe (universe view only)
- **Mouse Wheel**: Zoom in/out (universe view only)
- **Click Galaxy**: Transition to galaxy detail view with orbiting solar systems
- **Click Solar System**: Zoom into solar system with orbiting planets
- **Click Planet**: Land on planet surface to view markdown content
- **Click Moon (in skybox)**: Hop to moon and view its content
- **Back Button**: Return to previous level with animated transition
- **Breadcrumbs**: Navigate hierarchy via top navigation bar

### Accessibility

The application supports modern accessibility features:
- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Focus States**: Clear visual indicators for focused elements
- **Reduced Motion**: Respects `prefers-reduced-motion` setting to disable non-essential animations
- **Screen Reader Support**: Semantic HTML and ARIA labels where appropriate

### Performance

The scene uses several optimizations for smooth 60 FPS rendering:
- Shader-based particle systems for galaxies (2,000+ particles each)
- Instanced rendering for planets and stars
- GPU-accelerated animations
- Efficient state management with Zustand
- Optimized markdown rendering with React Markdown

See [docs/visuals.md](docs/visuals.md) for detailed scene controls, animation tuning, and performance optimization guidelines.
See [docs/content-authoring.md](docs/content-authoring.md) for markdown authoring guidelines.

## Future Enhancements

- 🎮 Interactive 3D universe visualization with advanced physics
- 🗄️ Database integration for dynamic content (if needed)
- 📊 Analytics and usage tracking
- 🌐 API endpoints for external integrations
- 🔍 Search and filter capabilities in admin interface
- 📱 Mobile-optimized admin interface

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Troubleshooting

### Build Errors

If you encounter build errors:
1. Delete `node_modules` and `package-lock.json`
2. Run `npm install` again
3. Clear Next.js cache: `rm -rf .next`

### Test Failures

If tests fail:
1. Ensure all dependencies are installed
2. Check that `universe.json` is valid JSON
3. Run `npm run type-check` to verify TypeScript

### Development Server Issues

If the dev server won't start:
1. Check that port 3000 is available
2. Try `npm run dev -- --port 3001` to use a different port
3. Clear any cached files: `rm -rf .next`

## Documentation

- [Universe Schema Documentation](docs/universe-schema.md)
- [Visual Scene Controls and Animation Tuning](docs/visuals.md)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Three Fiber Documentation](https://docs.pmnd.rs/react-three-fiber)


# Permanents (License, Contributing, Author)

Do not change any of the below sections

## License

This Agent Foundry Project is licensed under the Apache 2.0 License - see the LICENSE file for details.

## Contributing

Feel free to submit issues and enhancement requests!

## Author

Created by Agent Foundry and John Brosnihan
