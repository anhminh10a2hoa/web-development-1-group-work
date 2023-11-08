require('dotenv').config();
const http = require('http');
const { handleRequest } = require('./routes');

const { connectDB } = require('./models/db');

const PORT = process.env.PORT || 3000;
const dbAddress = process.env.DBURL;
const server = http.createServer(handleRequest);

server.on('error', err => {
  console.error(err);
  server.close();
});

server.on('close', () => console.log('Server closed.'));

connectDB();

server.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`);
});