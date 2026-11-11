import { BadRequestException, Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Req, ServiceUnavailableException } from "@nestjs/common";
import { z } from "zod";
import { pathInputSchema, type SessionPayload } from "@codekita/shared";
import { ManagementService } from "./management.service";
import { Permissions } from "../../common/guards/permissions.guard";
import { AcademyService } from "./academy.service";
import { IsPublic } from "../../common/decorators/is-public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";

type UserRequest = { user: SessionPayload };
function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) throw new BadRequestException(result.error.issues[0]?.message ?? "Invalid input");
  return result.data;
}

@Controller()
export class AcademyController {
  constructor(private readonly academy: AcademyService, private readonly management: ManagementService) {}
  @IsPublic() @Get("paths") paths() { return this.academy.paths(); }
  @IsPublic() @Get("paths/:slug") detail(@Param("slug") slug: string) { return this.academy.detail(slug); }
  @Post("paths/:slug/enroll") enroll(@Req() request: UserRequest, @Param("slug") slug: string) { return this.academy.enroll(request.user.userId, slug); }
  @Get("learning/dashboard") dashboard(@Req() request: UserRequest) { return this.academy.dashboard(request.user.userId); }
  @Get("learn/:module/:section") lesson(@Req() request: UserRequest, @Param("module") module: string, @Param("section") section: string) { return this.academy.workspace(request.user.userId, module, section); }
  @Patch("learn/:module/:section") save(@Req() request: UserRequest, @Param("module") module: string, @Param("section") section: string, @Body() body: unknown) {
    return this.academy.save(request.user.userId, module, section, parse(z.object({ notes: z.string().max(20000), bookmarked: z.boolean() }).strict(), body));
  }
  @Post("learn/:module/:section/complete") complete(@Req() request: UserRequest, @Param("module") module: string, @Param("section") section: string, @Body() body: unknown) {
    const input = parse(z.object({ answer: z.number().int().min(0).max(5) }).strict(), body);
    return this.academy.complete(request.user.userId, module, section, input.answer);
  }
  @IsPublic() @Get("leaderboard") leaderboard() { return this.academy.leaderboard(); }
  @IsPublic() @Get("labs") labs() { return this.management.labs(); }
  @Post("labs/:id/submissions") submit() { throw new ServiceUnavailableException("Code execution is disabled until an isolated, resource-limited runner is configured."); }
  @Roles("ADMIN", "SUPER_ADMIN") @Get("admin/paths") adminPaths(@Req() req: UserRequest) { return this.academy.adminList(req.user); }
  @Roles("ADMIN", "SUPER_ADMIN") @Get("admin/starter-content") starter() { return this.management.templates(); }
  @Roles("ADMIN", "SUPER_ADMIN") @Permissions("courses:write") @Post("admin/paths") create(@Req() req: UserRequest, @Body() body: unknown) { return this.academy.writePath(parse(pathInputSchema, body), req.user); }
  @Roles("ADMIN", "SUPER_ADMIN") @Permissions("courses:write") @Patch("admin/paths/:id") update(@Req() req: UserRequest, @Param("id", new ParseUUIDPipe()) id: string, @Body() body: unknown) { return this.academy.writePath(parse(pathInputSchema, body), req.user, id); }
  @Roles("ADMIN", "SUPER_ADMIN") @Permissions("courses:write") @Delete("admin/paths/:id") archive(@Req() req: UserRequest, @Param("id", new ParseUUIDPipe()) id: string) { return this.academy.archive(id, req.user); }
}