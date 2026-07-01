import { Result, UseCase } from '@repo/shared'
import { SetUserActiveInputDTO, UserDTO, toUserDTO } from '../dto/user.dto'
import { UserError } from '../errors'
import { UserRepository } from '../provider'
import { RoleAuthorizationPolicy } from '../service'

/// Activates a user (ADMIN only).
export class ActivateUser implements UseCase<SetUserActiveInputDTO, UserDTO> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: SetUserActiveInputDTO): Promise<Result<UserDTO>> {
    const authorized = RoleAuthorizationPolicy.ensureCanManageUsers(
      input.actorRole,
    )
    if (authorized.isFailure) return authorized.withFail

    const found = await this.userRepository.findById(input.id)
    if (found.isFailure) return Result.fail(UserError.USER_NOT_FOUND)

    const activated = found.instance.activate()
    if (activated.isFailure) return activated.withFail

    const saved = await this.userRepository.update(activated.instance)
    if (saved.isFailure) return saved.withFail

    return Result.ok(toUserDTO(activated.instance))
  }
}
