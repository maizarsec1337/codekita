import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { pathInputSchema, type CategoryInput, type ProfileInput, type SessionPayload, type UserUpdate } from "@codekita/shared";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class ManagementService {
  constructor(private readonly prisma: PrismaService) {}
  categories(admin = false) {
    return this.prisma.category.findMany({ where: admin ? {} : { isActive: true }, orderBy: { name: "asc" } });
  }
  async writeCategory(input: CategoryInput, id?: string) {
    if (id && !await this.prisma.category.findUnique({ where: { id } })) throw new NotFoundException("Category not found");
    try {
      return id ? await this.prisma.category.update({ where: { id }, data: input }) : await this.prisma.category.create({ data: input });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new ConflictException("Category slug already exists");
      throw error;
    }
  }
  async archiveCategory(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException("Category not found");
    return this.writeCategory({ name: category.name, slug: category.slug, description: category.description, isActive: false }, id);
  }
  async profile(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { profile: true } });
    if (!user) throw new NotFoundException("User not found");
    return { userId, email: user.email, firstName: user.firstName ?? "", lastName: user.lastName ?? "", displayName: user.profile?.displayName ?? "", bio: user.profile?.bio ?? "" };
  }
  async saveProfile(userId: string, input: ProfileInput) {
    const { firstName, lastName, ...profile } = input;
    await this.prisma.user.update({ where: { id: userId }, data: { firstName, lastName, profile: { upsert: { create: profile, update: profile } } } });
    return this.profile(userId);
  }
  async users(page: number) {
    const where = {};
    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({ where, skip: (page - 1) * 25, take: 25, orderBy: [{ createdAt: "desc" }, { id: "asc" }], select: { id: true, email: true, firstName: true, lastName: true, isActive: true, roles: { select: { role: { select: { name: true } } } } } }),
      this.prisma.user.count({ where }),
    ]);
    return { users: users.map(user => ({ ...user, roles: user.roles.map(item => item.role.name) })), total, page };
  }
  async updateUser(actor: SessionPayload, id: string, input: UserUpdate) {
    if (actor.userId === id) throw new BadRequestException("Self role changes and self deactivation are not allowed");
    return this.prisma.$transaction(async db => {
      const user = await db.user.findUnique({ where: { id }, include: { roles: { include: { role: true } } } });
      if (!user) throw new NotFoundException("User not found");
      if (user.roles.some(item => item.role.name === "SUPER_ADMIN")) throw new ForbiddenException("Super administrator accounts require operator provisioning");
      if (!actor.roles.includes("SUPER_ADMIN") && (input.roles.includes("ADMIN") || user.roles.some(item => item.role.name === "ADMIN"))) throw new ForbiddenException("Only a super administrator may manage administrators");
      const roles = await db.role.findMany({ where: { name: { in: input.roles } } });
      if (roles.length !== new Set(input.roles).size) throw new ConflictException("Required roles have not been provisioned");
      await db.user.update({ where: { id }, data: { isActive: input.isActive } });
      await db.userRole.deleteMany({ where: { userId: id } });
      await db.userRole.createMany({ data: roles.map(role => ({ userId: id, roleId: role.id })) });
      await db.session.deleteMany({ where: { userId: id } });
      return { id, isActive: input.isActive, roles: input.roles };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }
  async statistics() {
    const [users, courses, enrollments, certificates, quizAttempts] = await this.prisma.$transaction([
      this.prisma.user.count(), this.prisma.course.count(), this.prisma.enrollment.count(), this.prisma.certificate.count(), this.prisma.quizResult.count(),
    ]);
    return { users, courses, enrollments, certificates, quizAttempts };
  }
  async templates() {
    return (await this.prisma.curriculumTemplate.findMany({ orderBy: { slug: "asc" } })).map(item => pathInputSchema.parse(item.content));
  }
  async labs() {
    return { execution: { available: false, reason: "An isolated runner is not configured." }, labs: await this.prisma.lab.findMany({ where: { isPublished: true }, orderBy: { title: "asc" } }) };
  }
  async labDraft(userId: string, labId: string) {
    if (!await this.prisma.lab.findFirst({ where: { id: labId, isPublished: true } })) throw new NotFoundException("Lab not found");
    return this.prisma.labDraft.findUnique({ where: { userId_labId: { userId, labId } } });
  }
  async saveLabDraft(userId: string, labId: string, input: { code: string; language: string }) {
    await this.labDraft(userId, labId);
    return this.prisma.labDraft.upsert({ where: { userId_labId: { userId, labId } }, create: { userId, labId, ...input }, update: input });
  }
}