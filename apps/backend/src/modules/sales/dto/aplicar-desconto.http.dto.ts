import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, Min } from 'class-validator';

/// Discount type over HTTP. `valor` is an absolute amount in reais; `percentual`
/// is a percentage (0..100).
export enum TipoDescontoHttp {
  VALOR = 'valor',
  PERCENTUAL = 'percentual',
}

/// `PATCH /vendas/:id/desconto` body.
export class AplicarDescontoInDTO {
  @ApiProperty({ enum: TipoDescontoHttp, description: 'Discount type' })
  @IsEnum(TipoDescontoHttp)
  tipo!: TipoDescontoHttp;

  @ApiProperty({
    minimum: 0,
    description:
      'Discount value: reais (>= 0) for "valor"; percentage (0..100) for "percentual"',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  valor!: number;
}
