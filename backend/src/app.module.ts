import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DevelopersModule } from './developers/developers.module';

@Module({
  imports: [DevelopersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
