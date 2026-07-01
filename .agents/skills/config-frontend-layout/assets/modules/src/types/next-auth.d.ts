import 'next-auth';
import 'next-auth/jwt';

export interface Permission {
  action: string;
  subject: string;
}

export type UserAccountStatus = 'ACTIVE' | 'INACTIVE';

declare module 'next-auth' {
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      /**
       * Quando true, o usuário foi vítima de um reset administrativo e
       * precisa definir uma nova senha antes de acessar o resto da
       * aplicação. Gate aplicado em `src/proxy.ts`.
       */
      mustChangePassword?: boolean;
    };
    accessToken?: string;
    error?: string;
    permissions?: Permission[];
    modules?: string[];
    roles?: string[];
    /** Alinhado a UserDetailResponseDto.status (api-docs.json) */
    status?: UserAccountStatus;
    /** Aliases brutos de profile.permissions[].alias para checagem de menu */
    permissionAliases?: string[];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: string;
    email?: string;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    error?: string;
    permissions?: Permission[];
    modules?: string[];
    roles?: string[];
    status?: UserAccountStatus;
    permissionAliases?: string[];
    /** Flag de força-troca propagada do backend pós-reset por admin. */
    mustChangePassword?: boolean;
  }
}
