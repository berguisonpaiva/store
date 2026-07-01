import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Result, TransactionContext } from '@repo/shared';
import {
  AttributeMap,
  Product,
  ProductError,
  ProductsRepository,
} from '@repo/catalog';
import {
  PrismaService,
  PrismaTransactionContext,
} from '../../../db/prisma.service';

type ProductRow = Prisma.ProductGetPayload<{ include: { variations: true } }>;

/// Prisma adapter for the domain `ProductsRepository`. The `Product` aggregate
/// (product + its `Variation` children) is written inside a transaction:
/// `create` inserts the product and its variations; `update` upserts each
/// variation, never deleting one (deactivation is just an `active` flag).
/// Business rules stay in the domain; the unique indexes are redundant safety
/// nets whose violations are mapped back to the matching domain code.
@Injectable()
export class ProductPrismaRepository implements ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    entity: Product,
    tx?: TransactionContext,
  ): Promise<Result<void>> {
    const run = async (client: Prisma.TransactionClient) => {
      await client.product.create({
        data: {
          id: entity.id,
          name: entity.name,
          description: entity.description,
          categoryId: entity.categoryId,
          active: entity.active,
        },
      });
      await client.variation.createMany({
        data: entity.variations.map((variation) => ({
          id: variation.id,
          productId: entity.id,
          sku: variation.sku,
          barcode: variation.barcode,
          attributes: variation.attributes,
          priceCents: variation.price,
          minStock: variation.minStock,
          active: variation.active,
        })),
      });
    };

    try {
      await this.withTx(tx, run);
      return Result.ok();
    } catch (error) {
      return this.mapWriteError(error);
    }
  }

  async update(
    entity: Product,
    tx?: TransactionContext,
  ): Promise<Result<void>> {
    const run = async (client: Prisma.TransactionClient) => {
      await client.product.update({
        where: { id: entity.id },
        data: {
          name: entity.name,
          description: entity.description,
          categoryId: entity.categoryId,
          active: entity.active,
        },
      });
      // Sync variations: create new, update existing. Never delete — a removed
      // variation cannot happen (the domain only deactivates).
      for (const variation of entity.variations) {
        await client.variation.upsert({
          where: { id: variation.id },
          create: {
            id: variation.id,
            productId: entity.id,
            sku: variation.sku,
            barcode: variation.barcode,
            attributes: variation.attributes,
            priceCents: variation.price,
            minStock: variation.minStock,
            active: variation.active,
          },
          update: {
            sku: variation.sku,
            barcode: variation.barcode,
            attributes: variation.attributes,
            priceCents: variation.price,
            minStock: variation.minStock,
            active: variation.active,
          },
        });
      }
    };

    try {
      await this.withTx(tx, run);
      return Result.ok();
    } catch (error) {
      return this.mapWriteError(error);
    }
  }

  async findById(id: string): Promise<Result<Product>> {
    const row = await this.prisma.client.product.findUnique({
      where: { id },
      include: { variations: true },
    });
    if (!row) return Result.fail(ProductError.PRODUCT_NOT_FOUND);
    return this.toDomain(row);
  }

  async findBySku(sku: string): Promise<Result<Product | null>> {
    const variation = await this.prisma.client.variation.findUnique({
      where: { sku },
      select: { productId: true },
    });
    if (!variation) return Result.ok(null);
    return this.loadOwningProduct(variation.productId);
  }

  async findByBarcode(barcode: string): Promise<Result<Product | null>> {
    const variation = await this.prisma.client.variation.findUnique({
      where: { barcode },
      select: { productId: true },
    });
    if (!variation) return Result.ok(null);
    return this.loadOwningProduct(variation.productId);
  }

  private async loadOwningProduct(
    productId: string,
  ): Promise<Result<Product | null>> {
    const row = await this.prisma.client.product.findUnique({
      where: { id: productId },
      include: { variations: true },
    });
    if (!row) return Result.ok(null);
    const product = this.toDomain(row);
    if (product.isFailure) return product.withFail;
    return Result.ok(product.instance);
  }

  private toDomain(row: ProductRow): Result<Product> {
    return Product.tryCreate({
      id: row.id,
      name: row.name,
      description: row.description,
      categoryId: row.categoryId,
      active: row.active,
      variations: row.variations.map((variation) => ({
        id: variation.id,
        sku: variation.sku,
        barcode: variation.barcode,
        attributes: (variation.attributes ?? {}) as AttributeMap,
        price: variation.priceCents,
        minStock: variation.minStock,
        active: variation.active,
        createdAt: variation.createdAt,
        updatedAt: variation.updatedAt,
      })),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  private async withTx(
    tx: TransactionContext | undefined,
    run: (client: Prisma.TransactionClient) => Promise<void>,
  ): Promise<void> {
    const ctx = tx as PrismaTransactionContext | undefined;
    if (ctx?.client) {
      await run(ctx.client);
      return;
    }
    await this.prisma.runInTransaction((c) => run(c.client));
  }

  private mapWriteError(error: unknown): Result<void> {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const target = String(error.meta?.target ?? '');
      if (target.includes('barcode')) {
        return Result.fail(ProductError.BARCODE_ALREADY_IN_USE);
      }
      // Default the redundant unique-constraint safety net to SKU.
      return Result.fail(ProductError.SKU_ALREADY_IN_USE);
    }
    throw error;
  }
}
