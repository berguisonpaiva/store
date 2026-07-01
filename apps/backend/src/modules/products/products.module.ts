import { Module } from '@nestjs/common';
import {
  ActivateProduct,
  ActivateVariation,
  AddVariation,
  CreateProduct,
  DeactivateProduct,
  DeactivateVariation,
  FindProductById,
  FindVariationByBarcode,
  FindVariationBySku,
  ListProducts,
  UpdateProduct,
  UpdateVariation,
} from '@repo/catalog';
import { DbModule } from '../../db/db.module';
import { CategoryPrismaRepository } from '../categories/adapters/category.prisma.repository';
import { CategoriesModule } from '../categories/categories.module';
import { ProductPrismaQuery } from './adapters/product.prisma.query';
import { ProductPrismaRepository } from './adapters/product.prisma.repository';
import { ProductsController } from './products.controller';
import { VariationsController } from './variations.controller';

/// Composes the catalog product/variation use cases with the Prisma adapters
/// via DI. `CreateProduct`/`UpdateProduct` also need the categories repository
/// (to validate the referenced category), imported from `CategoriesModule`.
@Module({
  imports: [DbModule, CategoriesModule],
  controllers: [ProductsController, VariationsController],
  providers: [
    ProductPrismaRepository,
    ProductPrismaQuery,
    {
      provide: CreateProduct,
      useFactory: (
        repo: ProductPrismaRepository,
        categories: CategoryPrismaRepository,
      ) => new CreateProduct(repo, categories),
      inject: [ProductPrismaRepository, CategoryPrismaRepository],
    },
    {
      provide: UpdateProduct,
      useFactory: (
        repo: ProductPrismaRepository,
        categories: CategoryPrismaRepository,
      ) => new UpdateProduct(repo, categories),
      inject: [ProductPrismaRepository, CategoryPrismaRepository],
    },
    {
      provide: ActivateProduct,
      useFactory: (repo: ProductPrismaRepository) => new ActivateProduct(repo),
      inject: [ProductPrismaRepository],
    },
    {
      provide: DeactivateProduct,
      useFactory: (repo: ProductPrismaRepository) => new DeactivateProduct(repo),
      inject: [ProductPrismaRepository],
    },
    {
      provide: FindProductById,
      useFactory: (repo: ProductPrismaRepository) => new FindProductById(repo),
      inject: [ProductPrismaRepository],
    },
    {
      provide: ListProducts,
      useFactory: (query: ProductPrismaQuery) => new ListProducts(query),
      inject: [ProductPrismaQuery],
    },
    {
      provide: AddVariation,
      useFactory: (repo: ProductPrismaRepository) => new AddVariation(repo),
      inject: [ProductPrismaRepository],
    },
    {
      provide: UpdateVariation,
      useFactory: (repo: ProductPrismaRepository) => new UpdateVariation(repo),
      inject: [ProductPrismaRepository],
    },
    {
      provide: ActivateVariation,
      useFactory: (repo: ProductPrismaRepository) => new ActivateVariation(repo),
      inject: [ProductPrismaRepository],
    },
    {
      provide: DeactivateVariation,
      useFactory: (repo: ProductPrismaRepository) =>
        new DeactivateVariation(repo),
      inject: [ProductPrismaRepository],
    },
    {
      provide: FindVariationBySku,
      useFactory: (repo: ProductPrismaRepository) => new FindVariationBySku(repo),
      inject: [ProductPrismaRepository],
    },
    {
      provide: FindVariationByBarcode,
      useFactory: (repo: ProductPrismaRepository) =>
        new FindVariationByBarcode(repo),
      inject: [ProductPrismaRepository],
    },
  ],
})
export class ProductsModule {}
