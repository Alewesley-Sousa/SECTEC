import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Area } from './entities/area.entity';
import { AreasController } from './areas.controller';
import { AreasService } from './areas.service';

@Module({ imports: [TypeOrmModule.forFeature([Area])], controllers: [AreasController], providers: [AreasService], exports: [AreasService] })
export class AreasModule {}
