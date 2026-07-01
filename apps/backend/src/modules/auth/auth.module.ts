import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Login, RefreshToken, ValidateToken } from '@repo/auth';
import { BcryptHashComparer } from '../../shared/crypto/bcrypt-hash-comparer';
import { UsersModule } from '../users/users.module';
import { UserPrismaRepository } from '../users/adapters/user.prisma.repository';
import { AuthController } from './auth.controller';
import { JwtTokenService } from './adapters/jwt-token-service';

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [
    {
      provide: JwtTokenService,
      useFactory: (jwt: JwtService, config: ConfigService) =>
        new JwtTokenService(jwt, config),
      inject: [JwtService, ConfigService],
    },
    {
      provide: Login,
      useFactory: (
        reader: UserPrismaRepository,
        comparer: BcryptHashComparer,
        tokens: JwtTokenService,
      ) => new Login(reader, comparer, tokens),
      inject: [UserPrismaRepository, BcryptHashComparer, JwtTokenService],
    },
    {
      provide: RefreshToken,
      useFactory: (tokens: JwtTokenService) => new RefreshToken(tokens),
      inject: [JwtTokenService],
    },
    {
      provide: ValidateToken,
      useFactory: (tokens: JwtTokenService) => new ValidateToken(tokens),
      inject: [JwtTokenService],
    },
  ],
})
export class AuthModule {}
