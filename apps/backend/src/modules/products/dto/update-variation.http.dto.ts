import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

/// HTTP payload to edit an existing variation. The owning product is taken from
/// the route (`/products/:productId/variations/:variationId`). Every edit field
/// is optional; when `price` is provided it must be > 0 (integer cents) and
/// `minStock` ≥ 0.
export class UpdateVariationHttpDto {
  @ApiPropertyOptional({ minLength: 1 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  sku?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  barcode?: string | null;

  @ApiPropertyOptional({ type: Object, description: 'Free-form attribute map' })
  @IsOptional()
  @IsObject()
  attributes?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Price in integer cents (> 0)',
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  price?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  minStock?: number;
}
