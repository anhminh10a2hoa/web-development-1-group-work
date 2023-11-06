const path = require('path');
const dotEnvPath = path.resolve(__dirname, '../.env');
require('dotenv').config({ path: dotEnvPath });

const { connectDB, disconnectDB } = require('../models/db');
const User = require('../models/user');
const users = require('./users.json').map(user => ({ ...user }));

(async () => {
  connectDB();
  await User.deleteMany({});
  await User.create(users);
  disconnectDB();
})();
