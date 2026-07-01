import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Result } from '@repo/shared';
import { AttributeMap, Variation } from '@repo/catalog';
import { CatalogVariationReader } from '@repo/inventory';
import { PrismaService } from '../../../db/prisma.service';

type VariationRow = Prisma.VariationGetPayload<object>;

@Injectable()
export class CatalogVariationPrismaReader implements CatalogVariationReader {
  constructor(private readonly prisma: PrismaService) {}

  async findById(variationId: string): Promise<Result<Variation | null>> {
    const row = await this.prisma.client.variation.findUnique({
      where: { id: variationId },
    });

    if (!row) {
      return Result.ok(null);
    }

    return this.toDomain(row);
  }

  private toDomain(row: VariationRow): Result<Variation> {
    return Variation.tryCreate({
      id: row.id,
      sku: row.sku,
      barcode: row.barcode,
      attributes: (row.attributes ?? {}) as AttributeMap,
      price: row.priceCents,
      minStock: row.minStock,
      active: row.active,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
