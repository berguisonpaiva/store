import { Result, UseCase } from '@repo/shared'
import { SetUserActiveInputDTO, UserDTO, toUserDTO } from '../dto/user.dto'
import { UserError } from '../errors'
import { UserRole } from '../model/user-role'
import { UserRepository } from '../provider'
import { LastMasterPolicy, RoleAuthorizationPolicy } from '../service'

/// Deactivates a user (MASTER/ADMIN only). Blocks deactivating the last
/// active MASTER via `LastMasterPolicy`.
export class DeactivateUser implements UseCase<SetUserActiveInputDTO, UserDTO> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: SetUserActiveInputDTO): Promise<Result<UserDTO>> {
    const authorized = RoleAuthorizationPolicy.ensureCanManageUsers(
      input.actorRole,
    )
    if (authorized.isFailure) return authorized.withFail

    const found = await this.userRepository.findById(input.id)
    if (found.isFailure) return Result.fail(UserError.USER_NOT_FOUND)
    const current = found.instance

    const count = await this.userRepository.countActiveByRole(UserRole.MASTER)
    if (count.isFailure) return count.withFail

    const allowed = LastMasterPolicy.ensureCanDeactivate(current, count.instance)
    if (allowed.isFailure) return allowed.withFail

    const deactivated = current.deactivate()
    if (deactivated.isFailure) return deactivated.withFail

    const saved = await this.userRepository.update(deactivated.instance)
    if (saved.isFailure) return saved.withFail

    return Result.ok(toUserDTO(deactivated.instance))
  }
}
