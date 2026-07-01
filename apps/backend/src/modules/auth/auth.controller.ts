import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Login, RefreshToken } from '@repo/auth';
import { Public } from '../../shared/decorators/public.decorator';
import { unwrap } from '../../shared/errors/domain-error.mapper';
import { LoginHttpDto, LoginResponseDto } from './dto/login.http.dto';
import { RefreshHttpDto, RefreshResponseDto } from './dto/refresh.http.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly login: Login,
    private readonly refreshToken: RefreshToken,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Authenticate staff by email + password' })
  @ApiResponse({ status: 200, type: LoginResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Generic error for invalid credentials (no user enumeration)',
  })
  async loginRoute(@Body() dto: LoginHttpDto): Promise<LoginResponseDto> {
    return unwrap(
      await this.login.execute({ email: dto.email, password: dto.password }),
    );
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Issue a new access token from a refresh token' })
  @ApiResponse({ status: 200, type: RefreshResponseDto })
  async refreshRoute(@Body() dto: RefreshHttpDto): Promise<RefreshResponseDto> {
    return unwrap(
      await this.refreshToken.execute({ refreshToken: dto.refreshToken }),
    );
  }
}
