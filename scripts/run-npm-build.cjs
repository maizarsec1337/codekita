const { spawnSync } = require('node:child_process');
const result = process.platform === 'win32'
  ? spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', 'npm run build'], { stdio: 'inherit', env: process.env })
  : spawnSync('npm', ['run', 'build'], { stdio: 'inherit', env: process.env });
process.exitCode = result.status ?? 1;