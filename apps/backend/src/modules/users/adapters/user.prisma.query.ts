import { Injectable } from '@nestjs/common';
import { PaginatedResultDTO, Result } from '@repo/shared';
import { ListUsersFilterDTO, UserDTO, UserQuery, UserRole } from '@repo/auth';
import { PrismaService } from '../../../db/prisma.service';

/// Read-side adapter for `UserQuery`: paginated, filtered projection that never
/// exposes the password hash.
@Injectable()
export class UserPrismaQuery implements UserQuery {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    filter: ListUsersFilterDTO,
  ): Promise<Result<PaginatedResultDTO<UserDTO>>> {
    const where = {
      ...(filter.role !== undefined ? { role: filter.role } : {}),
      ...(filter.active !== undefined ? { active: filter.active } : {}),
    };

    const page = filter.page;
    const pageSize = filter.pageSize;

    const [rows, total] = await Promise.all([
      this.prisma.client.user.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.client.user.count({ where }),
    ]);

    const data: UserDTO[] = rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role as UserRole,
      active: row.active,
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
