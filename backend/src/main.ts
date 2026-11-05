import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { ConfigService } from "@nestjs/config";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { PinoLogger } from "./common/logger/pino.logger";
import { AppModule } from "./app.module";
import fastifyHelmet from "@fastify/helmet";
import fastifyRateLimit from "@fastify/rate-limit";
import fastifyStatic from "@fastify/static";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Env } from "@codekita/shared";

async function bootstrap() {
  const logger = new PinoLogger();

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
    bufferLogs: true,
    logger,
  });
  app.useLogger(logger);

  const configService = app.get(ConfigService);
  const port = configService.get<number>("PORT", 3000);
  const corsOrigin = configService.get<string>("CORS_ORIGIN", "http://localhost:5173");
  const nodeEnv = configService.get<Env["NODE_ENV"]>("NODE_ENV", "development");

  const fastify = app.getHttpAdapter().getInstance();

  // Security headers (Fastify Helmet)
  await fastify.register(fastifyHelmet as any, {
    contentSecurityPolicy: false,
    hidePoweredBy: true,
    hsts: nodeEnv === "production" ? { maxAge: 31536000, includeSubDomains: true } : false,
  });

  // Rate limiting (applied to all routes)
  await fastify.register(fastifyRateLimit as any, {
    max: nodeEnv === "production" ? 100 : 1000,
    timeWindow: 60000,
  });

  // CORS — credentials enabled for session cookies from the frontend origin
  app.enableCors({ origin: corsOrigin, credentials: true });

  // Global infrastructure
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter(logger));
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.setGlobalPrefix("api");

  // OpenAPI documentation (development only)
  if (configService.get<boolean>("ENABLE_SWAGGER", true)) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle("CodeKita API")
        .setDescription("CodeKita educational platform API")
        .setVersion("0.1.0")
        .build(),
    );
    SwaggerModule.setup("docs", app, document);
  }

  // Production: serve frontend static assets + SPA fallback.
  // /api/* is owned by NestJS controllers; unknown API paths return JSON 404.
  if (nodeEnv === "production") {
    const publicDir = join(process.cwd(), "dist", "public");
    if (existsSync(publicDir)) {
      await fastify.register(fastifyStatic as any, { root: publicDir });

      fastify.setNotFoundHandler((request: any, reply: any) => {
        if (request.method === "GET" && !request.url.startsWith("/api")) {
          return reply.sendFile("index.html", publicDir);
        }
        return reply.code(404).send({
          statusCode: 404,
          error: "NotFound",
          message: "API route not found",
          timestamp: new Date().toISOString(),
          path: request.url,
        });
      });
    }
  }

  await app.init();
  await app.listen(port, "0.0.0.0");

  logger.log(`CodeKita backend listening on :${port} (${nodeEnv})`);

  const signals = ["SIGTERM", "SIGINT"];
  for (const signal of signals) {
    process.on(signal, async () => {
      logger.log(`Received ${signal}, shutting down gracefully`);
      await app.close();
      process.exit(0);
    });
  }
}

const logger = new PinoLogger();
bootstrap().catch((error: unknown) => {
  logger.error(error instanceof Error ? error : String(error), "bootstrap failed");
  process.exit(1);
});