const http = require('http');

http.get('http://localhost:3000/api/models?tags=latina&limit=5', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log("Done", data.length));
});
