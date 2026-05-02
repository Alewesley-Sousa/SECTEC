import * as bcrypt from 'bcrypt';
import { HashingProvider } from './hashing.provider'; // 👈 import que estava faltando

export class BcryptProvider extends HashingProvider {
  private saltRounds = 10;

  async hash(data: string): Promise<string> {
    return bcrypt.hash(data, this.saltRounds);
  }

  async compare(data: string, hashedData: string): Promise<boolean> {
    return bcrypt.compare(data, hashedData);
  }
}