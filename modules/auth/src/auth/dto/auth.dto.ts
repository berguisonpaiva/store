import { UserRole } from '../../user'

export type LoginInputDTO = {
  email: string
  password: string
}

/// Authenticated user identity returned alongside the tokens on login.
export type AuthUserDTO = {
  id: string
  name: string
  role: UserRole
}

export type LoginOutputDTO = {
  accessToken: string
  refreshToken: string
  user: AuthUserDTO
}

export type RefreshTokenInputDTO = {
  refreshToken: string
}

export type RefreshTokenOutputDTO = {
  accessToken: string
}

export type ValidateTokenInputDTO = {
  accessToken: string
}
