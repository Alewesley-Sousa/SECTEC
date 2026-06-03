// src/materiais/materiais.controller.ts
import { 
  Controller, 
  Post, 
  Delete,
  Param,
  Patch,
  ParseIntPipe,
  UseInterceptors, 
  UploadedFile, 
  Body,
  Get,
  UseGuards,
  Req
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { 
  ApiConsumes, 
  ApiBody, 
  ApiTags, 
  ApiOperation, 
  ApiBearerAuth,
  ApiParam 
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { mkdirSync } from 'fs';
import { extname, join } from 'path';

import { MateriaisService } from './materiais.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, UserRole } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { AvaliarMaterialDto } from './dto/avaliar-material.dto';

@ApiTags('Materiais do Projeto')
@Controller('materiais')
@ApiBearerAuth('token-jwt')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ORIENTADOR) // Padrão da classe para fins administrativos
export class MateriaisController {
  constructor(private readonly materiaisService: MateriaisService) {}

  @Post()
  @Roles(UserRole.ALUNO) // Sobrescreve para permitir que o aluno envie a entrega
  @ApiOperation({ summary: 'Cria a entrega de um material para o projeto' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateMaterialDto })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadDir = join(process.cwd(), 'tmp');
          mkdirSync(uploadDir, { recursive: true });
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async criarMaterial(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreateMaterialDto,
    @GetUser('userId') userId: number,
  ) {
    return await this.materiaisService.criarMaterial(file, body, userId);
  }

  @Delete(':id/cancelar')
  @Roles(UserRole.ALUNO)
  @ApiOperation({ summary: 'Cancela o envio de um material em análise dentro da janela de 1 dia' })
  @ApiParam({ name: 'id', description: 'ID numérico do material a ser cancelado', type: Number })
  async cancelarMaterial(
    @Param('id', ParseIntPipe) materialId: number,
    @GetUser('userId') userId: number, // 👈 CORREÇÃO: Captura a chave correta do JWT
  ) {
    return await this.materiaisService.cancelarMaterial(materialId, userId);
  }

  
  
  
  @Patch(':id/avaliar')
  @ApiOperation({ summary: 'Aprova ou recusa o material postado por um aluno' })
  @ApiParam({ name: 'id', description: 'ID numérico do material a ser avaliado', type: Number })
  @ApiBody({
    schema: {
      oneOf: [
        {
          type: 'object',
          required: ['decisao'],
          properties: {
            decisao: { type: 'string', example: 'APROVAR' },
          },
        },
        {
          type: 'object',
          required: ['decisao', 'opiniao'],
          properties: {
            decisao: { type: 'string', example: 'RECUSAR' },
            opiniao: { type: 'string', example: 'Explique o ajuste necessário para o aluno.' },
          },
        },
      ],
    },
  })
  async avaliarMaterial(
    @Param('id', ParseIntPipe) materialId: number,
    @Body() body: AvaliarMaterialDto,
  ) {
    return await this.materiaisService.avaliarMaterial(materialId, body);
  }
    
    
    
  @Get('pendentes-orientador')
  @Roles(UserRole.ORIENTADOR) // Garante que apenas professores acessem
  @ApiOperation({ summary: 'Lista os materiais em análise dos projetos orientados pelo professor' })
  async listarPendentes(@GetUser('userId') orientadorId: number) {
    return await this.materiaisService.listarMateriaisPendentesPorOrientador(orientadorId);
  }

  @Get('projetos-orientados')
  @Roles(UserRole.ORIENTADOR)
  @ApiOperation({ summary: 'Lista os materiais dos projetos que o orientador já orienta' })
  async findMateriaisPorOrientador(@GetUser('userId') orientadorId: number) {
    return await this.materiaisService.findMateriaisPorOrientador(orientadorId);
  }
  @Get('projeto/:projetoId')
@Roles(UserRole.ALUNO)
@ApiOperation({ summary: 'Lista os materiais de um projeto específico' })
async listarPorProjeto(@Param('projetoId', ParseIntPipe) projetoId: number) {
  return this.materiaisService.listarPorProjeto(projetoId);
}
}
