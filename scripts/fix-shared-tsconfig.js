const fs = require("fs");
const p = "packages/shared/tsconfig.json";
let s = fs.readFileSync(p, "utf8");
s = s.replace(/    "skipLibCheck": true,\r?\n    "types": \["node"\]/, '    "skipLibCheck": true');
fs.writeFileSync(p, s);
JSON.parse(s);
console.log("fixed shared tsconfig");