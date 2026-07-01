/// Port that compares a plain-text password against a stored hash. Implemented
/// in infrastructure; used by the auth module for login.
export interface HashComparer {
  compare(plain: string, hash: string): Promise<boolean>
}
