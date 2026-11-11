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
import { cookies, validCsrf } from "./common/security";
import { projectRoot } from "./config/project-root";
import { configuration } from "./config/configuration";

// Use the plugin's Fastify types consistently: pnpm can install a different
// Fastify minor alongside Nest's adapter than the direct application dependency.
type PluginFastifyInstance = Parameters<typeof fastifyStatic>[0];
type FrontendHandler = Parameters<PluginFastifyInstance["setNotFoundHandler"]>[1];

async function bootstrap() {
  const logger = new PinoLogger();

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter({ trustProxy: configuration().TRUST_PROXY || false }), {
    bufferLogs: true,
    logger,
  });
  app.useLogger(logger);

  const configService = app.get(ConfigService);
  const port = configService.get<number>("PORT", 3000);
  const corsOrigin = configService.get<string>("CORS_ORIGIN", "http://localhost:5173");
  const nodeEnv = configService.get<Env["NODE_ENV"]>("NODE_ENV", "development");

  // Nest's adapter and the plugins resolve different Fastify 5 type copies.
  // Normalize that type-only boundary; the runtime instance is unchanged.
  const fastify = app.getHttpAdapter().getInstance() as unknown as PluginFastifyInstance;
  fastify.addHook("onRequest", async (request, reply) => {
    if (request.url.startsWith("/api/")) reply.header("Cache-Control", "no-store");
    if (!["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) return;
    const origin = request.headers.origin;
    const token = cookies(request.headers.cookie).csrf_token;
    if ((origin && origin !== corsOrigin) || !validCsrf(token, request.headers["x-csrf-token"], configService.getOrThrow<string>("SESSION_SECRET"))) {
      return reply.code(403).send({ statusCode: 403, message: "CSRF validation failed. Refresh and try again.", error: "Forbidden", timestamp: new Date().toISOString() });
    }
  });

  // Security headers (Fastify Helmet)
  await fastify.register(fastifyHelmet, {
    contentSecurityPolicy: false,
    hidePoweredBy: true,
    hsts: nodeEnv === "production" ? { maxAge: 31536000, includeSubDomains: true } : false,
  });

  // Limit API requests without counting static assets and client-side routes.
  await fastify.register(fastifyRateLimit, {
    max: nodeEnv === "production" ? 100 : 1000,
    timeWindow: 60000,
    allowList: (request: { url: string }) => !request.url.split("?")[0].startsWith("/api/"),
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
    const publicDir = join(projectRoot, "dist");
    if (existsSync(publicDir)) {
      await fastify.register(fastifyStatic, { root: publicDir, serve: false });

      const frontendFallback: FrontendHandler = (request, reply) => {
        const pathname = request.url.split("?")[0];
        const read = request.method === "GET" || request.method === "HEAD";
        if (read && (pathname.startsWith("/assets/") || /^\/status\/(403|404|500|503)\.html$/.test(pathname) || pathname === "/favicon.jpg")) {
          return reply.sendFile(pathname.slice(1), publicDir);
        }
        if (read && /text\/html/i.test(request.headers.accept ?? "") && !/^\/(?:api|assets|status|runtime)(?:\/|$)/i.test(pathname) && !pathname.includes(".") && !pathname.startsWith("/src/")) {
          return reply.sendFile("index.html", publicDir);
        }
        return reply.code(404).send({
          statusCode: 404,
          error: "NotFound",
          message: "API route not found",
          timestamp: new Date().toISOString(),
          path: request.url,
        });
      };
      fastify.get("/", frontendFallback);
      fastify.get("/*", frontendFallback);
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