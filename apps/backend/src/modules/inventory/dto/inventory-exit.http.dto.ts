import { ApiProperty } from '@nestjs/swagger';
import { MotivoMovimentacaoEstoque } from '@repo/inventory';
import { IsEnum, IsInt, IsPositive, IsUUID } from 'class-validator';

export class InventoryExitHttpDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  variacaoId!: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @IsPositive()
  quantidade!: number;

  @ApiProperty({
    enum: [
      MotivoMovimentacaoEstoque.PERDA,
      MotivoMovimentacaoEstoque.AJUSTE,
    ],
  })
  @IsEnum([
    MotivoMovimentacaoEstoque.PERDA,
    MotivoMovimentacaoEstoque.AJUSTE,
  ])
  motivo!: MotivoMovimentacaoEstoque;
}
