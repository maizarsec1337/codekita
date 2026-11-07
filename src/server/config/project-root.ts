import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

function findProjectRoot(start: string): string {
  let current = resolve(start);
  while (true) {
    if (existsSync(join(current, "package.json")) && existsSync(join(current, "prisma", "schema.prisma"))) return current;
    const parent = dirname(current);
    if (parent === current) throw new Error("Cannot locate the CodeKita project root and Prisma schema");
    current = parent;
  }
}

export const projectRoot = findProjectRoot(__dirname);