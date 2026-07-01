import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
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
import { UserRole } from '@repo/auth';
import {
  AdicionarItem,
  AplicarDesconto,
  CancelarVenda,
  CriarVenda,
  FinalizarVenda,
  RemoverItem,
  TipoDesconto,
} from '@repo/sales';
import { JwtGuard } from '../../shared/auth/jwt.guard';
import { RolesGuard } from '../../shared/auth/roles.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Papeis } from '../../shared/decorators/papeis.decorator';
import { unwrap } from '../../shared/errors/domain-error.mapper';
import { reaisToCents } from './adapters/money';
import { VariacaoPrismaReader } from './adapters/variacao.prisma.reader';
import { toVendaOut } from './adapters/venda.mapper';
import {
  AdicionarItemInDTO,
  AplicarDescontoInDTO,
  CriarVendaInDTO,
  FinalizarVendaInDTO,
  TipoDescontoHttp,
  VendaOutDTO,
} from './dto';

/// Public sales commands (CQRS write side). `usuarioId` is always derived from the
/// authenticated operator (design D7); `sessaoCaixaId` is bound by the domain from
/// the operator's open session. Money crosses the HTTP edge in reais.
@ApiTags('vendas')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Controller('vendas')
export class VendasCommandsController {
  constructor(
    private readonly criarVenda: CriarVenda,
    private readonly adicionarItem: AdicionarItem,
    private readonly removerItem: RemoverItem,
    private readonly aplicarDesconto: AplicarDesconto,
    private readonly finalizarVenda: FinalizarVenda,
    private readonly cancelarVenda: CancelarVenda,
    private readonly variacaoReader: VariacaoPrismaReader,
  ) {}

  @Post()
  @HttpCode(201)
  @Papeis(UserRole.ADMIN, UserRole.OPERADOR)
  @ApiOperation({
    summary: 'Open a sale bound to the operator open cash session',
  })
  @ApiCreatedResponse({ description: 'Sale opened', type: VendaOutDTO })
  @ApiUnprocessableEntityResponse({ description: 'NO_OPEN_CASH_SESSION' })
  async criar(
    @CurrentUser('id') usuarioId: string,
    @Body() _dto: CriarVendaInDTO,
  ): Promise<VendaOutDTO> {
    const venda = unwrap(await this.criarVenda.execute({ usuarioId }));
    return toVendaOut(venda);
  }

  @Post(':id/itens')
  @HttpCode(201)
  @Papeis(UserRole.ADMIN, UserRole.OPERADOR)
  @ApiOperation({
    summary: 'Add an item resolved by variacaoId, sku, or codigoBarras',
  })
  @ApiCreatedResponse({ description: 'Item added', type: VendaOutDTO })
  @ApiNotFoundResponse({ description: 'SALE_NOT_FOUND or VARIATION_NOT_FOUND' })
  @ApiConflictResponse({ description: 'SALE_ALREADY_FINALIZED' })
  async adicionar(
    @Param('id', ParseUUIDPipe) vendaId: string,
    @Body() dto: AdicionarItemInDTO,
  ): Promise<VendaOutDTO> {
    if (!dto.variacaoId && !dto.sku && !dto.codigoBarras) {
      throw new BadRequestException('VARIATION_IDENTIFIER_REQUIRED');
    }

    const resolved = await this.variacaoReader.resolver({
      variacaoId: dto.variacaoId,
      sku: dto.sku,
      codigoBarras: dto.codigoBarras,
    });
    if (!resolved) {
      throw new BadRequestException('VARIATION_NOT_FOUND');
    }

    const venda = unwrap(
      await this.adicionarItem.execute({
        vendaId,
        variacaoId: resolved.variacaoId,
        quantidade: dto.quantidade,
        precoUnitario: resolved.precoUnitario,
      }),
    );
    return toVendaOut(venda);
  }

