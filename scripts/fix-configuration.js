const fs = require("fs");
const p = "backend/src/config/configuration.ts";
let s = fs.readFileSync(p, "utf8");
s = s.replace(
  ".map(([field, messages]) => `${field}: ${(messages ?? []).join(", ")}`)",
  ".map(function (entry) {\n        const field = entry[0];\n        const messages = entry[1] ?? [];\n        return field + \": \" + messages.join(\", \");\n      })",
);
s = s.replace(
  "throw new Error(`Invalid environment configuration: ${fieldErrors}`);",
  'throw new Error("Invalid environment configuration: " + fieldErrors);',
);
fs.writeFileSync(p, s);
JSON.parse(s.replace(/`/g, ""));
console.log("fixed configuration.ts");