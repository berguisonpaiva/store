import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginatedResultDTO, Result } from '@repo/shared';
import {
  ListProductsFilterDTO,
  ProductListItemDTO,
  ProductsQuery,
} from '@repo/catalog';
import { PrismaService } from '../../../db/prisma.service';

/// Read-side adapter for `ProductsQuery`: paginated, name-searched and
/// category/status-filtered projection. Returns the lighter list item (a
/// variation count, not the nested variations) and never leaks the entity.
@Injectable()
export class ProductPrismaQuery implements ProductsQuery {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    filter: ListProductsFilterDTO,
  ): Promise<Result<PaginatedResultDTO<ProductListItemDTO>>> {
    const where: Prisma.ProductWhereInput = {
      ...(filter.name
        ? { name: { contains: filter.name, mode: 'insensitive' } }
        : {}),
      ...(filter.categoryId ? { categoryId: filter.categoryId } : {}),
      ...(filter.active !== undefined ? { active: filter.active } : {}),
    };

    const page = filter.page;
    const pageSize = filter.pageSize;

    const [rows, total] = await Promise.all([
      this.prisma.client.product.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { variations: true } } },
      }),
      this.prisma.client.product.count({ where }),
    ]);

    const data: ProductListItemDTO[] = rows.map((row) => ({
      id: row.id,
      name: row.name,
      categoryId: row.categoryId,
      active: row.active,
      variationCount: row._count.variations,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));

    return Result.ok({
      data,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  }
}
