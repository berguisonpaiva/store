/// Port that compares a plain-text password against a stored hash. Implemented
/// in infrastructure; reused by `change-password` and by the auth module.
export interface HashComparer {
  compare(plain: string, hash: string): Promise<boolean>
}
