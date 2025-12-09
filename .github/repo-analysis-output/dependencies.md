# Dependency Graph

Multi-language intra-repository dependency analysis.

Supports Python, JavaScript/TypeScript, C/C++, Rust, Go, Java, C#, Swift, HTML/CSS, and SQL.

Includes classification of external dependencies as stdlib vs third-party.

## Statistics

- **Total files**: 45
- **Intra-repo dependencies**: 38
- **External stdlib dependencies**: 5
- **External third-party dependencies**: 16

## External Dependencies

### Standard Library / Core Modules

Total: 5 unique modules

- `crypto`
- `fs/promises`
- `os`
- `path`
- `util`

### Third-Party Packages

Total: 16 unique packages

- `@/../public/universe/universe.json`
- `@/lib/auth`
- `@/lib/crypto`
- `@/lib/github`
- `@/lib/hover-store`
- `@/lib/universe/mutate`
- `@/lib/universe/persist`
- `@/lib/universe/types`
- `@testing-library/jest-dom`
- `@testing-library/react`
- `next/headers`
- `next/jest`
- `next/server`
- `react`
- `three`
- `zustand`

## Most Depended Upon Files (Intra-Repo)

- `src/lib/universe/types.ts` (11 dependents)
- `src/lib/universe/mutate.ts` (6 dependents)
- `src/lib/crypto.ts` (4 dependents)
- `src/lib/universe/persist.ts` (3 dependents)
- `src/lib/github.ts` (2 dependents)
- `src/lib/hover-store.ts` (2 dependents)
- `src/lib/universe/data-service.ts` (2 dependents)
- `src/lib/universe/scale-constants.ts` (2 dependents)
- `src/lib/animation.ts` (1 dependents)
- `src/lib/auth.ts` (1 dependents)

## Files with Most Dependencies (Intra-Repo)

- `src/lib/universe/__tests__/admin-workflow.test.ts` (3 dependencies)
- `src/lib/universe/__tests__/integration-save-workflow.test.ts` (3 dependencies)
- `src/lib/universe/__tests__/edge-cases.test.ts` (2 dependencies)
- `src/lib/universe/__tests__/galaxy-creation.test.ts` (2 dependencies)
- `src/lib/universe/__tests__/mutate.test.ts` (2 dependencies)
- `src/lib/universe/__tests__/persist.test.ts` (2 dependencies)
- `src/lib/universe/data-service.ts` (2 dependencies)
- `src/lib/universe/persist.ts` (2 dependencies)
- `src/lib/__tests__/animation.test.ts` (1 dependencies)
- `src/lib/__tests__/auth.test.ts` (1 dependencies)
