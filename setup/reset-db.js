const path = require('path');
const dotEnvPath = path.resolve(__dirname, '../.env');
require('dotenv').config({ path: dotEnvPath });

const { connectDB } = require('../models/db');
const User = require('../models/user');
const Order = require('../models/order');
const Product = require('../models/product');
const users = require('./users.json').map(user => ({ ...user }));
const products = require('./products.json').map(product => ({ ...product }));

(async () => {
  connectDB();
  try {
    await User.deleteMany({});
    await Order.deleteMany({});
    await Product.deleteMany({});
    await User.create(users);
    await Product.create(products);
  } catch (err) {
    console.log('error when reset the DB');
  }
})();
