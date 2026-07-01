export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  /** Staff role, when available (e.g. decoded from the access token). */
  role?: string;
}
