const fs = require('fs');

const filePath = 'src/database/migrations/initial_script.sql';
const lines = fs.readFileSync(filePath, { encoding: 'utf-8' }).split(/\r?\n/);

for (const line of lines) {
  lines.shift();
  if (line.length === 0) {
    fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
    break;
  }
}
