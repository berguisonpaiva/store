import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsString, MinLength } from 'class-validator';

export class MovimentacaoInDTO {
  @ApiProperty({ exclusiveMinimum: true, minimum: 0, description: 'Movement amount in reais (> 0)' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  valor!: number;

  @ApiProperty({ minLength: 1, description: 'Reason for the movement (required)' })
  @IsString()
  @MinLength(1)
  observacao!: string;
}
