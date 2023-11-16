const responseUtils = require('./utils/responseUtils');
const { acceptsJson, isJson, parseBodyJson, getCredentials } = require('./utils/requestUtils');
const { renderPublic } = require('./utils/render');
const { getCurrentUser } = require('./auth/auth');
const { getAllUsers, registerUser, deleteUser, viewUser, updateUser } = require('./controllers/users');
const { getAllProducts, getProduct, addNewProduct, updateProduct, deleteProduct } = require('./controllers/products');
const User = require('./models/user') ;

/**
 * Known API routes and their allowed methods
 *
 * Used to check allowed methods and also to send the correct header value
 * in response to an OPTIONS request by sendOptions() (Access-Control-Allow-Methods)
 */
const allowedMethods = {
    '/api/register': ['POST'],
    '/api/users': ['GET'],
    '/api/products': ['GET', 'POST'],
    '/api/orders': ['GET', 'POST']
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

    // Check for allowable methods
    if (!(filePath in allowedMethods) || !allowedMethods[filePath].includes(method.toUpperCase())) {
        return responseUtils.methodNotAllowed(response);
    }

    // Handle unknown routes with a 404 response
    if (!(filePath in allowedMethods)) {
        return responseUtils.notFound(response);
    }

    // GET all users
    if (filePath === '/api/users' && method.toUpperCase() === 'GET') {
        const userCredentials = getCredentials(request);
        if (!userCredentials) {
          return responseUtils.basicAuthChallenge(response);
        }
        const loggedInUser = await getCurrentUser(request);
        if (loggedInUser === null){
          return responseUtils.basicAuthChallenge(response);
        }
        if (loggedInUser.role === 'customer'){
          return responseUtils.forbidden(response);
        }
        return getAllUsers(response);
    }

    // Register a new user
    if (filePath === '/api/register' && method.toUpperCase() === 'POST') {
      if (!request.headers.accept) {
        return responseUtils.contentTypeNotAcceptable(response);
      }
      if (!isJson(request)) {
        return responseUtils.badRequest(response, 'Invalid Content-Type. Expected application/json');
      }
      const newUser = await parseBodyJson(request);
      return registerUser(response, newUser);
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
        return getAllProducts(response);
    }

    if (filePath === '/api/products' && method.toUpperCase() === 'POST') {
      const userCredentials = getCredentials(request);
      if (!userCredentials) {
          return responseUtils.basicAuthChallenge(response);
      }

      const loggedInUser = await User.findOne({ email: userCredentials[0] });
      if (!loggedInUser || !(await loggedInUser.checkPassword(userCredentials[1]))) {
          return responseUtils.basicAuthChallenge(response);
      }
      if(loggedInUser.role !== 'admin' ){
          return responseUtils.forbidden(response);
      }
      if (!isJson(request)){
          return responseUtils.badRequest(response);
      }
      
      const newProduct = await parseBodyJson(request);
      return addNewProduct(response, newProduct);
  }

    // Default to 404 Not Found if unknown URL
    if (!(filePath in allowedMethods)) return responseUtils.notFound(response);

    // Check for allowable methods
    if (!allowedMethods[filePath].includes(method.toUpperCase())) {
        return responseUtils.methodNotAllowed(response);
    }
};

module.exports = { handleRequest };