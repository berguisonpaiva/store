import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@repo/auth';

export class MeResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ format: 'email' })
  email!: string;

  @ApiProperty({ enum: UserRole })
  role!: UserRole;

  @ApiProperty()
  active!: boolean;
}
