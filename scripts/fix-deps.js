const fs = require("fs");
const p = "backend/package.json";
let s = fs.readFileSync(p, "utf8");
let changed = false;
if (s.includes('"@nestjs/swagger": "^12.0.0"')) {
  s = s.replace('"@nestjs/swagger": "^12.0.0"', '"@nestjs/swagger": "^11.3.2"');
  changed = true;
}
if (s.includes('"@fastify/static": "^7.0.4"')) {
  s = s.replace('"@fastify/static": "^7.0.4"', '"@fastify/static": "^10.1.2"');
  changed = true;
}
if (changed) {
  fs.writeFileSync(p, s);
  JSON.parse(s);
}
console.log("done", changed);