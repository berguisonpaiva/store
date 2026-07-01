import { Email, Result, UseCase } from '@repo/shared'
import { UpdateUserInputDTO, UserDTO, toUserDTO } from '../dto/user.dto'
import { UserError } from '../errors'
import { UserRepository } from '../provider'
import {
  RoleAuthorizationPolicy,
  UniqueEmailSpecification,
} from '../service'

/// Edits a user's name, email and role. Authorization and email uniqueness
/// are enforced in the domain.
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
