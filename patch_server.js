const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

// Find and replace the listen block
const idx = content.indexOf('// Start server');
if (idx === -1) { console.log('Could not find start server block'); process.exit(1); }

const newBlock = `// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log('PriceCompare Server running on http://localhost:' + PORT);
  console.log('Search endpoint: http://localhost:' + PORT + '/api/search?q=iPhone');
  console.log('Cache enabled (1 hour TTL)');
});

// Friendly error if port is already in use
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error('\\n PORT ' + PORT + ' is already in use!');
    console.error(' Close the other terminal running node server.js, then try again.\\n');
    process.exit(1);
  } else {
    throw err;
  }
});
`;

content = content.substring(0, idx) + newBlock;
fs.writeFileSync('server.js', content);
console.log('server.js patched successfully');
