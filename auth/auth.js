const { getCredentials } = require('./requestUtils');
const { getUser } = require('./users');
/**
 * Get current user based on the request headers
 *
 * @param {http.IncomingMessage} request
 * @returns {Object|null} current authenticated user or null if not yet authenticated
 */
const getCurrentUser = request => {
  const credentials = getCredentials(request);

  if (!credentials) {
    return null; // No credentials provided
  }

  const [username, password] = credentials;
  const user = getUser(username, password);

  return user;
};

module.exports = { getCurrentUser };