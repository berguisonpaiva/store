import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { HashComparer } from '@repo/auth';

// A valid bcrypt hash used for a constant-cost dummy comparison so that a
// missing/empty hash does not short-circuit and leak timing information.
const DUMMY_HASH = `$2b$10$${'a'.repeat(53)}`;

/// bcrypt implementation of the domain `HashComparer` port.
@Injectable()
export class BcryptHashComparer implements HashComparer {
  async compare(plain: string, hash: string): Promise<boolean> {
    if (!hash) {
      await bcrypt.compare(plain, DUMMY_HASH);
      return false;
    }
    return bcrypt.compare(plain, hash);
  }
}
