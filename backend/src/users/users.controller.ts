import { 
  Controller, 
  FileTypeValidator, 
  Get, 
  MaxFileSizeValidator, 
  ParseFilePipe, 
  Post, 
  UploadedFile, 
  UseGuards, 
  UseInterceptors 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { 
  ApiBearerAuth, 
  ApiBody, 
  ApiConsumes, 
  ApiOperation, 
  ApiTags 
} from '@nestjs/swagger'; // 👈 Importações do Swagger
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';

@ApiTags('users') // Agrupa os endpoints no Swagger
@ApiBearerAuth()  // Indica que o endpoint requer o Token JWT para testar
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post('upload-csv')
  @ApiOperation({ summary: 'Realiza o cadastro em lote via arquivo CSV' })
  @ApiConsumes('multipart/form-data') // 👈 Essencial para aparecer o campo de upload
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { // 👈 Deve ser o mesmo nome usado no FileInterceptor
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadCsv(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 2 }),
          new FileTypeValidator({ fileType: 'text/csv' }),
        ],
      }),
    ) file: Express.Multer.File,
  ) {
    // --- PARTE DO BANCO DE DADOS ---
    // O service irá ler o buffer, transformar em objetos e salvar no TypeORM
    return this.usersService.processCsv(file.buffer);
  }

  @Get('alunos')
  getAlunos() {
    return this.usersService.findAllAlunos();
  }

  @Get('orientadores')
  getOrientadores() {
    return this.usersService.findAllOrientadores();
  }
}