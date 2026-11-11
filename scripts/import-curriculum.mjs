// One-time import of existing original content; never runs at application startup.
// Existing courses/templates/labs are never overwritten. No accounts or activity.
import { createRequire } from 'node:module';
import { PrismaClient } from '@prisma/client';
import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
const require = createRequire(import.meta.url);
const { starterPaths, labDefinitions, pathInputSchema } = require('../.server-build/runtime/packages/shared/src/index.js');
for (const file of ['.env.local', '.env']) if (existsSync(file)) {
  for (const [key, value] of Object.entries(parseEnv(readFileSync(file, 'utf8')))) process.env[key] ??= value;
}
const prisma = new PrismaClient();
try {
  for (const source of starterPaths) {
    const input = pathInputSchema.parse(source);
    await prisma.curriculumTemplate.upsert({ where: { slug: input.slug }, create: { slug: input.slug, content: input }, update: {} });
    if (await prisma.course.findUnique({ where: { slug: input.slug } })) continue;
    await prisma.$transaction(async db => {
      const category = await db.category.upsert({ where: { slug: input.academy }, create: { slug: input.academy, name: { programming: 'Programming', cybersecurity: 'Cybersecurity', ai: 'AI Engineering' }[input.academy] }, update: {} });
      const { modules, ...course } = input;
      await db.course.create({ data: { ...course, categoryId: category.id, modules: { create: modules.map((module, order) => ({ title: module.title, slug: module.slug, order, lessons: { create: module.lessons.map((lesson, order) => ({ title: lesson.title, slug: lesson.slug, order, content: lesson.content, objectives: lesson.objectives, assessment: lesson.assessment, quiz: { create: lesson.assessment } })) } })) } } });
    }, { timeout: 30000 });
  }
  for (const lab of labDefinitions) await prisma.lab.upsert({ where: { id: lab.id }, create: { ...lab, isPublished: true }, update: {} });
  console.log('Existing original curriculum and lab content imported without overwriting records or creating learner activity.');
} catch { console.error('Content import failed. Check migrations, content validation and connectivity. No credentials are logged.'); process.exitCode = 1; }
finally { await prisma.$disconnect(); }