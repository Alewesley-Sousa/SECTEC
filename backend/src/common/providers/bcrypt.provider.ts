// src/common/providers/bcrypt.provider.ts
import * as bcrypt from 'bcrypt';

export class BcryptProvider extends HashingProvider {
  private saltRounds = 10; // Ideal: buscar do .env

  async hash(data: string): Promise<string> {
    return bcrypt.hash(data, this.saltRounds);
  }

  async compare(data: string, hashedData: string): Promise<boolean> {
    return bcrypt.compare(data, hashedData);
  }
}