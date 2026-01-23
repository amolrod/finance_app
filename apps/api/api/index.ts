import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType, INestApplication } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';
import helmet from 'helmet';
import { AppModule } from '../src/app.module';

const expressApp = express();
let app: INestApplication;

async function bootstrap(): Promise<void> {
  if (app) {
    return;
  }

  app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
    {
      logger: ['error', 'warn', 'log'],
    },
  );

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: false,
  }));

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // API versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  await app.init();
}

// Vercel serverless handler
export default async function handler(
  req: express.Request,
  res: express.Response,
): Promise<void> {
  await bootstrap();
  expressApp(req, res);
}
