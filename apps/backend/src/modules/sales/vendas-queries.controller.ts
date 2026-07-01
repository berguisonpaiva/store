import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@repo/auth';
import { PaginatedResultDTO } from '@repo/shared';
import { BuscarVenda, ListarVendas, ResumoVendas } from '@repo/sales';
import { JwtGuard } from '../../shared/auth/jwt.guard';
import { RolesGuard } from '../../shared/auth/roles.guard';
import { Papeis } from '../../shared/decorators/papeis.decorator';
import { unwrap } from '../../shared/errors/domain-error.mapper';
import { toResumoVendasOut, toVendaOut } from './adapters/venda.mapper';
import {
  ListarVendasQueryDto,
  ResumoVendasOutDTO,
  ResumoVendasQueryDto,
  VendaOutDTO,
} from './dto';

/// Public sales reads (CQRS query side). Money crosses the HTTP edge in reais.
@ApiTags('vendas')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Controller('vendas')
export class VendasQueriesController {
  constructor(
    private readonly buscarVenda: BuscarVenda,
    private readonly listarVendas: ListarVendas,
    private readonly resumoVendas: ResumoVendas,
  ) {}

  @Get('resumo')
  @Papeis(UserRole.MASTER, UserRole.ADMIN, UserRole.OPERADOR)
  @ApiOperation({ summary: 'Aggregated sales totals for the given filter' })
  @ApiOkResponse({ description: 'Sales summary', type: ResumoVendasOutDTO })
  async resumo(
    @Query() query: ResumoVendasQueryDto,
  ): Promise<ResumoVendasOutDTO> {
    const resumo = unwrap(
      await this.resumoVendas.execute({
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
        usuarioId: query.usuarioId,
        sessaoCaixaId: query.sessaoCaixaId,
        status: query.status,
      }),
    );
    return toResumoVendasOut(resumo);
  }

  @Get(':id')
  @Papeis(UserRole.MASTER, UserRole.ADMIN, UserRole.OPERADOR)
  @ApiOperation({ summary: 'Fetch a sale by id' })
  @ApiOkResponse({ description: 'The sale', type: VendaOutDTO })
  @ApiNotFoundResponse({ description: 'SALE_NOT_FOUND' })
  async buscar(
    @Param('id', ParseUUIDPipe) vendaId: string,
  ): Promise<VendaOutDTO> {
    const venda = unwrap(await this.buscarVenda.execute({ vendaId }));
    return toVendaOut(venda);
  }

  @Get()
  @Papeis(UserRole.MASTER, UserRole.ADMIN, UserRole.OPERADOR)
  @ApiOperation({ summary: 'List sales (paginated) filtered by period/operator/session/status' })
  @ApiOkResponse({ description: 'Sales page' })
  async listar(
    @Query() query: ListarVendasQueryDto,
  ): Promise<PaginatedResultDTO<VendaOutDTO>> {
    const page = unwrap(
      await this.listarVendas.execute({
        page: query.page,
        pageSize: query.pageSize,
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
        usuarioId: query.usuarioId,
        sessaoCaixaId: query.sessaoCaixaId,
        status: query.status,
      }),
    );
    return {
      data: page.data.map((venda) => toVendaOut(venda)),
      meta: page.meta,
    };
  }
}
