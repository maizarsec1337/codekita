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
import { AcademyModule } from "./modules/academy/academy.module";

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
    AcademyModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}