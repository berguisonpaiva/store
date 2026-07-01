import { AuthError, RefreshToken } from '../../src/auth'
import { UserRole } from '../../src/user'
import { FakeTokenService } from '../mock/fake-token-service'

describe('RefreshToken', () => {
  test('issues a new access token from a valid refresh token', async () => {
    const tokens = new FakeTokenService()
    const refreshToken = await tokens.generateRefreshToken({
      id: 'b3f1c2d4-0000-4000-8000-000000000000',
      name: 'Ana Silva',
      email: 'ana@store.com',
      role: UserRole.ADMIN,
    })
    const useCase = new RefreshToken(tokens)

    const result = await useCase.execute({ refreshToken })

    expect(result.isOk).toBe(true)
    expect(result.instance.accessToken).toBeTruthy()
  })

  test('fails with INVALID_TOKEN for an unknown refresh token', async () => {
    const useCase = new RefreshToken(new FakeTokenService())

    const result = await useCase.execute({ refreshToken: 'bogus' })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(AuthError.INVALID_TOKEN)
  })
})
