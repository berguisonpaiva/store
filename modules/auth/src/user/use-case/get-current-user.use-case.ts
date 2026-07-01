import { Result, UseCase } from '@repo/shared'
import { UserDTO, toUserDTO } from '../dto/user.dto'
import { UserError } from '../errors'
import { UserRepository } from '../provider'

export interface GetCurrentUserInput {
  userId: string
}

/// Read path for `GET /auth/me`: resolves the authenticated user id to its
/// public projection (never the password hash). Reuses the find-by-id read.
export class GetCurrentUser implements UseCase<GetCurrentUserInput, UserDTO> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: GetCurrentUserInput): Promise<Result<UserDTO>> {
    const found = await this.userRepository.findById(input.userId)
    if (found.isFailure) return Result.fail(UserError.USER_NOT_FOUND)
    return Result.ok(toUserDTO(found.instance))
  }
}
