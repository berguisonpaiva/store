import { Module } from '@nestjs/common';
import {
  AbrirCaixa,
  CaixaAbertoDoOperador,
  CaixaPortService,
  FecharCaixa,
  ListarMovimentacoes,
  RegistrarSangria,
  RegistrarSuprimento,
  ResumoSessao,
} from '@repo/sales';
import { DbModule } from '../../../db/db.module';
import { CaixaPrismaQuery } from './adapters/caixa.prisma.query';
import { CaixaPrismaRepository } from './adapters/caixa.prisma.repository';
import { StubPendingSalePredicate } from './adapters/stub-pending-sale.predicate';
import { CaixaCommandsController } from './caixa-commands.controller';
import { CaixaQueriesController } from './caixa-queries.controller';

/// Composition root for the cash-session module.
///
/// - `CaixaRepository`  -> `CaixaPrismaRepository`
/// - `CaixaQuery`       -> `CaixaPrismaQuery`
/// - `PendingSalePredicate` -> `StubPendingSalePredicate` (PLACEHOLDER — replaced
///   by the real `VendasModule` binding once `vendas` lands; see the stub file).
///
/// Exports `CaixaPortService` (the `CaixaPort` implementation) so a future
/// `VendasModule` can import it to record cash sales — the ONLY surface that
/// creates a `VENDA` movement (no public route does).
@Module({
  imports: [DbModule],
  controllers: [CaixaCommandsController, CaixaQueriesController],
  providers: [
    CaixaPrismaRepository,
    CaixaPrismaQuery,
    StubPendingSalePredicate,
    {
      provide: AbrirCaixa,
      useFactory: (repo: CaixaPrismaRepository) => new AbrirCaixa(repo),
      inject: [CaixaPrismaRepository],
    },
    {
      provide: RegistrarSuprimento,
      useFactory: (repo: CaixaPrismaRepository) => new RegistrarSuprimento(repo),
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
        pendingSale: StubPendingSalePredicate,
      ) => new FecharCaixa(repo, query, pendingSale),
      inject: [CaixaPrismaRepository, CaixaPrismaQuery, StubPendingSalePredicate],
    },
    {
      provide: CaixaAbertoDoOperador,
      useFactory: (query: CaixaPrismaQuery) => new CaixaAbertoDoOperador(query),
      inject: [CaixaPrismaQuery],
    },
    {
      provide: ListarMovimentacoes,
      useFactory: (query: CaixaPrismaQuery) => new ListarMovimentacoes(query),
      inject: [CaixaPrismaQuery],
    },
    {
      provide: ResumoSessao,
      useFactory: (query: CaixaPrismaQuery) => new ResumoSessao(query),
      inject: [CaixaPrismaQuery],
    },
    {
      provide: CaixaPortService,
      useFactory: (repo: CaixaPrismaRepository, query: CaixaPrismaQuery) =>
        new CaixaPortService(repo, query),
      inject: [CaixaPrismaRepository, CaixaPrismaQuery],
    },
  ],
  // `CaixaPrismaRepository` is exported so the `vendas` `CaixaGateway` adapter can
  // check session state and record the cancel-time cash reversal; `CaixaPortService`
  // remains the only surface that creates a `VENDA` movement.
  exports: [CaixaPortService, CaixaPrismaRepository],
})
export class CaixaModule {}
