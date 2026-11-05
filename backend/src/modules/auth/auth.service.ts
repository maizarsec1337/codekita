import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../database/prisma.service";
import { randomBytes } from "node:crypto";
import argon2 from "argon2";
import type { RoleName, SessionPayload } from "@codekita/shared";

const CSRF_TOKEN_BYTES = 24;

/**
 * Authentication service.
 * - Passwords are hashed with Argon2id (configured via env).
 * * Sessions are server-side records validated on every request.
 * - Registration assigns only the STUDENT role (no public admin registration).
 * - Administrator credentials are never seeded or hardcoded.
 */

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async hashPassword(plain: string): Promise<string> {
    return argon2.hash(plain, {
      memoryCost: this.configService.get<number>("ARGON2ID_MEMORY_COST", 65536),
      timeCost: this.configService.get<number>("ARGON2ID_TIME_COST", 3),
      parallelism: this.configService.get<number>("ARGON2ID_PARALLELISM", 4),
      type: argon2.argon2id,
    });
  }

  async verifyPassword(hash: string, plain: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plain);
    } catch {
      return false;
    }
  }

  async validateSession(token: string): Promise<SessionPayload | null> {
    const session = await this.prisma.session.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            roles: { include: { role: true } },
          },
        },
      },
    });

    if (!session) {
      return null;
    }

    if (session.expiresAt < new Date()) {
      await this.prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      return null;
    }

    const user = session.user;
    if (!user || !user.isActive) {
      return null;
    }

    return {
      userId: user.id,
      email: user.email,
      roles: (user.roles.map((ur: { role: { name: string } }) => ur.role.name) as unknown as RoleName[])
        .filter(
          (r): r is RoleName =>
            ["SUPER_ADMIN", "ADMIN", "INSTRUCTOR", "STUDENT"].includes(r),
        ),
    };
  }

  async createSession(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<string> {
    const maxAge = this.configService.get<number>("SESSION_MAX_AGE", 86400000);
    const token = randomBytes(CSRF_TOKEN_BYTES).toString("hex");

    await this.prisma.session.create({
      data: {
        token,
        expiresAt: new Date(Date.now() + maxAge),
        userId,
        ipAddress,
        userAgent,
      },
    });

    return token;
  }

  async revokeSession(token: string): Promise<void> {
    await this.prisma.session.deleteMany({ where: { token } }).catch(() => {});
  }

  async revokeAllSessionsForUser(userId: string): Promise<void> {
    await this.prisma.session.deleteMany({ where: { userId } }).catch(() => {});
  }

  async login(identifier: string, password: string, ipAddress?: string, userAgent?: string) {
    // Support login with either email or username (both stored in email column)
    const user = await this.prisma.user.findUnique({
      where: { email: identifier },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (!(await this.verifyPassword(user.passwordHash, password))) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (!user.isActive) {
      throw new ForbiddenException("Account is deactivated");
    }

    const token = await this.createSession(user.id, ipAddress, userAgent);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: [],
      },
    };
  }

  async register(email: string, password: string, firstName?: string, lastName?: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new BadRequestException("Email already registered");
    }

    const passwordHash = await this.hashPassword(password);

    const studentRole = await this.prisma.role.findUnique({
      where: { name: "STUDENT" },
    });
    if (!studentRole) {
      throw new Error("STUDENT role not seeded — run database setup first");
    }

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        roles: {
          create: { role: { connect: { id: studentRole.id } } },
        },
      },
    });

    const token = await this.createSession(user.id);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: ["STUDENT"],
      },
    };
  }

  async generateCsrfToken(): Promise<string> {
    return randomBytes(CSRF_TOKEN_BYTES).toString("hex");
  }
}