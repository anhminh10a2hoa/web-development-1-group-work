const products = require('../products.json');

const getAllProducts = () => {
  return products;
};

module.exports = {
  getAllProducts
};