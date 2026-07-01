import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { HashGenerator } from '@repo/auth';

const SALT_ROUNDS = 10;

/// bcrypt implementation of the domain `HashGenerator` port.
@Injectable()
export class BcryptHashGenerator implements HashGenerator {
  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, SALT_ROUNDS);
  }
}
