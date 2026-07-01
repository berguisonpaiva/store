import {
  Body,
  Controller,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import {
  AbrirCaixa,
  FecharCaixa,
  RegistrarSangria,
  RegistrarSuprimento,
  toSessaoCaixaDTO,
} from '@repo/sales';
import { UserRole } from '@repo/auth';
import { JwtGuard } from '../../../shared/auth/jwt.guard';
import { RolesGuard } from '../../../shared/auth/roles.guard';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { Papeis } from '../../../shared/decorators/papeis.decorator';
import { unwrap } from '../../../shared/errors/domain-error.mapper';
import { centsToReais, reaisToCents } from './adapters/money';
import {
  AbrirCaixaInDTO,
  FecharCaixaInDTO,
  FecharCaixaOutDTO,
  MovimentacaoInDTO,
  MovimentacaoOutDTO,
  SessaoOutDTO,
} from './dto';

/// Public cash commands. The `operadorId` is always derived from the
/// authenticated user — never read from the body. There is intentionally NO
/// route that creates a `VENDA` movement: cash sales only enter through the
/// `CaixaPort` consumed by `vendas`.
@ApiTags('caixa')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Controller('caixa')
export class CaixaCommandsController {
  constructor(
    private readonly abrirCaixa: AbrirCaixa,
    private readonly fecharCaixa: FecharCaixa,
    private readonly registrarSangria: RegistrarSangria,
    private readonly registrarSuprimento: RegistrarSuprimento,
  ) {}

  @Post('abrir')
  @HttpCode(201)
  @Papeis(UserRole.ADMIN, UserRole.OPERADOR)
  @ApiOperation({
    summary: 'Open a cash session for the authenticated operator',
  })
  @ApiCreatedResponse({ description: 'Session opened', type: SessaoOutDTO })
  @ApiConflictResponse({ description: 'CAIXA_JA_ABERTO' })
  async abrir(
    @CurrentUser('id') operadorId: string,
    @Body() dto: AbrirCaixaInDTO,
  ): Promise<SessaoOutDTO> {
    const sessao = unwrap(
      await this.abrirCaixa.execute({
        operadorId,
        valorAbertura: reaisToCents(dto.valorAbertura),
      }),
    );
    return this.toSessaoOut(toSessaoCaixaDTO(sessao));
  }

  @Post(':id/fechar')
  @HttpCode(200)
  @Papeis(UserRole.ADMIN, UserRole.OPERADOR)
  @ApiOperation({
    summary: 'Close the caller own cash session with a counted amount',
  })
  @ApiOkResponse({ description: 'Session closed', type: FecharCaixaOutDTO })
  @ApiNotFoundResponse({ description: 'CAIXA_NAO_ENCONTRADO' })
  @ApiForbiddenResponse({ description: 'NAO_E_DONO_DO_CAIXA' })
  @ApiConflictResponse({ description: 'CAIXA_JA_FECHADO' })
  @ApiUnprocessableEntityResponse({
    description: 'VENDA_PENDENTE_NO_FECHAMENTO',
  })
  async fechar(
    @CurrentUser('id') usuarioId: string,
    @Param('id', ParseUUIDPipe) sessaoId: string,
    @Body() dto: FecharCaixaInDTO,
  ): Promise<FecharCaixaOutDTO> {
    const resultado = unwrap(
      await this.fecharCaixa.execute({
        sessaoId,
        usuarioId,
        valorFechamento: reaisToCents(dto.valorFechamento ?? 0),
      }),
    );
    return {
      sessaoId: resultado.sessaoId,
      esperado: centsToReais(resultado.resumo.saldoEsperado),
      contado: centsToReais(resultado.contado),
      divergencia: centsToReais(resultado.divergencia),
      resumo: {
        totalVendas: centsToReais(resultado.resumo.totalVendas),
        qtdVendas: resultado.resumo.qtdVendas,
        totalPorForma: this.totalPorFormaToReais(
          resultado.resumo.totalPorForma,
        ),
        sangrias: centsToReais(resultado.resumo.sangrias),
        suprimentos: centsToReais(resultado.resumo.suprimentos),
        saldoEsperado: centsToReais(resultado.resumo.saldoEsperado),
      },
    };
  }

  @Post(':id/sangria')
  @HttpCode(201)
  @Papeis(UserRole.ADMIN, UserRole.OPERADOR)
  @ApiOperation({
    summary: 'Register a sangria (cash withdrawal) on the caller own session',
  })
  @ApiCreatedResponse({
    description: 'Sangria registered',
    type: MovimentacaoOutDTO,
  })
  @ApiNotFoundResponse({ description: 'CAIXA_NAO_ENCONTRADO' })
  @ApiForbiddenResponse({ description: 'NAO_E_DONO_DO_CAIXA' })
  async sangria(
    @CurrentUser('id') usuarioId: string,
    @Param('id', ParseUUIDPipe) sessaoId: string,
    @Body() dto: MovimentacaoInDTO,
  ): Promise<MovimentacaoOutDTO> {
    const movimentacao = unwrap(
      await this.registrarSangria.execute({
        sessaoId,
        usuarioId,
        valor: reaisToCents(dto.valor),
        observacao: dto.observacao,
      }),
    );
    return {
      id: movimentacao.id,
      tipo: movimentacao.tipo,
      valor: centsToReais(movimentacao.valor),
      observacao: movimentacao.observacao,
      criadaEm: movimentacao.criadaEm,
    };
  }

  @Post(':id/suprimento')
  @HttpCode(201)
  @Papeis(UserRole.ADMIN, UserRole.OPERADOR)
  @ApiOperation({
    summary:
      'Register a suprimento (cash reinforcement) on the caller own session',
  })
  @ApiCreatedResponse({
    description: 'Suprimento registered',
    type: MovimentacaoOutDTO,
  })
  @ApiNotFoundResponse({ description: 'CAIXA_NAO_ENCONTRADO' })
  @ApiForbiddenResponse({ description: 'NAO_E_DONO_DO_CAIXA' })
  async suprimento(
    @CurrentUser('id') usuarioId: string,
    @Param('id', ParseUUIDPipe) sessaoId: string,
    @Body() dto: MovimentacaoInDTO,
  ): Promise<MovimentacaoOutDTO> {
    const movimentacao = unwrap(
      await this.registrarSuprimento.execute({
        sessaoId,
        usuarioId,
        valor: reaisToCents(dto.valor),
        observacao: dto.observacao,
      }),
    );
    return {
      id: movimentacao.id,
      tipo: movimentacao.tipo,
      valor: centsToReais(movimentacao.valor),
      observacao: movimentacao.observacao,
      criadaEm: movimentacao.criadaEm,
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

  private toSessaoOut(dto: ReturnType<typeof toSessaoCaixaDTO>): SessaoOutDTO {
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
