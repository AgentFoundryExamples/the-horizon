# Dependency Graph

Multi-language intra-repository dependency analysis.

Supports Python, JavaScript/TypeScript, C/C++, Rust, Go, Java, C#, Swift, HTML/CSS, and SQL.

Includes classification of external dependencies as stdlib vs third-party.

## Statistics

- **Total files**: 23
- **Intra-repo dependencies**: 12
- **External stdlib dependencies**: 3
- **External third-party dependencies**: 11

## External Dependencies

### Standard Library / Core Modules

Total: 3 unique modules

- `crypto`
- `fs/promises`
- `path`

### Third-Party Packages

Total: 11 unique packages

- `@/../public/universe/universe.json`
- `@/lib/auth`
- `@/lib/github`
- `@/lib/universe/mutate`
- `@testing-library/jest-dom`
- `@testing-library/react`
- `next/headers`
- `next/jest`
- `next/server`
- `three`
- `zustand`

## Most Depended Upon Files (Intra-Repo)

- `src/lib/universe/types.ts` (5 dependents)
- `src/lib/universe/data-service.ts` (2 dependents)
- `src/lib/auth.ts` (1 dependents)
- `src/lib/camera.ts` (1 dependents)
- `src/lib/github.ts` (1 dependents)
- `src/lib/store.ts` (1 dependents)
- `src/lib/universe/mutate.ts` (1 dependents)

## Files with Most Dependencies (Intra-Repo)

- `src/lib/universe/__tests__/edge-cases.test.ts` (2 dependencies)
- `src/lib/universe/__tests__/mutate.test.ts` (2 dependencies)
- `src/lib/__tests__/auth.test.ts` (1 dependencies)
- `src/lib/__tests__/camera.test.ts` (1 dependencies)
- `src/lib/__tests__/github.test.ts` (1 dependencies)
- `src/lib/__tests__/store.test.ts` (1 dependencies)
- `src/lib/universe/__tests__/data-service.test.ts` (1 dependencies)
- `src/lib/universe/__tests__/types.test.ts` (1 dependencies)
- `src/lib/universe/data-service.ts` (1 dependencies)
- `src/lib/universe/mutate.ts` (1 dependencies)
