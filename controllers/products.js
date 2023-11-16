const responseUtils = require('../utils/responseUtils');
const http = require('http');
const Product = require('../models/product'); 

/**
 * Send all products as JSON
 *
 * @param {http.ServerResponse} response - Response to the UI
 * @returns {object} - JSON object
 */
const getAllProducts = async (response) => {
  const allProducts = await Product.find({});
  return responseUtils.sendJson(response, allProducts);
};

/**
 * Add a new product
 *
 * @param {http.ServerResponse} response - Response to the UI
 * @param {object} product - Product data
 * @returns {object} - JSON object representing the new product
 */
const addNewProduct = async (response, product) => {
  // Validation checks for required fields
  const requiredFields = ['name', 'price', 'description', 'image'];
  for (const field of requiredFields) {
    if (!product[field]) {
      return responseUtils.badRequest(response, `${field.charAt(0).toUpperCase() + field.slice(1)} is missing`);
    }
  }
  const newProduct = new Product(product);
  await newProduct.save();
  return responseUtils.createdResource(response, newProduct);
};

/**
 * Get a product by ID
 *
 * @param {http.ServerResponse} response - Response to the UI
 * @param {string} id - Product ID
 * @returns {object} - JSON object representing the product
 */
const getProduct = async (response, id) => {
  const product = await Product.findOne({ _id: id });
  if (!product) {
    return responseUtils.notFound(response);
  }
  return responseUtils.sendJson(response, product);
};

/**
 * Update a product by ID
 *
 * @param {http.ServerResponse} response - Response to the UI
 * @param {string} id - Product ID
 * @param {object} productData - Updated product data
 * @returns {object} - JSON object representing the updated product
 */
const updateProduct = async (response, id, productData) => {
  // Validation checks for required fields
  if (!productData.name || !productData.price || productData.price <= 0) {
    return responseUtils.badRequest(response, 'Name, Price, or Invalid Price');
  }

  const currentProduct = await Product.findOne({ _id: id });
  if (!currentProduct) {
    return responseUtils.notFound(response);
  }

  // Update only the provided fields
  for (const key in productData) {
    if (Object.prototype.hasOwnProperty.call(productData, key)) {
      currentProduct[key] = productData[key];
    }
  }

  await currentProduct.save();
  return responseUtils.sendJson(response, currentProduct);
};

/**
 * Delete a product by ID
 *
 * @param {http.ServerResponse} response - Response to the UI
 * @param {string} id - Product ID
 * @returns {object} - JSON object representing the deleted product
 */
const deleteProduct = async (response, id) => {
  const product = await Product.findOne({ _id: id });
  if (!product) {
    return responseUtils.notFound(response);
  }
  await product.remove();
  return responseUtils.sendJson(response, product);
};

module.exports = { getAllProducts, addNewProduct, getProduct, updateProduct, deleteProduct };
