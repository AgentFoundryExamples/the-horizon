# Dependency Graph

Multi-language intra-repository dependency analysis.

Supports Python, JavaScript/TypeScript, C/C++, Rust, Go, Java, C#, Swift, HTML/CSS, and SQL.

Includes classification of external dependencies as stdlib vs third-party.

## Statistics

- **Total files**: 31
- **Intra-repo dependencies**: 22
- **External stdlib dependencies**: 5
- **External third-party dependencies**: 14

## External Dependencies

### Standard Library / Core Modules

Total: 5 unique modules

- `crypto`
- `fs/promises`
- `os`
- `path`
- `util`

### Third-Party Packages

Total: 14 unique packages

- `@/../public/universe/universe.json`
- `@/lib/auth`
- `@/lib/crypto`
- `@/lib/github`
- `@/lib/universe/mutate`
- `@/lib/universe/persist`
- `@testing-library/jest-dom`
- `@testing-library/react`
- `next/headers`
- `next/jest`
- `next/server`
- `react`
- `three`
- `zustand`

## Most Depended Upon Files (Intra-Repo)

- `src/lib/universe/types.ts` (7 dependents)
- `src/lib/crypto.ts` (4 dependents)
- `src/lib/universe/data-service.ts` (2 dependents)
- `src/lib/universe/mutate.ts` (2 dependents)
- `src/lib/animation.ts` (1 dependents)
- `src/lib/auth.ts` (1 dependents)
- `src/lib/camera.ts` (1 dependents)
- `src/lib/github.ts` (1 dependents)
- `src/lib/store.ts` (1 dependents)
- `src/lib/universe/persist.ts` (1 dependents)

## Files with Most Dependencies (Intra-Repo)

- `src/lib/universe/__tests__/edge-cases.test.ts` (2 dependencies)
- `src/lib/universe/__tests__/mutate.test.ts` (2 dependencies)
- `src/lib/universe/__tests__/persist.test.ts` (2 dependencies)
- `src/lib/universe/persist.ts` (2 dependencies)
- `src/lib/__tests__/animation.test.ts` (1 dependencies)
- `src/lib/__tests__/auth.test.ts` (1 dependencies)
- `src/lib/__tests__/camera.test.ts` (1 dependencies)
- `src/lib/__tests__/crypto.test.ts` (1 dependencies)
- `src/lib/__tests__/github.test.ts` (1 dependencies)
- `src/lib/__tests__/store.test.ts` (1 dependencies)
