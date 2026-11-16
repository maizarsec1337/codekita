import fastifyRateLimit from "@fastify/rate-limit";
type Instance = Parameters<typeof fastifyRateLimit>[0];

export function installAuthenticationRateLimit(fastify: Instance) {
  const limitLogin = fastify.createRateLimit({ max: 10, timeWindow: 60000, keyGenerator: request => `login:${request.ip}` });
  const limitPasswordChange = fastify.createRateLimit({ max: 10, timeWindow: 60000, keyGenerator: request => `password-change:${request.ip}` });
  fastify.addHook("onRequest", async (request, reply) => {
    const path = request.url.split("?")[0];
    if (request.method !== "POST" || !["/api/auth/login", "/api/auth/change-password"].includes(path)) return;
    const result = await (path === "/api/auth/login" ? limitLogin(request) : limitPasswordChange(request));
    if (!result.isAllowed && result.isExceeded) return reply.header("Retry-After", String(result.ttlInSeconds)).code(429).send({ statusCode: 429, error: "Too Many Requests", message: "Too many authentication attempts" });
  });
}