# ADR 001: Use BullMQ for Job Queue

## Status
Accepted

## Context
We need a robust, production-ready job queue system that supports:
- Priority queuing
- Delayed and scheduled jobs
- Automatic retries with backoff
- Job persistence
- High throughput
- Active development and community support

## Decision
We will use BullMQ as our job queue implementation.

## Rationale

### Why BullMQ?

1. **Redis-backed**: Uses Redis for fast, reliable message brokering
2. **Feature-rich**: Built-in support for priorities, delays, retries, rate limiting
3. **Performance**: Handles tens of thousands of jobs per second
4. **Reliability**: Jobs persisted to Redis, survives crashes
5. **Active development**: Regular updates and security patches
6. **TypeScript native**: First-class TypeScript support
7. **Battle-tested**: Used by thousands of companies in production

### Alternatives Considered

**AWS SQS**
- ❌ Requires AWS account and internet connectivity
- ❌ Higher latency (network calls)
- ❌ More complex pricing model
- ✅ Fully managed, no infrastructure
- ✅ Infinite scalability

**RabbitMQ**
- ❌ More complex to set up and maintain
- ❌ Higher resource requirements
- ❌ Steeper learning curve
- ✅ More flexible routing
- ✅ Multiple protocol support

**Kafka**
- ❌ Over-engineered for simple job processing
- ❌ Complex cluster management
- ❌ Higher resource requirements
- ✅ Excellent for event streaming
- ✅ High throughput

**Sidekiq** (Ruby)
- ❌ Ruby-specific
- ❌ Not applicable for Node.js projects

## Consequences

### Positive
- Fast, reliable job processing
- Easy to implement and maintain
- Rich feature set out of the box
- Good developer experience
- Clear migration path if needed

### Negative
- Requires Redis infrastructure
- Redis memory limits could be constraint at massive scale
- Vendor lock-in to Redis (though abstract behind interface)

### Mitigation
- Abstract BullMQ behind `IQueuePublisher` interface
- Keep business logic independent of queue implementation
- Could swap to different queue system if needed (AWS SQS, RabbitMQ) without changing business logic

## Implementation Notes
- Use latest BullMQ version (4.x)
- Configure with sensible defaults (3 retries, exponential backoff)
- Monitor Redis memory usage
- Implement proper error handling
- Use worker pools for concurrency

## References
- [BullMQ Documentation](https://docs.bullmq.io/)
- [BullMQ GitHub](https://github.com/taskforcesh/bullmq)
