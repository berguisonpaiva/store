import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsUUID, Min, MinLength } from 'class-validator';

export class InventoryAdjustmentHttpDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  variacaoId!: string;

  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  novoSaldo!: number;

  @ApiProperty({ minLength: 1 })
  @IsString()
  @MinLength(1)
  observacao!: string;
}
