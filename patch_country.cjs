const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  "country: m.country || 'Unknown',",
  "country: m.modelsCountry || m.country || 'Unknown',\n            countryCode: m.modelsCountry || m.countryCode || 'Unknown',"
);

code = code.replace(
  "if (t === 'latina') return ['colombia', 'mexico', 'venezuela', 'argentina', 'spain', 'brazil', 'chile', 'peru', 'co', 'mx', 've', 'ar', 'br'].some((c) => m.country.toLowerCase().includes(c) || m.countryCode.toLowerCase().includes(c));",
  "if (t === 'latina') return ['colombia', 'mexico', 'venezuela', 'argentina', 'spain', 'brazil', 'chile', 'peru', 'co', 'mx', 've', 'ar', 'br', 'cl', 'pe', 'es'].some((c) => (m.country && m.country.toLowerCase() === c) || (m.countryCode && m.countryCode.toLowerCase() === c));"
);

fs.writeFileSync('server.ts', code);
console.log("Patched server.ts country mapping");
