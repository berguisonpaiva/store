import { PaginatedResultDTO, Result, TransactionContext } from '@repo/shared'
import {
  ListUsersFilterDTO,
  User,
  UserDTO,
  UserQuery,
  UserRepository,
  toUserDTO,
} from '../../src/user'

/// Reference in-memory implementation used by use-case tests. Implements both
/// the command (`UserRepository`) and read (`UserQuery`) ports.
export class InMemoryUserRepository implements UserRepository, UserQuery {
  readonly items = new Map<string, User>()

  async create(entity: User, _tx?: TransactionContext): Promise<Result<void>> {
    this.items.set(entity.id, entity)
    return Result.ok()
  }

  async update(entity: User, _tx?: TransactionContext): Promise<Result<void>> {
    this.items.set(entity.id, entity)
    return Result.ok()
  }

  async findById(id: string): Promise<Result<User>> {
    const entity = this.items.get(id)
    if (!entity) {
      return Result.fail('ENTITY_NOT_FOUND')
    }
    return Result.ok(entity)
  }

  async delete(id: string, _tx?: TransactionContext): Promise<Result<void>> {
    this.items.delete(id)
    return Result.ok()
  }

  async findByEmail(email: string): Promise<Result<User | null>> {
    const normalized = email.trim().toLowerCase()
    const found = [...this.items.values()].find((u) => u.email === normalized)
    return Result.ok(found ?? null)
  }

  async list(
    filter: ListUsersFilterDTO,
  ): Promise<Result<PaginatedResultDTO<UserDTO>>> {
    let rows = [...this.items.values()]
    if (filter.role !== undefined) {
      rows = rows.filter((u) => u.role === filter.role)
    }
    if (filter.active !== undefined) {
      rows = rows.filter((u) => u.active === filter.active)
    }

    const total = rows.length
    const page = filter.page
    const pageSize = filter.pageSize
    const start = (page - 1) * pageSize
    const data = rows.slice(start, start + pageSize).map(toUserDTO)

    return Result.ok({
      data,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  }
}
