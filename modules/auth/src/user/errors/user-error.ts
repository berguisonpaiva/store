/// Stable domain error codes for the users context. Returned via
/// `Result.fail(<CODE>)`; the API layer maps them to HTTP responses.
export const UserError = {
  EMAIL_ALREADY_IN_USE: 'EMAIL_ALREADY_IN_USE',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  OPERATION_NOT_ALLOWED_FOR_ROLE: 'OPERATION_NOT_ALLOWED_FOR_ROLE',
  INVALID_ROLE: 'INVALID_ROLE',
  INVALID_CURRENT_PASSWORD: 'INVALID_CURRENT_PASSWORD',
} as const;

export type UserErrorCode = (typeof UserError)[keyof typeof UserError];
