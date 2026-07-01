import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Result, TransactionContext } from '@repo/shared';
import {
  User,
  UserError,
  UserReader,
  UserRepository,
  UserRole,
} from '@repo/auth';
import {
  PrismaService,
  PrismaTransactionContext,
} from '../../../db/prisma.service';

type UserRow = Prisma.UserGetPayload<{ include: { password: true } }>;

/// Prisma adapter for the domain `UserRepository` + `UserReader`. Persists the
/// user and its password hash across two tables inside a transaction, and maps
/// rows back to the `User` aggregate. Business rules stay in the domain; the
/// unique index is only a redundant safety net.
@Injectable()
export class UserPrismaRepository implements UserRepository, UserReader {
  constructor(private readonly prisma: PrismaService) {}

  async create(entity: User, tx?: TransactionContext): Promise<Result<void>> {
    const run = async (client: Prisma.TransactionClient) => {
      await client.user.create({
        data: {
          id: entity.id,
          name: entity.name,
          email: entity.email,
          role: entity.role,
          active: entity.active,
        },
      });
      await client.userPassword.create({
        data: { userId: entity.id, hash: entity.passwordHash },
      });
    };

    try {
      await this.withTx(tx, run);
      return Result.ok();
    } catch (error) {
      return this.mapWriteError(error);
    }
  }

  async update(entity: User, tx?: TransactionContext): Promise<Result<void>> {
    const run = async (client: Prisma.TransactionClient) => {
      await client.user.update({
        where: { id: entity.id },
        data: {
          name: entity.name,
          email: entity.email,
          role: entity.role,
          active: entity.active,
        },
      });
      await client.userPassword.upsert({
        where: { userId: entity.id },
        create: { userId: entity.id, hash: entity.passwordHash },
        update: { hash: entity.passwordHash },
      });
    };

    try {
      await this.withTx(tx, run);
      return Result.ok();
    } catch (error) {
      return this.mapWriteError(error);
    }
  }

  async findById(id: string): Promise<Result<User>> {
    const row = await this.prisma.client.user.findUnique({
      where: { id },
      include: { password: true },
    });
    if (!row) return Result.fail(UserError.USER_NOT_FOUND);
    return this.toDomain(row);
  }

  async delete(id: string, tx?: TransactionContext): Promise<Result<void>> {
    const client = this.clientFrom(tx);
    await client.user.delete({ where: { id } });
    return Result.ok();
  }

  async findByEmail(email: string): Promise<Result<User | null>> {
    const row = await this.prisma.client.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { password: true },
    });
    if (!row) return Result.ok(null);
    return this.toDomain(row);
  }

  private toDomain(row: UserRow): Result<User> {
    return User.tryCreate({
      id: row.id,
      name: row.name,
      email: row.email,
      passwordHash: row.password?.hash ?? '',
      role: row.role as UserRole,
      active: row.active,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  private clientFrom(tx?: TransactionContext): Prisma.TransactionClient {
    const ctx = tx as PrismaTransactionContext | undefined;
    return ctx?.client ?? this.prisma.client;
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
      // Redundant safety net: surface as the same domain error code.
      return Result.fail(UserError.EMAIL_ALREADY_IN_USE);
    }
    throw error;
  }
}
