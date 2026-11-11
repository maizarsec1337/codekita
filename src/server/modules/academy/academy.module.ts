import { Module } from "@nestjs/common";
import { AcademyController } from "./academy.controller";
import { AcademyService } from "./academy.service";
import { ManagementController } from "./management.controller";
import { ManagementService } from "./management.service";
@Module({ controllers: [AcademyController, ManagementController], providers: [AcademyService, ManagementService] })
export class AcademyModule {}