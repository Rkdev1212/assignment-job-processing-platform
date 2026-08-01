# Contributing to AsyncFlow

Thank you for considering contributing to AsyncFlow! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow

## Getting Started

1. **Fork the repository**
2. **Clone your fork:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/assignment-job-processing-platform.git
   cd assignment-job-processing-platform
   ```
3. **Install dependencies:**
   ```bash
   npm install
   ```
4. **Create a branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### 1. Make Changes

- Follow existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation

### 2. Run Tests

```bash
# Run all tests
npm test

# Run specific tests
npm run test:unit
npm run test:integration

# Check coverage
npm run test:cov
```

### 3. Lint and Format

```bash
# Lint code
npm run lint

# Format code
npm run format
```

### 4. Commit Changes

Use conventional commit messages:
```
feat: add new feature
fix: fix bug
docs: update documentation
test: add tests
refactor: refactor code
chore: update dependencies
```

Example:
```bash
git add .
git commit -m "feat: add job priority queuing"
```

### 5. Push Changes

```bash
git push origin feature/your-feature-name
```

### 6. Create Pull Request

- Provide clear description
- Reference related issues
- Ensure CI passes

## Project Structure

```
asyncflow/
├── apps/
│   ├── api/          # REST API application
│   └── worker/       # Job processing worker
├── packages/
│   ├── shared/       # Domain models and events
│   ├── contracts/    # Interfaces
│   ├── database/     # Prisma ORM
│   ├── queue/        # BullMQ integration
│   ├── logger/       # Logging
│   ├── metrics/      # Metrics collection
│   ├── config/       # Configuration
│   └── utils/        # Utilities
└── docs/             # Documentation
```

## Architecture Guidelines

### Clean Architecture

Follow the established layers:
1. **Domain**: Business logic, entities, events (no dependencies)
2. **Application**: Use cases, services (depends on Domain)
3. **Infrastructure**: Database, queue, external services (implements contracts)
4. **Presentation**: Controllers, DTOs (depends on Application)

### Dependency Rule

- Dependencies point inward (outer → inner)
- Inner layers never depend on outer layers
- Use interfaces to invert dependencies

### Example

```typescript
// ❌ Bad: Business logic depends on infrastructure
class JobService {
  constructor(private prisma: PrismaClient) {}
}

// ✅ Good: Business logic depends on abstraction
class JobService {
  constructor(private repository: IJobRepository) {}
}
```

## Coding Standards

### TypeScript

- Use strict mode
- Avoid `any` type
- Prefer interfaces over types for contracts
- Use meaningful variable names
- Add JSDoc comments for public APIs

### Testing

- Write tests for new features
- Aim for >80% coverage
- Unit tests for business logic
- Integration tests for infrastructure
- E2E tests for critical flows

### Error Handling

- Use specific error types
- Provide meaningful error messages
- Log errors with context
- Don't swallow errors

```typescript
// ✅ Good
try {
  await processJob(job);
} catch (error) {
  this.logger.error('Failed to process job', error, {
    jobId: job.id,
    type: job.type,
  });
  throw error;
}
```

## Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for APIs
- Update ADRs for architectural decisions
- Include examples in documentation

## Pull Request Checklist

- [ ] Tests pass locally
- [ ] Code follows style guide
- [ ] Documentation updated
- [ ] Commit messages are clear
- [ ] Branch is up to date with main
- [ ] No merge conflicts
- [ ] PR description is clear

## Review Process

1. Automated checks run (CI)
2. Code review by maintainers
3. Address feedback
4. Approval and merge

## Questions?

Feel free to open an issue for questions or discussions.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
