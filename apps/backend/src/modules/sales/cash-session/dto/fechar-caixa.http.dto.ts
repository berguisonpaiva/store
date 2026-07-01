import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class FecharCaixaInDTO {
  @ApiPropertyOptional({
    minimum: 0,
    description:
      'Counted cash amount in reais (>= 0). Defaults to 0 when omitted.',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  valorFechamento?: number;
}
