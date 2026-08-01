# ADR 005: Adopt Clean Architecture

## Status
Accepted

## Context
We need an architecture that:
- Separates business logic from infrastructure
- Makes the system testable
- Supports long-term maintainability
- Allows independent evolution of components
- Follows SOLID principles
- Enables team scaling

## Decision
We will structure the codebase following Clean Architecture (Hexagonal Architecture) principles.

## Rationale

### Why Clean Architecture?

1. **Independence**: Business logic independent of frameworks, databases, UI
2. **Testability**: Easy to test business logic in isolation
3. **Flexibility**: Can swap out infrastructure without affecting business logic
4. **Maintainability**: Clear boundaries and responsibilities
5. **Scalability**: Easy to add features without breaking existing code
6. **Team Collaboration**: Different teams can work on different layers

### Architecture Layers

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│    (Controllers, DTOs, Middleware)      │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│        Application Layer                │
│    (Use Cases, Services, Events)        │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│           Domain Layer                  │
│    (Entities, Value Objects, Rules)     │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│       Infrastructure Layer              │
│  (Database, Queue, External Services)   │
└─────────────────────────────────────────┘
```

### Layer Responsibilities

**Domain Layer (Core)**
- Business entities (Job)
- Domain events (JobCreated, JobCompleted)
- Business rules (state transitions)
- No dependencies on other layers

**Application Layer**
- Use cases / services (JobService)
- Orchestration logic
- Transaction management
- Depends only on Domain and Contracts

**Infrastructure Layer**
- Database implementations (PrismaJobRepository)
- Queue implementations (BullMQQueuePublisher)
- External service adapters
- Depends on Contracts (implements interfaces)

**Presentation Layer**
- HTTP controllers
- Request/response DTOs
- Middleware, filters, guards
- Depends on Application layer

### Dependency Rule

**Dependencies point inward**
- Presentation → Application → Domain
- Infrastructure → Domain (through interfaces)
- No inner layer depends on outer layer

### Interfaces (Contracts)

Interfaces define contracts between layers:
```typescript
// Contract (no dependencies)
interface IJobRepository {
  create(job: Job): Promise<Job>;
}

// Domain uses contract
class JobService {
  constructor(private repo: IJobRepository) {}
}

// Infrastructure implements contract
class PrismaJobRepository implements IJobRepository {
  create(job: Job): Promise<Job> { ... }
}
```

### Alternatives Considered

**Layered Architecture**
- ❌ Less separation of concerns
- ❌ Harder to test
- ❌ More coupling
- ✅ Simpler to understand
- ✅ Less boilerplate

**Microservices**
- ❌ Premature complexity
- ❌ Operational overhead
- ❌ Network latency
- ✅ Independent deployment
- ✅ Technology diversity

**Modular Monolith**
- ✅ Good middle ground
- ✅ Bounded contexts
- ❌ Still requires discipline
- ⚠️  Can evolve from Clean Architecture

## Consequences

### Positive
- Business logic is framework-agnostic
- Easy to test each layer independently
- Can migrate from NestJS to Express without changing business logic
- Can swap Prisma for TypeORM
- Clear boundaries prevent accidental coupling
- New team members can understand structure quickly

### Negative
- More files and folders
- More interfaces and abstractions
- Initial development slower
- Requires team discipline

### Mitigation
- Provide clear examples and documentation
- Use code generators for boilerplate
- Conduct code reviews to enforce boundaries
- Keep interfaces simple and focused

## Testing Strategy

**Unit Tests**: Domain and Application layers (no dependencies)
```typescript
describe('Job.markCompleted', () => {
  it('should transition to COMPLETED state', () => {
    const job = new Job(...);
    job.markCompleted();
    expect(job.status).toBe(JobStatus.COMPLETED);
  });
});
```

**Integration Tests**: Infrastructure layer (with real dependencies)
```typescript
describe('PrismaJobRepository', () => {
  it('should persist job to database', async () => {
    const repo = new PrismaJobRepository(prisma);
    const job = Job.create(...);
    await repo.create(job);
    // verify in database
  });
});
```

**E2E Tests**: Full stack through HTTP
```typescript
describe('POST /jobs', () => {
  it('should create job and return 201', async () => {
    const response = await request(app)
      .post('/api/v1/jobs')
      .send({ type: 'email.send', payload: {} });
    expect(response.status).toBe(201);
  });
});
```

## Evolution Path

Clean Architecture supports evolution:

1. **Current**: Modular monolith with clear boundaries
2. **Next**: Extract packages into separate repos if needed
3. **Future**: Convert packages to microservices if scale requires

The architecture supports all these transitions because:
- Boundaries are already defined
- Interfaces are stable
- Business logic is isolated

## Project Structure

```
apps/api/
├── src/
│   ├── presentation/      # HTTP layer
│   │   ├── controllers/
│   │   ├── dtos/
│   │   ├── middleware/
│   │   └── filters/
│   ├── application/       # Use cases
│   │   └── services/
│   ├── infrastructure/    # External services
│   │   ├── repositories/
│   │   └── adapters/
│   └── main.ts

packages/
├── shared/               # Domain layer
│   ├── domain/
│   │   ├── entities/
│   │   └── events/
├── contracts/            # Interfaces
│   ├── repositories/
│   └── services/
└── infrastructure/       # Implementations
    ├── database/
    ├── queue/
    └── logger/
```

## References
- [The Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Hexagonal Architecture - Alistair Cockburn](https://alistair.cockburn.us/hexagonal-architecture/)
- [Domain-Driven Design - Eric Evans](https://www.domainlanguage.com/ddd/)
