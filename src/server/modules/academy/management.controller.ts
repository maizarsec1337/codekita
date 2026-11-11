import { BadRequestException, Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req } from "@nestjs/common";
import { z } from "zod";
import { categoryInputSchema, profileInputSchema, userUpdateSchema, type SessionPayload } from "@codekita/shared";
import { IsPublic } from "../../common/decorators/is-public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { Permissions } from "../../common/guards/permissions.guard";
import { ManagementService } from "./management.service";
type UserRequest = { user: SessionPayload };
function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new BadRequestException(result.error.issues[0]?.message ?? "Invalid input");
  return result.data;
}
@Controller()
export class ManagementController {
  constructor(private readonly management: ManagementService) {}
  @IsPublic() @Get("categories") categories() { return this.management.categories(); }
  @Get("profile") profile(@Req() req: UserRequest) { return this.management.profile(req.user.userId); }
  @Patch("profile") saveProfile(@Req() req: UserRequest, @Body() body: unknown) { return this.management.saveProfile(req.user.userId, parse(profileInputSchema, body)); }
  @Roles("ADMIN", "SUPER_ADMIN") @Get("admin/categories") adminCategories() { return this.management.categories(true); }
  @Roles("ADMIN", "SUPER_ADMIN") @Permissions("categories:write") @Post("admin/categories") create(@Body() body: unknown) { return this.management.writeCategory(parse(categoryInputSchema, body)); }
  @Roles("ADMIN", "SUPER_ADMIN") @Permissions("categories:write") @Patch("admin/categories/:id") update(@Param("id", new ParseUUIDPipe()) id: string, @Body() body: unknown) { return this.management.writeCategory(parse(categoryInputSchema, body), id); }
  @Roles("ADMIN", "SUPER_ADMIN") @Permissions("categories:write") @Delete("admin/categories/:id") archive(@Param("id", new ParseUUIDPipe()) id: string) { return this.management.archiveCategory(id); }
  @Roles("ADMIN", "SUPER_ADMIN") @Permissions("users:write") @Get("admin/users") users(@Query("page") page = "1") { return this.management.users(parse(z.coerce.number().int().min(1).max(100000), page)); }
  @Roles("ADMIN", "SUPER_ADMIN") @Permissions("users:write") @Patch("admin/users/:id") user(@Req() req: UserRequest, @Param("id", new ParseUUIDPipe()) id: string, @Body() body: unknown) { return this.management.updateUser(req.user, id, parse(userUpdateSchema, body)); }
  @Roles("ADMIN", "SUPER_ADMIN") @Get("admin/statistics") statistics() { return this.management.statistics(); }
  @Get("labs/:id/draft") draft(@Req() req: UserRequest, @Param("id") id: string) { return this.management.labDraft(req.user.userId, id); }
  @Patch("labs/:id/draft") saveDraft(@Req() req: UserRequest, @Param("id") id: string, @Body() body: unknown) { return this.management.saveLabDraft(req.user.userId, id, parse(z.object({ code: z.string().max(100000), language: z.string().min(1).max(30) }).strict(), body)); }
}