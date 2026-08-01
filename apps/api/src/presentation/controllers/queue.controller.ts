import { Controller, Post, Get, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JobService } from '../../application/services/job.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

/**
 * Queue Controller
 * 
 * Handles queue management operations.
 */
@ApiTags('Queue')
@Controller('queue')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class QueueController {
  constructor(private readonly jobService: JobService) {}

  @Post('pause')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pause job queue' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Queue paused successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async pauseQueue(): Promise<{ message: string }> {
    await this.jobService.pauseQueue();
    return { message: 'Queue paused successfully' };
  }

  @Post('resume')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resume job queue' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Queue resumed successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async resumeQueue(): Promise<{ message: string }> {
    await this.jobService.resumeQueue();
    return { message: 'Queue resumed successfully' };
  }

  @Get('status')
  @ApiOperation({ summary: 'Get queue status' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Queue status retrieved successfully' })
  async getQueueStatus() {
    return this.jobService.getQueueStatus();
  }
}
