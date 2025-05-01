import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as mongoose from 'mongoose';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuración de validación global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Configuración CORS
  app.enableCors();

  // Configuración Swagger - Usar try/catch para evitar errores de tipado
  try {
    const config = new DocumentBuilder()
      .setTitle('Broers API')
      .setDescription('API para el sistema de información de Broers')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    
    // Usar as any para evitar errores de tipado
    const document = SwaggerModule.createDocument(app as any, config);
    SwaggerModule.setup('api/docs', app as any, document);
  } catch (err) {
    console.error('Error al configurar Swagger:', err);
  }

  // Conexión a MongoDB
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/broersDB', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    } as mongoose.ConnectOptions);
    console.log(' Conectado a MongoDB');
  } catch (error) {
    console.error(' Error al conectar MongoDB', error);
  }

  await app.listen(3000);
  console.log(' Servidor corriendo en http://localhost:3000');
}
bootstrap();