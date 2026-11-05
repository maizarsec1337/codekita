const fs = require("fs");
const s = fs.readFileSync("backend/src/config/configuration.ts", "utf8");
for (let i = 0; i < s.length; i++) {
  if (s.charCodeAt(i) === 0x60) {
    console.log("BACKTICK at", i, JSON.stringify(s.slice(Math.max(0, i - 40), i + 40)));
  }
}
console.log("line count:", s.split("\r\n").length);
s.split("\r\n").forEach((line, idx) => {
  console.log(idx + 1, JSON.stringify(line));
});