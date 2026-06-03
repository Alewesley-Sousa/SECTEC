import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';

@Module({
  imports: [
    // Certifique-se de carregar o .env
    ConfigModule.forRoot({
      isGlobal: true, // Recomendado para que outros módulos também acessem o .env
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
