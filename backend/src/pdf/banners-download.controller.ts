import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';  // 👈 use 'import type' aqui
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, UserRole } from '../auth/decorators/roles.decorator';
import { BannersDownloadService } from './banners-download.service';

@ApiTags('Banners Download')
@ApiBearerAuth('token-jwt')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.COORDENACAO)
@Controller('coordenador/banners')
export class BannersDownloadController {
  constructor(private readonly service: BannersDownloadService) {}

  @Get('validar')
  @ApiOperation({ summary: 'Verifica projetos com/sem banner aprovado' })
  @ApiQuery({ name: 'curso', required: false })
  @ApiQuery({ name: 'serie', required: false })
  async validar(
    @Query('curso') curso?: string,
    @Query('serie') serie?: string,
  ) {
    return this.service.validar(curso, serie);
  }

  @Get('download')
  @ApiOperation({ summary: 'Download dos banners em ZIP' })
  @ApiQuery({ name: 'curso', required: false })
  @ApiQuery({ name: 'serie', required: false })
  async download(
    @Res() res: Response,
    @Query('curso') curso?: string,
    @Query('serie') serie?: string,
  ) {
    await this.service.gerarZip(res, curso, serie);
  }
}