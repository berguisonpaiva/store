import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

/// HTTP payload for a variation (used both as a nested entry when creating a
/// product and as the body when adding a variation to an existing product).
/// `price` is in integer cents and must be > 0; `minStock` ≥ 0. Deeper rules
/// (SKU/barcode format and uniqueness) live in the domain.
export class CreateVariationHttpDto {
  @ApiProperty({ minLength: 1 })
  @IsString()
  @MinLength(1)
  sku!: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  barcode?: string | null;

  @ApiPropertyOptional({ type: Object, description: 'Free-form attribute map' })
  @IsOptional()
  @IsObject()
  attributes?: Record<string, string>;

  @ApiProperty({ description: 'Price in integer cents (> 0)', minimum: 1 })
  @IsInt()
  @IsPositive()
  price!: number;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  minStock?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
