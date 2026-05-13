import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { MateriaisService } from './materiais.service';
import { RevisarMaterialDto } from './dto/revisar-material.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, UserRole } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('materiais')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ORIENTADOR)
export class MateriaisController {
  constructor(private readonly materiaisService: MateriaisService) {}

  @Get('projeto/:projetoId')
  findByProjeto(
    @Param('projetoId', ParseIntPipe) projetoId: number,
    @GetUser('userId') userId: number,
  ) {
    return this.materiaisService.findByProjeto(projetoId, userId);
  }

  @Patch(':id/revisar')
  revisar(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('userId') userId: number,
    @Body() dto: RevisarMaterialDto,
  ) {
    return this.materiaisService.revisar(id, userId, dto);
  }
}
