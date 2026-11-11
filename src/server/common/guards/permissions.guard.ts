import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "../../database/prisma.service";
export const Permissions = (...names: string[]) => SetMetadata("permissions", names);
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly prisma: PrismaService) {}
  async canActivate(context: ExecutionContext) {
    const required = this.reflector.getAllAndOverride<string[]>("permissions", [context.getHandler(), context.getClass()]);
    if (!required?.length) return true;
    const user = context.switchToHttp().getRequest<{ user?: { userId: string } }>().user;
    if (!user) throw new ForbiddenException("Authentication required");
    const permissions = await this.prisma.permission.findMany({ where: { name: { in: required }, roles: { some: { role: { users: { some: { userId: user.userId } } } } } }, select: { name: true } });
    if (!required.every(name => permissions.some(item => item.name === name))) throw new ForbiddenException("Insufficient permission");
    return true;
  }
}