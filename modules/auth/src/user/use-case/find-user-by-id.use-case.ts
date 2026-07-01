import { Result, UseCase } from '@repo/shared'
import { UserDTO, toUserDTO } from '../dto/user.dto'
import { UserError } from '../errors'
import { UserRepository } from '../provider'

export interface FindUserByIdInput {
  id: string
}

/// Returns a single user projection or `USER_NOT_FOUND`.
export class FindUserById implements UseCase<FindUserByIdInput, UserDTO> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: FindUserByIdInput): Promise<Result<UserDTO>> {
    const found = await this.userRepository.findById(input.id)
    if (found.isFailure) return Result.fail(UserError.USER_NOT_FOUND)
    return Result.ok(toUserDTO(found.instance))
  }
}
