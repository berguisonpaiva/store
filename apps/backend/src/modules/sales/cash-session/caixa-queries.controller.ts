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
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  CaixaAbertoDoOperador,
  ListarMovimentacoes,
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
import { centsToReais } from './adapters/money';
import {
  ListMovimentacoesQueryDto,
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
  ) {}

  @Get('aberto')
  @Papeis(UserRole.MASTER, UserRole.ADMIN, UserRole.OPERADOR)
  @ApiOperation({ summary: "Fetch the authenticated operator's open session" })
  @ApiOkResponse({ description: 'Open session or null', type: SessaoOutDTO })
  async aberto(
    @CurrentUser('id') operadorId: string,
  ): Promise<SessaoOutDTO | null> {
    const dto = unwrap(await this.caixaAbertoDoOperador.execute({ operadorId }));
    return dto ? this.toSessaoOut(dto) : null;
  }

  @Get(':id/resumo')
  @Papeis(UserRole.MASTER, UserRole.ADMIN, UserRole.OPERADOR)
  @ApiOperation({ summary: 'Fetch the aggregated summary of a session' })
  @ApiOkResponse({ description: 'Session summary', type: ResumoSessaoOutDTO })
  @ApiNotFoundResponse({ description: 'CASH_SESSION_NOT_FOUND' })
  async resumo(
    @Param('id', ParseUUIDPipe) sessaoId: string,
  ): Promise<ResumoSessaoOutDTO> {
    const resumo = unwrap(await this.resumoSessao.execute({ sessaoId }));
    return {
      abertura: centsToReais(resumo.abertura),
      suprimentos: centsToReais(resumo.suprimentos),
      vendasDinheiro: centsToReais(resumo.vendasDinheiro),
      sangrias: centsToReais(resumo.sangrias),
      esperado: centsToReais(resumo.esperado),
      contado: centsToReais(resumo.contado),
      divergencia: centsToReais(resumo.divergencia),
    };
  }

  @Get(':id/movimentacoes')
  @Papeis(UserRole.MASTER, UserRole.ADMIN, UserRole.OPERADOR)
  @ApiOperation({ summary: 'List the movements of a session (paginated)' })
  @ApiOkResponse({ description: 'Movements page' })
  async movimentacoes(
    @Param('id', ParseUUIDPipe) sessaoId: string,
    @Query() query: ListMovimentacoesQueryDto,
  ): Promise<PaginatedResultDTO<MovimentacaoOutDTO>> {
    const page = unwrap(
      await this.listarMovimentacoes.execute({
        sessaoId,
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

  private toSessaoOut(dto: SessaoCaixaDTO): SessaoOutDTO {
    return {
      id: dto.id,
      operadorId: dto.operadorId,
      status: dto.status,
      valorAbertura: centsToReais(dto.valorAbertura),
      valorFechamento: centsToReais(dto.valorFechamento),
      abertaEm: dto.abertaEm,
      fechadaEm: dto.fechadaEm,
    };
  }
}
