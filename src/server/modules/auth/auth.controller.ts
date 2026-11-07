import { Body, Controller, Get, Post, Req, Res, UnauthorizedException, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { AuthService } from "./auth.service";
import { IsPublic } from "../../common/decorators/is-public.decorator";
import { cookies, csrfToken } from "../../common/security";

const credentials = z.object({ email: z.string().trim().min(1).max(254), password: z.string().min(8).max(256) });
const registration = credentials.extend({ email: z.string().trim().email().max(254), firstName: z.string().trim().max(100).optional(), lastName: z.string().trim().max(100).optional() });

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly config: ConfigService) {}

  private cookie(name: string, value: string, maxAge: number) {
    const secure = this.config.get("NODE_ENV") === "production" || this.config.get<boolean>("COOKIE_SECURE", false);
    const sameSite = this.config.get<string>("COOKIE_SAME_SITE", "lax");
    return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=${sameSite}; Max-Age=${Math.floor(maxAge / 1000)}${secure ? "; Secure" : ""}`;
  }

  private async authenticated(token: string, reply: FastifyReply) {
    const user = await this.auth.validateSession(token);
    if (!user) throw new UnauthorizedException();
    reply.header("Cache-Control", "no-store");
    reply.header("Set-Cookie", [
      this.cookie(this.config.get<string>("SESSION_NAME", "codekita_session"), token, this.config.get<number>("SESSION_MAX_AGE", 86400000)),
      this.cookie("csrf_token", csrfToken(this.config.getOrThrow<string>("SESSION_SECRET")), 86400000),
    ]);
    return { user };
  }

  @IsPublic()
  @Get("csrf-token")
  csrf(@Res({ passthrough: true }) reply: FastifyReply) {
    const token = csrfToken(this.config.getOrThrow<string>("SESSION_SECRET"));
    reply.header("Cache-Control", "no-store");
    reply.header("Set-Cookie", this.cookie("csrf_token", token, 86400000));
    return { token };
  }

  @IsPublic()
  @Post("login")
  async login(@Body() body: unknown, @Req() request: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
    const input = credentials.safeParse(body);
    if (!input.success) throw new BadRequestException("Enter valid credentials");
    const result = await this.auth.login(input.data.email, input.data.password, request.ip, request.headers["user-agent"]);
    return this.authenticated(result.token, reply);
  }

  @IsPublic()
  @Post("register")
  async register(@Body() body: unknown, @Res({ passthrough: true }) reply: FastifyReply) {
    const input = registration.safeParse(body);
    if (!input.success) throw new BadRequestException(input.error.issues[0].message);
    const result = await this.auth.register(input.data.email.toLowerCase(), input.data.password, input.data.firstName, input.data.lastName);
    return this.authenticated(result.token, reply);
  }

  @Get("me")
  me(@Req() request: FastifyRequest & { user: unknown }, @Res({ passthrough: true }) reply: FastifyReply) {
    reply.header("Cache-Control", "no-store");
    return { user: request.user };
  }

  @Post("logout")
  async logout(@Req() request: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
    const name = this.config.get<string>("SESSION_NAME", "codekita_session");
    const token = cookies(request.headers.cookie)[name];
    if (token) await this.auth.revokeSession(token);
    reply.header("Set-Cookie", [this.cookie(name, "", 0), this.cookie("csrf_token", "", 0)]);
    return { ok: true };
  }
}