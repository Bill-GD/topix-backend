const fs = require('fs');

const filePath = 'src/database/migrations/initial_script.sql';
const lines = fs
  .readFileSync(filePath, { encoding: 'utf-8' })
  .split(/\r?\n/)
  .filter((line) => !line.includes('schema.ts'));

lines.shift();
lines.shift();
fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
