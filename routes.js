const responseUtils = require('./utils/responseUtils');
const { acceptsJson, isJson, parseBodyJson, getCredentials } = require('./utils/requestUtils');
const { renderPublic } = require('./utils/render');
// Import the User model from models/user.js
const { User } = require('./models/user');

/**
 * Known API routes and their allowed methods
 *
 * Used to check allowed methods and also to send the correct header value
 * in response to an OPTIONS request by sendOptions() (Access-Control-Allow-Methods)
 */
const allowedMethods = {
  '/api/register': ['POST'],
  '/api/users': ['GET'],
  '/api/products': ['GET'],
};

/**
 * Send a response to a client OPTIONS request.
 *
 * @param {string} filePath pathname of the request URL
 * @param {http.ServerResponse} response
 */
const sendOptions = (filePath, response) => {
  if (filePath in allowedMethods) {
    response.writeHead(204, {
      'Access-Control-Allow-Methods': allowedMethods[filePath].join(','),
      'Access-Control-Allow-Headers': 'Content-Type,Accept',
      'Access-Control-Max-Age': '86400',
      'Access-Control-Expose-Headers': 'Content-Type,Accept',
    });
    return response.end();
  }

  return responseUtils.notFound(response);
};

// eslint-disable-next-line max-lines-per-function, complexity
const handleRequest = async (request, response) => {
  const { url, method, headers } = request;
  const filePath = new URL(url, `http://${headers.host}`).pathname;

  // Serve static files from public/ and return immediately
  if (method.toUpperCase() === 'GET' && !filePath.startsWith('/api')) {
    const fileName = filePath === '/' || filePath === '' ? 'index.html' : filePath;
    return renderPublic(fileName, response);
  }

  if (method.toUpperCase() === 'OPTIONS') return sendOptions(filePath, response);

  // Require a correct accept header (require 'application/json' or '*/*')
  if (!acceptsJson(request)) {
    return responseUtils.contentTypeNotAcceptable(response);
  }

  // GET all users
  if (filePath === '/api/users' && method.toUpperCase() === 'GET') {
    const userCredentials = getCredentials(request);
    if (!userCredentials) {
      return responseUtils.basicAuthChallenge(response);
    }

    const loggedInUser = await User.findOne({ email: userCredentials[0] });
    if (!loggedInUser || !(await loggedInUser.checkPassword(userCredentials[1]))) {
      return responseUtils.basicAuthChallenge(response);
    } else if (loggedInUser.role === 'customer') {
      return responseUtils.forbidden(response);
    }

    // Use the User model to get all users
    const users = await User.find();
    return responseUtils.sendJson(response, users);
  }

  // Register a new user
  if (filePath === '/api/register' && method.toUpperCase() === 'POST') {
    // Fail if not a JSON request, don't allow non-JSON Content-Type
    if (!isJson(request)) {
      return responseUtils.badRequest(response, 'Invalid Content-Type. Expected application/json');
    }

    // Parse the JSON body
    const newUser = await parseBodyJson(request);

    // Validate the new user
    if (!(newUser.name && newUser.email && newUser.password && newUser.role)) {
      return responseUtils.badRequest(response, 'Missing user data');
    }

    // Check if the email is already in use
    const existingUser = await User.findOne({ email: newUser.email });
    if (existingUser) {
      return responseUtils.badRequest(response, 'Email is already in use');
    }

    // Create a new user using the User model
    const createdUser = new User(newUser);

    try {
      // Save the new user to the database
      await createdUser.save();
      return responseUtils.createdResource(response, createdUser);
    } catch (error) {
      return responseUtils.serverError(response, 'Error creating user');
    }
  }

  if (filePath === '/api/products' && method.toUpperCase() === 'GET') {
    const userCredentials = getCredentials(request);
    if (!userCredentials) {
      return responseUtils.basicAuthChallenge(response);
    }

    const loggedInUser = await User.findOne({ email: userCredentials[0] });
    if (!loggedInUser || !(await loggedInUser.checkPassword(userCredentials[1]))) {
      return responseUtils.basicAuthChallenge(response);
    }

    // Use the appropriate logic to get all products (you might have your own implementation)
    const products = await getAllProducts();
    return responseUtils.sendJson(response, products);
  }

  // Default to 404 Not Found if unknown URL
  if (!(filePath in allowedMethods)) return responseUtils.notFound(response);

  // Check for allowable methods
  if (!allowedMethods[filePath].includes(method.toUpperCase())) {
    return responseUtils.methodNotAllowed(response);
  }
};

module.exports = { handleRequest };