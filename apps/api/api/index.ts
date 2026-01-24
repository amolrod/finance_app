import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType, INestApplication } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import helmet from 'helmet';
import { AppModule } from '../src/app.module';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const helmetMiddleware = (helmet as any).default || helmet;

const expressApp = (express as any)();
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
  app.use(helmetMiddleware({
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
  req: any,
  res: any,
): Promise<void> {
  // Handle CORS - reflect origin for credentials support
  const origin = req.headers?.origin || 'https://finance-app-web-mu.vercel.app';
  
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  await bootstrap();
  expressApp(req, res);
}
