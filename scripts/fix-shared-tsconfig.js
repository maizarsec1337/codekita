const fs = require("fs");
const p = "packages/shared/tsconfig.json";
let s = fs.readFileSync(p, "utf8");
s = s.replace(/ {4}"skipLibCheck": true,\r?\n {4}"types": \["node"\]/, '    "skipLibCheck": true');
fs.writeFileSync(p, s);
JSON.parse(s);
console.log("fixed shared tsconfig");