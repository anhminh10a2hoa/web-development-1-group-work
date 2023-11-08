const { getCredentials } = require('./requestUtils');
// Import the User model from models/user.js
const { User } = require('../models/user');

/**
 * Get current user based on the request headers
 *
 * @param {http.IncomingMessage} request
 * @returns {Object|null} current authenticated user or null if not yet authenticated
 */
const getCurrentUser = async (request) => {
  const credentials = getCredentials(request);

  if (!credentials) {
    return null; // No credentials provided
  }

  const [username, password] = credentials;

  try {
    // Use the User model's findOne method to find a user with the given email
    const user = await User.findOne({ email: username });

    if (!user) {
      return null; // No user with the provided email
    }

    // Use the User model's checkPassword method to verify the password
    const isPasswordValid = await user.checkPassword(password);

    if (isPasswordValid) {
      return user; // User authenticated
    } else {
      return null; // Password does not match
    }
  } catch (error) {
    console.error(error);
    return null; // An error occurred
  }
};

module.exports = { getCurrentUser };