// src/common/providers/hashing.provider.ts
export abstract class HashingProvider {
  abstract hash(data: string | Buffer): Promise<string>;
  abstract compare(data: string | Buffer, hashedData: string): Promise<boolean>;
}