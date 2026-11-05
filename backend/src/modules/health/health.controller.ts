import { Controller, Get } from "@nestjs/common";
import { HealthService } from "./health.service";
import { parseHealthDto } from "@codekita/shared";

/**
 * GET /api/health
 * Reports actual application status and database readiness.
 */

@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async health() {
    return parseHealthDto(await this.healthService.check());
  }
}