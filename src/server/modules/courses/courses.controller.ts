import { BadRequestException, Controller, Get, Query, ServiceUnavailableException } from "@nestjs/common";
import { CoursesService } from "./courses.service";
import { IsPublic } from "../../common/decorators/is-public.decorator";
import {
  courseQuerySchema,
  parseCoursesResponse,
} from "@codekita/shared";

/**
 * GET /api/courses
 * Returns published courses from the database. Empty array (not fabricated
 * records) when no courses exist. 503 when the persistence layer is unavailable.
 */

@Controller("courses")
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @IsPublic()
  async findAll(@Query() query: unknown) {
    const parsed = courseQuerySchema.safeParse(query);
    if (!parsed.success) throw new BadRequestException("Invalid pagination parameters");
    try {
      const result = await this.coursesService.findAll(parsed.data.page, parsed.data.limit);
      return parseCoursesResponse(result);
    } catch {
      throw new ServiceUnavailableException("Courses service unavailable");
    }
  }
}