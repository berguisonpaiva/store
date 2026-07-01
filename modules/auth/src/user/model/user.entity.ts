import {
  Email,
  Entity,
  EntityProps,
  HashPassword,
  PersonName,
  Result,
} from '@repo/shared'
import { UserError } from '../errors'
import { UserRole, isUserRole } from './user-role'

export interface UserProps extends EntityProps {
  name: string
  email: string
  passwordHash: string
  role: UserRole
  active: boolean
}

/// Staff user aggregate. Holds the password only as a hash (never plain text);
/// all field validation lives in the value objects + `tryCreate`.
export class User extends Entity<User, UserProps> {
  private constructor(props: UserProps) {
    super(props)
  }

  get name(): string {
    return this.props.name
  }

  get email(): string {
    return this.props.email
  }

  get passwordHash(): string {
    return this.props.passwordHash
  }

  get role(): UserRole {
    return this.props.role
  }

  get active(): boolean {
    return this.props.active
  }

  static create(props: UserProps): User {
    const result = User.tryCreate(props)
    result.validator.throwsIfFailed()
    return result.instance
  }

  static tryCreate(props: UserProps): Result<User> {
    const name = PersonName.tryCreate(props.name)
    const email = Email.tryCreate(props.email)
    const passwordHash = HashPassword.tryCreate(props.passwordHash)

    const validated = Result.combine([name, email, passwordHash])
    if (validated.isFailure) {
      return validated.withFail
    }

    if (!isUserRole(props.role)) {
      return Result.fail(UserError.INVALID_ROLE)
    }

    const [validName, validEmail, validHash] = validated.instance

    return Result.ok(
      new User({
        ...props,
        name: validName.value,
        email: validEmail.value,
        passwordHash: validHash.value,
        role: props.role,
        active: props.active ?? true,
      }),
    )
  }

  /// Activates the user.
  activate(): Result<User> {
    return this.cloneWith({ active: true })
  }

  /// Deactivates the user. The cannot-deactivate-self rule is enforced by the
  /// use case, not here.
  deactivate(): Result<User> {
    return this.cloneWith({ active: false })
  }

  /// Changes the staff role.
  changeRole(role: UserRole): Result<User> {
    return this.cloneWith({ role })
  }

  /// Replaces the stored password hash (re-validated by `tryCreate`).
  changePasswordHash(passwordHash: string): Result<User> {
    return this.cloneWith({ passwordHash })
  }

  /// Edits profile fields (name/email/role); each is re-validated.
  edit(input: {
    name?: string
    email?: string
    role?: UserRole
  }): Result<User> {
    return this.cloneWith({
      name: input.name ?? this.props.name,
      email: input.email ?? this.props.email,
      role: input.role ?? this.props.role,
    })
  }
}
