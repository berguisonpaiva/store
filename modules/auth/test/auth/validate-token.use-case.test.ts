import { AuthError, ValidateToken } from '../../src/auth'
import { UserRole } from '../../src/user'
import { FakeTokenService } from '../mock/fake-token-service'

describe('ValidateToken', () => {
  test('returns the identity for a valid access token', async () => {
    const tokens = new FakeTokenService()
    const accessToken = await tokens.generateAccessToken({
      id: 'b3f1c2d4-0000-4000-8000-000000000000',
      name: 'Ana Silva',
      email: 'ana@store.com',
      role: UserRole.ADMIN,
    })
    const useCase = new ValidateToken(tokens)

    const result = await useCase.execute({ accessToken })

    expect(result.isOk).toBe(true)
    expect(result.instance.email).toBe('ana@store.com')
  })

  test('fails with INVALID_TOKEN for an invalid access token', async () => {
    const useCase = new ValidateToken(new FakeTokenService())

    const result = await useCase.execute({ accessToken: 'bogus' })

    expect(result.isFailure).toBe(true)
    expect(result.errors).toContain(AuthError.INVALID_TOKEN)
  })
})
