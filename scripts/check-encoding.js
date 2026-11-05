const fs = require("fs");
for (const f of [
  "backend/src/config/configuration.ts",
]) {
  const b = fs.readFileSync(f);
  const s = b.toString("utf8");
  console.log("====", f, "bytes:", b.length);
  for (let i = 0; i < b.length; i++) {
    const c = b[i];
    if (c < 32 && c !== 10 && c !== 13 && c !== 9) {
      console.log("CTRL char", c, "at", i, "context:", JSON.stringify(s.slice(Math.max(0, i - 20), i + 20)));
    }
    if (c > 127) {
      console.log("NON-ASCII", c, "at", i, "context:", JSON.stringify(s.slice(Math.max(0, i - 20), i + 20)));
    }
  }
  console.log("done scan");
  console.log(JSON.stringify(s.slice(0, 1200)));
}