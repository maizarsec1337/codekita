import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { buildCoursesResponse } from "@codekita/shared";

/**
 * Course catalog service. Reads from the persistence layer — no hardcoded
 * course records are ever returned.
 */

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [courses, total] = await this.prisma.$transaction([
      this.prisma.course.findMany({
        where: { isPublished: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          coverImage: true,
          isPublished: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.course.count({ where: { isPublished: true } }),
    ]);

    return buildCoursesResponse({ data: courses, page, limit, total });
  }
}