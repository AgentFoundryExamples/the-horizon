# The Horizon - Interactive Universe Explorer

A modern web application for exploring a 3D universe featuring galaxies, solar systems, planets, and moons. Built with Next.js 14, React, TypeScript, and Three.js.

## Features

- 🌌 **Universe Data Schema**: Well-defined JSON structure for galaxies, solar systems, planets, and moons
- 🎨 **3D Ready**: Built with Three.js and React Three Fiber for future 3D visualizations
- 📝 **Markdown Content**: Rich content support using React Markdown
- ✅ **TypeScript**: Fully typed data models with runtime validation
- 🧪 **Tested**: Comprehensive unit tests for data loading and validation
- 🚀 **Next.js 14**: Server-side rendering and static generation support
- 📱 **Responsive**: Mobile-friendly design

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
│   │   ├── page.tsx           # Home page
│   │   ├── globals.css        # Global styles
│   │   └── galaxy/[id]/       # Galaxy detail pages
│   └── lib/
│       └── universe/          # Universe data library
│           ├── types.ts       # TypeScript models
│           ├── data-service.ts # Data loading service
│           └── __tests__/     # Unit tests
├── public/
│   └── universe/
│       └── universe.json      # Universe data
├── docs/
│   └── universe-schema.md     # Schema documentation
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

### Adding New Content

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

Current environment variables (for future features):
- `ADMIN_PASSWORD` - Admin authentication
- `GITHUB_TOKEN` - GitHub API integration
- `NODE_ENV` - Environment mode

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel dashboard
3. Deploy (zero configuration needed)

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

## Future Enhancements

- 🎮 Interactive 3D universe visualization
- 👤 Admin UI for content management
- 🗄️ Database integration for dynamic content
- 🔐 Authentication and authorization
- 📊 Analytics and usage tracking
- 🌐 API endpoints for external integrations

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
