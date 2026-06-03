// src/common/common.module.ts
import { Global, Module } from '@nestjs/common';
import { HashingProvider } from './providers/hashing.provider';
import { BcryptProvider } from './providers/bcrypt.provider';

@Global() // Torna disponível em toda a aplicação
@Module({
  providers: [
    {
      provide: HashingProvider,
      useClass: BcryptProvider, // Injeta a implementação concreta
    },
  ],
  exports: [HashingProvider],
})
export class CommonModule {}