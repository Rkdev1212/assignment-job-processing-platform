import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsObject, IsOptional, IsNumber, Min, Max, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Create Job DTO
 */
export class CreateJobDto {
  @ApiProperty({
    description: 'Job type identifier',
    example: 'email.send',
  })
  @IsString()
  type: string;

  @ApiProperty({
    description: 'Job payload data',
    example: { to: 'user@example.com', subject: 'Welcome', body: 'Hello World' },
  })
  @IsObject()
  payload: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Job priority (higher number = higher priority)',
    example: 1,
    minimum: 0,
    maximum: 10,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  priority?: number;

  @ApiPropertyOptional({
    description: 'Maximum number of retry attempts',
    example: 3,
    minimum: 1,
    maximum: 10,
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
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  delay?: number;

  @ApiPropertyOptional({
    description: 'Scheduled execution time',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  runAt?: Date;
}
