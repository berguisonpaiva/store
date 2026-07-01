import { PaginatedResultDTO, Result, UseCase } from '@repo/shared'
import { ListUsersFilterDTO, UserDTO } from '../dto/user.dto'
import { UserQuery } from '../provider'

/// Lists users with pagination and optional role/active filters (read side).
export class ListUsers
  implements UseCase<ListUsersFilterDTO, PaginatedResultDTO<UserDTO>>
{
  constructor(private readonly userQuery: UserQuery) {}

  async execute(
    input: ListUsersFilterDTO,
  ): Promise<Result<PaginatedResultDTO<UserDTO>>> {
    return this.userQuery.list(input)
  }
}
