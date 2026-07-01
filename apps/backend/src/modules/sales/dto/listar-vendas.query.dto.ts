import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';
import { StatusVenda } from '@repo/sales';

/// `GET /vendas` query string. Filters by period, operator, session, and status.
export class ListarVendasQueryDto {
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
    format: 'date-time',
    description: 'Period start (ISO 8601)',
  })
  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Period end (ISO 8601)',
  })
  @IsOptional()
  @IsISO8601()
  endDate?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Operator (usuarioId) filter',
  })
  @IsOptional()
  @IsUUID()
  usuarioId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Cash session filter' })
  @IsOptional()
  @IsUUID()
  sessaoCaixaId?: string;

  @ApiPropertyOptional({ enum: StatusVenda, description: 'Sale status filter' })
  @IsOptional()
  @IsEnum(StatusVenda)
  status?: StatusVenda;
}

/// `GET /vendas/resumo` query string. Same filters as the list, without pagination.
export class ResumoVendasQueryDto {
  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Period start (ISO 8601)',
  })
  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Period end (ISO 8601)',
  })
  @IsOptional()
  @IsISO8601()
  endDate?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Operator (usuarioId) filter',
  })
  @IsOptional()
  @IsUUID()
  usuarioId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Cash session filter' })
  @IsOptional()
  @IsUUID()
  sessaoCaixaId?: string;

  @ApiPropertyOptional({ enum: StatusVenda, description: 'Sale status filter' })
  @IsOptional()
  @IsEnum(StatusVenda)
  status?: StatusVenda;
}
