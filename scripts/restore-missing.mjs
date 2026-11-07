import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const trackedFiles = execFileSync(
  "git",
  ["ls-tree", "-r", "--name-only", "HEAD", "--", "frontend/src", "frontend/public", "backend/src", "backend/prisma"],
  { encoding: "utf8" },
)
  .trim()
  .split(/\r?\n/)
  .filter(Boolean);

let restored = 0;
let preserved = 0;

for (const source of trackedFiles) {
  let destination;
  if (source.startsWith("frontend/src/")) destination = `src/${source.slice("frontend/src/".length)}`;
  else if (source.startsWith("frontend/public/")) destination = `public/${source.slice("frontend/public/".length)}`;
  else if (source.startsWith("backend/src/")) destination = `src/server/${source.slice("backend/src/".length)}`;
  else if (source.startsWith("backend/prisma/")) destination = `prisma/${source.slice("backend/prisma/".length)}`;
  else continue;

  if (existsSync(destination)) {
    preserved += 1;
    continue;
  }

  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, execFileSync("git", ["show", `HEAD:${source}`]));
  restored += 1;
}

console.log(`Restored ${restored} missing tracked files; preserved ${preserved} existing destinations.`);