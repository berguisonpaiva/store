import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class FecharCaixaInDTO {
  @ApiProperty({ minimum: 0, description: 'Counted cash amount in reais (>= 0)' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  valorFechamento!: number;
}
