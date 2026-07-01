import { PaginatedResultDTO, Result } from '@repo/shared'
import { ListUsersFilterDTO, UserDTO } from '../dto/user.dto'

/// CQRS read port: paginated/filtered user projection for listing. Kept
/// separate from the command-side `UserRepository`.
export interface UserQuery {
  list(filter: ListUsersFilterDTO): Promise<Result<PaginatedResultDTO<UserDTO>>>
}
