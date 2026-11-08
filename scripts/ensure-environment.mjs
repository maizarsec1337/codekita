import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SESSION_SECRET = "SESSION_SECRET";

async function readOptional(filePath) {
  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return null;
    throw error;
  }
}

function parseValue(rawValue) {
  const value = rawValue.trim();
  if (!value) return "";

  const quote = value[0];
  if (quote === '"' || quote === "'" || quote === "`") {
    const closingQuote = value.lastIndexOf(quote);
    return closingQuote > 0 ? value.slice(1, closingQuote) : value.slice(1);
  }

  const comment = value.indexOf("#");
  return (comment === -1 ? value : value.slice(0, comment)).trim();
}

function inlineComment(rawValue) {
  const value = rawValue.trim();
  if (!value) return "";

  const quote = value[0];
  if (quote === '"' || quote === "'" || quote === "`") {
    const closingQuote = value.lastIndexOf(quote);
    if (closingQuote > 0) {
      const suffix = value.slice(closingQuote + 1).trimStart();
      return suffix.startsWith("#") ? suffix : "";
    }
    return "";
  }

  const comment = value.indexOf("#");
  return comment === -1 ? "" : value.slice(comment);
}

function findLastAssignment(content) {
  const pattern = /^(?<prefix>[\t ]*(?:export[\t ]+)?SESSION_SECRET[\t ]*=[\t ]*)(?<value>[^\r\n]*)(?<ending>\r?\n|$)/gm;
  let assignment = null;
  let match;

  while ((match = pattern.exec(content)) !== null) {
    assignment = {
      start: match.index,
      end: match.index + match[0].length,
      prefix: match.groups.prefix,
      rawValue: match.groups.value,
      ending: match.groups.ending,
      value: parseValue(match.groups.value),
    };
  }

  return assignment;
}

function replaceEmptyAssignment(content, assignment, secret) {
  const comment = inlineComment(assignment.rawValue);
  const replacement = `${assignment.prefix}${secret}${comment ? ` ${comment}` : ""}${assignment.ending}`;
  return content.slice(0, assignment.start) + replacement + content.slice(assignment.end);
}

function appendAssignment(content, secret) {
  const lineEnding = content.includes("\r\n") ? "\r\n" : "\n";
  const separator = content.length > 0 && !content.endsWith("\n") && !content.endsWith("\r") ? lineEnding : "";
  return `${content}${separator}# Generated locally by CodeKita. Do not commit this file.${lineEnding}${SESSION_SECRET}=${secret}${lineEnding}`;
}

/**
 * Ensures local development/production startup has a session secret without
 * overwriting a configured process value or any other environment variable.
 * Missing values are written to the Git-ignored .env.local file.
 */
export async function ensureLocalSessionSecret({ root, environment }) {
  if (typeof environment[SESSION_SECRET] === "string" && environment[SESSION_SECRET].trim().length > 0) {
    return { generated: false, filePath: null };
  }

  // An explicitly empty value would override dotenv values in NestJS.
  if (typeof environment[SESSION_SECRET] === "string") delete environment[SESSION_SECRET];

  const localPath = join(root, ".env.local");
  const envPath = join(root, ".env");
  const localContent = await readOptional(localPath);
  const localAssignment = localContent === null ? null : findLastAssignment(localContent);

  if (localAssignment?.value) return { generated: false, filePath: localPath };

  if (!localAssignment) {
    const envContent = await readOptional(envPath);
    const envAssignment = envContent === null ? null : findLastAssignment(envContent);
    if (envAssignment?.value) return { generated: false, filePath: envPath };
  }

  const secret = randomBytes(48).toString("base64url");
  const updated = localAssignment
    ? replaceEmptyAssignment(localContent, localAssignment, secret)
    : appendAssignment(localContent ?? "", secret);

  await writeFile(localPath, updated, { encoding: "utf8", mode: 0o600 });
  environment[SESSION_SECRET] = secret;
  return { generated: true, filePath: localPath };
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : null;
if (invokedPath === import.meta.url) {
  const root = fileURLToPath(new URL("../", import.meta.url));
  const result = await ensureLocalSessionSecret({ root, environment: process.env });
  console.log(result.generated
    ? `[environment] Generated missing SESSION_SECRET in ${basename(result.filePath)} (value hidden).`
    : "[environment] SESSION_SECRET is already configured.");
}