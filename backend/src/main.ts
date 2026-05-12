import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { UsersSeed } from './users/users.seed';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 1. Defina um prefixo global para todas as rotas da API (ex: /api)
  app.setGlobalPrefix('api'); 

  const seedService = app.get(UsersSeed);
  await seedService.run();
  app.enableCors();

  // 2. CONFIGURAÇÃO DO SWAGGER
  const config = new DocumentBuilder()
    .setTitle('API SECTEC')
    .setDescription('Sistema de Gerenciamento de Projetos - SECTEC')
    .setVersion('1.0')
    .addTag('projetos')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  
  // 3. Mude o endpoint do Swagger para /docs ou algo diferente de /api
  // Se o Swagger ficar em /api, ele "atropela" as rotas reais da sua API
  SwaggerModule.setup('docs', app, document); 

  await app.listen(process.env.PORT ?? 3000);
  
  // Agora você terá:
  // API em: http://localhost:3000/api/...
  // Swagger em: http://localhost:3000/docs
  console.log(`🚀 API rodando em: http://localhost:3000/api`);
  console.log(`📑 Swagger rodando em: http://localhost:3000/docs`);
}

bootstrap();