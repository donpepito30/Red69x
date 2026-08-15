const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(
  "console.log('Fetching from:', fetchUrl);",
  "console.log('Fetching from:', fetchUrl); require('fs').writeFileSync('last_fetch.txt', fetchUrl);"
);
fs.writeFileSync('server.ts', code);
console.log("Patched server.ts with file logging");
