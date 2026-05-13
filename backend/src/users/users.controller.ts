import {
  Controller,
  Get,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseInterceptors,
  FileValidator,
  UseGuards,
  Patch,
  Param,
  ParseIntPipe
} from '@nestjs/common';
import { UsersService } from './users.service';
import { FileInterceptor } from '@nestjs/platform-express';
// Adicionei ApiProperty e ApiResponse
import { ApiBody, ApiConsumes, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { UserRole } from './entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class CsvFileValidator extends FileValidator {
  constructor() {
    super({});
  }

  isValid(file: Express.Multer.File): boolean {
    return /\.(csv)$/i.test(file.originalname);
  }

  buildErrorMessage(): string {
    return 'O arquivo deve ser um CSV válido (extensão .csv).';
  }
}
// @UseGuards(JwtAuthGuard)
@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get('alunos')
  @ApiOperation({ summary: 'Listar todos os alunos ativos' })
  getAlunos() {
    return this.usersService.findAllAlunos();
  }

  @Get('orientadores')
  @ApiOperation({ summary: 'Listar todos os orientadores ativos' })
  getOrientadores() {
    return this.usersService.findAllOrientadores();
  }

  // --- ROTA DE ALUNOS ---
  @Post('upload-csv/alunos')
  @ApiOperation({ summary: 'Upload de CSV exclusivo para ALUNOS' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Arquivo CSV contendo os dados dos alunos',
    schema: {
      type: 'object',
      properties: {
        file: { // Este nome deve ser igual ao do FileInterceptor
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Usuários importados com sucesso.' })
  @ApiResponse({ status: 400, description: 'Arquivo inválido ou e-mail duplicado.' })
  @UseInterceptors(FileInterceptor('file'))
  uploadCsvAlunos(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }),
          new CsvFileValidator(),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.usersService.processarCsv(file, UserRole.ALUNO);
  }

  // --- ROTA DE PROFESSORES ---
  @Post('upload-csv/professores')
  @ApiOperation({ summary: 'Upload de CSV exclusivo para PROFESSORES/ORIENTADORES' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Arquivo CSV contendo os dados dos professores',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Usuários importados com sucesso.' })
  @ApiResponse({ status: 400, description: 'Arquivo inválido ou e-mail duplicado.' })
  @UseInterceptors(FileInterceptor('file'))
  uploadCsvProfessores(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }),
          new CsvFileValidator(),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.usersService.processarCsv(file, UserRole.ORIENTADOR);
  }
  
    @Patch(':id/promote-comissao')
  async promote(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.promoteToComissao(id);
  }
}
