import { Email, Result, StrongPassword, UseCase } from '@repo/shared'
import { CreateUserInputDTO, UserDTO, toUserDTO } from '../dto/user.dto'
import { User } from '../model'
import { HashGenerator, UserRepository } from '../provider'
import {
  RoleAuthorizationPolicy,
  UniqueEmailSpecification,
} from '../service'

/// Creates a staff user. Authorization, password strength, and email
/// uniqueness are all enforced in the domain before persisting.
export class CreateUser implements UseCase<CreateUserInputDTO, UserDTO> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly hashGenerator: HashGenerator,
  ) {}

  async execute(input: CreateUserInputDTO): Promise<Result<UserDTO>> {
    const authorized = RoleAuthorizationPolicy.ensureCanManageUsers(
      input.actorRole,
    )
    if (authorized.isFailure) return authorized.withFail

    const password = StrongPassword.tryCreate(input.password)
    if (password.isFailure) return password.withFail

    const email = Email.tryCreate(input.email)
    if (email.isFailure) return email.withFail

    const existing = await this.userRepository.findByEmail(email.instance.value)
    if (existing.isFailure) return existing.withFail

    const unique = UniqueEmailSpecification.ensureUnique(existing.instance)
    if (unique.isFailure) return unique.withFail

    const passwordHash = await this.hashGenerator.hash(input.password)

    const user = User.tryCreate({
      name: input.name,
      email: email.instance.value,
      passwordHash,
      role: input.role,
      active: input.active ?? true,
    })
    if (user.isFailure) return user.withFail

    const saved = await this.userRepository.create(user.instance)
    if (saved.isFailure) return saved.withFail

    return Result.ok(toUserDTO(user.instance))
  }
}
