import { Module } from '@nestjs/common';
import {
  AdicionarItem,
  AdicionarPagamento,
  AlterarQuantidadeItem,
  AplicarDesconto,
  BuscarVenda,
  CancelarVenda,
  CaixaGateway,
  CriarVenda,
  EstoqueGateway,
  FinalizarVenda,
  ListarVendas,
  RemoverItem,
  ResumoVendas,
  VariacaoGateway,
  VendasQuery,
  VendasRepository,
} from '@repo/sales';
import { DbModule } from '../../db/db.module';
import { PrismaService } from '../../db/prisma.service';
import { CaixaModule } from './cash-session/caixa.module';
import { InventoryModule } from '../inventory/inventory.module';
import { CaixaGatewayAdapter } from './adapters/caixa.gateway.adapter';
import { EstoqueGatewayAdapter } from './adapters/estoque.gateway.adapter';
import { VariacaoPrismaReader } from './adapters/variacao.prisma.reader';
import { VendasPrismaQuery } from './adapters/vendas.prisma.query';
import { VendasPrismaRepository } from './adapters/vendas.prisma.repository';
import { VendasCommandsController } from './vendas-commands.controller';
import { VendasQueriesController } from './vendas-queries.controller';

/// Injection tokens for the domain-declared ports (interfaces have no runtime
/// value, so the gateways are bound by string token).
const ESTOQUE_GATEWAY = 'VENDAS_ESTOQUE_GATEWAY';
const CAIXA_GATEWAY = 'VENDAS_CAIXA_GATEWAY';
const VARIACAO_GATEWAY = 'VENDAS_VARIACAO_GATEWAY';

/// Composition root for the PDV sales module.
///
/// - `VendasRepository` -> `VendasPrismaRepository`
/// - `VendasQuery`      -> `VendasPrismaQuery`
/// - `EstoqueGateway`   -> `EstoqueGatewayAdapter` (delegates to the estoque sales port)
/// - `CaixaGateway`     -> `CaixaGatewayAdapter` (delegates to the caixa cash port)
/// - `VariacaoGateway`  -> `VariacaoPrismaReader` (catalog price/active read, RN10)
///
/// `finalizar-venda` / `cancelar-venda` receive the `PrismaService` as the
/// `TransactionManager`, so repository writes commit/roll back together with the
/// orchestrated stock/cash gateway calls (design D3).
@Module({
  imports: [DbModule, InventoryModule, CaixaModule],
  controllers: [VendasCommandsController, VendasQueriesController],
  providers: [
    VendasPrismaRepository,
    VendasPrismaQuery,
    VariacaoPrismaReader,
    EstoqueGatewayAdapter,
    CaixaGatewayAdapter,
    { provide: ESTOQUE_GATEWAY, useExisting: EstoqueGatewayAdapter },
    { provide: CAIXA_GATEWAY, useExisting: CaixaGatewayAdapter },
    { provide: VARIACAO_GATEWAY, useExisting: VariacaoPrismaReader },
    {
      provide: CriarVenda,
      useFactory: (repo: VendasRepository, caixa: CaixaGateway) =>
        new CriarVenda(repo, caixa),
      inject: [VendasPrismaRepository, CAIXA_GATEWAY],
    },
    {
      provide: AdicionarItem,
      useFactory: (
        repo: VendasRepository,
        variacao: VariacaoGateway,
        estoque: EstoqueGateway,
      ) => new AdicionarItem(repo, variacao, estoque),
      inject: [VendasPrismaRepository, VARIACAO_GATEWAY, ESTOQUE_GATEWAY],
    },
    {
      provide: RemoverItem,
      useFactory: (repo: VendasRepository) => new RemoverItem(repo),
      inject: [VendasPrismaRepository],
    },
    {
      provide: AlterarQuantidadeItem,
      useFactory: (repo: VendasRepository, estoque: EstoqueGateway) =>
        new AlterarQuantidadeItem(repo, estoque),
      inject: [VendasPrismaRepository, ESTOQUE_GATEWAY],
    },
    {
      provide: AdicionarPagamento,
      useFactory: (repo: VendasRepository) => new AdicionarPagamento(repo),
      inject: [VendasPrismaRepository],
    },
    {
      provide: AplicarDesconto,
      useFactory: (repo: VendasRepository) => new AplicarDesconto(repo),
      inject: [VendasPrismaRepository],
    },
    {
      provide: FinalizarVenda,
      useFactory: (
        repo: VendasRepository,
        estoque: EstoqueGateway,
        caixa: CaixaGateway,
        prisma: PrismaService,
      ) => new FinalizarVenda(repo, estoque, caixa, prisma),
      inject: [
        VendasPrismaRepository,
        ESTOQUE_GATEWAY,
        CAIXA_GATEWAY,
        PrismaService,
      ],
    },
    {
      provide: CancelarVenda,
      useFactory: (
        repo: VendasRepository,
        estoque: EstoqueGateway,
        caixa: CaixaGateway,
        prisma: PrismaService,
      ) => new CancelarVenda(repo, estoque, caixa, prisma),
      inject: [
        VendasPrismaRepository,
        ESTOQUE_GATEWAY,
        CAIXA_GATEWAY,
        PrismaService,
      ],
    },
    {
      provide: BuscarVenda,
      useFactory: (query: VendasQuery) => new BuscarVenda(query),
      inject: [VendasPrismaQuery],
    },
    {
      provide: ListarVendas,
      useFactory: (query: VendasQuery) => new ListarVendas(query),
      inject: [VendasPrismaQuery],
    },
    {
      provide: ResumoVendas,
      useFactory: (query: VendasQuery) => new ResumoVendas(query),
      inject: [VendasPrismaQuery],
    },
  ],
})
export class SalesModule {}
