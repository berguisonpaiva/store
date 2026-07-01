import { Module } from '@nestjs/common';
import {
  AbrirCaixa,
  CaixaAbertoDoOperador,
  CaixaPortService,
  FecharCaixa,
  ListarMovimentacoes,
  ListarVendas,
  RegistrarSangria,
  RegistrarSuprimento,
  ResumoSessao,
  VendasQuery,
} from '@repo/sales';
import { DbModule } from '../../../db/db.module';
import { VendasPrismaQuery } from '../adapters/vendas.prisma.query';
import { CaixaPrismaQuery } from './adapters/caixa.prisma.query';
import { CaixaPrismaRepository } from './adapters/caixa.prisma.repository';
import { VendasPendingSalePredicate } from './adapters/vendas-pending-sale.predicate';
import { CaixaCommandsController } from './caixa-commands.controller';
import { CaixaQueriesController } from './caixa-queries.controller';

/// Composition root for the cash-session module.
///
/// - `CaixaRepository`  -> `CaixaPrismaRepository`
/// - `CaixaQuery`       -> `CaixaPrismaQuery`
/// - `PendingSalePredicate` -> `VendasPendingSalePredicate` (real gate: an `ABERTA`
///   sale on the session ⇒ pending; blocks `fechar-caixa` with
///   `VENDA_PENDENTE_NO_FECHAMENTO`, Decision 5). Implemented as a backend read
///   over the `venda` table to avoid a caixa↔vendas domain cycle.
///
/// Exports `CaixaPortService` (the `CaixaPort` implementation) so `SalesModule`
/// binds its `CaixaGateway` through it — the ONLY surface that creates a `VENDA`
/// movement (no public route does).
@Module({
  imports: [DbModule],
  controllers: [CaixaCommandsController, CaixaQueriesController],
  providers: [
    CaixaPrismaRepository,
    CaixaPrismaQuery,
    VendasPendingSalePredicate,
    VendasPrismaQuery,
    {
      // Backs `GET /caixa/:id/vendas` (sale-api contract): lists the sales of a
      // session, reusing the vendas read side. The ownership gate is applied in
      // the controller via `ResumoSessao`'s actor scoping (RN03/RN04).
      provide: ListarVendas,
      useFactory: (query: VendasQuery) => new ListarVendas(query),
      inject: [VendasPrismaQuery],
    },
    {
      provide: AbrirCaixa,
      useFactory: (repo: CaixaPrismaRepository) => new AbrirCaixa(repo),
      inject: [CaixaPrismaRepository],
    },
    {
      provide: RegistrarSuprimento,
      useFactory: (repo: CaixaPrismaRepository) =>
        new RegistrarSuprimento(repo),
      inject: [CaixaPrismaRepository],
    },
    {
      provide: RegistrarSangria,
      useFactory: (repo: CaixaPrismaRepository) => new RegistrarSangria(repo),
      inject: [CaixaPrismaRepository],
    },
    {
      provide: FecharCaixa,
      useFactory: (
        repo: CaixaPrismaRepository,
        query: CaixaPrismaQuery,
        pendingSale: VendasPendingSalePredicate,
      ) => new FecharCaixa(repo, query, pendingSale),
      inject: [
        CaixaPrismaRepository,
        CaixaPrismaQuery,
        VendasPendingSalePredicate,
      ],
    },
    {
      provide: CaixaAbertoDoOperador,
      useFactory: (query: CaixaPrismaQuery) => new CaixaAbertoDoOperador(query),
      inject: [CaixaPrismaQuery],
    },
    {
      provide: ListarMovimentacoes,
      useFactory: (repo: CaixaPrismaRepository, query: CaixaPrismaQuery) =>
        new ListarMovimentacoes(query, repo),
      inject: [CaixaPrismaRepository, CaixaPrismaQuery],
    },
    {
      provide: ResumoSessao,
      useFactory: (repo: CaixaPrismaRepository, query: CaixaPrismaQuery) =>
        new ResumoSessao(query, repo),
      inject: [CaixaPrismaRepository, CaixaPrismaQuery],
    },
    {
      provide: CaixaPortService,
      useFactory: (repo: CaixaPrismaRepository, query: CaixaPrismaQuery) =>
        new CaixaPortService(repo, query),
      inject: [CaixaPrismaRepository, CaixaPrismaQuery],
    },
  ],
  // `CaixaPortService` is the only surface exposed to `SalesModule`; the vendas
  // `CaixaGateway` adapter flows entirely through the sealed `CaixaPort`
  // (`caixaAbertoDoOperador`/`isSessaoAberta`/`registrarVenda`/`estornarVenda`),
  // never the caixa repository directly (Decision 3).
  exports: [CaixaPortService],
})
export class CaixaModule {}
