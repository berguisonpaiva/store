import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

/// `PATCH /vendas/:id/itens/:itemId/quantidade` body. Changes the quantity of an
/// existing line, keeping its price snapshot; available stock is revalidated for
/// the NEW quantity (RN09).
export class AlterarQuantidadeItemInDTO {
  @ApiProperty({ minimum: 1, description: 'New quantity (integer > 0)' })
  @IsInt()
  @Min(1)
  quantidade!: number;
}
