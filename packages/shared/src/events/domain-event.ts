/**
 * Base Domain Event
 * 
 * All domain events extend this base class.
 */
export abstract class DomainEvent {
  public readonly occurredAt: Date;

  constructor(
    public readonly eventName: string,
    public readonly aggregateId: string,
  ) {
    this.occurredAt = new Date();
  }

  abstract toPayload(): Record<string, any>;
}
