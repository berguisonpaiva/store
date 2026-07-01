import { Email, Result, UseCase } from '@repo/shared'
import { HashComparer, UserReader } from '../../user'
import { LoginInputDTO, LoginOutputDTO } from '../dto'
import { AuthError } from '../errors'
import { CredentialsPolicy } from '../service'
import { TokenService } from '../provider'

/// Authenticates staff by email + password and issues an access + refresh
/// token pair. Unknown email and wrong password return the same generic error.
export class Login implements UseCase<LoginInputDTO, LoginOutputDTO> {
  constructor(
    private readonly userReader: UserReader,
    private readonly hashComparer: HashComparer,
    private readonly tokenService: TokenService,
  ) {}

  async execute(input: LoginInputDTO): Promise<Result<LoginOutputDTO>> {
    const email = Email.tryCreate(input.email)
    // An invalid email format simply cannot match any user → generic error.
    if (email.isFailure) return Result.fail(AuthError.INVALID_CREDENTIALS)

    const found = await this.userReader.findByEmail(email.instance.value)
    if (found.isFailure) return found.withFail
    const user = found.instance

    const passwordMatches = user
      ? await this.hashComparer.compare(input.password, user.passwordHash)
      : false

    const decision = CredentialsPolicy.evaluate(user, passwordMatches)
    if (decision.isFailure) return decision.withFail

    const identity = {
      id: user!.id,
      name: user!.name,
      email: user!.email,
      role: user!.role,
    }
    const accessToken = await this.tokenService.generateAccessToken(identity)
    const refreshToken = await this.tokenService.generateRefreshToken(identity)

    return Result.ok({ accessToken, refreshToken })
  }
}
