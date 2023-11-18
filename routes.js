// Import necessary modules and utilities
const responseUtils = require('./utils/responseUtils');
const http = require('http');
const { acceptsJson, isJson, parseBodyJson, getCredentials } = require('./utils/requestUtils');
const { renderPublic } = require('./utils/render');
const { getCurrentUser } = require('./auth/auth');
const User = require('./models/user');
const { getAllUsers, registerUser, deleteUser, viewUser, updateUser } = require('./controllers/users');
const { getAllProducts, addNewProduct, getProduct, updateProduct, deleteProduct } = require('./controllers/products');
const { getAllOrdersByAdmin, getOrderByAdmin, addNewOrder, getAllOrdersByCustomer, getOrderByCustomer } = require('./controllers/orders');

/**
 * Known API routes and their allowed methods
 * Used to check allowed methods and also to send correct header value
 * in response to an OPTIONS request by sendOptions() (Access-Control-Allow-Methods)
 */
const allowedMethods = {
  '/api/register': ['POST'],
  '/api/users': ['GET'],
  '/api/products': ['GET', 'POST'],
  '/api/orders': ['GET', 'POST']
};

/**
 * Send response to client options request.
 *
 * @param {string} filePath - Pathname of the request URL
 * @param {http.ServerResponse} response - Response to option API
 * @returns {undefined} - Not found
 */
const sendOptions = (filePath, response) => {
  // Check if the requested path is in the allowedMethods
  if (filePath in allowedMethods) {
    // Respond with the appropriate headers for OPTIONS request
    response.writeHead(204, {
      'Access-Control-Allow-Methods': allowedMethods[filePath].join(','),
      'Access-Control-Allow-Headers': 'Content-Type,Accept',
      'Access-Control-Max-Age': '86400',
      'Access-Control-Expose-Headers': 'Content-Type,Accept'
    });
    return response.end();
  }

  // If path not found in allowedMethods, respond with a 404 Not Found
  return responseUtils.notFound(response);
};

/**
 * Does the URL have an ID component as its last part? (e.g., /api/users/dsf7844e)
 *
 * @param {string} url - File path
 * @param {string} prefix - The API (users, products, orders)
 * @returns {boolean} - True if correct form
 */
const matchIdRoute = (url, prefix) => {
  // Define a regex pattern for matching IDs in the URL
  const idPattern = '[0-9a-z]{8,24}';
  const regex = new RegExp(`^(/api)?/${prefix}/${idPattern}$`);
  return regex.test(url);
};

/**
 * Check if the URL matches the expected route for a specific type (users, products, orders).
 *
 * @param {string} url - File path
 * @param {string} type - The type of resource (users, products, orders)
 * @returns {boolean} - True if the URL matches the expected route
 */
const checkoutRouteMatch = (url, type) => {
  // Use matchIdRoute to check if the URL matches the expected route for the given type
  if (type === 'users') return matchIdRoute(url, 'users');
  if (type === 'products') return matchIdRoute(url, 'products');
  if (type === 'orders') return matchIdRoute(url, 'orders');
  else return matchIdRoute(url, 'users');
};

/**
 * Handle incoming HTTP requests.
 *
 * @param {http.IncomingMessage} request - Incoming request
 * @param {http.ServerResponse} response - Response to be sent
 * @returns {undefined} - Not found
 */
