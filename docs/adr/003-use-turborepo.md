# ADR 003: Use TurboRepo for Monorepo Management

## Status
Accepted

## Context
We need a monorepo solution to manage multiple applications (API, Worker) and shared packages (contracts, database, queue, etc.) efficiently. Requirements:
- Fast, incremental builds
- Efficient caching
- Simple configuration
- Good developer experience
- CI/CD friendly

## Decision
We will use TurboRepo as our monorepo build system.

## Rationale

### Why TurboRepo?

1. **Speed**: Intelligent caching and task parallelization
2. **Simplicity**: Minimal configuration required
3. **Incremental Builds**: Only rebuilds what changed
4. **Remote Caching**: Team-wide build cache sharing
5. **Task Dependencies**: Automatic dependency graph resolution
6. **Zero Config**: Works with existing tools (npm, TypeScript)
7. **Developer Experience**: Fast feedback loops

### Alternatives Considered

**Nx**
- ❌ More complex configuration
- ❌ Steeper learning curve
- ❌ Heavier tooling
- ✅ More features (code generation, migrations)
- ✅ Better for very large monorepos

**Lerna**
- ❌ Slower builds (no caching by default)
- ❌ Less active development
- ❌ More configuration needed
- ✅ Mature ecosystem
- ✅ Good for versioning/publishing

**Rush**
- ❌ Complex setup
- ❌ Opinionated workflows
- ✅ Good for enterprise
- ✅ Strong isolation

**Yarn/npm Workspaces Only**
- ❌ No build caching
- ❌ No task orchestration
- ❌ Manual dependency management
- ✅ Simple
- ✅ Native package manager support

## Consequences

### Positive
- Dramatically faster CI/CD pipelines
- Better local development experience
- Easy to add new packages
- Automatic task dependencies
- Team-wide caching improves collaboration

### Negative
- Another tool in the stack
- Requires understanding of build pipeline
- Initial setup overhead

### Mitigation
- Keep turbo.json configuration simple
- Document build pipeline
- Use sensible defaults
- Provide clear npm scripts

## Project Structure

```
asyncflow/
├── apps/
│   ├── api/          # NestJS API
│   └── worker/       # Job Worker
├── packages/
│   ├── shared/       # Domain models
│   ├── contracts/    # Interfaces
│   ├── database/     # Prisma
│   ├── queue/        # BullMQ
│   ├── logger/       # Pino
│   ├── metrics/      # Prometheus
│   ├── config/       # Configuration
│   └── utils/        # Utilities
└── turbo.json        # Build configuration
```

## Build Pipeline

1. **Parallel Builds**: Packages build in parallel when possible
2. **Dependency Awareness**: Dependent packages build first
3. **Caching**: Skip builds if nothing changed
4. **Outputs**: Track build artifacts for caching

## Performance Benefits

- **First build**: ~60 seconds
- **Cached build**: ~5 seconds
- **Incremental build**: ~10-20 seconds

## References
- [TurboRepo Documentation](https://turbo.build/repo/docs)
- [TurboRepo GitHub](https://github.com/vercel/turbo)
