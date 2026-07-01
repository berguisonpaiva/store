import {
  Controller,
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
import {
  CaixaAbertoDoOperador,
  CaixaActorDTO,
  ListarMovimentacoes,
  ListarVendas,
  PapelCaixa,
  ResumoSessao,
  SessaoCaixaDTO,
} from '@repo/sales';
import { PaginatedResultDTO } from '@repo/shared';
import { UserRole } from '@repo/auth';
import { JwtGuard } from '../../../shared/auth/jwt.guard';
import { RolesGuard } from '../../../shared/auth/roles.guard';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { Papeis } from '../../../shared/decorators/papeis.decorator';
import { unwrap } from '../../../shared/errors/domain-error.mapper';
import { toVendaOut } from '../adapters/venda.mapper';
import { ListarVendasQueryDto, VendaOutDTO } from '../dto';
import { CaixaPrismaQuery } from './adapters/caixa.prisma.query';
import { centsToReais } from './adapters/money';
import {
  ListMovimentacoesQueryDto,
  ListarSessoesQueryDto,
  MovimentacaoOutDTO,
  ResumoSessaoOutDTO,
  SessaoOutDTO,
} from './dto';

/// Public cash reads (CQRS query side).
@ApiTags('caixa')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Controller('caixa')
export class CaixaQueriesController {
  constructor(
    private readonly caixaAbertoDoOperador: CaixaAbertoDoOperador,
    private readonly resumoSessao: ResumoSessao,
    private readonly listarMovimentacoes: ListarMovimentacoes,
    private readonly listarVendas: ListarVendas,
    private readonly caixaQuery: CaixaPrismaQuery,
  ) {}

  @Get()
  @Papeis(UserRole.ADMIN)
  @ApiOperation({
    summary: 'ADMIN: list all operators sessions with filters (RN04)',
  })
  @ApiOkResponse({ description: 'Sessions page (all operators)' })
  @ApiForbiddenResponse({
    description: 'OPERATION_NOT_ALLOWED_FOR_ROLE (non-ADMIN)',
  })
  async listar(
    @Query() query: ListarSessoesQueryDto,
  ): Promise<PaginatedResultDTO<SessaoOutDTO>> {
    const page = unwrap(
      await this.caixaQuery.listarSessoes({
        page: query.page,
        pageSize: query.pageSize,
        usuarioId: query.usuarioId,
        status: query.status,
        from: query.from ? new Date(query.from) : undefined,
        to: query.to ? new Date(query.to) : undefined,
      }),
    );
    return {
      data: page.data.map((dto) => this.toSessaoOut(dto)),
      meta: page.meta,
    };
  }

  @Get('aberto')
  @Papeis(UserRole.ADMIN, UserRole.OPERADOR)
  @ApiOperation({ summary: "Fetch the authenticated operator's open session" })
  @ApiOkResponse({ description: 'Open session or null', type: SessaoOutDTO })
  async aberto(
    @CurrentUser('id') operadorId: string,
  ): Promise<SessaoOutDTO | null> {
    const dto = unwrap(
      await this.caixaAbertoDoOperador.execute({ operadorId }),
    );
    return dto ? this.toSessaoOut(dto) : null;
  }

  @Get(':id/resumo')
  @Papeis(UserRole.ADMIN, UserRole.OPERADOR)
  @ApiOperation({
    summary: 'Fetch the aggregated summary of a session (owner or ADMIN)',
  })
  @ApiOkResponse({ description: 'Session summary', type: ResumoSessaoOutDTO })
  @ApiNotFoundResponse({ description: 'CAIXA_NAO_ENCONTRADO' })
  @ApiForbiddenResponse({ description: 'ACESSO_NEGADO (non-owner, non-ADMIN)' })
  async resumo(
    @CurrentUser('id') usuarioId: string,
    @CurrentUser('role') role: UserRole,
    @Param('id', ParseUUIDPipe) sessaoId: string,
  ): Promise<ResumoSessaoOutDTO> {
    const resumo = unwrap(
      await this.resumoSessao.execute({
        sessaoId,
        ator: this.toActor(usuarioId, role),
      }),
    );
    return {
      abertura: centsToReais(resumo.abertura),
      suprimentos: centsToReais(resumo.suprimentos),
      vendasDinheiro: centsToReais(resumo.vendasDinheiro),
      sangrias: centsToReais(resumo.sangrias),
      esperado: centsToReais(resumo.esperado),
      contado: resumo.contado === null ? null : centsToReais(resumo.contado),
      divergencia:
        resumo.divergencia === null ? null : centsToReais(resumo.divergencia),
      totalVendas: centsToReais(resumo.totalVendas),
      qtdVendas: resumo.qtdVendas,
      totalPorForma: this.totalPorFormaToReais(resumo.totalPorForma),
    };
  }

  @Get(':id/movimentacoes')
  @Papeis(UserRole.ADMIN, UserRole.OPERADOR)
  @ApiOperation({
    summary: 'List the movements of a session (owner or ADMIN, paginated)',
  })
  @ApiOkResponse({ description: 'Movements page' })
  @ApiNotFoundResponse({ description: 'CAIXA_NAO_ENCONTRADO' })
  @ApiForbiddenResponse({ description: 'ACESSO_NEGADO (non-owner, non-ADMIN)' })
  async movimentacoes(
    @CurrentUser('id') usuarioId: string,
    @CurrentUser('role') role: UserRole,
    @Param('id', ParseUUIDPipe) sessaoId: string,
    @Query() query: ListMovimentacoesQueryDto,
  ): Promise<PaginatedResultDTO<MovimentacaoOutDTO>> {
    const page = unwrap(
      await this.listarMovimentacoes.execute({
        sessaoId,
        ator: this.toActor(usuarioId, role),
        page: query.page,
        pageSize: query.pageSize,
      }),
    );
    return {
      data: page.data.map((m) => ({
        id: m.id,
        tipo: m.tipo,
        valor: centsToReais(m.valor),
        observacao: m.observacao,
        criadaEm: m.timestamp,
      })),
      meta: page.meta,
    };
  }

  @Get(':id/vendas')
  @Papeis(UserRole.ADMIN, UserRole.OPERADOR)
  @ApiOperation({
    summary: 'List the sales of a session (owner or ADMIN, paginated)',
  })
  @ApiOkResponse({ description: 'Sales page for the session' })
  @ApiNotFoundResponse({ description: 'CAIXA_NAO_ENCONTRADO' })
  @ApiForbiddenResponse({ description: 'ACESSO_NEGADO (non-owner, non-ADMIN)' })
  async vendas(
    @CurrentUser('id') usuarioId: string,
    @CurrentUser('role') role: UserRole,
    @Param('id', ParseUUIDPipe) sessaoId: string,
    @Query() query: ListarVendasQueryDto,
  ): Promise<PaginatedResultDTO<VendaOutDTO>> {
    // RN03/RN04 ownership gate: reuse ResumoSessao's actor scoping so a non-ADMIN
    // reading another operator's session fails with ACESSO_NEGADO (403), and a
    // missing session fails with CAIXA_NAO_ENCONTRADO (404) — before any sale read.
    unwrap(
      await this.resumoSessao.execute({
        sessaoId,
        ator: this.toActor(usuarioId, role),
      }),
    );

    const page = unwrap(
      await this.listarVendas.execute({
        page: query.page,
        pageSize: query.pageSize,
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
        // Sales of THIS session; the ownership gate above already enforced scope,
        // so a non-ADMIN only ever reaches this point for a session they own.
        sessaoCaixaId: sessaoId,
        status: query.status,
      }),
    );
    return {
      data: page.data.map((venda) => toVendaOut(venda)),
      meta: page.meta,
    };
  }

  private toActor(usuarioId: string, role: UserRole): CaixaActorDTO {
    return {
      usuarioId,
      papel: role === UserRole.ADMIN ? PapelCaixa.ADMIN : PapelCaixa.OPERADOR,
    };
  }

  private totalPorFormaToReais(
    totalPorForma: Record<string, number>,
  ): Record<string, number> {
    const out: Record<string, number> = {};
    for (const [forma, valor] of Object.entries(totalPorForma)) {
      out[forma] = centsToReais(valor);
    }
    return out;
  }

  private toSessaoOut(dto: SessaoCaixaDTO): SessaoOutDTO {
    return {
      id: dto.id,
      operadorId: dto.operadorId,
      status: dto.status,
      valorAbertura: centsToReais(dto.valorAbertura),
      valorFechamento:
        dto.valorFechamento === null ? null : centsToReais(dto.valorFechamento),
      abertaEm: dto.abertaEm,
      fechadaEm: dto.fechadaEm,
    };
  }
}
