/// Stable domain error codes for the authentication context.
export const AuthError = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  INVALID_TOKEN: 'INVALID_TOKEN',
  USER_INACTIVE: 'USER_INACTIVE',
} as const;

export type AuthErrorCode = (typeof AuthError)[keyof typeof AuthError];
