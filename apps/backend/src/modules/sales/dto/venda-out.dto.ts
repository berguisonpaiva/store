import { ApiProperty } from '@nestjs/swagger';
import { CanalVenda, FormaPagamento, StatusVenda } from '@repo/sales';

/// HTTP response shape for a sale line. Money is exposed in reais (number).
export class ItemVendaOutDTO {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  variacaoId!: string;

  @ApiProperty({ description: 'Quantity (integer)' })
  quantidade!: number;

  @ApiProperty({ description: 'Unit price snapshot in reais' })
  precoUnitario!: number;

  @ApiProperty({ description: 'Line total in reais' })
  total!: number;
}

/// HTTP response shape for a payment line. Money is exposed in reais (number).
export class PagamentoOutDTO {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: FormaPagamento })
  forma!: FormaPagamento;

  @ApiProperty({ description: 'Amount in reais' })
  valor!: number;
}

/// HTTP response shape for a sale. Money is exposed in reais (number).
export class VendaOutDTO {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ nullable: true, description: 'Sequential receipt number (null until finalized)' })
  numero!: number | null;

  @ApiProperty({ enum: CanalVenda })
  canal!: CanalVenda;

  @ApiProperty({ enum: StatusVenda })
  status!: StatusVenda;

  @ApiProperty({ format: 'uuid' })
  usuarioId!: string;

  @ApiProperty({ format: 'uuid' })
  sessaoCaixaId!: string;

  @ApiProperty({ description: 'Σ line totals in reais' })
  subtotal!: number;

  @ApiProperty({ description: 'Resolved discount amount in reais' })
  desconto!: number;

  @ApiProperty({ description: 'subtotal - desconto in reais' })
  total!: number;

  @ApiProperty({ type: [ItemVendaOutDTO] })
  itens!: ItemVendaOutDTO[];

  @ApiProperty({ type: [PagamentoOutDTO] })
  pagamentos!: PagamentoOutDTO[];

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  concluidaEm!: Date | null;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  canceladaEm!: Date | null;

  @ApiProperty({ type: String, format: 'date-time' })
  criadoEm!: Date;
}

/// HTTP response shape for a per-payment-method total (RF30). Money in reais.
export class PagamentoPorFormaOutDTO {
  @ApiProperty({ enum: FormaPagamento })
  forma!: FormaPagamento;

  @ApiProperty({ description: 'Σ paid with this method in reais' })
  total!: number;

  @ApiProperty({ description: 'Number of payments with this method' })
  quantidade!: number;
}

/// HTTP response shape for the sales summary. Money is exposed in reais (number).
export class ResumoVendasOutDTO {
  @ApiProperty({ description: 'Number of sales matching the filter' })
  quantidade!: number;

  @ApiProperty({ description: 'Σ subtotals in reais' })
  subtotal!: number;

  @ApiProperty({ description: 'Σ discounts in reais' })
  desconto!: number;

  @ApiProperty({ description: 'Σ totals in reais' })
  total!: number;

  @ApiProperty({
    type: [PagamentoPorFormaOutDTO],
    description: 'Total sold per payment method — all four methods, zero when unused (RF30)',
  })
  porFormaPagamento!: PagamentoPorFormaOutDTO[];
}
