# ADR 004: Implement Repository Pattern

## Status
Accepted

## Context
We need to abstract data access logic from business logic to:
- Keep business logic independent of database implementation
- Make code testable in isolation
- Support future database migration
- Follow clean architecture principles
- Improve maintainability

## Decision
We will implement the Repository Pattern with dependency injection.

## Rationale

### Why Repository Pattern?

1. **Separation of Concerns**: Business logic doesn't know about database
2. **Testability**: Easy to mock repositories in unit tests
3. **Flexibility**: Can swap database without changing business logic
4. **Single Responsibility**: Repository handles only data access
5. **Consistency**: Standardized data access interface
6. **Clean Architecture**: Aligns with hexagonal architecture

### Pattern Implementation

**Interface (Contracts Layer)**
```typescript
interface IJobRepository {
  create(job: Job): Promise<Job>;
  findById(id: string): Promise<Job | null>;
  findMany(filters: JobFilters): Promise<PaginatedResult<Job>>;
  update(job: Job): Promise<Job>;
  delete(id: string): Promise<void>;
}
```

**Implementation (Infrastructure Layer)**
```typescript
class PrismaJobRepository implements IJobRepository {
  // Prisma-specific implementation
}
```

**Usage (Application Layer)**
```typescript
class JobService {
  constructor(private repository: IJobRepository) {}
  // Business logic using repository interface
}
```

### Alternatives Considered

**Active Record**
- ❌ Couples domain models to database
- ❌ Harder to test
- ❌ Less flexible
- ✅ Less boilerplate
- ✅ Simpler for CRUD operations

**Direct ORM Usage**
- ❌ Business logic depends on ORM
- ❌ Hard to test without database
- ❌ Difficult to migrate
- ✅ Less abstraction
- ✅ Fewer layers

**Data Mapper**
- ✅ Similar benefits to Repository
- ❌ More complex
- ❌ More boilerplate

## Consequences

### Positive
- Business logic is database-agnostic
- Easy to write unit tests with mocks
- Can migrate from Prisma to TypeORM/Sequelize without changing business logic
- Clear separation of concerns
- Easier to understand code flow

### Negative
- More files and interfaces
- Additional abstraction layer
- Slight performance overhead (negligible)
- More boilerplate code

### Mitigation
- Use code generation for boilerplate where possible
- Keep repository interfaces focused and simple
- Document mapping between domain and database models

## Mapping Strategy

**Domain Entity → Database Model**
- Domain entities are rich objects with behavior
- Database models are plain data structures
- Repository handles bidirectional mapping

**Example:**
```typescript
// Domain
class Job {
  markCompleted() { /* business logic */ }
}

// Database
interface JobRecord {
  id: string;
  status: string;
  // ... other fields
}

// Repository maps between them
class PrismaJobRepository {
  private mapToDomain(record: JobRecord): Job {
    return new Job(...);
  }
}
```

## Testing Benefits

**Without Repository:**
```typescript
// Requires real database
test('should create job', async () => {
  const job = await prisma.job.create(...);
});
```

**With Repository:**
```typescript
// Can use mock
test('should create job', async () => {
  const mockRepo = { create: jest.fn() };
  const service = new JobService(mockRepo);
});
```

## Migration Path

If we need to change database:
1. Create new repository implementation (e.g., `TypeORMJobRepository`)
2. Update dependency injection configuration
3. Business logic remains unchanged
4. Run tests to verify

## References
- [Repository Pattern - Martin Fowler](https://martinfowler.com/eaaCatalog/repository.html)
- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
