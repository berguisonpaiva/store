import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class AbrirCaixaInDTO {
  @ApiProperty({ minimum: 0, description: 'Opening cash amount in reais (>= 0)' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  valorAbertura!: number;
}
