import { Result, UseCase } from '@repo/shared'
import { DeactivateUserInputDTO, UserDTO, toUserDTO } from '../dto/user.dto'
import { UserError } from '../errors'
import { UserRepository } from '../provider'
import { RoleAuthorizationPolicy } from '../service'

/// Deactivates a user (ADMIN only). An actor cannot deactivate their own
/// account (RN05); the rule is enforced here in the domain, never by the DB.
export class DeactivateUser
  implements UseCase<DeactivateUserInputDTO, UserDTO>
{
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: DeactivateUserInputDTO): Promise<Result<UserDTO>> {
    const authorized = RoleAuthorizationPolicy.ensureCanManageUsers(
      input.actorRole,
    )
    if (authorized.isFailure) return authorized.withFail

    if (input.userId === input.requesterId) {
      return Result.fail(UserError.CANNOT_DEACTIVATE_SELF)
    }

    const found = await this.userRepository.findById(input.userId)
    if (found.isFailure) return Result.fail(UserError.USER_NOT_FOUND)
    const current = found.instance

    const deactivated = current.deactivate()
    if (deactivated.isFailure) return deactivated.withFail

    const saved = await this.userRepository.update(deactivated.instance)
    if (saved.isFailure) return saved.withFail

    return Result.ok(toUserDTO(deactivated.instance))
  }
}
