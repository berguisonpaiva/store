import { Module } from '@nestjs/common';
import {
  AjustarSaldo,
  ConsultarSaldo,
  EstoquePortService,
  ListarAbaixoDoMinimo,
  ListarMovimentacoes,
  RegistrarEntrada,
  RegistrarSaida,
} from '@repo/inventory';
import { DbModule } from '../../db/db.module';
import { CatalogVariationPrismaReader } from './adapters/catalog-variation.prisma.reader';
import { EstoquePrismaQuery } from './adapters/estoque.prisma.query';
import { EstoquePrismaRepository } from './adapters/estoque.prisma.repository';
import { InventoryCommandsController } from './inventory-commands.controller';
import { InventoryQueriesController } from './inventory-queries.controller';

@Module({
  imports: [DbModule],
  controllers: [InventoryCommandsController, InventoryQueriesController],
  providers: [
    CatalogVariationPrismaReader,
    EstoquePrismaRepository,
    EstoquePrismaQuery,
    {
      provide: RegistrarEntrada,
      useFactory: (
        repo: EstoquePrismaRepository,
        reader: CatalogVariationPrismaReader,
      ) => new RegistrarEntrada(repo, reader),
      inject: [EstoquePrismaRepository, CatalogVariationPrismaReader],
    },
    {
      provide: RegistrarSaida,
      useFactory: (
        repo: EstoquePrismaRepository,
        reader: CatalogVariationPrismaReader,
      ) => new RegistrarSaida(repo, reader),
      inject: [EstoquePrismaRepository, CatalogVariationPrismaReader],
    },
    {
      provide: AjustarSaldo,
      useFactory: (
        repo: EstoquePrismaRepository,
        reader: CatalogVariationPrismaReader,
      ) => new AjustarSaldo(repo, reader),
      inject: [EstoquePrismaRepository, CatalogVariationPrismaReader],
    },
    {
      provide: ConsultarSaldo,
      useFactory: (
        query: EstoquePrismaQuery,
        reader: CatalogVariationPrismaReader,
      ) => new ConsultarSaldo(query, reader),
      inject: [EstoquePrismaQuery, CatalogVariationPrismaReader],
    },
    {
      provide: ListarMovimentacoes,
      useFactory: (query: EstoquePrismaQuery) => new ListarMovimentacoes(query),
      inject: [EstoquePrismaQuery],
    },
    {
      provide: ListarAbaixoDoMinimo,
      useFactory: (query: EstoquePrismaQuery) =>
        new ListarAbaixoDoMinimo(query),
      inject: [EstoquePrismaQuery],
    },
    {
      provide: EstoquePortService,
      useFactory: (
        repo: EstoquePrismaRepository,
        reader: CatalogVariationPrismaReader,
      ) => new EstoquePortService(repo, reader),
      inject: [EstoquePrismaRepository, CatalogVariationPrismaReader],
    },
  ],
  // `EstoquePrismaRepository` is exported so the `vendas` `EstoqueGateway` adapter
  // can read available balance for `validarSaldoDisponivel`.
  exports: [EstoquePortService, EstoquePrismaRepository],
})
export class InventoryModule {}
