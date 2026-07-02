import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@repo/auth';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUserHttpDto {
  @ApiProperty({ minLength: 2 })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ format: 'email' })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ enum: UserRole })
  @IsString()
  role!: UserRole | string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
