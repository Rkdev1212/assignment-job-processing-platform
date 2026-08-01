import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { JwtService } from '@nestjs/jwt';

export class GenerateTokenDto {
  @ApiProperty({ example: 'testuser', description: 'Username to embed in token' })
  @IsString()
  username!: string;

  @ApiProperty({ example: 'user-123', description: 'User ID (optional)', required: false })
  @IsOptional()
  @IsString()
  userId?: string;
}

export class TokenResponseDto {
  @ApiProperty({ description: 'JWT Bearer token — paste this into the Authorize dialog' })
  token!: string;

  @ApiProperty({ description: 'Token expiry' })
  expiresIn!: string;

  @ApiProperty({ description: 'Usage instructions' })
  usage!: string;
}

/**
 * Auth Controller
 *
 * Generates demo JWT tokens for testing protected endpoints via Swagger.
 */
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly jwtService: JwtService) {}

  @Post('token')
  @ApiOperation({
    summary: 'Generate a demo JWT token for testing',
    description:
      'Returns a signed JWT. Copy the `token` value, click **Authorize** at the top of Swagger, and enter `Bearer <token>`.',
  })
  @ApiResponse({ status: 201, type: TokenResponseDto })
  generateToken(@Body() dto: GenerateTokenDto): TokenResponseDto {
    const payload = {
      sub: dto.userId || `user-${Date.now()}`,
      username: dto.username,
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      expiresIn: '24h',
      usage: 'In Swagger: click Authorize → enter: Bearer <token>',
    };
  }
}
