import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
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
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
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
  @Papeis(UserRole.ADMIN, UserRole.OPERADOR)
  @ApiOperation({
    summary:
      'Aggregated sales totals for the given filter (own sales for non-ADMIN)',
  })
  @ApiOkResponse({ description: 'Sales summary', type: ResumoVendasOutDTO })
  async resumo(
    @CurrentUser('id') usuarioId: string,
    @CurrentUser('role') role: UserRole,
    @Query() query: ResumoVendasQueryDto,
  ): Promise<ResumoVendasOutDTO> {
    const resumo = unwrap(
      await this.resumoVendas.execute({
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
        // RN03/RN04: non-ADMIN is scoped to their own sales; ADMIN may filter freely.
        usuarioId: this.scopedUsuarioId(role, usuarioId, query.usuarioId),
        sessaoCaixaId: query.sessaoCaixaId,
        status: query.status,
      }),
    );
    return toResumoVendasOut(resumo);
  }

  @Get(':id')
  @Papeis(UserRole.ADMIN, UserRole.OPERADOR)
  @ApiOperation({ summary: 'Fetch a sale by id (own sale for non-ADMIN)' })
  @ApiOkResponse({ description: 'The sale', type: VendaOutDTO })
  @ApiNotFoundResponse({ description: 'SALE_NOT_FOUND' })
  @ApiForbiddenResponse({ description: 'ACESSO_NEGADO (non-owner, non-ADMIN)' })
  async buscar(
    @CurrentUser('id') usuarioId: string,
    @CurrentUser('role') role: UserRole,
    @Param('id', ParseUUIDPipe) vendaId: string,
  ): Promise<VendaOutDTO> {
    const venda = unwrap(await this.buscarVenda.execute({ vendaId }));
    // RN03: a non-ADMIN may only read their own sale.
    if (role !== UserRole.ADMIN && venda.usuarioId !== usuarioId) {
      throw new ForbiddenException('ACESSO_NEGADO');
    }
    return toVendaOut(venda);
  }

  @Get()
  @Papeis(UserRole.ADMIN, UserRole.OPERADOR)
  @ApiOperation({
    summary: 'List sales (paginated); non-ADMIN scoped to own sales',
  })
  @ApiOkResponse({ description: 'Sales page' })
  async listar(
    @CurrentUser('id') usuarioId: string,
    @CurrentUser('role') role: UserRole,
    @Query() query: ListarVendasQueryDto,
  ): Promise<PaginatedResultDTO<VendaOutDTO>> {
    const page = unwrap(
      await this.listarVendas.execute({
        page: query.page,
        pageSize: query.pageSize,
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
        // RN03/RN04: non-ADMIN is scoped to their own sales; ADMIN may filter freely.
        usuarioId: this.scopedUsuarioId(role, usuarioId, query.usuarioId),
        sessaoCaixaId: query.sessaoCaixaId,
        status: query.status,
      }),
    );
    return {
      data: page.data.map((venda) => toVendaOut(venda)),
      meta: page.meta,
    };
  }

  /// RN03/RN04 read-scope: ADMIN honours the requested `usuarioId` filter (or none);
  /// a non-ADMIN caller is always forced to their own id, ignoring the filter.
  private scopedUsuarioId(
    role: UserRole,
    callerId: string,
    requested?: string,
  ): string | undefined {
    return role === UserRole.ADMIN ? requested : callerId;
  }
}
