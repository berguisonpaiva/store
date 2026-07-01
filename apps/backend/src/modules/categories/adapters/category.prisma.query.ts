import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Result } from '@repo/shared';
import {
  CategoriesQuery,
  CategoryDTO,
  ListCategoriesFilterDTO,
} from '@repo/catalog';
import { PrismaService } from '../../../db/prisma.service';

/// Read-side adapter for `CategoriesQuery`: lists categories (optionally
/// filtered by active state) for selection in product forms and management.
@Injectable()
export class CategoryPrismaQuery implements CategoriesQuery {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    filter?: ListCategoriesFilterDTO,
  ): Promise<Result<CategoryDTO[]>> {
    const where: Prisma.CategoryWhereInput = {
      ...(filter?.active !== undefined ? { active: filter.active } : {}),
    };

    const rows = await this.prisma.client.category.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    const data: CategoryDTO[] = rows.map((row) => ({
      id: row.id,
      name: row.name,
      active: row.active,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));

    return Result.ok(data);
  }
}
