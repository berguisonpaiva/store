export type LoginInputDTO = {
  email: string
  password: string
}

export type LoginOutputDTO = {
  accessToken: string
  refreshToken: string
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
