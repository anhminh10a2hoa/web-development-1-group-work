const chai = require('chai');
const expect = chai.expect;
const { createResponse } = require('node-mocks-http');
const { getAllProducts } = require('../../../controllers/products');
const Product = require('../../../models/product');

const products = require('../../../setup/products.json').map(product => ({
  ...product
}));

describe('Products Controller', () => {
  let response;
  beforeEach(async () => {
    // reset database
    await Product.deleteMany({});
    await Product.create(products);
    response = createResponse();
  });

  describe('getAllProducts()', () => {
    it('should respond with JSON', async () => {
      const products = await getAllProducts(response);
      console.log(products);
      expect(response.statusCode).to.equal(200);
      expect(response.getHeader('content-type')).to.equal('application/json');
      expect(response._isJSON()).to.be.true;
      expect(response._isEndCalled()).to.be.true;
      expect(response._getJSONData()).to.be.an('array');
      expect(response._getJSONData()).to.be.deep.equal(products);
    });
  });
});