const handleRequest = async function (request, response) {
  // Extract relevant information from the incoming request
  const { url, method, headers } = request;
  const filePath = new URL(url, `http://${headers.host}`).pathname;

  // Serve static files for GET requests that do not start with '/api'
  if (method.toUpperCase() === 'GET' && !filePath.startsWith('/api')) {
    // If it's a non-API GET request, render the public file
    const fileName = filePath === '/' || filePath === '' ? 'index.html' : filePath;
    return renderPublic(fileName, response);
  }

  // Handle OPTIONS request
  if (method.toUpperCase() === 'OPTIONS') return sendOptions(filePath, response);

  // Handle API routes for users
  if (checkoutRouteMatch(filePath, 'users')) {
    // Handle API routes for user-related operations
    const credentials = getCredentials(request);
    if (credentials !== null) {
      const id = filePath.split('/')[3];
      const authorizedUser = await getCurrentUser(request);

      // Check user authentication and role
      if (authorizedUser === null) {
        responseUtils.basicAuthChallenge(response);
      } else if (authorizedUser.role !== 'admin') {
        response.writeHead(403, { 'WWW-Authenticate': 'Basic' });
        response.end();
      } else {
        // Check request method and perform corresponding action
        if (!acceptsJson(request)) {
          return responseUtils.contentTypeNotAcceptable(response);
        }
        if (method.toUpperCase() === "GET") {
          // Get user details
          return viewUser(response, id, authorizedUser);
        }
        if (method.toUpperCase() === "DELETE") {
          // Delete user
          return deleteUser(response, id, authorizedUser);
        }
        if (method.toUpperCase() === "PUT") {
          // Update user
          const json = await parseBodyJson(request);
          if (authorizedUser.role === 'admin') {
            return updateUser(response, id, authorizedUser, json);
          }
        }
      }
    } else {
      responseUtils.basicAuthChallenge(response);
    }
  }

  // Handle API routes for products
  if (checkoutRouteMatch(filePath, 'products')) {
    // Handle API routes for product-related operations
    const credentials = getCredentials(request);
    if (credentials === null) {
      return responseUtils.basicAuthChallenge(response);
    }
    const productId = filePath.split('/')[3];
    const user = await getCurrentUser(request);

    // Check user authentication and role
    if (user === null) {
      return responseUtils.basicAuthChallenge(response);
    }
    if (!acceptsJson(request)) {
      return responseUtils.contentTypeNotAcceptable(response);
    }

    // Check request method and perform corresponding action
    if (method.toUpperCase() === 'GET') {
      // Get product details
      return getProduct(response, productId);
    }

    if (user.role !== 'admin') {
      return responseUtils.forbidden(response);
    }

    if (method.toUpperCase() === 'PUT') {
      // Update product
      const product = await parseBodyJson(request);
      return updateProduct(response, productId, product);
    }

    if (method.toUpperCase() === 'DELETE') {
      // Delete product
      return deleteProduct(response, productId);
    }
  }

  // Handle API routes for orders
  if (checkoutRouteMatch(filePath, 'orders') && method === 'GET') {
    // Handle API routes for order-related operations
    const credentials = getCredentials(request);
    if (credentials === null) {
      return responseUtils.basicAuthChallenge(response);
    }
    const orderId = filePath.split('/')[3];
    const user = await getCurrentUser(request);

    // Check user authentication and role
    if (user === null) {
      return responseUtils.basicAuthChallenge(response);
    }
    if (!acceptsJson(request)) {
      return responseUtils.contentTypeNotAcceptable(response);
    }

    // Check user role and get order details accordingly
    if (user.role === 'customer') {
      // Get order details for customer
      return getOrderByCustomer(response, user._id, orderId);
    }
    if (user.role === 'admin') {
      // Get order details for admin
      return getOrderByAdmin(response, orderId);
    }
  }

  // Default to 404 Not Found if the URL is unknown
  if (!(filePath in allowedMethods)) return responseUtils.notFound(response);

  // Check for allowable methods
  if (!allowedMethods[filePath].includes(method.toUpperCase())) {
    return responseUtils.methodNotAllowed(response);
  }

  // Require a correct accept header (require 'application/json' or '*/*')
  if (!acceptsJson(request)) {
    return responseUtils.contentTypeNotAcceptable(response);
  }

  // Handle GET request for all users
  if (filePath === '/api/users' && method.toUpperCase() === 'GET') {
    // TODO: 8.5 Add authentication (only allowed to users with role "admin")
    const auth = request.headers.authorization;

    // Check for basic authentication
    if (!auth || auth === '') {
      return responseUtils.basicAuthChallenge(response);
    }
    if (Buffer.from(auth.split(" ")[1], 'base64').toString('base64') !== auth.split(" ")[1]) {
      return responseUtils.basicAuthChallenge(response);
    }
    const user = await getCurrentUser(request);
    if (user === null) {
      return responseUtils.basicAuthChallenge(response);
    }
    if (user.role === 'customer') {
      return responseUtils.forbidden(response);
    }
    // Get all users if the user has admin role
    return getAllUsers(response);
  }

  // Handle POST request for user registration
  if (filePath === '/api/register' && method.toUpperCase() === 'POST') {
    // Fail if not a JSON request, don't allow non-JSON Content-Type
    if (!request.headers.accept) {
      return responseUtils.contentTypeNotAcceptable(response);
    }

    // TODO: 8.4 Implement registration
    // You can use parseBodyJson(request) method from utils/requestUtils.js to parse request body.
    // Useful methods here include:
    // - validateUser(user) from /utils/users.js
    // - emailInUse(user.email) from /utils/users.js
    // - badRequest(response, message) from /utils/responseUtils.js
    if (!isJson(request)) {
      return responseUtils.badRequest(response);
    }
    const user = await parseBodyJson(request);
    return registerUser(response, user);
  }

  // Handle API routes for products
  if (filePath === '/api/products') {
    const auth = request.headers.authorization;
    if (!auth || auth === '') {
      return responseUtils.basicAuthChallenge(response);
    }
    if (Buffer.from(auth.split(" ")[1], 'base64').toString('base64') !== auth.split(" ")[1]) {
      return responseUtils.basicAuthChallenge(response);
    }
    const user = await getCurrentUser(request);
    if (user === null) {
      return responseUtils.basicAuthChallenge(response);
    }

    // Handle GET request for all products
    if (method.toUpperCase() === 'GET') {
      if (user.role === 'admin' || user.role === 'customer') {
        return getAllProducts(response);
      }
    }

    // Handle POST request for adding a new product
    if (method.toUpperCase() === 'POST') {
      if (user.role !== 'admin') {
        return responseUtils.forbidden(response);
      }
      if (!isJson(request)) {
        return responseUtils.badRequest(response);
      }

      const newProduct = await parseBodyJson(request);
      return addNewProduct(response, newProduct);
    }
  }

  // Handle API routes for orders
  if (filePath === '/api/orders') {
    const auth = request.headers.authorization;
    if (!auth || auth === '') {
      return responseUtils.basicAuthChallenge(response);
    }
    if (Buffer.from(auth.split(" ")[1], 'base64').toString('base64') !== auth.split(" ")[1]) {
      return responseUtils.basicAuthChallenge(response);
    }
    const user = await getCurrentUser(request);
    if (user === null) {
      return responseUtils.basicAuthChallenge(response);
    }

    // Handle GET request for all orders
    if (method.toUpperCase() === 'GET') {
      if (user.role === 'customer') {
        return getAllOrdersByCustomer(response, user._id);
      } else if (user.role === 'admin') {
        return getAllOrdersByAdmin(response);
      }
    }

    // Handle POST request for adding a new order
    if (method.toUpperCase() === 'POST') {
      if (!isJson(request)) {
        return responseUtils.badRequest(response);
      }

      const order = await parseBodyJson(request);
      if (user.role !== 'customer') {
        return responseUtils.forbidden(response);
      }

      return addNewOrder(response, order, user._id);
    }
  }
};

// Export the handleRequest function for use in other modules
module.exports = { handleRequest };
