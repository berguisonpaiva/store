import {
  Controller,
  Body,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { GetCurrentUser, Login, RefreshToken } from '@repo/auth';
import { JwtGuard } from '../../shared/auth/jwt.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Public } from '../../shared/decorators/public.decorator';
import { unwrap } from '../../shared/errors/domain-error.mapper';
import { LoginHttpDto, LoginResponseDto } from './dto/login.http.dto';
import { MeResponseDto } from './dto/me.http.dto';
import { RefreshHttpDto, RefreshResponseDto } from './dto/refresh.http.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly login: Login,
    private readonly refreshToken: RefreshToken,
    private readonly getCurrentUser: GetCurrentUser,
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

  @Get('me')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Return the authenticated user' })
  @ApiResponse({ status: 200, type: MeResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async meRoute(@CurrentUser('id') userId: string): Promise<MeResponseDto> {
    const user = unwrap(await this.getCurrentUser.execute({ userId }));
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active,
    };
  }
}
