import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

/// `POST /vendas/:id/itens` body. Exactly one identifier is provided; the route
/// resolves it to a variation and snapshots its price into the line.
export class AdicionarItemInDTO {
  @ApiPropertyOptional({ format: 'uuid', description: 'Variation id' })
  @IsOptional()
  @IsUUID()
  variacaoId?: string;

  @ApiPropertyOptional({ description: 'Variation SKU' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ description: 'Variation barcode' })
  @IsOptional()
  @IsString()
  codigoBarras?: string;

  @ApiProperty({ minimum: 1, description: 'Quantity (integer > 0)' })
  @IsInt()
  @Min(1)
  quantidade!: number;
}
