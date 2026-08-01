import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JobStatus } from '@asyncflow/shared';

/**
 * Job Response DTO
 */
export class JobResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'email.send' })
  type: string;

  @ApiProperty({ example: { to: 'user@example.com' } })
  payload: Record<string, any>;

  @ApiProperty({ enum: JobStatus, example: JobStatus.QUEUED })
  status: JobStatus;

  @ApiProperty({ example: 1 })
  priority: number;

  @ApiProperty({ example: 0 })
  attempts: number;

  @ApiProperty({ example: 3 })
  maxAttempts: number;

  @ApiProperty({ example: 0 })
  delay: number;

  @ApiPropertyOptional({ example: '2024-12-31T23:59:59Z' })
  runAt: Date | null;

  @ApiPropertyOptional({ example: 'worker-1' })
  workerId: string | null;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  updatedAt: Date;

  @ApiPropertyOptional({ example: '2024-01-01T00:00:10Z' })
  startedAt: Date | null;

  @ApiPropertyOptional({ example: '2024-01-01T00:00:20Z' })
  completedAt: Date | null;

  @ApiPropertyOptional({ example: 10000 })
  executionTime: number | null;

  @ApiPropertyOptional({ example: 'Connection timeout' })
  lastError: string | null;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  correlationId: string;
}
