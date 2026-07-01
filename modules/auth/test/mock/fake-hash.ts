import { HashComparer, HashGenerator } from '../../src/user'

/// A constant hash in valid bcrypt shape so `HashPassword.tryCreate` accepts it.
export const FAKE_HASH = `$2b$10$${'a'.repeat(53)}`

export class FakeHashGenerator implements HashGenerator {
  async hash(_plain: string): Promise<string> {
    return FAKE_HASH
  }
}

/// Comparer that matches when the plain text equals [correctPlain]. When
/// [correctPlain] is omitted, every comparison succeeds.
export class FakeHashComparer implements HashComparer {
  constructor(private readonly correctPlain?: string) {}

  async compare(plain: string, _hash: string): Promise<boolean> {
    return this.correctPlain === undefined ? true : plain === this.correctPlain
  }
}
