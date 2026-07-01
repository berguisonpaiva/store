import { ApiProperty } from '@nestjs/swagger';
import { MotivoMovimentacaoEstoque } from '@repo/inventory';
import { IsEnum, IsInt, IsPositive, IsUUID } from 'class-validator';

export class InventoryEntryHttpDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  variacaoId!: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @IsPositive()
  quantidade!: number;

  @ApiProperty({ enum: [
    MotivoMovimentacaoEstoque.COMPRA,
    MotivoMovimentacaoEstoque.DEVOLUCAO,
    MotivoMovimentacaoEstoque.AJUSTE,
  ] })
  @IsEnum([
    MotivoMovimentacaoEstoque.COMPRA,
    MotivoMovimentacaoEstoque.DEVOLUCAO,
    MotivoMovimentacaoEstoque.AJUSTE,
  ])
  motivo!: MotivoMovimentacaoEstoque;
}
