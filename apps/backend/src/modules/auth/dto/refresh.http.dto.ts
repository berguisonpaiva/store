import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RefreshHttpDto {
  @ApiProperty()
  @IsString()
  refreshToken!: string;
}

export class RefreshResponseDto {
  @ApiProperty()
  accessToken!: string;
}
