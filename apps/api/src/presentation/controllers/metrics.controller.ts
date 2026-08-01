import { Controller, Get, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { IMetricsCollector } from '@asyncflow/contracts';

/**
 * Metrics Controller
 * 
 * Exposes Prometheus-compatible metrics.
 */
@ApiTags('Metrics')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metrics: IMetricsCollector) {}

  @Get()
  @Header('Content-Type', 'text/plain')
  @ApiOperation({ summary: 'Get Prometheus metrics' })
  @ApiResponse({ status: 200, description: 'Metrics in Prometheus format' })
  async getMetrics(): Promise<string> {
    return this.metrics.getMetrics();
  }

  @Get('json')
  @ApiOperation({ summary: 'Get metrics as JSON' })
  @ApiResponse({ status: 200, description: 'Metrics as JSON object' })
  async getMetricsJson() {
    return this.metrics.getMetricsJson();
  }
}
