import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsObject, IsOptional, IsNumber, Min, Max, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export enum JobPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
}

/**
 * Create Job DTO
 */
export class CreateJobDto {
  @ApiProperty({
    description: 'Job type identifier',
    example: 'email',
  })
  @IsString()
  type!: string;

  @ApiProperty({
    description: 'Job payload data',
    example: { to: 'john@example.com', subject: 'Welcome', body: 'Hello' },
  })
  @IsObject()
  payload!: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Priority: "high" | "normal" | "low" or numeric 0–10',
    example: 'normal',
    default: 'normal',
  })
  @IsOptional()
  priority?: string | number;

  @ApiPropertyOptional({
    description: 'Maximum retry attempts',
    example: 3,
    default: 3,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  maxAttempts?: number;

  @ApiPropertyOptional({
    description: 'Delay before processing (milliseconds)',
    example: 5000,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  delay?: number;

  @ApiPropertyOptional({
    description: 'Scheduled execution time (ISO 8601)',
    example: '2026-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  runAt?: Date;
}
