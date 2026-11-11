import { PrismaClient } from '@prisma/client';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
for (const file of ['.env.local', '.env']) if (existsSync(file)) {
  for (const [key, value] of Object.entries(parseEnv(readFileSync(file, 'utf8')))) process.env[key] ??= value;
}
const report = { environment: Object.fromEntries(['DATABASE_URL', 'DIRECT_URL', 'SESSION_SECRET'].map(key => [key, Boolean(process.env[key])])) };
const prisma = new PrismaClient({ datasources: { db: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL } } });
try {
  report.tables = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`;
  report.connection = 'connected';
  report.existingApplicationTables = report.tables.filter(t => ['User', 'Course', 'Session', 'Role'].includes(t.table_name));
} catch (error) { report.connection = 'failed'; report.code = /^P\d{4}$/.test(error?.code ?? '') ? error.code : 'DATABASE_ERROR'; }
finally { await prisma.$disconnect(); writeFileSync('database-inspection.log', JSON.stringify(report, null, 2)); }