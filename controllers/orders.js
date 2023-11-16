const responseUtils = require('../utils/responseUtils');
const Order = require('../models/order');

/** Get all orders
 * 
 * @param {object} res - response object
 * @returns {object} - JSON object
 * 
 */
const getAllOrdersByAdmin = async (res) => {
  const allOrders = await Order.find({});
  return responseUtils.sendJson(res, allOrders);
};

/** Get order by id
 * 
 * @param {object} res - response object
 * @param {string} id - order id
 * @returns {object} - JSON object
 */
const getOrderByAdmin = async (res, id) => {
  const order = await Order.findOne({ _id: id });
  if (!order) {
    return responseUtils.notFound(res);
  }
  return responseUtils.sendJson(res, order);
};

/** Create new order
 * 
 * @param {object} res - response object
 * @param {object} order - order object
 * @param {string} customerId - customer id
 * @returns {object} - JSON object
 */
const addNewOrder = async (res, order, customerId) => {
  if (order.items.length === 0) {
    return responseUtils.badRequest(res, 'Order must have at least one item');
  }
  if (order.items.find(item => !item.quantity || !item.product || !item.product._id || !item.product.name || !item.product.price)) {
    return responseUtils.badRequest(res, 'Product Quantity/Price/Name/Id is missing');
  }
  const newOrder = await new Order({
    customerId: customerId,
    items: order.items
  });
  await newOrder.save();
  return responseUtils.createdResource(res, newOrder);
};


/** View order by customer
 * 
 * @param {object} res - response object
 * @param {string} customerId - customer id
 * @param {string} orderId - order id
 * @returns {object} - JSON object
 */
const getOrderByCustomer = async (res, customerId, orderId) => {
  const order = await Order.findOne({ _id: orderId, customerId: customerId });
  if (!order) {
    return responseUtils.notFound(res);
  }
  return responseUtils.sendJson(res, order);
};

/** View all orders by customer
 * 
 * @param {object} res - response object
 * @param {string} customerId - customer id
 * @returns {object} - JSON object
 */
const getAllOrdersByCustomer = async (res, customerId) => {
  const orders = await Order.find({ customerId: customerId });
  if (!orders) {
    return responseUtils.notFound(res);
  }
  return responseUtils.sendJson(res, orders);
};

module.exports = { getAllOrdersByAdmin, getOrderByAdmin, addNewOrder, getAllOrdersByCustomer, getOrderByCustomer };