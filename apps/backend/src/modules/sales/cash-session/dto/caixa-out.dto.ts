import { ApiProperty } from '@nestjs/swagger';
import { StatusSessaoCaixa, TipoMovimentacaoCaixa } from '@repo/sales';

/// HTTP response shape for a cash session. Money is exposed in reais (number).
export class SessaoOutDTO {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  operadorId!: string;

  @ApiProperty({ enum: StatusSessaoCaixa })
  status!: StatusSessaoCaixa;

  @ApiProperty({ description: 'Opening amount in reais' })
  valorAbertura!: number;

  @ApiProperty({ nullable: true, description: 'Counted amount in reais (null while open)' })
  valorFechamento!: number | null;

  @ApiProperty({ type: String, format: 'date-time' })
  abertaEm!: Date;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  fechadaEm!: Date | null;
}

/// HTTP response shape for a session summary. Money is exposed in reais (number).
export class ResumoSessaoOutDTO {
  @ApiProperty()
  abertura!: number;

  @ApiProperty()
  suprimentos!: number;

  @ApiProperty()
  vendasDinheiro!: number;

  @ApiProperty()
  sangrias!: number;

  @ApiProperty({ description: 'esperado = abertura + suprimentos + vendasDinheiro - sangrias' })
  esperado!: number;

  @ApiProperty({ nullable: true, description: 'Counted amount (present once closed)' })
  contado?: number | null;

  @ApiProperty({ nullable: true, description: 'contado - esperado (present once closed)' })
  divergencia?: number | null;
}

/// HTTP response shape returned when a session is closed. Money in reais.
export class FecharCaixaOutDTO {
  @ApiProperty({ format: 'uuid' })
  sessaoId!: string;

  @ApiProperty({ description: 'esperado = abertura + suprimentos + vendasDinheiro - sangrias' })
  esperado!: number;

  @ApiProperty({ description: 'Counted amount in reais' })
  contado!: number;

  @ApiProperty({ description: 'contado - esperado' })
  divergencia!: number;
}

/// HTTP response shape for a cash movement. Money is exposed in reais (number).
export class MovimentacaoOutDTO {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: TipoMovimentacaoCaixa })
  tipo!: TipoMovimentacaoCaixa;

  @ApiProperty({ description: 'Amount in reais' })
  valor!: number;

  @ApiProperty({ nullable: true })
  observacao?: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  criadaEm!: Date;
}
