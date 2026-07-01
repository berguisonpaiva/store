import { Result, UseCase } from '@repo/shared'
import { RefreshTokenInputDTO, RefreshTokenOutputDTO } from '../dto'
import { AuthError } from '../errors'
import { TokenService } from '../provider'

/// Issues a new access token from a valid refresh token. The refresh token is
/// not rotated.
export class RefreshToken
  implements UseCase<RefreshTokenInputDTO, RefreshTokenOutputDTO>
{
  constructor(private readonly tokenService: TokenService) {}

  async execute(
    input: RefreshTokenInputDTO,
  ): Promise<Result<RefreshTokenOutputDTO>> {
    const identity = await this.tokenService.validateRefreshToken(
      input.refreshToken,
    )
    if (!identity) return Result.fail(AuthError.INVALID_TOKEN)

    const accessToken = await this.tokenService.generateAccessToken(identity)
    return Result.ok({ accessToken })
  }
}
