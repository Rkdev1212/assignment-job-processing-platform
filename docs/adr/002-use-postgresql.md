# ADR 002: Use PostgreSQL for Job Storage

## Status
Accepted

## Context
We need a reliable database for storing job state, history, and metadata. The database must support:
- ACID transactions
- Complex queries for job filtering and analytics
- High read/write throughput
- JSON data types for flexible payloads
- Indexing for performance

## Decision
We will use PostgreSQL as our primary database.

## Rationale

### Why PostgreSQL?

1. **ACID Compliance**: Strong consistency guarantees for job state
2. **JSON Support**: Native JSONB type for flexible job payloads
3. **Performance**: Excellent query performance with proper indexing
4. **Reliability**: Battle-tested in production environments
5. **Rich Feature Set**: Full-text search, triggers, stored procedures
6. **Open Source**: Free, with strong community support
7. **Prisma ORM Support**: Excellent TypeScript integration

### Alternatives Considered

**MongoDB**
- ❌ Eventual consistency could cause race conditions
- ❌ Less mature transaction support
- ❌ Weaker querying capabilities
- ✅ Better horizontal scaling
- ✅ Flexible schema

**MySQL**
- ❌ Less robust JSON support
- ❌ Weaker transaction isolation
- ✅ Slightly faster for simple queries
- ✅ Lower resource usage

**DynamoDB**
- ❌ Requires AWS account
- ❌ Complex query patterns
- ❌ Cost at scale
- ✅ Infinite scalability
- ✅ Fully managed

**Redis Only**
- ❌ Limited query capabilities
- ❌ Memory-only storage (persistence is backup)
- ❌ Expensive for large datasets
- ✅ Extremely fast
- ✅ Simple

## Consequences

### Positive
- Strong consistency for job state
- Rich querying for job history and analytics
- Proven scalability patterns
- Excellent tooling and ecosystem
- Easy to backup and restore

### Negative
- Single-node bottleneck (mitigated with read replicas)
- More operational overhead than managed services
- Requires PostgreSQL expertise

### Mitigation
- Abstract database behind `IJobRepository` interface
- Use connection pooling for performance
- Implement proper indexing strategy
- Monitor query performance
- Use read replicas for analytics queries

## Schema Design

### Jobs Table
- Primary key: UUID
- Indexed fields: status, type, correlationId, createdAt, priority, runAt
- JSON field for flexible payloads
- Timestamp tracking for lifecycle events

### Job Timeline Table
- Tracks all state transitions
- Enables audit trail and debugging
- Foreign key cascade delete

## Performance Considerations
- Index on commonly queried fields
- Use JSONB for flexible payloads (indexed access)
- Partition by date for historical data
- Archive old completed jobs

## References
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Prisma with PostgreSQL](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
