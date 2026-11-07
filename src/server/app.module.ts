import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { validateEnvironment } from "./config/configuration";
import { DatabaseModule } from "./database/database.module";
import { HealthModule } from "./modules/health/health.module";
import { CoursesModule } from "./modules/courses/courses.module";
import { AuthModule } from "./modules/auth/auth.module";
import { AuthGuard } from "./common/guards/auth.guard";
import { RolesGuard } from "./common/guards/roles.guard";
import { AcademyModule } from "./modules/academy/academy.module";
import { projectRoot } from "./config/project-root";
import { join } from "node:path";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Validate before constructing Prisma or other providers.
      validate: validateEnvironment,
      envFilePath: [join(projectRoot, ".env.local"), join(projectRoot, ".env")],
    }),
    DatabaseModule,
    HealthModule,
    CoursesModule,
    AuthModule,
    AcademyModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}