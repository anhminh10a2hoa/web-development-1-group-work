const data = {
  products: require('../products.json').map(product => ({...product}))
};
const getAllProducts = () => data.products.map(product => ({...product}));
module.exports = {
  getAllProducts
};