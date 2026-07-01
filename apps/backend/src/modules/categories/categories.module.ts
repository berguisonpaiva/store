import { Module } from '@nestjs/common';
import {
  ActivateCategory,
  CreateCategory,
  DeactivateCategory,
  ListCategories,
  UpdateCategory,
} from '@repo/catalog';
import { DbModule } from '../../db/db.module';
import { CategoryPrismaQuery } from './adapters/category.prisma.query';
import { CategoryPrismaRepository } from './adapters/category.prisma.repository';
import { CategoriesController } from './categories.controller';

/// Composes the catalog category use cases with the Prisma adapters via DI.
/// Exports the repository so `ProductsModule` can validate referenced
/// categories when creating/editing products.
@Module({
  imports: [DbModule],
  controllers: [CategoriesController],
  providers: [
    CategoryPrismaRepository,
    CategoryPrismaQuery,
    {
      provide: CreateCategory,
      useFactory: (repo: CategoryPrismaRepository) => new CreateCategory(repo),
      inject: [CategoryPrismaRepository],
    },
    {
      provide: UpdateCategory,
      useFactory: (repo: CategoryPrismaRepository) => new UpdateCategory(repo),
      inject: [CategoryPrismaRepository],
    },
    {
      provide: ActivateCategory,
      useFactory: (repo: CategoryPrismaRepository) => new ActivateCategory(repo),
      inject: [CategoryPrismaRepository],
    },
    {
      provide: DeactivateCategory,
      useFactory: (repo: CategoryPrismaRepository) =>
        new DeactivateCategory(repo),
      inject: [CategoryPrismaRepository],
    },
    {
      provide: ListCategories,
      useFactory: (query: CategoryPrismaQuery) => new ListCategories(query),
      inject: [CategoryPrismaQuery],
    },
  ],
  exports: [CategoryPrismaRepository],
})
export class CategoriesModule {}
