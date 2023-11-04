const responseUtils = require('./utils/responseUtils');
const { acceptsJson, isJson, parseBodyJson, getCredentials } = require('./utils/requestUtils');
const { renderPublic } = require('./utils/render');
const { emailInUse, getAllUsers, saveNewUser, validateUser, getUser } = require('./utils/users');

/**
 * Known API routes and their allowed methods
 *
 * Used to check allowed methods and also to send correct header value
 * in response to an OPTIONS request by sendOptions() (Access-Control-Allow-Methods)
 */
const allowedMethods = {
  '/api/register': ['POST'],
  '/api/users': ['GET']
};

/**
 * Send response to client options request.
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
      'Access-Control-Expose-Headers': 'Content-Type,Accept'
    });
    return response.end();
  }

  return responseUtils.notFound(response);
};

/**
 * Does the url have an ID component as its last part? (e.g. /api/users/dsf7844e)
 *
 * @param {string} url filePath
 * @param {string} prefix
 * @returns {boolean}
 */
const matchIdRoute = (url, prefix) => {
  const idPattern = '[0-9a-z]{8,24}';
  const regex = new RegExp(`^(/api)?/${prefix}/${idPattern}$`);
  return regex.test(url);
};

/**
 * Does the URL match /api/users/{id}
 *
 * @param {string} url filePath
 * @returns {boolean}
 */
const matchUserId = url => {
  return matchIdRoute(url, 'users');
};

// eslint-disable-next-line max-lines-per-function, complexity
const handleRequest = async(request, response) => {
  const { url, method, headers } = request;
  const filePath = new URL(url, `http://${headers.host}`).pathname;

  // serve static files from public/ and return immediately
  if (method.toUpperCase() === 'GET' && !filePath.startsWith('/api')) {
    const fileName = filePath === '/' || filePath === '' ? 'index.html' : filePath;
    return renderPublic(fileName, response);
  }

  if (matchUserId(filePath)) {
    const userCredentials = getCredentials(request);
    if (!userCredentials) {
      return responseUtils.basicAuthChallenge(response);
    }
    const loggedInUser = getUser(userCredentials[0], userCredentials[1]);

    if (!loggedInUser) {
      return responseUtils.unauthorized(response);
    }

    if (loggedInUser.role !== 'admin') {
      return responseUtils.forbidden(response);
    }

    if (method.toUpperCase() === 'GET') {
      // Handle GET request to retrieve a single user by ID
      const userId = filePath.split('/').pop();
      const user = getUserById(userId);
      if (!user) {
        return responseUtils.notFound(response);
      } else {
        return responseUtils.sendJson(response, user);
      }
    } else if (method.toUpperCase() === 'PUT') {
      // Handle PUT request to update a single user by ID
      const userId = filePath.split('/').pop();
      const user = getUserById(userId);
      if (!user) {
        return responseUtils.notFound(response);
      }

      // Parse the JSON body
      const updatedUser = await parseBodyJson(request);

      // Update user's role if provided
      if (updatedUser.role) {
        if (updatedUser.role === 'admin' || updatedUser.role === 'customer') {
          user.role = updatedUser.role;
        } else {
          return responseUtils.badRequest(response, 'Invalid role');
        }
      }

      return responseUtils.sendJson(response, user);
    } else if (method.toUpperCase() === 'DELETE') {
      // Handle DELETE request to delete a single user by ID
      const userId = filePath.split('/').pop();
      const deletedUser = deleteUserById(userId);
      if (!deletedUser) {
        return responseUtils.notFound(response);
      } else {
        return responseUtils.noContent(response);
      }
    }
  }

  // Default to 404 Not Found if unknown url
  if (!(filePath in allowedMethods)) return responseUtils.notFound(response);

  // See: http://restcookbook.com/HTTP%20Methods/options/
  if (method.toUpperCase() === 'OPTIONS') return sendOptions(filePath, response);

  // Check for allowable methods
  if (!allowedMethods[filePath].includes(method.toUpperCase())) {
    return responseUtils.methodNotAllowed(response);
  }

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
    const loggedInUser = getUser(userCredentials[0], userCredentials[1]);
    if (!loggedInUser || loggedInUser.role !== 'admin') {
      return responseUtils.forbidden(response);
    }
    return responseUtils.sendJson(response, getAllUsers());
  }

  // register new user
  if (filePath === '/api/register' && method.toUpperCase() === 'POST') {
    // Fail if not a JSON request, don't allow non-JSON Content-Type
    if (!isJson(request)) {
      return responseUtils.badRequest(response, 'Invalid Content-Type. Expected application/json');
    }

    const newUser = await parseBodyJson(request);

    // Validate the new user
    const validationErrors = validateUser(newUser);
    if (validationErrors.length > 0) {
      return responseUtils.badRequest(response, validationErrors.join(', '));
    }

    // Check if the email is already in use
    if (emailInUse(newUser.email)) {
      return responseUtils.badRequest(response, 'Email is already in use');
    }

    // Save the new user
    const createdUser = saveNewUser(newUser);

    return responseUtils.createdResource(response, createdUser);
  }
};

module.exports = { handleRequest };