require('dotenv').config();
const http = require('http');
const { connectDB } = require('./models/db');
const { handleRequest } = require('./routes');
const PORT = process.env.PORT || 3000;
const server = http.createServer(handleRequest);

server.on('error', err => {
  console.error(err);
  server.close();
});

server.on('close', () => console.log('Server closed.'));

connectDB();
require('./setup/reset-db.js');

server.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`);
});