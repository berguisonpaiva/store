import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsPositive,
  ValidateNested,
} from 'class-validator';
import { FormaPagamento } from '@repo/sales';

/// One payment line over HTTP. `valor` is in reais (> 0).
export class PagamentoInDTO {
  @ApiProperty({ enum: FormaPagamento, description: 'Payment method' })
  @IsEnum(FormaPagamento)
  forma!: FormaPagamento;

  @ApiProperty({ minimum: 0, description: 'Paid amount in reais (> 0)' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  valor!: number;
}

/// `POST /vendas/:id/finalizar` body. `Σ pagamentos` must equal the sale total.
export class FinalizarVendaInDTO {
  @ApiProperty({ type: [PagamentoInDTO], description: 'Payment lines' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PagamentoInDTO)
  pagamentos!: PagamentoInDTO[];
}