  @Delete(':id/itens/:itemId')
  @HttpCode(200)
  @Papeis(UserRole.ADMIN, UserRole.OPERADOR)
  @ApiOperation({ summary: 'Remove an item from an open sale' })
  @ApiOkResponse({ description: 'Item removed', type: VendaOutDTO })
  @ApiNotFoundResponse({ description: 'SALE_NOT_FOUND or ITEM_NOT_FOUND' })
  @ApiConflictResponse({ description: 'SALE_ALREADY_FINALIZED' })
  async remover(
    @Param('id', ParseUUIDPipe) vendaId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ): Promise<VendaOutDTO> {
    const venda = unwrap(await this.removerItem.execute({ vendaId, itemId }));
    return toVendaOut(venda);
  }

  @Patch(':id/desconto')
  @HttpCode(200)
  @Papeis(UserRole.ADMIN, UserRole.OPERADOR)
  @ApiOperation({
    summary: 'Apply a discount (valor in reais or percentual 0..100)',
  })
  @ApiOkResponse({ description: 'Discount applied', type: VendaOutDTO })
  @ApiNotFoundResponse({ description: 'SALE_NOT_FOUND' })
  @ApiConflictResponse({ description: 'SALE_ALREADY_FINALIZED' })
  @ApiUnprocessableEntityResponse({ description: 'DISCOUNT_EXCEEDS_SUBTOTAL' })
  async desconto(
    @Param('id', ParseUUIDPipe) vendaId: string,
    @Body() dto: AplicarDescontoInDTO,
  ): Promise<VendaOutDTO> {
    const tipo =
      dto.tipo === TipoDescontoHttp.PERCENTUAL
        ? TipoDesconto.PERCENTUAL
        : TipoDesconto.VALOR;
    // `percentual` is a percentage (not money); `valor` is reais -> cents.
    const valor =
      tipo === TipoDesconto.PERCENTUAL ? dto.valor : reaisToCents(dto.valor);

    const venda = unwrap(
      await this.aplicarDesconto.execute({ vendaId, tipo, valor }),
    );
    return toVendaOut(venda);
  }

  @Post(':id/finalizar')
  @HttpCode(200)
  @Papeis(UserRole.ADMIN, UserRole.OPERADOR)
  @ApiOperation({
    summary: 'Finalize a sale (stock + payments + cash) in one transaction',
  })
  @ApiOkResponse({
    description: 'Sale finalized (CONCLUIDA)',
    type: VendaOutDTO,
  })
  @ApiNotFoundResponse({ description: 'SALE_NOT_FOUND' })
  @ApiConflictResponse({ description: 'SALE_ALREADY_FINALIZED' })
  @ApiUnprocessableEntityResponse({
    description: 'INSUFFICIENT_STOCK or PAYMENT_MISMATCH',
  })
  async finalizar(
    @Param('id', ParseUUIDPipe) vendaId: string,
    @Body() dto: FinalizarVendaInDTO,
  ): Promise<VendaOutDTO> {
    const venda = unwrap(
      await this.finalizarVenda.execute({
        vendaId,
        pagamentos: dto.pagamentos.map((p) => ({
          forma: p.forma,
          valor: reaisToCents(p.valor),
        })),
      }),
    );
    return toVendaOut(venda);
  }

  @Post(':id/cancelar')
  @HttpCode(200)
  @Papeis(UserRole.ADMIN, UserRole.OPERADOR)
  @ApiOperation({
    summary:
      'Cancel a sale, reversing stock and cash while the session is open',
  })
  @ApiOkResponse({
    description: 'Sale cancelled (CANCELADA)',
    type: VendaOutDTO,
  })
  @ApiNotFoundResponse({ description: 'SALE_NOT_FOUND' })
  @ApiUnprocessableEntityResponse({ description: 'CASH_SESSION_CLOSED' })
  async cancelar(
    @Param('id', ParseUUIDPipe) vendaId: string,
  ): Promise<VendaOutDTO> {
    const venda = unwrap(await this.cancelarVenda.execute({ vendaId }));
    return toVendaOut(venda);
  }
}
