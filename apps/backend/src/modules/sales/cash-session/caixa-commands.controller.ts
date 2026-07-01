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
  @Papeis(UserRole.MASTER, UserRole.ADMIN, UserRole.OPERADOR)
  @ApiOperation({ summary: 'Open a cash session for the authenticated operator' })
  @ApiCreatedResponse({ description: 'Session opened', type: SessaoOutDTO })
  @ApiConflictResponse({ description: 'CASH_SESSION_ALREADY_OPEN' })
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
  @Papeis(UserRole.MASTER, UserRole.ADMIN, UserRole.OPERADOR)
  @ApiOperation({ summary: 'Close a cash session with a counted amount' })
  @ApiOkResponse({ description: 'Session closed', type: FecharCaixaOutDTO })
  @ApiNotFoundResponse({ description: 'CASH_SESSION_NOT_FOUND' })
  @ApiConflictResponse({ description: 'CASH_SESSION_ALREADY_CLOSED' })
  @ApiUnprocessableEntityResponse({ description: 'PENDING_SALE_IN_SESSION' })
  async fechar(
    @Param('id', ParseUUIDPipe) sessaoId: string,
    @Body() dto: FecharCaixaInDTO,
  ): Promise<FecharCaixaOutDTO> {
    const resultado = unwrap(
      await this.fecharCaixa.execute({
        sessaoId,
        valorFechamento: reaisToCents(dto.valorFechamento),
      }),
    );
    return {
      sessaoId: resultado.sessaoId,
      esperado: centsToReais(resultado.esperado),
      contado: centsToReais(resultado.contado),
      divergencia: centsToReais(resultado.divergencia),
    };
  }

  @Post(':id/sangria')
  @HttpCode(201)
  @Papeis(UserRole.MASTER, UserRole.ADMIN, UserRole.OPERADOR)
  @ApiOperation({ summary: 'Register a sangria (cash withdrawal) on a session' })
  @ApiCreatedResponse({ description: 'Sangria registered', type: MovimentacaoOutDTO })
  @ApiNotFoundResponse({ description: 'CASH_SESSION_NOT_FOUND' })
  async sangria(
    @Param('id', ParseUUIDPipe) sessaoId: string,
    @Body() dto: MovimentacaoInDTO,
  ): Promise<MovimentacaoOutDTO> {
    const movimentacao = unwrap(
      await this.registrarSangria.execute({
        sessaoId,
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
  @Papeis(UserRole.MASTER, UserRole.ADMIN, UserRole.OPERADOR)
  @ApiOperation({ summary: 'Register a suprimento (cash reinforcement) on a session' })
  @ApiCreatedResponse({ description: 'Suprimento registered', type: MovimentacaoOutDTO })
  @ApiNotFoundResponse({ description: 'CASH_SESSION_NOT_FOUND' })
  async suprimento(
    @Param('id', ParseUUIDPipe) sessaoId: string,
    @Body() dto: MovimentacaoInDTO,
  ): Promise<MovimentacaoOutDTO> {
    const movimentacao = unwrap(
      await this.registrarSuprimento.execute({
        sessaoId,
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
