import { Result, StrongPassword, UseCase } from '@repo/shared'
import { ChangePasswordInputDTO } from '../dto/user.dto'
import { UserError } from '../errors'
import { HashComparer, HashGenerator, UserRepository } from '../provider'

/// Lets a user change their own password: the current password must match,
/// the new one must be strong, and only the hash is ever stored.
export class ChangePassword implements UseCase<ChangePasswordInputDTO, void> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly hashGenerator: HashGenerator,
    private readonly hashComparer: HashComparer,
  ) {}

  async execute(input: ChangePasswordInputDTO): Promise<Result<void>> {
    const found = await this.userRepository.findById(input.id)
    if (found.isFailure) return Result.fail(UserError.USER_NOT_FOUND)
    const user = found.instance

    const matches = await this.hashComparer.compare(
      input.currentPassword,
      user.passwordHash,
    )
    if (!matches) return Result.fail(UserError.INVALID_CURRENT_PASSWORD)

    const newPassword = StrongPassword.tryCreate(input.newPassword)
    if (newPassword.isFailure) return newPassword.withFail

    const passwordHash = await this.hashGenerator.hash(input.newPassword)
    const updated = user.changePasswordHash(passwordHash)
    if (updated.isFailure) return updated.withFail

    const saved = await this.userRepository.update(updated.instance)
    if (saved.isFailure) return saved.withFail

    return Result.ok()
  }
}
