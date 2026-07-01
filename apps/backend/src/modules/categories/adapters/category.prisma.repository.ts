import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Result, TransactionContext } from '@repo/shared';
import { CategoriesRepository, Category, CategoryError } from '@repo/catalog';
import {
  PrismaService,
  PrismaTransactionContext,
} from '../../../db/prisma.service';

type CategoryRow = Prisma.CategoryGetPayload<object>;

/// Prisma adapter for the domain `CategoriesRepository`. Categories are never
/// hard-deleted (only deactivated). Uniqueness of the name is decided in the
/// domain; the unique index is a redundant safety net mapped back to
/// `CATEGORY_ALREADY_EXISTS`.
@Injectable()
export class CategoryPrismaRepository implements CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    entity: Category,
    tx?: TransactionContext,
  ): Promise<Result<void>> {
    try {
      await this.clientFrom(tx).category.create({
        data: {
          id: entity.id,
          name: entity.name,
          active: entity.active,
        },
      });
      return Result.ok();
    } catch (error) {
      return this.mapWriteError(error);
    }
  }

  async update(
    entity: Category,
    tx?: TransactionContext,
  ): Promise<Result<void>> {
    try {
      await this.clientFrom(tx).category.update({
        where: { id: entity.id },
        data: {
          name: entity.name,
          active: entity.active,
        },
      });
      return Result.ok();
    } catch (error) {
      return this.mapWriteError(error);
    }
  }

  async findById(id: string): Promise<Result<Category>> {
    const row = await this.prisma.client.category.findUnique({ where: { id } });
    if (!row) return Result.fail(CategoryError.CATEGORY_NOT_FOUND);
    return this.toDomain(row);
  }

  async findByName(name: string): Promise<Result<Category | null>> {
    const row = await this.prisma.client.category.findUnique({
      where: { name },
    });
    if (!row) return Result.ok(null);
    const category = this.toDomain(row);
    if (category.isFailure) return category.withFail;
    return Result.ok(category.instance);
  }

  private toDomain(row: CategoryRow): Result<Category> {
    return Category.tryCreate({
      id: row.id,
      name: row.name,
      active: row.active,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  private clientFrom(tx?: TransactionContext): Prisma.TransactionClient {
    const ctx = tx as PrismaTransactionContext | undefined;
    return ctx?.client ?? this.prisma.client;
  }

  private mapWriteError(error: unknown): Result<void> {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return Result.fail(CategoryError.CATEGORY_ALREADY_EXISTS);
    }
    throw error;
  }
}
