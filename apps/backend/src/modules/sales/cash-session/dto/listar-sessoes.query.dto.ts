import { ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';
import { StatusSessaoCaixa } from '@repo/sales';

/// `GET /caixa` (ADMIN list-all, RN04) query string. Filters across all operators.
export class ListarSessoesQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1 })
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  pageSize: number = 20;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Operator (usuarioId) filter',
  })
  @IsOptional()
  @IsUUID()
  usuarioId?: string;

  @ApiPropertyOptional({
    enum: StatusSessaoCaixa,
    description: 'Session status filter',
  })
  @IsOptional()
  @IsEnum(StatusSessaoCaixa)
  status?: StatusSessaoCaixa;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Opened-at start (ISO 8601)',
  })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Opened-at end (ISO 8601)',
  })
  @IsOptional()
  @IsISO8601()
  to?: string;
}

/// `GET /caixa/minhas` query string. Same filters as the ADMIN list, minus
/// `usuarioId` — the scope is ALWAYS the authenticated caller.
export class ListarMinhasSessoesQueryDto extends OmitType(
  ListarSessoesQueryDto,
  ['usuarioId'] as const,
) {}
