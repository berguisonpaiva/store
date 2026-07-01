import { AuthenticatedUser, Result, UseCase } from '@repo/shared'
import { ValidateTokenInputDTO } from '../dto'
import { AuthError } from '../errors'
import { TokenService } from '../provider'

/// Validates an access token and returns the authenticated identity (consumed
/// by the presentation guard). Read-side use case.
export class ValidateToken
  implements UseCase<ValidateTokenInputDTO, AuthenticatedUser>
{
  constructor(private readonly tokenService: TokenService) {}

  async execute(
    input: ValidateTokenInputDTO,
  ): Promise<Result<AuthenticatedUser>> {
    const user = await this.tokenService.validateAccessToken(input.accessToken)
    if (!user) return Result.fail(AuthError.INVALID_TOKEN)
    return Result.ok(user)
  }
}
