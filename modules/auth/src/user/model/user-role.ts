/// Staff roles. ADMIN manages users; OPERADOR sells and operates the cash register.
export enum UserRole {
  ADMIN = 'ADMIN',
  OPERADOR = 'OPERADOR',
}

export function isUserRole(value: unknown): value is UserRole {
  return (
    typeof value === 'string' &&
    (Object.values(UserRole) as string[]).includes(value)
  );
}
