import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { UsersSeed } from './users/users.seed';
import { UsersModule } from './users/users.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');

  // Serve arquivos estáticos
  app.useStaticAssets(join(process.cwd(), 'frontend', 'dist'));

  const seedService = app.select(UsersModule).get(UsersSeed);
  await seedService.run();

  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('API SECTEC')
    .setDescription('Sistema de Gerenciamento de Projetos - SECTEC')
    .setVersion('1.0')
    .addTag('projetos')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', name: 'JWT', description: 'Insira o seu token JWT aqui', in: 'header' },
      'token-jwt',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // Fallback para o React Router — qualquer rota não-API serve o index.html
  const distPath = join(process.cwd(), 'frontend', 'dist', 'index.html');
  app.use((req: any, res: any, next: any) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/docs')) {
      res.sendFile(distPath);
    } else {
      next();
    }
  });

  await app.listen(process.env.PORT ?? 3000);

  console.log(`🚀 API rodando em: http://localhost:3000/api`);
  console.log(`📑 Swagger rodando em: http://localhost:3000/docs`);
}

bootstrap();