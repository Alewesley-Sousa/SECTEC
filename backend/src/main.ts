import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Permite que o frontend acesse a API
  app.enableCors();

  // --- CONFIGURAÇÃO DO SWAGGER ---
  const config = new DocumentBuilder()
    .setTitle('API SECTEC')
    .setDescription('Sistema de Gerenciamento de Projetos - SECTEC')
    .setVersion('1.0')
    .addTag('projetos') // Organiza as rotas por tag
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); 
  // O link será: http://localhost:3000/api
  // -------------------------------

  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 Servidor rodando em: http://localhost:3000/api`);
}
bootstrap();