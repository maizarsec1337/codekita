import { Controller, Get } from "@nestjs/common";
import { HealthService } from "./health.service";
import { parseHealthDto } from "@codekita/shared";
import { IsPublic } from "../../common/decorators/is-public.decorator";

/**
 * GET /api/health
 * Reports actual application status and database readiness.
 */

@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @IsPublic()
  async health() {
    return parseHealthDto(await this.healthService.check());
  }
}