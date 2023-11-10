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

    // Use the User model's findOne method to find a user with the given email
    const user = User.findOne({ email: credentials.email });

    if (!user || !user.checkPassword(credentials.password)) {
        return null;
    }

    return user;

};

module.exports = { getCurrentUser };