import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsObject, IsOptional, IsNumber, Min, Max, IsDate } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum JobPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
}

const PRIORITY_MAP: Record<string, number> = {
  low: 0,
  normal: 5,
  high: 10,
};

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
    description: 'Priority: high | normal | low, or numeric 0-10 (higher = more priority)',
    example: 'normal',
    default: 'normal',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string' && PRIORITY_MAP[value.toLowerCase()] !== undefined) {
      return PRIORITY_MAP[value.toLowerCase()];
    }
    return typeof value === 'number' ? value : 5;
  })
  @IsNumber()
  @Min(0)
  @Max(10)
  priority?: number;

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
