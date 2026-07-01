import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@repo/auth';
import { IsEmail, IsString } from 'class-validator';

export class LoginHttpDto {
  @ApiProperty({ format: 'email' })
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  password!: string;
}

export class LoginUserDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: UserRole })
  role!: UserRole;
}

export class LoginResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty({ type: LoginUserDto })
  user!: LoginUserDto;
}
