import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { configuration } from "./config/configuration";
import { DatabaseModule } from "./database/database.module";
import { HealthModule } from "./modules/health/health.module";
import { CoursesModule } from "./modules/courses/courses.module";
import { AuthModule } from "./modules/auth/auth.module";
import { AuthGuard } from "./common/guards/auth.guard";
import { RolesGuard } from "./common/guards/roles.guard";
import { CsrfMiddleware } from "./common/middleware/csrf.middleware";
import { MiddlewareConsumer, RequestMethod } from "@nestjs/common";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: [".env", ".env.local"],
      ignoreEnvFile: process.env.NODE_ENV === "production" && !process.env.DATABASE_URL ? true : false,
    }),
    DatabaseModule,
    HealthModule,
    CoursesModule,
    AuthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CsrfMiddleware).forRoutes(
      { path: "auth/login", method: RequestMethod.POST },
      { path: "auth/register", method: RequestMethod.POST },
      { path: "auth/logout", method: RequestMethod.POST },
      { path: "*", method: RequestMethod.ALL },
    );
  }
}