const fs = require('fs');

const fileDir = 'src/database/migrations';
const fileName = 'initial_script.sql';

fs.mkdirSync(fileDir, { recursive: true });
fs.writeFileSync(`${fileDir}/${fileName}`, "");
