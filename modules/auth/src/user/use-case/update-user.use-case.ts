import { Email, Result, UseCase } from '@repo/shared'
import { UpdateUserInputDTO, UserDTO, toUserDTO } from '../dto/user.dto'
import { UserError } from '../errors'
import { UserRole } from '../model/user-role'
import { UserRepository } from '../provider'
import {
  LastMasterPolicy,
  RoleAuthorizationPolicy,
  UniqueEmailSpecification,
} from '../service'

/// Edits a user's name, email and role. Authorization, email uniqueness and
/// the last-active-MASTER rule are enforced in the domain.
export class UpdateUser implements UseCase<UpdateUserInputDTO, UserDTO> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: UpdateUserInputDTO): Promise<Result<UserDTO>> {
    const authorized = RoleAuthorizationPolicy.ensureCanManageUsers(
      input.actorRole,
    )
    if (authorized.isFailure) return authorized.withFail

    const found = await this.userRepository.findById(input.id)
    if (found.isFailure) return Result.fail(UserError.USER_NOT_FOUND)
    const current = found.instance

    if (input.role && input.role !== current.role) {
      const count = await this.userRepository.countActiveByRole(UserRole.MASTER)
      if (count.isFailure) return count.withFail
      const roleChange = LastMasterPolicy.ensureCanChangeRole(
        current,
        input.role,
        count.instance,
      )
      if (roleChange.isFailure) return roleChange.withFail
    }

    let normalizedEmail = input.email
    if (input.email) {
      const email = Email.tryCreate(input.email)
      if (email.isFailure) return email.withFail
      normalizedEmail = email.instance.value

      const existing = await this.userRepository.findByEmail(normalizedEmail)
      if (existing.isFailure) return existing.withFail
      const unique = UniqueEmailSpecification.ensureUnique(
        existing.instance,
        current.id,
      )
      if (unique.isFailure) return unique.withFail
    }

    const edited = current.edit({
      name: input.name,
      email: normalizedEmail,
      role: input.role,
    })
    if (edited.isFailure) return edited.withFail

    const saved = await this.userRepository.update(edited.instance)
    if (saved.isFailure) return saved.withFail

    return Result.ok(toUserDTO(edited.instance))
  }
}
