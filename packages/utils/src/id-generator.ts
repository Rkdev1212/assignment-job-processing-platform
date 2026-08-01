import { v4 as uuidv4 } from 'uuid';

/**
 * ID Generator
 * 
 * Generates unique identifiers for jobs and requests.
 */
export class IdGenerator {
  /**
   * Generate job ID
   */
  static generateJobId(): string {
    return uuidv4();
  }

  /**
   * Generate correlation ID
   */
  static generateCorrelationId(): string {
    return uuidv4();
  }

  /**
   * Generate request ID
   */
  static generateRequestId(): string {
    return uuidv4();
  }
}
