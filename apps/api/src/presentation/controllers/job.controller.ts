import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JobService } from '../../application/services/job.service';
import { CreateJobDto } from '../dtos/create-job.dto';
import { JobResponseDto } from '../dtos/job-response.dto';
import { JobQueryDto } from '../dtos/job-query.dto';
import { PaginatedResponseDto } from '../dtos/paginated-response.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CorrelationId } from '../decorators/correlation-id.decorator';

/**
 * Job Controller
 * 
 * Handles HTTP requests for job management.
 */
@ApiTags('Jobs')
@Controller('jobs')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new job' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Job created successfully',
    type: JobResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async createJob(
    @Body() createJobDto: CreateJobDto,
    @CorrelationId() correlationId: string,
  ): Promise<JobResponseDto> {
    const job = await this.jobService.createJob(createJobDto, correlationId);
    return job.toObject() as JobResponseDto;
  }

  @Get()
  @ApiOperation({ summary: 'List all jobs with filters and pagination' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Jobs retrieved successfully',
    type: PaginatedResponseDto<JobResponseDto>,
  })
  async listJobs(@Query() query: JobQueryDto): Promise<PaginatedResponseDto<JobResponseDto>> {
    const result = await this.jobService.listJobs(query);
    return {
      data: result.data.map((job) => job.toObject() as JobResponseDto),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get job by ID' })
  @ApiParam({ name: 'id', description: 'Job ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Job retrieved successfully',
    type: JobResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Job not found' })
  async getJob(@Param('id') id: string): Promise<JobResponseDto> {
    const job = await this.jobService.getJobById(id);
    return job.toObject() as JobResponseDto;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a job' })
  @ApiParam({ name: 'id', description: 'Job ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Job cancelled successfully',
    type: JobResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Job not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async cancelJob(@Param('id') id: string): Promise<JobResponseDto> {
    const job = await this.jobService.cancelJob(id);
    return job.toObject() as JobResponseDto;
  }
}
