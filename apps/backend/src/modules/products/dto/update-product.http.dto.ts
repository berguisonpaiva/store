import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

/// HTTP payload to edit a product's profile (name / description / category).
/// Variations are managed through the dedicated variation endpoints.
export class UpdateProductHttpDto {
  @ApiPropertyOptional({ minLength: 1 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  categoryId?: string | null;
}
