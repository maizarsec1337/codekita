import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../database/prisma.service";
import { createHmac, randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
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
    if (!/^[a-f0-9]{48,64}$/.test(token)) return null;
    const session = await this.prisma.session.findFirst({
      // Existing raw-token sessions remain usable until their original expiry.
      where: { token: { in: [this.sessionHash(token), token] } },
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
        token: this.sessionHash(token),
        expiresAt: new Date(Date.now() + maxAge),
        userId,
        ipAddress,
        userAgent,
      },
    });

    return token;
  }

  async revokeSession(token: string): Promise<void> {
    await this.prisma.session.deleteMany({ where: { token: { in: [this.sessionHash(token), token] } } });
  }

  async revokeAllSessionsForUser(userId: string): Promise<void> {
    await this.prisma.session.deleteMany({ where: { userId } });
  }

  private sessionHash(token: string) {
    return createHmac("sha256", this.configService.getOrThrow<string>("SESSION_SECRET")).update(token).digest("hex");
  }

  async login(identifier: string, password: string, ipAddress?: string, userAgent?: string) {
    const normalized = identifier.trim().toLowerCase();
    const include = { roles: { include: { role: true } } } as const;
    const user = await this.prisma.user.findUnique({ where: { email: normalized }, include })
      ?? await this.prisma.user.findUnique({ where: { username: normalized }, include });

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
        roles: user.roles.map((ur: { role: { name: string } }) => ur.role.name),
      },
    };
  }

  async register(email: string, password: string, firstName?: string, lastName?: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new BadRequestException("Email already registered");
    }

    const passwordHash = await this.hashPassword(password);

    const studentRole = await this.prisma.role.upsert({ where: { name: "STUDENT" }, create: { name: "STUDENT" }, update: {} });

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        profile: { create: { displayName: [firstName, lastName].filter(Boolean).join(" ") } },
        roles: {
          create: { role: { connect: { id: studentRole.id } } },
        },
      },
    }).catch((error: unknown) => {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new BadRequestException("Email already registered");
      throw error;
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